/**
 * tests/bt3-unit.test.js — Bài tập 3 (Track SE): 10 test case UNIT của Test Report
 *
 *   TC-U01  (← TC2.3)  QT-04  Hạn SLA theo 3 mức ưu tiên (nhánh A) + (nhánh B) Chủ Nhật
 *   TC-U02  (← TC1.1)  QT-08  Phân công KTV hợp lệ (cùng TT, proficiency >= 3)
 *   TC-U03  (← TC3.2)  QT-06  Chặn chuyển trạng thái ngược
 *   TC-U04  (← TC3.3)  FR4    Đặt lịch hẹn — 2 nhánh: không trùng / trùng
 *   TC-U05  (← RT-8)   QT-15  Che số điện thoại cho vai trò KTV
 *   TC-U06  (← TC2.1)  QT-08  Biên ĐẠT: proficiency = 3
 *   TC-U07  (← TC2.2)  QT-08  Biên RỚT: proficiency = 2
 *   TC-U08  (← TC1.2)  QT-04  Đổi priority → tính lại hạn SLA
 *   TC-U09  (← TC3.1)  QT-08  Từ chối KTV khác trung tâm
 *   TC-U10  (← TC3.4)  --     Mã phiếu không tồn tại
 *
 * LƯU Ý: tên hàm test() luôn BẮT ĐẦU bằng mã test case trong docs/test-report.md
 * (TC-01…TC-10) để giảng viên có thể chạy lại đúng một test case tại chỗ:
 *     npx jest tests/bt3-unit.test.js -t "TC-06"
 *
 * Mọi test đều dùng MOCK Repository (đối tượng giả) → KHÔNG cần CSDL,
 * KHÔNG cần Docker, KHÔNG cần seed. Chạy được ngay sau `npm install`.
 *
 * Cách chạy:
 *   npx jest tests/bt3-unit.test.js
 *
 * Khi điền cột 7 (Kết quả thực tế) của Test Report, hãy chép NỘI DUNG
 * in ra bên dưới (dòng '>>> [KẾT QUẢ THỰC TẾ] ...'), KHÔNG chép PASS/FAIL
 * do bạn tự đoán.
 */

const TicketService = require('../src/services/ticket.service');
const { AppError } = require('../src/errors/AppError');
const { phoneMasker } = require('../src/middlewares/phoneMasker.middleware');

