/**
 * tests/bt3-new.test.js — Bài tập 3 (Track SE): test case KIỂM SOÁT TRUY CẬP
 *
 *   TC-11  (TC-SEC-01) — A01 OWASP: KTV sửa phiếu bảo hành của KTV khác → kỳ vọng HTTP 403
 *   TC-11  (TC-SEC-03) — A01 OWASP: KTV đọc phiếu của KTV khác qua 3 endpoint đọc → HTTP 403
 *   TC-P1  (TC-SEC-02) — NFR2: Request API nghiệp vụ KHÔNG có token JWT → kỳ vọng HTTP 401
 *
 * LƯU Ý: tên hàm test() luôn BẮT ĐẦU bằng mã test case trong docs/test-report.md
 * để giảng viên có thể chạy lại đúng một test case tại chỗ:
 *     npx jest tests/bt3-new.test.js -t "TC-11"
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * LƯU Ý QUAN TRỌNG VỀ TÍNH TRUNG THỰC (CLO3 + CLO5)
 * ─────────────────────────────────────────────────────────────────────────────
 * Hai test này được viết theo ĐẶC TẢ (SRS / QT-14 / NFR2), KHÔNG theo hành vi
 * hiện tại của mã nguồn. Điều này là CỐ Ý:
 *
 *   • Khi đọc mã nguồn, thấy rằng `authorize()` được ĐỊNH NGHĨA trong
 *     src/middlewares/auth.middleware.js nhưng KHÔNG route nào trong
 *     src/routes/ticket.routes.js gọi tới nó, và src/services/ticket.service.js
 *     không có bước kiểm tra chủ sở hữu (so sánh technicianId của phiếu với
 *     technicianId của người gọi).
 *   • `authenticate()` cũng rơi về vai trò CENTER_MANAGER mặc định khi request
 *     không có token và không có header x-user-role.
 *
 * Vì vậy TC-SEC-01 và TC-SEC-02 DỰ KIẾN SẼ FAIL ở thời điểm hiện tại.
 * Đó chính là minh chứng cần thu thập cho Bug Log (BUG-04, BUG-05), theo đúng
 * tinh thần đề BT3 mục 2.3: "Ghi FAIL trung thực rồi sửa và ghi Bug Log là cách
 * được điểm CAO NHẤT".
 *
 * Cột 7 (Kết quả thực tế) của Test Report được điền từ stdout của lần chạy này.
 *
 * Cách chạy:
 *   npx jest tests/bt3-new.test.js
 * hoặc chạy toàn bộ:
 *   npm test
 *
 * Test này KHÔNG cần CSDL: createApp() được inject repository giả (in-memory),
 * còn TicketService, middleware xác thực, middleware che SĐT và errorHandler
 * đều là MÃ NGUỒN THẬT.
 */

require('dotenv').config();

const request = require('supertest');
const { createApp } = require('../src/app');

// =============================================================================
// TIỀN ĐIỀU KIỆN — DỰNG BẰNG CODE (không phụ thuộc CSDL, không phụ thuộc seed)
// =============================================================================

// KTV sở hữu phiếu đích: technicianId = 3 (Nguyễn Văn A, TT2)
// KTV kẻ tấn công   : technicianId = 5 (Đỗ Hữu Thắng, TT2) — KHÁC người sở hữu
const TECH_OWNER_ID = 3;
const TECH_ATTACKER_ID = 5;

const INITIAL_TICKETS = [
  {
    ticketId: 3,
    ticketCode: 'BH-2-00003/2026',
    customerId: 2,
    deviceId: 2,
    centerId: 2,
    technicianId: TECH_OWNER_ID,
    categoryId: 2,
    issueDesc: 'Pin tụt nhanh từ 100% xuống 20% trong 2 giờ sử dụng, máy nóng ran vùng lưng',
    priority: 'TRUNG_BINH',
    status: 'DA_PHAN_CONG',
    receivedAt: new Date('2026-10-25T10:00:00Z'),
    dueDate: new Date('2026-10-28T10:00:00Z'),
    statusHistory: [
      { from: null, to: 'MOI', at: '2026-10-25T10:00:00.000Z', by: null, note: 'Tiếp nhận phiếu' },
      { from: 'MOI', to: 'DA_PHAN_CONG', at: '2026-10-25T12:00:00.000Z', by: TECH_OWNER_ID, note: 'Phân công KTV' }
    ],
    customer: { customerId: 2, fullName: 'Trần Văn Nam', phone: '0912345678' },
    device: { deviceId: 2, serialNo: 'MK-SS24U-7712', productName: 'Samsung Galaxy S24 Ultra' }
  }
];

