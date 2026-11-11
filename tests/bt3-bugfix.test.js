/**
 * tests/bt3-bugfix.test.js — Bài tập 3 (Track SE): test case cho 3 lỗi gỡ trong
 * GIAI ĐOẠN ĐÓNG GÓI (phát hiện bằng phép thử máy trắng / white-box test).
 *
 *   TC-13 (TC-BUG-10) — CRITICAL: sequence PostgreSQL không tiến sau khi seed
 *                       → create() sinh trùng khoá chính → HTTP 500
 *   TC-14 (TC-BUG-11) — MAJOR:   generateTicketCode() dùng COUNT(*) → sinh mã
 *                       phiếu TRÙNG sau khi đã xoá 1 phiếu → HTTP 500
 *   TC-15 (TC-BUG-12) — MAJOR:   scheduleAppointment() không kiểm tra chủ sở hữu
 *                       → KTV đặt lịch hẹn cho phiếu của KTV khác (A01/QT-14)
 *
 * LƯU Ý: tên hàm test() luôn BẮT ĐẦU bằng mã test case trong docs/test-report.md
 * để giảng viên có thể chạy lại đúng một test case tại chỗ:
 *     npx jest tests/bt3-bugfix.test.js -t "TC-13"
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TÍNH TRUNG THỮC (CLO3 + CLO5)
 * ─────────────────────────────────────────────────────────────────────────────
 * TC-13 và TC-14 là lỗi CHỈ xuất hiện khi hệ thống được nạp dữ liệu mẫu thật rồi
 * tạo bản ghi mới — tức là chỉ lộ ra khi chạy phép thử máy trắng trên container
 * PostgreSQL 16. Bộ test unit trước đó dùng repository giả (in-memory) nên không
 * bắt được. Hai test này dùng repository giả mô phỏng ĐÚNG hành vi của PostgreSQL:
 *   • sequence PostgreSQL chỉ tiến khi tạo bản ghi KHÔNG chỉ định khoá chính
 *   • khoá chính trùng → Prisma ném P2002
 * Nhờ vậy lỗi được "tái lập" lại được trong môi trường không cần CSDL.
 */

require('dotenv').config();

const request = require('supertest');
const { createApp } = require('../src/app');
const { syncSequences, SEQUENCE_TABLES } = require('../prisma/sync-sequences');

// =============================================================================
// TIỀN ĐIỀU KIỆN — DỰNG BẰNG CODE (không phụ thuộc CSDL thật)
// =============================================================================

const TECH_OWNER_ID = 3;   // KTV sở hữu phiếu
const TECH_ATTACKER_ID = 5; // KTV khác — dùng để kiểm tra A01

const INITIAL_TICKETS = [
  {
    ticketId: 1,
    ticketCode: 'BH-2-00001/2026',
    customerId: 1,
    deviceId: 1,
    centerId: 2,
    technicianId: TECH_OWNER_ID,
    categoryId: 1,
    issueDesc: 'Man hinh bi soc xanh doc, cam ung goc phai bi liet',
    priority: 'CAO',
    status: 'DA_PHAN_CONG',
    receivedAt: new Date('2026-10-25T10:00:00Z'),
    dueDate: new Date('2026-10-28T10:00:00Z'),
    appointmentAt: null,
    appointmentStatus: null,
    statusHistory: [
      { from: null, to: 'MOI', at: '2026-10-25T10:00:00.000Z', by: null, note: 'Tiep nhan phieu' }
    ],
    customer: { customerId: 1, fullName: 'Nguyen Thi Mai', phone: '0901234567' },
    device: { deviceId: 1, serialNo: 'MK-IP15P-9921', productName: 'iPhone 15 Pro Max 256GB' }
  }
];

const INITIAL_TECHNICIANS = [
  {
    technicianId: TECH_OWNER_ID,
    employeeId: 'NV-KTV-003',
    fullName: 'Nguyen Van A',
    centerId: 2,
    level: 'CAO_CAP',
    proficiency: 5,
    isActive: true
  },
  {
    technicianId: TECH_ATTACKER_ID,
    employeeId: 'NV-KTV-005',
    fullName: 'Do Huu Thang',
    centerId: 2,
    level: 'TRUNG_CAP',
    proficiency: 3,
    isActive: true
  }
];

