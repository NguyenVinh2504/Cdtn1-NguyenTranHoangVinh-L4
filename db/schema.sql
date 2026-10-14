-- =============================================================================
-- SCHEMA SQL – LUỒNG L4: PHÂN CÔNG KỸ THUẬT VIÊN VÀ LỊCH HẸN
-- Hệ thống Smart CRM – Mekong Mobile
-- Track: Kỹ thuật phần mềm (SE)
-- Database: PostgreSQL 16
-- Học kỳ 1, 2026–2027
-- =============================================================================
-- Mục đích: SQL DDL skeleton cho Thành phần 4 của Bài tập 1
-- Checklist: ERD chuẩn 3NF, 4–6 bảng, ≥ 2 quan hệ FK, có INDEX gắn NFR
--
-- BT1 RÚT GỌN: 6 bảng (theo mục kiểm chứng SE: 4–6 bảng)
--   - Gộp technician_skill.proficiency vào bảng technician (mỗi KTV 1 proficiency)
--   - Gộp ticket_status_log vào cột status_history JSONB trong bảng ticket
--   - Gộp appointment vào cột appointment_at + appointment_status trong ticket
-- =============================================================================

-- =============================================================================
-- BẢNG 1: customer – Khách hàng
-- Nguồn: SRS mục 1.4, Case study mục 8
-- Phục vụ: FR1, US1 (tra cứu thông tin khách khi phân công)
-- Ràng buộc: QT-15 (che số điện thoại ở lớp Presentation)
-- =============================================================================
CREATE TABLE customer (
    customer_id   BIGSERIAL      PRIMARY KEY,
    full_name     VARCHAR(120)  NOT NULL,
    phone         VARCHAR(20)   NOT NULL UNIQUE,        -- QT-01, QT-02: chuẩn hóa 10 số bắt đầu 0
    email         VARCHAR(120),
    address       VARCHAR(255),
    segment       VARCHAR(20)   CHECK (segment IN ('VIP', 'THUONG_XUYEN', 'MOI', 'NGU_DONG')),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- =============================================================================
-- BẢNG 2: service_center – Trung tâm bảo hành
-- Nguồn: SRS mục 1.4, Case study mục 8
-- Phục vụ: FR2, US2 (QT-08: KTV cùng trung tâm mới được phân công)
-- =============================================================================
CREATE TABLE service_center (
    center_id     BIGSERIAL     PRIMARY KEY,
    center_name   VARCHAR(100)  NOT NULL,
    address       VARCHAR(255)  NOT NULL,
    phone         VARCHAR(20),
    city          VARCHAR(50)   NOT NULL,               -- TP.HCM, Can Tho, Ha Noi
    is_active     BOOLEAN       NOT NULL DEFAULT true
);

-- =============================================================================
-- BẢNG 3: device – Thiết bị của khách hàng
-- Nguồn: SRS mục 1.4, Case study mục 8
-- Phục vụ: FR1, FR2 (QT-03: serial_no duy nhất, QT-05: kiểm tra bảo hành)
-- =============================================================================
CREATE TABLE device (
    device_id     BIGSERIAL     PRIMARY KEY,
    customer_id   BIGINT        NOT NULL REFERENCES customer(customer_id),
    serial_no     VARCHAR(50)   NOT NULL UNIQUE,        -- QT-03: xác định duy nhất bằng serial/IMEI
    product_name  VARCHAR(100),                          -- Tên sản phẩm
    purchase_date DATE,
    warranty_months SMALLINT   NOT NULL DEFAULT 12,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT chk_warranty_positive CHECK (warranty_months >= 0)
);

CREATE INDEX idx_device_customer ON device(customer_id);
CREATE INDEX idx_device_serial   ON device(serial_no);  -- Tra cứu nhanh theo serial

-- =============================================================================
-- BẢNG 4: issue_category – Nhóm sự cố (danh mục)
-- Nguồn: SRS mục 1.4, Case study mục 8
-- Phục vụ: FR2, US2 (Phân loại sự cố, tính SLA mặc định QT-04)
-- =============================================================================
CREATE TABLE issue_category (
    category_id       SERIAL        PRIMARY KEY,
    category_name     VARCHAR(60)   NOT NULL UNIQUE,    -- MAN_HINH, PIN, SAC, PHAN_MEM, NUOC_VAO, KHAC
    default_priority  VARCHAR(10)  NOT NULL
        CHECK (default_priority IN ('CAO', 'TRUNG_BINH', 'THAP')),
    is_active         BOOLEAN       NOT NULL DEFAULT true
);

-- Dữ liệu mẫu cho issue_category
INSERT INTO issue_category (category_name, default_priority) VALUES
    ('MAN_HINH',   'CAO'),
    ('PIN',        'TRUNG_BINH'),
    ('SAC',        'THAP'),
    ('PHAN_MEM',   'THAP'),
    ('NUOC_VAO',   'CAO'),
    ('KHAC',       'TRUNG_BINH');

-- =============================================================================
-- BẢNG 5: technician – Kỹ thuật viên (đã gộp proficiency)
-- Nguồn: SRS mục 1.4, Case study mục 8
-- Phục vụ: FR2, FR5, US2, US3 (QT-08: cùng trung tâm, proficiency >= 3)
-- GỘP TỪ: bảng technician_skill cũ → proficiency (1–5) lưu thẳng trong technician
-- =============================================================================
CREATE TABLE technician (
    technician_id  BIGSERIAL     PRIMARY KEY,
    employee_id    VARCHAR(20)   NOT NULL UNIQUE,
    full_name      VARCHAR(120)  NOT NULL,
    center_id      BIGINT        NOT NULL REFERENCES service_center(center_id),
    level          VARCHAR(10)   NOT NULL
        CHECK (level IN ('SO_CAP', 'TRUNG_CAP', 'CAO_CAP')),
    proficiency    SMALLINT      NOT NULL
        CHECK (proficiency BETWEEN 1 AND 5),              -- QT-08: yêu cầu >= 3 khi nhận phiếu
    is_active      BOOLEAN       NOT NULL DEFAULT true,
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- INDEX: phục vụ QT-08 – lọc KTV theo trung tâm và trạng thái
CREATE INDEX idx_tech_center_active ON technician(center_id, is_active);

-- INDEX: tìm nhanh KTV đủ tay nghề (proficiency >= 3)
CREATE INDEX idx_tech_proficiency ON technician(proficiency) WHERE proficiency >= 3;

-- =============================================================================
-- BẢNG 6: ticket – Phiếu bảo hành (BẢNG TRUNG TÂM – gộp log + lịch hẹn)
-- Nguồn: SRS mục 1.4, Case study mục 8
-- Phục vụ: TẤT CẢ FR của luồng L4
-- Ràng buộc: QT-04 (due_date), QT-06 (vòng đời + status_history),
--            QT-07 (1 KTV/phiếu), QT-08 (KTV đủ proficiency)
-- GỘP TỪ: ticket_status_log (→ status_history JSONB)
--          appointment (→ appointment_at + appointment_status)
-- =============================================================================
CREATE TABLE ticket (
    ticket_id       BIGSERIAL     PRIMARY KEY,
    ticket_code     VARCHAR(20)   NOT NULL UNIQUE,     -- Dạng: BH-000123/2026

    -- Khóa ngoại: xác định các thực thể liên quan
    customer_id     BIGINT        NOT NULL REFERENCES customer(customer_id),
    device_id       BIGINT        NOT NULL REFERENCES device(device_id),
    center_id       BIGINT        NOT NULL REFERENCES service_center(center_id),
    technician_id   BIGINT        REFERENCES technician(technician_id),  -- QT-07: cho phép NULL (phiếu mới chưa phân công)
    category_id     INT           REFERENCES issue_category(category_id),  -- NULL nếu chưa phân loại

    -- Thông tin nghiệp vụ
    issue_desc      TEXT          NOT NULL
        CHECK (length(issue_desc) >= 10),             -- Mô tả tối thiểu 10 ký tự

    priority        VARCHAR(12)    NOT NULL
        CHECK (priority IN ('CAO', 'TRUNG_BINH', 'THAP')),  -- QT-04

    status          VARCHAR(20)    NOT NULL DEFAULT 'MOI'
        CHECK (status IN ('MOI', 'DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN',
                         'HOAN_TAT', 'DA_DONG', 'DA_HUY')),  -- QT-06: vòng đời

    -- Timestamps: QT-04 (SLA tự động)
    received_at     TIMESTAMPTZ   NOT NULL DEFAULT now(),
    due_date        TIMESTAMPTZ   NOT NULL,            -- QT-04: sinh tự động theo priority
    closed_at       TIMESTAMPTZ,

    -- LỊCH SỬ CHUYỂN TRẠNG THÁI (QT-06) – GỘP TỪ ticket_status_log cũ
    -- Cấu trúc JSON: [{"from":"MOI","to":"DA_PHAN_CONG","at":"2026-10-01T09:30:00+07:00","by":5,"note":"..."}]
    status_history  JSONB         NOT NULL DEFAULT '[]'::jsonb,

    -- LỊCH HẸN GIAO NHẬN (FR4/US4) – GỘP TỪ appointment cũ (1 lịch hẹn / 1 phiếu cho prototype BT1)
    appointment_at         TIMESTAMPTZ,
    appointment_status     VARCHAR(20) CHECK (appointment_status IN
                                ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),

    -- Ràng buộc giữa các cột
    CONSTRAINT chk_due_after_received CHECK (due_date >= received_at),
    CONSTRAINT chk_closed_after_received CHECK (
        closed_at IS NULL OR closed_at >= received_at
    ),

    -- Ràng buộc nghiệp vụ: nếu có appointment_at thì phải có appointment_status và ngược lại
    CONSTRAINT chk_appointment_pair CHECK (
        (appointment_at IS NULL AND appointment_status IS NULL) OR
        (appointment_at IS NOT NULL AND appointment_status IS NOT NULL)
    )
);

-- =============================================================================
-- INDEXes cho bảng ticket (Phục vụ NFR1: < 1.5s với 10.000 bản ghi, 20 RPS)
-- =============================================================================

-- INDEX 1: NFR1 – Lọc phiếu MOI theo trung tâm, sắp theo thời gian tiếp nhận
-- Phục vụ: FR1, US1 – "Xem danh sách phiếu chờ phân công"
CREATE INDEX idx_ticket_status_center_received
    ON ticket(status, center_id, received_at DESC);

-- INDEX 2: NFR1 – Workload + SLA
-- Phục vụ: FR3, US3 – "KTV xem phiếu được gán theo hạn SLA"
-- Phục vụ: FR5, US5 – "Xem khối lượng công việc KTV"
CREATE INDEX idx_ticket_tech_due
    ON ticket(technician_id, due_date ASC)
    WHERE status IN ('DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN');  -- Partial index

-- INDEX 3: Tìm phiếu sắp quá hạn (cảnh báo SLA)
-- Phục vụ: US3 – Cảnh báo phiếu < 4 giờ đến hạn
CREATE INDEX idx_ticket_due_warning
    ON ticket(due_date)
    WHERE status NOT IN ('DA_DONG', 'DA_HUY');

-- INDEX 4: Tra cứu nhanh theo mã phiếu
CREATE INDEX idx_ticket_code ON ticket(ticket_code);

-- INDEX 5: Kiểm tra trùng lịch hẹn (FR4)
-- Phục vụ: "Hệ thống phát hiện xung đột khi đặt lịch hẹn trùng khung giờ"
CREATE INDEX idx_ticket_appointment
    ON ticket(technician_id, appointment_at)
    WHERE appointment_at IS NOT NULL
      AND appointment_status IN ('SCHEDULED', 'CONFIRMED');

-- INDEX 6: Truy vấn JSONB status_history
CREATE INDEX idx_ticket_status_history_gin
    ON ticket USING GIN (status_history);

-- =============================================================================
-- VIEW: v_ticket_status_log – "bẻ" JSONB status_history thành bảng phẳng
-- Mục đích: cho code dễ truy vấn lịch sử trạng thái (thay thế bảng log cũ)
-- Cấu trúc: mỗi phần tử trong mảng JSONB → 1 dòng
-- =============================================================================
CREATE OR REPLACE VIEW v_ticket_status_log AS
SELECT
    t.ticket_id,
    t.ticket_code,
    (elem->>'from')      AS from_status,
    (elem->>'to')        AS to_status,
    (elem->>'at')::timestamptz AS changed_at,
    (elem->>'by')::bigint      AS changed_by,
    (elem->>'note')           AS note
FROM ticket t,
     jsonb_array_elements(t.status_history) AS elem;

-- =============================================================================
-- TRIGGER: Tự động ghi log vào status_history khi tạo/cập nhật phiếu
-- Phục vụ: QT-06 – mọi thay đổi trạng thái đều phải được ghi lại
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_append_status_history()
RETURNS TRIGGER AS $$
DECLARE
    v_entry JSONB;
BEGIN
    -- Khi tạo phiếu mới, ghi log trạng thái ban đầu 'MOI'
    IF TG_OP = 'INSERT' THEN
        v_entry := jsonb_build_object(
            'from', NULL,
            'to',   NEW.status,
            'at',   NEW.received_at,
            'by',   NULL,                     -- NULL khi tạo mới (chưa có KTV)
            'note', 'Tiếp nhận phiếu mới'
        );
        NEW.status_history := jsonb_build_array(v_entry);
        RETURN NEW;
    END IF;

    -- Khi cập nhật trạng thái, append vào mảng
    IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        v_entry := jsonb_build_object(
            'from', OLD.status,
            'to',   NEW.status,
            'at',   now(),
            'by',   NEW.technician_id,
            'note', NULL
        );
        NEW.status_history := NEW.status_history || v_entry;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ticket_status_history
BEFORE INSERT OR UPDATE OF status ON ticket
FOR EACH ROW EXECUTE FUNCTION fn_append_status_history();

-- =============================================================================
-- TRIGGER: Tự động tính due_date theo priority (QT-04)
-- CAO = 24 giờ, TRUNG_BINH = 72 giờ, THAP = 120 giờ
-- Đơn giản hóa: dùng cộng giờ trực tiếp (chấp nhận gần đúng cho prototype BT1)
-- Lưu ý: QT-04 yêu cầu chỉ tính ngày làm việc (T2-T7, trừ CN);
--         việc tính chính xác giờ làm việc sẽ được xử lý ở lớp Service.
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_calculate_due_date()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.priority IS DISTINCT FROM NEW.priority) THEN
        NEW.due_date := CASE NEW.priority
            WHEN 'CAO'        THEN NEW.received_at + INTERVAL '24 hours'
            WHEN 'TRUNG_BINH' THEN NEW.received_at + INTERVAL '72 hours'
            WHEN 'THAP'       THEN NEW.received_at + INTERVAL '120 hours'
            ELSE                   NEW.received_at + INTERVAL '72 hours'  -- Mặc định
        END CASE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_due_date
BEFORE INSERT OR UPDATE OF priority ON ticket
FOR EACH ROW EXECUTE FUNCTION fn_calculate_due_date();

-- =============================================================================
-- TRIGGER: Kiểm tra QT-08 khi gán KTV (proficiency >= 3)
-- Đây là lớp bảo vệ cuối cùng ở database; lớp Service phải kiểm tra trước.
-- =============================================================================
CREATE OR REPLACE FUNCTION fn_check_assignment_skill()
RETURNS TRIGGER AS $$
DECLARE
    v_proficiency SMALLINT;
    v_center_match BOOLEAN;
BEGIN
    -- Chỉ kiểm tra khi gán KTV mới (từ NULL → có, hoặc đổi KTV)
    IF NEW.technician_id IS NOT NULL
       AND (OLD.technician_id IS NULL OR OLD.technician_id <> NEW.technician_id) THEN

        SELECT proficiency, (center_id = NEW.center_id)
          INTO v_proficiency, v_center_match
          FROM technician
         WHERE technician_id = NEW.technician_id
           AND is_active = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'KTV id=% không tồn tại hoặc đã ngừng hoạt động', NEW.technician_id
                USING ERRCODE = '23514';
        END IF;

        IF NOT v_center_match THEN
            RAISE EXCEPTION 'KTV id=% không cùng trung tâm với phiếu (QT-08)', NEW.technician_id
                USING ERRCODE = '23514';
        END IF;

        IF v_proficiency < 3 THEN
            RAISE EXCEPTION 'KTV id=% có proficiency=% < 3, không đủ điều kiện nhận phiếu (QT-08)',
                            NEW.technician_id, v_proficiency
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_assignment_skill
BEFORE INSERT OR UPDATE OF technician_id ON ticket
FOR EACH ROW EXECUTE FUNCTION fn_check_assignment_skill();

-- =============================================================================
-- RÀNG BUỘC TOÀN VẸN BỔ SUNG (Application-level)
-- Lưu ý: Một số ràng buộc phức tạp cần kiểm tra ở lớp Service:
-- 1. QT-06: Chuyển trạng thái tuần tự, không đảo ngược (trigger chỉ log, không validate)
-- 2. FR4: Kiểm tra trùng lịch hẹn của KTV (lớp Service query view v_appointments)
-- =============================================================================

-- =============================================================================
-- VIEW: v_appointments – "bẻ" lịch hẹn từ ticket ra dạng bảng
-- Mục đích: code dễ truy vấn "lịch hẹn của KTV" / "kiểm tra trùng lịch"
-- =============================================================================
CREATE OR REPLACE VIEW v_appointments AS
SELECT
    ticket_id        AS appointment_source_ticket_id,
    technician_id,
    appointment_at   AS scheduled_at,
    appointment_status AS status,
    ticket_code,
    customer_id,
    device_id,
    center_id
FROM ticket
WHERE appointment_at IS NOT NULL;

-- =============================================================================
-- VIEW: Danh sách phiếu chờ phân công (US1, FR1)
-- =============================================================================
CREATE OR REPLACE VIEW v_tickets_pending AS
SELECT
    t.ticket_id,
    t.ticket_code,
    t.priority,
    t.received_at,
    t.due_date,
    c.full_name AS customer_name,
    c.phone AS customer_phone,
    d.serial_no,
    d.product_name,
    ic.category_name,
    sc.center_name
FROM ticket t
JOIN customer c ON t.customer_id = c.customer_id
JOIN device d ON t.device_id = d.device_id
JOIN service_center sc ON t.center_id = sc.center_id
LEFT JOIN issue_category ic ON t.category_id = ic.category_id
WHERE t.status = 'MOI'
ORDER BY t.priority, t.received_at ASC;

-- =============================================================================
-- VIEW: Công việc của KTV theo SLA (US3, FR3)
-- =============================================================================
CREATE OR REPLACE VIEW v_technician_workload AS
SELECT
    t.technician_id,
    tech.full_name AS technician_name,
    COUNT(*) AS workload_count,
    COUNT(CASE WHEN t.due_date - now() < INTERVAL '4 hours' THEN 1 END) AS urgent_count,
    MIN(t.due_date) AS next_due_date
FROM ticket t
JOIN technician tech ON t.technician_id = tech.technician_id
WHERE t.status IN ('DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN')
GROUP BY t.technician_id, tech.full_name
ORDER BY workload_count DESC;

-- =============================================================================
-- VIEW: KTV đủ điều kiện nhận phiếu (US2, QT-08)
-- =============================================================================
CREATE OR REPLACE VIEW v_eligible_technicians AS
SELECT
    tech.technician_id,
    tech.full_name,
    tech.center_id,
    tech.proficiency,
    sc.center_name,
    (SELECT COUNT(*) FROM ticket t
     WHERE t.technician_id = tech.technician_id
       AND t.status IN ('DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN')) AS current_workload
FROM technician tech
JOIN service_center sc ON tech.center_id = sc.center_id
WHERE tech.is_active = true
  AND tech.proficiency >= 3
ORDER BY tech.center_id, current_workload ASC, tech.proficiency DESC;

-- =============================================================================
-- DỮ LIỆU MẪU (Test data)
-- =============================================================================

-- Insert service centers (6 trung tâm)
INSERT INTO service_center (center_name, address, city) VALUES
    ('Trung tâm Q.10', '123 Đường 3/2, P.11, Q.10, TP.HCM', 'TP.HCM'),
    ('Trung tâm Tân Bình', '456 Đường Cộng Hòa, P.13, Q.Tân Bình, TP.HCM', 'TP.HCM'),
    ('Trung tâm Cần Thơ 1', '789 Đường 30/4, Q.Ninh Kiều, Cần Thơ', 'Can Tho'),
    ('Trung tâm Cần Thơ 2', '321 Đường Nguyễn Văn Linh, Q.Ninh Kiều, Cần Thơ', 'Can Tho'),
    ('Trung tâm Hà Nội 1', '99 Đường Láng Hạ, Đống Đa, Hà Nội', 'Ha Noi'),
    ('Trung tâm Hà Nội 2', '100 Đường Giải Phóng, Hai Bà Trưng, Hà Nội', 'Ha Noi');

-- =============================================================================
-- GHI CHÚ KỸ THUẬT
-- =============================================================================
-- 1. RÚT GỌN TỪ 9 BẢNG XUỐNG 6 BẢNG (BT1):
--    - Gộp technician_skill.proficiency vào technician.proficiency (1–5)
--    - Gộp ticket_status_log vào ticket.status_history (JSONB)
--    - Gộp appointment vào ticket.appointment_at + appointment_status
--    → 3 VIEW thay thế: v_ticket_status_log, v_appointments, v_eligible_technicians
--
-- 2. Chuẩn hóa: Tất cả bảng đạt 3NF
--    - Không có cột tính được (stored computed columns)
--    - Không có bảng cô lập
--    - FK hợp lệ, referential integrity được đảm bảo
--
-- 3. Khóa chính: Dùng BIGSERIAL (khóa nhân tạo)
--    - phone, serial_no chỉ có UNIQUE, không làm PK
--
-- 4. INDEX: Đánh trên các cột thường xuyên truy vấn
--    - idx_ticket_status_center_received: NFR1 (< 1.5s)
--    - idx_ticket_tech_due: NFR1, US3
--    - idx_ticket_appointment: FR4 (kiểm tra trùng lịch)
--    - idx_ticket_status_history_gin: truy vấn JSONB
--
-- 5. Trigger:
--    - trg_ticket_status_history: QT-06 (ghi log JSONB)
--    - trg_calculate_due_date: QT-04
--    - trg_check_assignment_skill: QT-08 (cuối cùng, Service vẫn phải check trước)
--
-- 6. Transaction: Phân công KTV phải trong 1 transaction
--    BEGIN;
--    UPDATE ticket SET technician_id = X, status = 'DA_PHAN_CONG' WHERE ...;
--    -- status_history tự động được append bởi trigger trg_ticket_status_history
--    COMMIT;
-- =============================================================================