const INITIAL_TECHNICIANS = [
  {
    technicianId: TECH_OWNER_ID,
    employeeId: 'NV-KTV-003',
    fullName: 'Nguyễn Văn A',
    centerId: 2,
    level: 'CAO_CAP',
    proficiency: 5,
    isActive: true
  },
  {
    technicianId: TECH_ATTACKER_ID,
    employeeId: 'NV-KTV-005',
    fullName: 'Đỗ Hữu Thắng',
    centerId: 2,
    level: 'TRUNG_CAP',
    proficiency: 3,
    isActive: true
  }
];

/**
 * Repository giả cho bảng ticket — mô phỏng đúng hành vi của
 * src/repositories/ticket.repository.js (chỉ lọc theo điều kiện được truyền vào).
 */
class FakeTicketRepository {
  constructor(tickets) {
    this.tickets = tickets;
  }

  // NFR3: mô phỏng transaction ACID — trả về chính repo này
  withClient() {
    return this;
  }

  async runInTransaction(work) {
    return work(this);
  }

  async lockById(ticketId) {
    return this.findById(ticketId);
  }

  async findById(ticketId) {
    return this.tickets.find(t => t.ticketId === Number(ticketId)) || null;
  }

  async findMany({ centerId, status, categoryId, priority } = {}) {
    let items = [...this.tickets];
    if (centerId) items = items.filter(t => t.centerId === Number(centerId));
    if (status) items = items.filter(t => t.status === status);
    if (categoryId) items = items.filter(t => t.categoryId === Number(categoryId));
    if (priority) items = items.filter(t => t.priority === priority);
    return { total: items.length, items };
  }

  async findUnassigned(centerId, filters = {}) {
    let items = this.tickets.filter(t => t.status === 'MOI' && t.technicianId === null);
    if (centerId) items = items.filter(t => t.centerId === Number(centerId));
    return { total: items.length, items };
  }

  async findByTechnician(technicianId, { status } = {}) {
    let items = this.tickets.filter(t => t.technicianId === Number(technicianId));
    if (status) items = items.filter(t => t.status === status);
    return { total: items.length, items };
  }

  async countOpenByTechnician(technicianId) {
    return this.tickets.filter(
      t =>
        t.technicianId === Number(technicianId) &&
        ['DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN'].includes(t.status)
    ).length;
  }

  async create(data) {
    return data;
  }

  async update(ticketId, data) {
    const ticket = this.tickets.find(t => t.ticketId === Number(ticketId));
    if (!ticket) return null;
    Object.assign(ticket, data);
    return ticket;
  }

  async delete(ticketId) {
    const idx = this.tickets.findIndex(t => t.ticketId === Number(ticketId));
    if (idx >= 0) return this.tickets.splice(idx, 1)[0];
    return null;
  }

  async generateTicketCode(centerId) {
    const count = await this.client_count(centerId);
    return `BH-${centerId}-${String(count + 1).padStart(5, '0')}/2026`;
  }

  async client_count(centerId) {
    return this.tickets.filter(t => t.centerId === Number(centerId)).length;
  }
}

/** Repository giả cho bảng technician */
class FakeTechnicianRepository {
  constructor(technicians) {
    this.technicians = technicians;
  }

  async findById(technicianId) {
    return this.technicians.find(t => t.technicianId === Number(technicianId)) || null;
  }

  async findMany({ centerId } = {}) {
    let items = [...this.technicians];
    if (centerId) items = items.filter(t => t.centerId === Number(centerId));
    return items;
  }

  async findEligible(centerId, minProficiency) {
    return this.technicians
      .filter(
        t =>
          t.centerId === Number(centerId) &&
          t.proficiency >= minProficiency &&
          t.isActive
      )
      .map(t => ({ ...t, workload: 0 }));
  }

  async create(data) {
    return data;
  }

  async update(id, data) {
    const tech = this.technicians.find(t => t.technicianId === Number(id));
    if (tech) Object.assign(tech, data);
    return tech;
  }

  async delete(id) {
    const tech = this.technicians.find(t => t.technicianId === Number(id));
    if (tech) tech.isActive = false;
    return tech;
  }
}

/** Repository giả cho lịch hẹn — luôn không có xung đột */
class FakeAppointmentRepository {
  async hasConflict() {
    return null;
  }