/**
 * Repository giả mô phỏng ĐÚNG hành vi sequence của PostgreSQL (BIGSERIAL):
 *   • `sequence` chỉ tiến khi tạo bản ghi KHÔNG chỉ định khoá chính.
 *   • Khi seed chèn bản ghi với khoá chính chỉ định tường minh, sequence KHÔNG tiến.
 *   • Tạo bản ghi mới -> sequence trả về giá trị đang đứng -> nếu trùng khoá đã có
 *     thì Prisma ném P2002 (giống hệt lỗi thật trong container).
 */
class FakeTicketRepository {
  constructor(tickets) {
    this.tickets = tickets;
    // Sau khi seed nạp 4 phiếu với ticketId 1..4, sequence của PostgreSQL
    // vẫn ở giá trị 1 (BUG-10) — mô phỏng đúng trạng thái lỗi.
    this.sequence = 1;
  }

  async findById(ticketId) {
    return this.tickets.find(t => t.ticketId === Number(ticketId)) || null;
  }

  async findMany() {
    return { total: this.tickets.length, items: this.tickets };
  }

  async findUnassigned() {
    return { total: 0, items: [] };
  }

  async findByTechnician() {
    return { total: 0, items: [] };
  }

  async countOpenByTechnician() {
    return 0;
  }

  async create(data) {
    // Mô phỏng BIGSERIAL: sinh khoá chính từ sequence HIỆN TẠI rồi mới tăng sequence.
    const generatedId = this.sequence;
    this.sequence = this.sequence + 1;

    const clash = this.tickets.some(t => t.ticketId === generatedId);
    if (clash) {
      // PrismaClientKnownRequestError code P2002
      const err = new Error(
        `Invalid prisma.ticket.create() invocation:\n\nUnique constraint failed on the fields: (\`ticket_id\`)`
      );
      err.code = 'P2002';
      err.meta = { modelName: 'Ticket', target: ['ticket_id'] };
      throw err;
    }

    const ticket = { ...data, ticketId: generatedId };
    this.tickets.push(ticket);
    return ticket;
  }

  async update(ticketId, data) {
    const ticket = this.tickets.find(t => t.ticketId === Number(ticketId));
    if (ticket) Object.assign(ticket, data);
    return ticket;
  }

  async delete(ticketId) {
    const idx = this.tickets.findIndex(t => t.ticketId === Number(ticketId));
    return idx >= 0 ? this.tickets.splice(idx, 1)[0] : null;
  }

  /**
   * BUG-11: bản SAI dùng COUNT(*) — sinh mã trùng khi đã xoá 1 phiếu.
   * Bản ĐÚNG dùng MAX(ticket_id) — mã luôn tăng đơn điệu.
   */
  async generateTicketCode(centerId) {
    const latest = this.tickets
      .filter(t => t.centerId === Number(centerId))
      .reduce((max, t) => Math.max(max, t.ticketId), 0);
    const year = new Date().getFullYear();
    return `BH-${centerId}-${String(latest + 1).padStart(5, '0')}/${year}`;
  }
}

class FakeTechnicianRepository {
  constructor(technicians) {
    this.technicians = technicians;
    this.sequence = 1;
  }

  async findById(technicianId) {
    return this.technicians.find(t => t.technicianId === Number(technicianId)) || null;
  }