describe('BT3 Unit Test — 10 test case của Test Report (docs/test-report.md). Chạy lại 1 case: npx jest tests/bt3-unit.test.js -t <mã>', () => {
  let ticketService;
  let mockTicketRepo;
  let mockTechRepo;
  let mockApptRepo;
  let fakeTickets;
  let fakeTechs;

  beforeEach(() => {
    fakeTickets = [
      {
        ticketId: 101,
        ticketCode: 'BH-2-00101/2026',
        centerId: 2,
        technicianId: null,
        status: 'MOI',
        priority: 'CAO',
        receivedAt: new Date('2026-10-26T03:00:00Z'),
        dueDate: new Date('2026-10-27T03:00:00Z'),
        statusHistory: [
          { from: null, to: 'MOI', at: '2026-10-26T03:00:00Z', by: null, note: 'Tiếp nhận' }
        ]
      },
      {
        ticketId: 102,
        ticketCode: 'BH-2-00102/2026',
        centerId: 2,
        technicianId: 5,
        status: 'HOAN_TAT',
        priority: 'TRUNG_BINH',
        receivedAt: new Date('2026-10-20T08:00:00Z'),
        dueDate: new Date('2026-10-23T08:00:00Z'),
        statusHistory: [
          { from: null, to: 'MOI', at: '2026-10-20T08:00:00Z', by: null },
          { from: 'MOI', to: 'DA_PHAN_CONG', at: '2026-10-20T09:00:00Z', by: 1 },
          { from: 'DA_PHAN_CONG', to: 'HOAN_TAT', at: '2026-10-21T10:00:00Z', by: 5 }
        ]
      },
      {
        ticketId: 103,
        ticketCode: 'BH-2-00103/2026',
        centerId: 2,
        technicianId: 5,
        status: 'DA_PHAN_CONG',
        priority: 'CAO',
        receivedAt: new Date('2026-10-26T03:00:00Z'),
        dueDate: new Date('2026-10-27T03:00:00Z'),
        statusHistory: [
          { from: null, to: 'MOI', at: '2026-10-26T03:00:00Z', by: null },
          { from: 'MOI', to: 'DA_PHAN_CONG', at: '2026-10-26T04:00:00Z', by: 1 }
        ]
      }
    ];

    fakeTechs = [
      { technicianId: 1, fullName: 'Nguyễn Văn A', centerId: 2, proficiency: 4, isActive: true },
      { technicianId: 2, fullName: 'Trần Văn Biên Đạt', centerId: 2, proficiency: 3, isActive: true },
      { technicianId: 3, fullName: 'Lê Học Việc', centerId: 2, proficiency: 2, isActive: true },
      { technicianId: 4, fullName: 'Phạm Khác Trụ Sở', centerId: 1, proficiency: 5, isActive: true }
    ];

    mockTicketRepo = {
      findById: jest.fn(async id => fakeTickets.find(t => t.ticketId === Number(id)) || null),
      lockById: jest.fn(async id => fakeTickets.find(t => t.ticketId === Number(id)) || null),
      findMany: jest.fn(async () => ({ total: fakeTickets.length, items: fakeTickets })),
      countOpenByTechnician: jest.fn(async () => 2),
      update: jest.fn(async (id, updateData) => {
        const ticket = fakeTickets.find(t => t.ticketId === Number(id));
        if (!ticket) return null;
        Object.assign(ticket, updateData);
        return ticket;
      }),
      delete: jest.fn(async id => {
        const idx = fakeTickets.findIndex(t => t.ticketId === Number(id));
        if (idx >= 0) return fakeTickets.splice(idx, 1)[0];
        return null;
      })
    };

    mockTechRepo = {
      findById: jest.fn(async id => fakeTechs.find(t => t.technicianId === Number(id)) || null)
    };

    mockApptRepo = {
      hasConflict: jest.fn(async (techId, time) => {
        if (new Date(time).toISOString() === new Date('2026-10-26T14:00:00Z').toISOString()) {
          return { ticketCode: 'BH-2-99999/2026' };
        }
        return null;
      })
    };

    ticketService = new TicketService(mockTicketRepo, mockTechRepo, mockApptRepo, {});
  });

  /** In kết quả thực tế để chép vào cột 7 của Test Report */
  function logActual(label, lines) {
    // eslint-disable-next-line no-console
    console.log(`\n>>> [KẾT QUẢ THỰC TẾ] ${label}\n${lines.map(l => `    ${l}`).join('\n')}`);
  }

  // ===========================================================================
  // LOẠI 1 — LUỒNG ĐÚNG (HAPPY PATH)
  // ===========================================================================

  test('TC-01 (TC-U01): Tính hạn SLA tự động theo 3 mức ưu tiên — CAO 24h, TRUNG_BINH 72h, THAP 120h (QT-04)', () => {
    // Nhánh A: tiếp nhận vào THỨ HAI (ngày làm việc) → hạn = số giờ làm việc
    const received = new Date('2026-10-26T03:00:00Z'); // Thứ 2, 10:00 giờ VN

    const dueCao = ticketService.calculateDueDate(received, 'CAO');
    const dueTB = ticketService.calculateDueDate(received, 'TRUNG_BINH');
    const dueThap = ticketService.calculateDueDate(received, 'THAP');

    const dCao = dueCao.getTime() - received.getTime();
    const dTB = dueTB.getTime() - received.getTime();
    const dThap = dueThap.getTime() - received.getTime();

    logActual('TC-01 nhánh A — tiếp nhận Thứ 2 (không bỏ qua Chủ Nhật)', [
      `receivedAt      : ${received.toISOString()}  (${received.toUTCString().slice(0, 3)})`,
      `CAO      dueDate : ${dueCao.toISOString()}  (+${dCao} ms)`,
      `TRUNG_BINH      : ${dueTB.toISOString()}  (+${dTB} ms)`,
      `THAP            : ${dueThap.toISOString()}  (+${dThap} ms)`
    ]);

    expect(dCao).toBe(24 * 3600 * 1000);
    expect(dTB).toBe(72 * 3600 * 1000);
    expect(dThap).toBe(120 * 3600 * 1000);
  });

  test('TC-01 (TC-U01) nhánh B: Tiếp nhận vào CHỦ NHẬT → 24 giờ SLA không đếm giờ Chủ Nhật (QT-04)', () => {
    // Nhánh B: tiếp nhận vào CHỦ NHẬT → giờ làm việc chạy từ 00:00 Thứ 2
    const receivedSunday = new Date('2026-10-25T03:00:00Z'); // Chủ Nhật, 10:00 giờ VN

    const dueCao = ticketService.calculateDueDate(receivedSunday, 'CAO');

    logActual('TC-01 nhánh B — tiếp nhận Chủ Nhật (bỏ qua giờ Chủ Nhật)', [
      `receivedAt      : ${receivedSunday.toISOString()}  (${receivedSunday.toUTCString().slice(0, 3)})`,
      `CAO      dueDate : ${dueCao.toISOString()}  (${dueCao.toUTCString().slice(0, 3)})`,
      `chênh lệch lịch : +${dueCao.getTime() - receivedSunday.getTime()} ms (> 24h vì đã bỏ qua Chủ Nhật)`
    ]);

    // 24 giờ làm việc tính từ 00:00 Thứ 2 → 00:00 Thứ 3 (giờ VN) = 2026-10-26T17:00:00Z
    expect(dueCao.toISOString()).toBe('2026-10-26T17:00:00.000Z');
    // Chắc chắn KHÔNG phải cách cộng giờ lịch thuần túy (24h → 2026-10-26T03:00:00Z)
    expect(dueCao.getTime()).toBeGreaterThan(receivedSunday.getTime() + 24 * 3600 * 1000);
  });

  test('TC-02 (TC-U02): Phân công KTV hợp lệ (cùng trung tâm, proficiency = 4 >= 3) chuyển sang DA_PHAN_CONG và ghi log JSONB (QT-08 + QT-06)', async () => {
    const result = await ticketService.assignTechnician(101, 1, 99, 'Phân công đúng tay nghề');

    const latest = result.statusHistory[result.statusHistory.length - 1];
    logActual('TC-02', [
      `technicianId    : ${result.technicianId}`,
      `status          : ${result.status}`,
      `statusHistory   : ${result.statusHistory.length} phần tử`,
      `phần tử cuối    : from=${latest.from} to=${latest.to} by=${latest.by} note="${latest.note}" at=${latest.at}`
    ]);

    expect(result.technicianId).toBe(1);
    expect(result.status).toBe('DA_PHAN_CONG');
    expect(Array.isArray(result.statusHistory)).toBe(true);
    expect(result.statusHistory).toHaveLength(2);
    expect(latest.from).toBe('MOI');
    expect(latest.to).toBe('DA_PHAN_CONG');
    expect(latest.by).toBe(99);
    expect(latest.note).toBe('Phân công đúng tay nghề');
    expect(latest.at).toBeDefined();
  });

  test('TC-04 (TC-U04) nhánh 1: Đặt lịch hẹn khi KHÔNG trùng lịch — ghi appointmentAt và appointmentStatus (FR4)', async () => {
    const result = await ticketService.scheduleAppointment(102, '2026-10-26T15:00:00Z');

    logActual('TC-04 nhánh 1 (không trùng)', [
      `hasConflict gọi với: ${JSON.stringify(mockApptRepo.hasConflict.mock.calls[0])}`,
      `appointmentAt   : ${new Date(result.appointmentAt).toISOString()}`,
      `appointmentStatus: ${result.appointmentStatus}`
    ]);

    expect(mockApptRepo.hasConflict).toHaveBeenCalledWith(5, '2026-10-26T15:00:00Z', 102);
    expect(new Date(result.appointmentAt).toISOString()).toBe('2026-10-26T15:00:00.000Z');
    expect(result.appointmentStatus).toBe('SCHEDULED');
  });

  test('TC-05 (TC-U05): Che số điện thoại khách hàng cho vai trò TECHNICIAN thành 090****567, giữ nguyên kiểu Date (QT-15)', () => {
    const receivedAt = new Date('2026-10-28T14:43:26.024Z');
    const rawData = {
      ticketId: 1,
      receivedAt,
      customer: {
        phone: '0901234567',
        createdAt: new Date('2026-10-28T10:00:00.000Z')
      }
    };

    const req = { query: {}, params: {}, body: {}, headers: { 'x-user-role': 'TECHNICIAN' } };
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) { this.statusCode = code; return this; },
      json(data) { this.jsonData = data; return this; }
    };

    phoneMasker(req, res, () => {});
    res.json(rawData);

    logActual('TC-05', [
      `SĐT gốc         : 0901234567`,
      `SĐT trả về      : ${res.jsonData.customer.phone}`,
      `receivedAt là Date: ${res.jsonData.receivedAt instanceof Date} (${res.jsonData.receivedAt.toISOString()})`,
      `createdAt  là Date: ${res.jsonData.customer.createdAt instanceof Date} (${res.jsonData.customer.createdAt.toISOString()})`
    ]);

    expect(res.jsonData.customer.phone).toBe('090****567');
    expect(res.jsonData.receivedAt).toBeInstanceOf(Date);
    expect(res.jsonData.receivedAt.toISOString()).toBe('2026-10-28T14:43:26.024Z');
    expect(res.jsonData.customer.createdAt).toBeInstanceOf(Date);
  });

  test('TC-03 (TC-U08): Cập nhật ưu tiên từ CAO sang TRUNG_BINH → tự động tính lại hạn SLA theo giờ làm việc (QT-04)', async () => {
    const updated = await ticketService.updateTicket(101, {
      issueDesc: 'Mô tả sự cố mới đã được cập nhật chi tiết trên 10 ký tự',
      priority: 'TRUNG_BINH'
    });

    logActual('TC-03', [
      `priority        : ${updated.priority}`,
      `issueDesc       : "${updated.issueDesc}"`,
      `receivedAt      : ${new Date('2026-10-26T03:00:00Z').toISOString()} (Thứ 2)`,
      `dueDate mới     : ${new Date(updated.dueDate).toISOString()} (Thứ 5)`
    ]);

    expect(updated.issueDesc).toBe('Mô tả sự cố mới đã được cập nhật chi tiết trên 10 ký tự');
    expect(updated.priority).toBe('TRUNG_BINH');
    // SLA 72 giờ làm việc từ Thứ 2 10:00 (giờ VN) → Thứ 5 10:00 (giờ VN)
    expect(new Date(updated.dueDate).toISOString()).toBe(new Date('2026-10-29T03:00:00Z').toISOString());
  });

  // ===========================================================================
  // LOẠI 2 — GIÁ TRỊ BIÊN (hai bên của cùng ranh giới proficiency = 3)
  // ===========================================================================

  test('TC-06 (TC-U06) (biên ĐẠT): KTV có đúng proficiency = 3 (ngưỡng tối thiểu QT-08) ĐƯỢC phân công thành công', async () => {
    const result = await ticketService.assignTechnician(101, 2, 99, 'KTV đạt đúng ngưỡng');
    const latest = result.statusHistory[result.statusHistory.length - 1];

    logActual('TC-06 (biên đạt)', [
      `technicianId 2  : centerId=${fakeTechs[1].centerId}, proficiency=${fakeTechs[1].proficiency}`,
      `status          : ${result.status}`,
      `statusHistory   : ${result.statusHistory.length} phần tử, phần tử cuối to=${latest.to}`
    ]);

    expect(result.technicianId).toBe(2);
    expect(result.status).toBe('DA_PHAN_CONG');
    expect(latest.to).toBe('DA_PHAN_CONG');
  });

  test('TC-07 (TC-U07) (biên RỚT): KTV có proficiency = 2 (ngay dưới ngưỡng 3) bị từ chối với mã KTV_KHONG_DU_TAY_NGHE, phiếu giữ nguyên MOI', async () => {
    let caught = null;
    try {
      await ticketService.assignTechnician(101, 3, 99);
    } catch (err) {
      caught = err;
    }

    logActual('TC-07 (biên rớt)', [
      `technicianId 3  : centerId=${fakeTechs[2].centerId}, proficiency=${fakeTechs[2].proficiency}`,
      `err.code        : ${caught ? caught.code : '(không ném lỗi)'}`,
      `err.message     : ${caught ? caught.message : '(không ném lỗi)'}`,
      `trạng thái phiếu : ${fakeTickets[0].status} (mong đợi: MOI)`
    ]);

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.code).toBe('KTV_KHONG_DU_TAY_NGHE');
    expect(caught.message).toContain('proficiency tối thiểu từ 3 trở lên');
    expect(fakeTickets[0].status).toBe('MOI');
  });

  // ===========================================================================
  // LOẠI 3 — DỮ LIỆU SAI / VI PHẠM RÀNG BUỘC
  // ===========================================================================

  test('TC-08 (TC-U03): Chặn chuyển trạng thái ngược HOAN_TAT → MOI theo QT-06, không ghi log và không update', async () => {
    let caught = null;
    try {
      await ticketService.transitionStatus(102, 'MOI', 5, 'Cố tình chuyển lùi');
    } catch (err) {
      caught = err;
    }

    logActual('TC-08', [
      `err.code          : ${caught ? caught.code : '(không ném lỗi)'}`,
      `err.message       : ${caught ? caught.message : '(không ném lỗi)'}`,
      `repo.update gọi  : ${mockTicketRepo.update.mock.calls.length} lần`,
      `statusHistory     : ${fakeTickets[1].statusHistory.length} phần tử (mong đợi: 3)`
    ]);

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.code).toBe('TRANG_THAI_KHONG_HOP_LE');
    expect(caught.message).toContain('quy tắc vòng đời không đảo ngược');
    expect(mockTicketRepo.update).not.toHaveBeenCalled();
    expect(fakeTickets[1].statusHistory).toHaveLength(3);
  });

  test('TC-09 (TC-U04 nhánh 2): Phát hiện và từ chối xung đột lịch hẹn với mã LICH_HEN_XUNG_DOT, không ghi đè lịch hẹn cũ', async () => {
    let caught = null;
    try {
      await ticketService.scheduleAppointment(102, '2026-10-26T14:00:00Z');
    } catch (err) {
      caught = err;
    }

    logActual('TC-09 (xung đột)', [
      `err.code          : ${caught ? caught.code : '(không ném lỗi)'}`,
      `err.message       : ${caught ? caught.message : '(không ném lỗi)'}`,
      `repo.update gọi  : ${mockTicketRepo.update.mock.calls.length} lần (mong đợi: 0)`
    ]);

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.code).toBe('LICH_HEN_XUNG_DOT');
    expect(caught.message).toContain('đã có lịch hẹn khác');
    expect(caught.message).toContain('BH-2-99999/2026');
    expect(mockTicketRepo.update).not.toHaveBeenCalled();
  });

  test('TC-10 (TC-U09): Từ chối phân công KTV khác trung tâm với mã KTV_KHONG_CUNG_TRUNG_TAM, phiếu giữ nguyên MOI', async () => {
    let caught = null;
    try {
      await ticketService.assignTechnician(101, 4, 99);
    } catch (err) {
      caught = err;
    }

    logActual('TC-10', [
      `KTV 4            : centerId=${fakeTechs[3].centerId}, proficiency=${fakeTechs[3].proficiency}`,
      `Phiếu 101        : centerId=${fakeTickets[0].centerId}`,
      `err.code         : ${caught ? caught.code : '(không ném lỗi)'}`,
      `err.message      : ${caught ? caught.message : '(không ném lỗi)'}`,
      `trạng thái phiếu  : ${fakeTickets[0].status} (mong đợi: MOI)`
    ]);

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.code).toBe('KTV_KHONG_CUNG_TRUNG_TAM');
    expect(caught.message).toContain('không thuộc trung tâm tiếp nhận phiếu');
    expect(fakeTickets[0].status).toBe('MOI');
  });

  test('TC-P3 (BUG-08): Chặn chuyển trạng thái tự thân DA_PHAN_CONG → DA_PHAN_CONG theo QT-06, không ghi log rác', async () => {
    let caught = null;
    try {
      await ticketService.transitionStatus(103, 'DA_PHAN_CONG', 5, 'Cố tình chuyển sang chính nó');
    } catch (err) {
      caught = err;
    }

    logActual('TC-P3 (BUG-08 — self-loop)', [
      `trạng thái gốc    : DA_PHAN_CONG`,
      `trạng thái đích   : DA_PHAN_CONG (self-loop)`,
      `err.code          : ${caught ? caught.code : '(không ném lỗi)'}`,
      `err.message       : ${caught ? caught.message : '(không ném lỗi)'}`,
      `repo.update gọi  : ${mockTicketRepo.update.mock.calls.length} lần (mong đợi: 0)`,
      `statusHistory     : ${fakeTickets[2].statusHistory.length} phần tử (mong đợi: 2)`
    ]);

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.code).toBe('TRANG_THAI_KHONG_HOP_LE');
    expect(caught.message).toContain('quy tắc vòng đời không đảo ngược');
    expect(mockTicketRepo.update).not.toHaveBeenCalled();
    expect(fakeTickets[2].statusHistory).toHaveLength(2);
  });

  test('TC-P4 (QT-07): Điều chuyển KTV trên phiếu đang DA_PHAN_CONG phải ghi kèm note lý do vào status_history', async () => {
    // QT-07: mỗi lần điều chuyển KTV phải ghi kèm note lý do vào status_history
    const result = await ticketService.assignTechnician(
      103, 1, 99, 'Điều chuyển KTV do chuyên môn chuyên ngành sửa mainboard'
    );

    const latest = result.statusHistory[result.statusHistory.length - 1];
    logActual('TC-P4 (QT-07 — note khi điều chuyển KTV)', [
      `phiếu gốc        : 103 (status DA_PHAN_CONG, technicianId đã có)`,
      `KTV mới          : ${result.technicianId}`,
      `status           : ${result.status}`,
      `statusHistory    : ${result.statusHistory.length} phần tử`,
      `phần tử cuối     : from=${latest.from} to=${latest.to} by=${latest.by}`,
      `note             : "${latest.note}"`,
      `note khác rỗng   : ${latest.note.trim().length > 0}`
    ]);

    expect(latest.from).toBe('DA_PHAN_CONG');
    expect(latest.to).toBe('DA_PHAN_CONG');
    expect(result.statusHistory).toHaveLength(3);
    // QT-07: note lý do phải có thật, không rỗng
    expect(typeof latest.note).toBe('string');
    expect(latest.note.trim().length).toBeGreaterThan(0);
    expect(latest.note).toContain('Điều chuyển KTV');
    expect(latest.by).toBe(99);
  });

  test('TC-P5 (QT-11): Từ chối phân công khi KTV đang giữ đủ 8 phiếu mở — mã KTV_QUA_TAI (biên đạt)', async () => {
    // Biên ĐẠT của QT-11: openCount đúng bằng giới hạn 8 -> vẫn bị từ chối (>= MAX_OPEN_TICKETS_PER_TECH)
    mockTicketRepo.countOpenByTechnician.mockResolvedValue(8);

    let caught = null;
    try {
      await ticketService.assignTechnician(101, 1, 99);
    } catch (err) {
      caught = err;
    }

    logActual('TC-P5 (QT-11 — chống quá tải KTV, biên đạt 8 phiếu)', [
      `giới hạn           : MAX_OPEN_TICKETS_PER_TECH = 8`,
      `số phiếu mở của KTV : 8 (đúng biên đạt)`,
      `err.code            : ${caught ? caught.code : '(không ném lỗi)'}`,
      `err.message         : ${caught ? caught.message : '(không ném lỗi)'}`,
      `repo.update gọi     : ${mockTicketRepo.update.mock.calls.length} lần (mong đợi: 0)`,
      `trạng thái phiếu 101 : ${fakeTickets[0].status} (mong đợi: MOI)`
    ]);

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.code).toBe('KTV_QUA_TAI');
    expect(caught.message).toContain('vượt giới hạn tải cho phép');
    expect(mockTicketRepo.update).not.toHaveBeenCalled();
    expect(fakeTickets[0].status).toBe('MOI');
  });

  test('TC-P6 (QT-11): Biên rớt — KTV còn 7 phiếu mở vẫn được phân công thành công', async () => {
    // Biên RỚT của QT-11: openCount = 7 (< 8) -> được phân công
    mockTicketRepo.countOpenByTechnician.mockResolvedValue(7);

    const result = await ticketService.assignTechnician(101, 1, 99);

    logActual('TC-P6 (QT-11 — biên rớt 7 phiếu)', [
      `số phiếu mở của KTV : 7 (< giới hạn 8)`,
      `status              : ${result.status}`,
      `technicianId        : ${result.technicianId}`,
      `repo.update gọi     : ${mockTicketRepo.update.mock.calls.length} lần (mong đợi: 1)`
    ]);

    expect(result.status).toBe('DA_PHAN_CONG');
    expect(result.technicianId).toBe(1);
    expect(mockTicketRepo.update).toHaveBeenCalledTimes(1);
  });

  test('TC-P2 (TC-U10): Thao tác trên mã phiếu không tồn tại trả về PHIEU_KHONG_TON_TAI, không update dữ liệu rác', async () => {
    let caught = null;
    try {
      await ticketService.assignTechnician(999999, 1, 99);
    } catch (err) {
      caught = err;
    }

    logActual('TC-P2 (TC-U10)', [
      `ticketId         : 999999`,
      `err.code         : ${caught ? caught.code : '(không ném lỗi)'}`,
      `err.message      : ${caught ? caught.message : '(không ném lỗi)'}`,
      `repo.update gọi  : ${mockTicketRepo.update.mock.calls.length} lần (mong đợi: 0)`
    ]);

    expect(caught).toBeInstanceOf(AppError);
    expect(caught.code).toBe('PHIEU_KHONG_TON_TAI');
    expect(caught.message).toContain('999999');
    expect(mockTicketRepo.update).not.toHaveBeenCalled();
  });
});