  async findByTechnician() {
    return [];
  }
}

/** Repository giả cho khách hàng */
class FakeCustomerRepository {
  async findById() {
    return null;
  }
}

// =============================================================================
// KHỞI TẠO APP THẬT (createApp) VỚI REPOSITORY GIẢ
// =============================================================================

let app;
let ticketStore;
let ticketRepo;

/** Dựng lại tiền điều kiện sạch cho mỗi test */
function buildApp() {
  // Deep copy để mỗi test bắt đầu từ cùng một trạng thái dữ liệu
  ticketStore = INITIAL_TICKETS.map(t => ({
    ...t,
    statusHistory: t.statusHistory.map(h => ({ ...h })),
    customer: { ...t.customer },
    device: { ...t.device }
  }));

  ticketRepo = new FakeTicketRepository(ticketStore);

  return createApp({
    ticketRepo,
    technicianRepo: new FakeTechnicianRepository(INITIAL_TECHNICIANS.map(t => ({ ...t }))),
    appointmentRepo: new FakeAppointmentRepository(),
    customerRepo: new FakeCustomerRepository()
  });
}

/** Header giả lập người dùng (chế độ dev/test của hệ thống) */
function techHeaders(technicianId) {
  return {
    'x-user-role': 'TECHNICIAN',
    'x-user-id': String(technicianId),
    'x-user-center': '2'
  };
}

/** In kết quả thực tế ra stdout để điền cột 7 của Test Report */
function logActual(label, res) {
  // eslint-disable-next-line no-console
  console.log(
    `\n>>> [KẾT QUẢ THỰC TẾ] ${label}\n` +
      `    HTTP status : ${res.status}\n` +
      `    body.error  : ${res.body && res.body.error !== undefined ? res.body.error : '(không có)'}\n` +
      `    body.message: ${res.body && res.body.message !== undefined ? res.body.message : '(không có)'}`
  );
}

// =============================================================================
// TC-SEC-01 — A01 OWASP: Sửa phiếu bảo hành của KTV khác → HTTP 403
// =============================================================================

