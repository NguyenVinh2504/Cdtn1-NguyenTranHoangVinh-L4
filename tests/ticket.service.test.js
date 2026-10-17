const TicketService = require('../src/services/ticket.service');
const { AppError } = require('../src/errors/AppError');

describe('TicketService - Bộ kiểm thử module cốt lõi Luồng L4 (BT2 - Buổi 7 tới 10)', () => {
  let ticketService;
  let mockTicketRepo;
  let mockTechRepo;
  let mockApptRepo;
  let mockCustRepo;

  // Dữ liệu giả lập cô lập (Không phụ thuộc môi trường bên ngoài)
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
        receivedAt: new Date('2026-10-25T08:00:00Z'),
        dueDate: new Date('2026-10-26T08:00:00Z'),
        statusHistory: [
          { from: null, to: 'MOI', at: '2026-10-25T08:00:00Z', by: null, note: 'Tiếp nhận' }
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
      }
    ];

    fakeTechs = [
      // KTV 1: Đủ chuẩn, thợ giỏi (proficiency = 4, trung tâm 2)
      { technicianId: 1, fullName: 'Nguyễn Văn A', centerId: 2, proficiency: 4, isActive: true },
      // KTV 2: Biên đạt chuẩn (proficiency = 3, trung tâm 2)
      { technicianId: 2, fullName: 'Trần Văn Biên Đạt', centerId: 2, proficiency: 3, isActive: true },
      // KTV 3: Biên rớt chuẩn (proficiency = 2 < 3, trung tâm 2)
      { technicianId: 3, fullName: 'Lê Học Việc', centerId: 2, proficiency: 2, isActive: true },
      // KTV 4: Khác trung tâm (Trung tâm 1, proficiency = 5)
      { technicianId: 4, fullName: 'Phạm Khác Trụ Sở', centerId: 1, proficiency: 5, isActive: true }
    ];

    mockTicketRepo = {
      findById: jest.fn(async id => fakeTickets.find(t => t.ticketId === Number(id)) || null),
      countOpenByTechnician: jest.fn(async techId => 2),
      update: jest.fn(async (id, updateData) => {
        const ticket = fakeTickets.find(t => t.ticketId === Number(id));
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
        // Giả lập xung đột nếu lịch hẹn trùng vào 14:00 ngày 26/10
        if (new Date(time).toISOString() === new Date('2026-10-26T14:00:00Z').toISOString()) {
          return { ticketCode: 'BH-2-99999/2026' };
        }
        return null;
      })
    };

    mockCustRepo = {};

    ticketService = new TicketService(mockTicketRepo, mockTechRepo, mockApptRepo, mockCustRepo);
  });

  // =========================================================================
  // LOẠI 1: KIỂM THỬ LUỒNG ĐÚNG (HAPPY PATH)
  // =========================================================================
  describe('Loại 1: Luồng đúng (Happy Path)', () => {
    test('TC1.1: Quản lý phân công KTV hợp lệ (cùng trung tâm, proficiency=4 >= 3) thành công', async () => {
      const result = await ticketService.assignTechnician(101, 1, 99, 'Phân công đúng tay nghề');

      // Kiểm chứng KTV được gán và trạng thái chuyển sang DA_PHAN_CONG
      expect(result.technicianId).toBe(1);
      expect(result.status).toBe('DA_PHAN_CONG');

      // Kiểm chứng nhật ký JSONB status_history được append đúng chuẩn
      expect(Array.isArray(result.statusHistory)).toBe(true);
      expect(result.statusHistory).toHaveLength(2);

      const latestLog = result.statusHistory[result.statusHistory.length - 1];
      expect(latestLog.from).toBe('MOI');
      expect(latestLog.to).toBe('DA_PHAN_CONG');
      expect(latestLog.by).toBe(99);
      expect(latestLog.note).toBe('Phân công đúng tay nghề');
      expect(latestLog.at).toBeDefined();
    });
  });

  // =========================================================================
  // LOẠI 2: KIỂM THỬ GIÁ TRỊ BIÊN (BOUNDARY VALUES)
  // =========================================================================
  describe('Loại 2: Giá trị biên (Boundary Conditions)', () => {
    test('TC2.1 (Biên đạt): KTV có đúng proficiency = 3 (ngưỡng tối thiểu của QT-08) được phân công thành công', async () => {
      const result = await ticketService.assignTechnician(101, 2, 99, 'KTV đạt đúng ngưỡng');

      expect(result.technicianId).toBe(2);
      expect(result.status).toBe('DA_PHAN_CONG');
      const latestLog = result.statusHistory[result.statusHistory.length - 1];
      expect(latestLog.to).toBe('DA_PHAN_CONG');
    });

    test('TC2.2 (Biên rớt): KTV có proficiency = 2 (ngay dưới ngưỡng 3) bị từ chối với mã KTV_KHONG_DU_TAY_NGHE', async () => {
      await expect(
        ticketService.assignTechnician(101, 3, 99)
      ).rejects.toThrow(AppError);

      try {
        await ticketService.assignTechnician(101, 3, 99);
      } catch (err) {
        expect(err.code).toBe('KTV_KHONG_DU_TAY_NGHE');
        expect(err.message).toContain('proficiency tối thiểu từ 3 trở lên');
      }
    });

    test('TC2.3 (Biên SLA): Tự động tính đúng due_date cho các mốc SLA 24h, 72h, 120h theo QT-04', () => {
      const received = new Date('2026-10-25T10:00:00Z');

      const dueCao = ticketService.calculateDueDate(received, 'CAO');
      expect(dueCao.getTime() - received.getTime()).toBe(24 * 3600 * 1000);

      const dueTB = ticketService.calculateDueDate(received, 'TRUNG_BINH');
      expect(dueTB.getTime() - received.getTime()).toBe(72 * 3600 * 1000);

      const dueThap = ticketService.calculateDueDate(received, 'THAP');
      expect(dueThap.getTime() - received.getTime()).toBe(120 * 3600 * 1000);
    });
  });

  // =========================================================================
  // LOẠI 3: KIỂM THỬ DỮ LIỆU SAI / VI PHẠM RÀNG BUỘC (INVALID DATA & CONSTRAINTS)
  // =========================================================================
  describe('Loại 3: Dữ liệu sai & Vi phạm ràng buộc', () => {
    test('TC3.1: Từ chối phân công KTV khác trung tâm với mã KTV_KHONG_CUNG_TRUNG_TAM (QT-08)', async () => {
      await expect(
        ticketService.assignTechnician(101, 4, 99) // Tech 4 ở Trung tâm 1, Ticket 101 ở Trung tâm 2
      ).rejects.toThrow(AppError);

      try {
        await ticketService.assignTechnician(101, 4, 99);
      } catch (err) {
        expect(err.code).toBe('KTV_KHONG_CUNG_TRUNG_TAM');
        expect(err.message).toContain('không thuộc trung tâm tiếp nhận phiếu');
      }
    });

    test('TC3.2: Ngăn chặn chuyển trạng thái ngược từ HOAN_TAT về MOI theo QT-06 (Vòng đời không đảo ngược)', async () => {
      await expect(
        ticketService.transitionStatus(102, 'MOI', 5, 'Cố tình chuyển lùi')
      ).rejects.toThrow(AppError);

      try {
        await ticketService.transitionStatus(102, 'MOI', 5);
      } catch (err) {
        expect(err.code).toBe('TRANG_THAI_KHONG_HOP_LE');
        expect(err.message).toContain('quy tắc vòng đời không đảo ngược');
      }
    });

    test('TC3.3: Phát hiện và từ chối xung đột lịch hẹn của KTV với mã LICH_HEN_XUNG_DOT (FR4)', async () => {
      const conflictTime = '2026-10-26T14:00:00Z';
      await expect(
        ticketService.scheduleAppointment(102, conflictTime)
      ).rejects.toThrow(AppError);

      try {
        await ticketService.scheduleAppointment(102, conflictTime);
      } catch (err) {
        expect(err.code).toBe('LICH_HEN_XUNG_DOT');
        expect(err.message).toContain('đã có lịch hẹn khác');
      }
    });

    test('TC3.4: Thao tác trên mã phiếu không tồn tại trả về PHIEU_KHONG_TON_TAI', async () => {
      await expect(
        ticketService.assignTechnician(999999, 1, 99)
      ).rejects.toThrow(AppError);

      try {
        await ticketService.assignTechnician(999999, 1, 99);
      } catch (err) {
        expect(err.code).toBe('PHIEU_KHONG_TON_TAI');
      }
    });

    test('TC3.5 (CRUD Delete Entity 1): Xóa thành công phiếu bảo hành ở trạng thái MOI', async () => {
      const deleted = await ticketService.deleteTicket(101, 'Khách hủy yêu cầu');
      expect(deleted.ticketId).toBe(101);
      expect(mockTicketRepo.delete).toHaveBeenCalledWith(101);
    });

    test('TC3.6: Từ chối xóa phiếu đã hoàn tất hoặc đang xử lý với mã KHONG_THE_XOA_PHIEU', async () => {
      await expect(
        ticketService.deleteTicket(102, 'Cố tình xóa phiếu đã xong')
      ).rejects.toThrow(AppError);

      try {
        await ticketService.deleteTicket(102, 'Cố tình xóa');
      } catch (err) {
        expect(err.code).toBe('KHONG_THE_XOA_PHIEU');
        expect(err.message).toContain('Không thể xóa phiếu');
      }
    });
  });
});

