const TechnicianService = require('../src/services/technician.service');
const { AppError } = require('../src/errors/AppError');

describe('TechnicianService - Quản lý Kỹ thuật viên & Cân bằng tải (Luồng L4)', () => {
  let technicianService;
  let mockTechRepo;
  let mockTicketRepo;

  let fakeTechs;
  let fakeTickets;

  beforeEach(() => {
    fakeTechs = [
      { technicianId: 1, fullName: 'Nguyễn Văn A', centerId: 2, proficiency: 4, isActive: true },
      { technicianId: 2, fullName: 'Trần Văn Cường', centerId: 2, proficiency: 3, isActive: true },
      { technicianId: 3, fullName: 'Lê Học Việc', centerId: 2, proficiency: 2, isActive: true },
      { technicianId: 4, fullName: 'Vũ Khác Trung Tâm', centerId: 1, proficiency: 5, isActive: true }
    ];

    fakeTickets = [
      { ticketId: 10, centerId: 2, status: 'MOI' }
    ];

    mockTechRepo = {
      findById: jest.fn(async id => fakeTechs.find(t => t.technicianId === Number(id)) || null),
      findEligible: jest.fn(async (centerId, minProf) => {
        // Chỉ trả về KTV cùng trung tâm và có proficiency >= 3
        return fakeTechs
          .filter(t => t.centerId === Number(centerId) && t.proficiency >= minProf && t.isActive)
          .map(t => ({ ...t, workload: t.technicianId === 1 ? 5 : 1 })); // Giả lập workload
      }),
      create: jest.fn(async data => ({ technicianId: 99, ...data })),
      update: jest.fn(async (id, data) => {
        const tech = fakeTechs.find(t => t.technicianId === Number(id));
        Object.assign(tech, data);
        return tech;
      }),
      delete: jest.fn(async id => {
        const tech = fakeTechs.find(t => t.technicianId === Number(id));
        tech.isActive = false;
        return tech;
      })
    };

    mockTicketRepo = {
      findById: jest.fn(async id => fakeTickets.find(t => t.ticketId === Number(id)) || null)
    };

    technicianService = new TechnicianService(mockTechRepo, mockTicketRepo);
  });

  test('TC-TECH-1: Gợi ý KTV đạt chuẩn cho phiếu kèm sắp xếp ưu tiên KTV có workload thấp nhất (Cân bằng tải V3)', async () => {
    const result = await technicianService.listCandidatesForTicket(10);

    expect(result.ticket.ticketId).toBe(10);
    expect(result.candidates).toHaveLength(2); // Chỉ Tech 1 (prof=4) và Tech 2 (prof=3), loại Tech 3 (prof=2) và Tech 4 (center=1)

    // Tech 2 có workload = 1 phải xếp trước Tech 1 có workload = 5
    expect(result.candidates[0].technicianId).toBe(2);
    expect(result.candidates[0].workload).toBe(1);
    expect(result.candidates[1].technicianId).toBe(1);
    expect(result.candidates[1].workload).toBe(5);
  });

  test('TC-TECH-2: Thêm mới kỹ thuật viên thành công (Thao tác Create của CRUD Entity 2)', async () => {
    const newTechData = {
      employeeId: 'NV-KTV-099',
      fullName: 'Hoàng Văn Mới',
      centerId: 2,
      level: 'TRUNG_CAP',
      proficiency: 4
    };

    const created = await technicianService.createTechnician(newTechData);
    expect(created.employeeId).toBe('NV-KTV-099');
    expect(created.proficiency).toBe(4);
  });

  test('TC-TECH-3: Vô hiệu hóa kỹ thuật viên bằng Soft Delete (QT-13) cập nhật isActive = false', async () => {
    const deleted = await technicianService.softDeleteTechnician(1);
    expect(deleted.isActive).toBe(false);
  });

  test('TC-TECH-4: Truy vấn kỹ thuật viên không tồn tại trả về lỗi KTV_KHONG_TON_TAI', async () => {
    await expect(technicianService.getById(9999)).rejects.toThrow(AppError);
    try {
      await technicianService.getById(9999);
    } catch (err) {
      expect(err.code).toBe('KTV_KHONG_TON_TAI');
    }
  });
});