describe('TC-SEC-01 — A01 OWASP: Kiểm soát truy cập theo chủ sở hữu (KTV sửa phiếu của KTV khác)', () => {
  beforeEach(() => {
    app = buildApp();
  });

  test('TC-11 (TC-SEC-01): KTV technicianId=5 không được sửa phiếu bảo hành của KTV technicianId=3 (trả HTTP 403, KHÔNG được thay đổi dữ liệu)', async () => {
    const TARGET_TICKET_ID = 3;

    // Chụp lại trạng thái phiếu đích TRƯỚC khi gọi API
    const before = ticketStore.find(t => t.ticketId === TARGET_TICKET_ID);
    const statusBefore = before.status;
    const historyLengthBefore = before.statusHistory.length;
    const issueDescBefore = before.issueDesc;

    // -------------------------------------------------------------------------
    // Bước 1: KTV kẻ tấn công đổi trạng thái phiếu của người khác
    // -------------------------------------------------------------------------
    const resPatch = await request(app)
      .patch(`/api/tickets/${TARGET_TICKET_ID}/status`)
      .set(techHeaders(TECH_ATTACKER_ID))
      .send({ status: 'DANG_XU_LY', note: 'Tấn công A01: đổi trạng thái phiếu của KTV khác' });

    logActual('TC-SEC-01 bước 1 — PATCH /api/tickets/3/status với role TECHNICIAN id=5', resPatch);

    // -------------------------------------------------------------------------
    // Bước 2: KTV kẻ tấn công sửa nội dung phiếu của người khác
    // -------------------------------------------------------------------------
    const resPut = await request(app)
      .put(`/api/tickets/${TARGET_TICKET_ID}`)
      .set(techHeaders(TECH_ATTACKER_ID))
      .send({ issueDesc: 'Tấn công A01: sửa mô tả sự cố của phiếu thuộc KTV khác' });

    logActual('TC-SEC-01 bước 2 — PUT /api/tickets/3 với role TECHNICIAN id=5', resPut);

    // -------------------------------------------------------------------------
    // Bước 3: Kiểm tra dữ liệu trong CSDL (in-memory store) KHÔNG bị thay đổi
    // -------------------------------------------------------------------------
    const after = ticketStore.find(t => t.ticketId === TARGET_TICKET_ID);

    // eslint-disable-next-line no-console
    console.log(
      `\n>>> [KẾT QUẢ THỰC TẾ] TC-SEC-01 bước 3 — trạng thái phiếu sau 2 request\n` +
        `    status         : ${statusBefore}  ->  ${after.status}\n` +
        `    statusHistory  : ${historyLengthBefore} phần tử  ->  ${after.statusHistory.length} phần tử\n` +
        `    issueDesc      : "${issueDescBefore}"  ->  "${after.issueDesc}"`
    );

    // =====================================================================
    // KẾT QUẢ MONG ĐỢI (theo QT-14 + AC2 + A01 OWASP):
    //   1) Cả 2 request phải bị từ chối với HTTP 403 Forbidden
    //   2) Mã lỗi nghiệp vụ phải là KHONG_CO_QUYEN
    //   3) Thông báo lỗi phải nói rõ không có quyền
    //   4) Phiếu bảo hành KHÔNG được thay đổi bất kỳ trường nào
    // =====================================================================

    // (1) Mã HTTP
    expect(resPatch.status).toBe(403);
    expect(resPut.status).toBe(403);

    // (2) Mã lỗi nghiệp vụ
    expect(resPatch.body.error).toBe('KHONG_CO_QUYEN');
    expect(resPut.body.error).toBe('KHONG_CO_QUYEN');

    // (3) Nội dung thông báo lỗi
    expect(resPatch.body.message).toMatch(/không có quyền/i);
    expect(resPut.body.message).toMatch(/không có quyền/i);

    // (4) Dữ liệu phiếu KHÔNG bị thay đổi
    expect(after.status).toBe(statusBefore);
    expect(after.statusHistory).toHaveLength(historyLengthBefore);
    expect(after.issueDesc).toBe(issueDescBefore);

    // Lưu ý: khi hệ thống đã sửa xong, các assertion ở trên sẽ PASS.
    // Trước khi sửa, test FAIL và in ra giá trị thực tế ở log phía trên.
  });

  // ===========================================================================
  // TC-SEC-03 — A01 OWASP: KTV đọc phiếu của KTV khác qua đường ĐỌC
  // (BUG-07 — phát hiện khi đối chiếu QT-14 với mã nguồn thật)
  // ===========================================================================

  test('TC-11 (TC-SEC-03): KTV technicianId=5 KHÔNG được đọc phiếu của KTV technicianId=3 qua 3 endpoint đọc (HTTP 403)', async () => {
    const TARGET_TICKET_ID = 3;

    // -------------------------------------------------------------------------
    // Bước 1: GET /api/tickets/technician/mine?technicianId=3
    //         (KTV cố chỉ định tham số của người khác)
    // -------------------------------------------------------------------------
    const resMine = await request(app)
      .get(`/api/tickets/technician/mine?technicianId=${TECH_OWNER_ID}`)
      .set(techHeaders(TECH_ATTACKER_ID));

    logActual('TC-SEC-03 bước 1 — GET /api/tickets/technician/mine?technicianId=3 (KTV id=5)', resMine);

    // -------------------------------------------------------------------------
    // Bước 2: GET /api/tickets (danh sách tổng quát) — không được lộ phiếu người khác
    // -------------------------------------------------------------------------
    const resList = await request(app)
      .get('/api/tickets?centerId=2')
      .set(techHeaders(TECH_ATTACKER_ID));

    logActual('TC-SEC-03 bước 2 — GET /api/tickets?centerId=2 (KTV id=5)', resList);

    // -------------------------------------------------------------------------
    // Bước 3: GET /api/tickets/3 (chi tiết phiếu của người khác)
    // -------------------------------------------------------------------------
    const resDetail = await request(app)
      .get(`/api/tickets/${TARGET_TICKET_ID}`)
      .set(techHeaders(TECH_ATTACKER_ID));

    logActual('TC-SEC-03 bước 3 — GET /api/tickets/3 (KTV id=5)', resDetail);

    // -------------------------------------------------------------------------
    // Bước 4: GET /api/tickets/unassigned (phiếu chờ phân công của cả trung tâm)
    // -------------------------------------------------------------------------
    const resUnassigned = await request(app)
      .get('/api/tickets/unassigned')
      .set(techHeaders(TECH_ATTACKER_ID));

    logActual('TC-SEC-03 bước 4 — GET /api/tickets/unassigned (KTV id=5)', resUnassigned);

    // =====================================================================
    // KẾT QUẢ MONG ĐỢI (theo QT-14: "KTV chỉ có quyền truy xuất các phiếu
    // được gán cho chính mình"):
    //   1) Chỉ định technicianId của người khác  -> HTTP 403 KHONG_CO_QUYEN
    //   2) Danh sách tổng quát                   -> KHÔNG chứa phiếu của KTV khác
    //   3) Chi tiết phiếu của người khác          -> HTTP 403 KHONG_CO_QUYEN
    //   4) Danh sách phiếu chờ phân công           -> HTTP 403 KHONG_CO_QUYEN
    // =====================================================================

    // (1) Chỉ định tham số của người khác
    expect(resMine.status).toBe(403);
    expect(resMine.body.error).toBe('KHONG_CO_QUYEN');

    // (2) Danh sách tổng quát phải bị giới hạn theo chủ sở hữu
    expect(resList.status).toBe(200);
    const listedTicketIds = (resList.body.data || []).map(t => Number(t.technicianId));
    expect(listedTicketIds.every(id => id === TECH_ATTACKER_ID)).toBe(true);
    expect(listedTicketIds).not.toContain(TECH_OWNER_ID);

    // (3) Chi tiết phiếu của KTV khác
    expect(resDetail.status).toBe(403);
    expect(resDetail.body.error).toBe('KHONG_CO_QUYEN');

    // (4) Danh sách phiếu chờ phân công của cả trung tâm
    expect(resUnassigned.status).toBe(403);
    expect(resUnassigned.body.error).toBe('KHONG_CO_QUYEN');
  });
});