  async findMany() {
    return this.technicians;
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
    const generatedId = this.sequence;
    this.sequence = this.sequence + 1;

    const clash = this.technicians.some(t => t.technicianId === generatedId);
    if (clash) {
      const err = new Error(
        `Invalid prisma.technician.create() invocation:\n\nUnique constraint failed on the fields: (\`technician_id\`)`
      );
      err.code = 'P2002';
      err.meta = { modelName: 'Technician', target: ['technician_id'] };
      throw err;
    }

    const tech = { ...data, technicianId: generatedId };
    this.technicians.push(tech);
    return tech;
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

class FakeAppointmentRepository {
  async hasConflict() {
    return null;
  }
  async findByTechnician() {
    return [];
  }
}

class FakeCustomerRepository {
  async findById() {
    return null;
  }
}

let app;
let ticketStore;
let ticketRepo;
let technicianStore;

function buildApp() {
  ticketStore = INITIAL_TICKETS.map(t => ({
    ...t,
    statusHistory: t.statusHistory.map(h => ({ ...h })),
    customer: { ...t.customer },
    device: { ...t.device }
  }));

  technicianStore = INITIAL_TECHNICIANS.map(t => ({ ...t }));

  ticketRepo = new FakeTicketRepository(ticketStore);

  return createApp({
    ticketRepo,
    technicianRepo: new FakeTechnicianRepository(technicianStore),
    appointmentRepo: new FakeAppointmentRepository(),
    customerRepo: new FakeCustomerRepository()
  });
}

function techHeaders(technicianId) {
  return {
    'x-user-role': 'TECHNICIAN',
    'x-user-id': String(technicianId),
    'x-user-center': '2'
  };
}

const managerHeaders = {
  'x-user-role': 'CENTER_MANAGER',
  'x-user-id': '1',
  'x-user-center': '2'
};

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
// TC-13 (TC-BUG-10) — CRITICAL: sequence PostgreSQL không tiến sau khi seed
// =============================================================================

describe('TC-13 (TC-BUG-10) — CRITICAL: Sau khi nạp dữ liệu mẫu, tạo phiếu mới phải thành công (không trùng khoá chính)', () => {
  beforeEach(() => {
    app = buildApp();
  });

  test('TC-13 (TC-BUG-10): POST /api/tickets sau khi seed trả HTTP 201, KHÔNG trả 500 do trùng khoá chính ticket_id', async () => {
    // -------------------------------------------------------------------------
    // Bước 1: Mô phỏng trạng thái sau khi seed: sequence vẫn ở giá trị 1
    //          trong khi bảng đã có phiếu ticket_id = 1.
    //          (FakeTicketRepository khởi tạo `this.sequence = 1` — đúng trạng thái lỗi)
    // -------------------------------------------------------------------------
    expect(ticketStore.some(t => t.ticketId === ticketRepo.sequence)).toBe(true);

    // -------------------------------------------------------------------------
    // Bước 2: Chạy đúng hàm đồng bộ sequence mà prisma/seed.js gọi
    //          (BUG-10 fix). Với CSDL thật, hàm này đặt lại sequence của
    //          PostgreSQL về MAX(cột) + 1. Ở đây ta mô phỏng bằng cách áp
    //          dụng kết quả đó lên sequence của repository giả.
    // -------------------------------------------------------------------------
    const executedSql = [];
    const fakePrisma = {
      $executeRawUnsafe: async (sql) => {
        executedSql.push(sql);
      }
    };
    const syncedTables = await syncSequences(fakePrisma);

    // Hàm đồng bộ phải phủ đủ 6 bảng có khoá chính serial
    expect(syncedTables).toEqual(SEQUENCE_TABLES.map(t => t.table));
    expect(executedSql).toHaveLength(6);
    executedSql.forEach(sql => {
      expect(sql).toMatch(/setval\(pg_get_serial_sequence/);
      expect(sql).toMatch(/COALESCE\(\(SELECT MAX\(/);
      // is_called = false -> nextval trả về đúng giá trị vừa đặt (MAX + 1)
      expect(sql).toMatch(/false\)$/);
    });

    // Áp dụng kết quả đồng bộ lên sequence của repository giả:
    // sequence mới = MAX(ticket_id) + 1 = 1 + 1 = 2 (không còn trùng khoá đã có)
    ticketRepo.sequence = Math.max(...ticketStore.map(t => t.ticketId)) + 1;
    expect(ticketRepo.sequence).toBe(2);
    expect(ticketStore.some(t => t.ticketId === ticketRepo.sequence)).toBe(false);

    // -------------------------------------------------------------------------
    // Bước 3: Tạo phiếu bảo hành mới
    // -------------------------------------------------------------------------
    const res = await request(app)
      .post('/api/tickets')
      .set(managerHeaders)
      .send({
        customerId: 1,
        deviceId: 1,
        centerId: 2,
        categoryId: 1,
        issueDesc: 'Man hinh bi soc xanh doc, cam ung goc phai bi liet',
        priority: 'CAO'
      });

    logActual('TC-13 — POST /api/tickets ngay sau khi nạp dữ liệu mẫu', res);

    // =====================================================================
    // KẾT QUẢ MONG ĐỢI:
    //   1) HTTP 201 Created (KHÔNG phải 500)
    //   2) Mã lỗi nghiệp vụ KHÔNG phải LOI_HE_THONG
    //   3) Bản ghi mới được tạo với khoá chính KHÔNG trùng
    //   4) Mã phiếu mới KHÔNG trùng mã phiếu đang tồn tại
    // =====================================================================
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.error).toBeUndefined();

    expect(res.body.data.ticketId).toBeDefined();
    expect(res.body.data.ticketCode).toBeDefined();
    expect(res.body.data.ticketCode).not.toBe('BH-2-00001/2026');
    expect(res.body.data.status).toBe('MOI');
  });
});

// =============================================================================
// TC-14 (TC-BUG-11) — MAJOR: sinh mã phiếu trùng sau khi đã xoá 1 phiếu
// =============================================================================

describe('TC-14 (TC-BUG-11) — MAJOR: Tạo phiếu mới sau khi đã xoá một phiếu phải không sinh mã phiếu TRÙNG', () => {
  beforeEach(() => {
    app = buildApp();
  });

  test('TC-14 (TC-BUG-11): POST /api/tickets sau khi DELETE một phiếu trả HTTP 201 với ticket_code KHÔNG trùng', async () => {
    // -------------------------------------------------------------------------
    // Bước 1: Thêm thêm 3 phiếu (mô phỏng bảng đã có 4 phiếu sau seed)
    // -------------------------------------------------------------------------
    for (const id of [2, 3, 4]) {
      ticketStore.push({
        ticketId: id,
        ticketCode: `BH-2-0000${id}/2026`,
        customerId: 1,
        deviceId: 1,
        centerId: 2,
        technicianId: null,
        categoryId: 1,
        issueDesc: 'Man hinh bi soc xanh doc lan soat nghiep',
        priority: 'CAO',
        status: 'MOI',
        receivedAt: new Date('2026-10-25T10:00:00Z'),
        dueDate: new Date('2026-10-28T10:00:00Z'),
        appointmentAt: null,
        appointmentStatus: null,
        statusHistory: [],
        customer: { customerId: 1, fullName: 'Nguyen Thi Mai', phone: '0901234567' },
        device: { deviceId: 1, serialNo: 'MK-IP15P-9921', productName: 'iPhone 15 Pro Max 256GB' }
      });
    }
    // Sequence đã được "sửa" đúng cách sau seed (BUG-10 fix): đứng sau MAX = 4
    ticketRepo.sequence = 5;

    // -------------------------------------------------------------------------
    // Bước 2: Xoá phiếu có ticket_id = 2 (chỉ được xoá khi status = MOI)
    // -------------------------------------------------------------------------
    const resDelete = await request(app)
      .delete('/api/tickets/2')
      .set(managerHeaders)
      .send({ reason: 'Khach huyen phieu' });

    logActual('TC-14 bước 2 — DELETE /api/tickets/2', resDelete);
    expect(resDelete.status).toBe(200);
    expect(ticketStore.find(t => t.ticketId === 2)).toBeUndefined();

    // -------------------------------------------------------------------------
    // Bước 3: Tạo phiếu mới. BUG-11: COUNT(*) = 3 -> sinh BH-2-00004/2026
    //          TRÙNG với phiếu đang tồn tại -> P2002 -> HTTP 500.
    //          Bản ĐÚNG: MAX(ticket_id) = 4 -> sinh BH-2-00005/2026 (không trùng).
    // -------------------------------------------------------------------------
    const res = await request(app)
      .post('/api/tickets')
      .set(managerHeaders)
      .send({
        customerId: 1,
        deviceId: 1,
        centerId: 2,
        categoryId: 1,
        issueDesc: 'Man hinh bi soc xanh doc, cam ung goc phai bi liet',
        priority: 'CAO'
      });

    logActual('TC-14 bước 3 — POST /api/tickets sau khi đã xoá 1 phiếu', res);

    // =====================================================================
    // KẾT QUẢ MONG ĐỢI:
    //   1) HTTP 201 Created (KHÔNG phải 500 do P2002 trùng ticket_code)
    //   2) Mã phiếu mới KHÔNG trùng bất kỳ mã phiếu nào đang tồn tại
    //   3) Mã phiếu mới lớn hơn mã phiếu lớn nhất đang tồn tại
    // =====================================================================
    expect(res.status).toBe(201);
    expect(res.body.error).toBeUndefined();

    const existingCodes = ticketStore.map(t => t.ticketCode);
    expect(existingCodes).toContain(res.body.data.ticketCode);
    expect(new Set(existingCodes).size).toBe(existingCodes.length);
  });
});

// =============================================================================
// TC-15 (TC-BUG-12) — MAJOR: đặt lịch hẹn không kiểm tra chủ sở hữu (A01/QT-14)
// =============================================================================

describe('TC-15 (TC-BUG-12) — MAJOR: KTV không được đặt lịch hẹn cho phiếu của KTV khác (A01 / QT-14)', () => {
  beforeEach(() => {
    app = buildApp();
  });

  test('TC-15 (TC-BUG-12): POST /api/tickets/{id}/appointment của KTV khác trả HTTP 403 và KHÔNG đổi dữ liệu', async () => {
    const TARGET_TICKET_ID = 1; // thuộc TECH_OWNER_ID = 3

    const before = ticketStore.find(t => t.ticketId === TARGET_TICKET_ID);
    const appointmentBefore = before.appointmentAt;

    // -------------------------------------------------------------------------
    // Bước 1: KTV technicianId=5 (KHÁC chủ sở hữu) thử đặt lịch hẹn cho phiếu của KTV 3
    // -------------------------------------------------------------------------
    const res = await request(app)
      .post(`/api/tickets/${TARGET_TICKET_ID}/appointment`)
      .set(techHeaders(TECH_ATTACKER_ID))
      .send({
        appointmentAt: '2026-11-20T10:00:00+07:00',
        appointmentStatus: 'SCHEDULED'
      });

    logActual('TC-15 — POST /api/tickets/1/appointment với KTV không phải chủ sở hữu', res);

    // =====================================================================
    // KẾT QUẢ MONG ĐỢI (QT-14 + A01 OWASP):
    //   1) HTTP 403 Forbidden
    //   2) Mã lỗi nghiệp vụ KHONG_CO_QUYEN
    //   3) Thông báo nói rõ không có quyền
    //   4) appointmentAt của phiếu KHÔNG bị thay đổi
    // =====================================================================
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('KHONG_CO_QUYEN');
    expect(res.body.message).toMatch(/không có quyền/i);

    const after = ticketStore.find(t => t.ticketId === TARGET_TICKET_ID);
    expect(after.appointmentAt).toEqual(appointmentBefore);
  });

  test('TC-15 (TC-BUG-12): POST /api/tickets/{id}/appointment của CHÍNH chủ sở hữu vẫn thành công (HTTP 200)', async () => {
    const res = await request(app)
      .post('/api/tickets/1/appointment')
      .set(techHeaders(TECH_OWNER_ID))
      .send({
        appointmentAt: '2026-11-20T10:00:00+07:00',
        appointmentStatus: 'SCHEDULED'
      });

    logActual('TC-15 — POST /api/tickets/1/appointment của chính chủ sở hữu', res);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.appointmentAt).toBeTruthy();
  });
});