// =============================================================================
// TC-SEC-02 — NFR2: Request API nghiệp vụ không có token JWT → HTTP 401
// =============================================================================

describe('TC-SEC-02 — NFR2: Request API nghiệp vụ KHÔNG có token JWT phải bị từ chối 401', () => {
  beforeEach(() => {
    app = buildApp();
  });

  test('TC-P1 (TC-SEC-02): Gọi API nghiệp vụ mà không gửi token (không Authorization, không x-user-role) phải trả HTTP 401 XAC_THUC_KHONG_HOP_LE', async () => {
    // -------------------------------------------------------------------------
    // Bước 1: Gọi API nghiệp vụ KHÔNG có bất kỳ thông tin xác thực nào
    // -------------------------------------------------------------------------
    const resList = await request(app).get('/api/tickets?centerId=2');
    logActual('TC-SEC-02 bước 1 — GET /api/tickets (không token, không x-user-role)', resList);

    // -------------------------------------------------------------------------
    // Bước 2: Gọi API phân công (ghi dữ liệu) mà không có token
    // -------------------------------------------------------------------------
    const resAssign = await request(app)
      .post('/api/tickets/3/assign')
      .send({ technicianId: TECH_ATTACKER_ID, note: 'Không token vẫn gọi được API ghi dữ liệu' });

    logActual('TC-SEC-02 bước 2 — POST /api/tickets/3/assign (không token)', resAssign);

    // -------------------------------------------------------------------------
    // Bước 3: Gọi API có token KHÔNG HỢP LỆ (điểm đối chiếu)
    // -------------------------------------------------------------------------
    const resBadToken = await request(app)
      .get('/api/tickets?centerId=2')
      .set('Authorization', 'Bearer token.khong.hop.le');

    logActual('TC-SEC-02 bước 3 — GET /api/tickets với Bearer token không hợp lệ', resBadToken);

    // =====================================================================
    // KẾT QUẢ MONG ĐỢI (theo NFR2 — 100% request API nghiệp vụ phải được
    // xác thực bằng JWT):
    //   1) Request KHÔNG token  -> HTTP 401, mã lỗi XAC_THUC_KHONG_HOP_LE
    //   2) Request token SAI   -> HTTP 401, mã lỗi TOKEN_HET_HAN
    //   3) Endpoint /health VẪN phải công khai (trả 200) để phục vụ
    //      healthcheck của Docker Compose
    // =====================================================================

    // (1) Không token
    expect(resList.status).toBe(401);
    expect(resList.body.error).toBe('XAC_THUC_KHONG_HOP_LE');
    expect(resAssign.status).toBe(401);
    expect(resAssign.body.error).toBe('XAC_THUC_KHONG_HOP_LE');

    // (2) Token không hợp lệ
    expect(resBadToken.status).toBe(401);
    expect(resBadToken.body.error).toBe('TOKEN_HET_HAN');

    // (3) Health check vẫn công khai
    const resHealth = await request(app).get('/health');
    expect(resHealth.status).toBe(200);
    expect(resHealth.body.status).toBe('UP');
  });
});
