const { AppError } = require('../errors/AppError');

class TechnicianService {
  constructor(technicianRepo, ticketRepo) {
    this.technicians = technicianRepo;
    this.tickets = ticketRepo;
  }

  /**
   * UC2 / NFR4: Lấy danh sách kỹ thuật viên đủ điều kiện để phân công cho phiếu
   * 1 endpoint duy nhất trả về danh sách KTV cùng trung tâm, proficiency >= 3,
   * kèm số lượng workload hiện tại để Quản lý chọn trong <= 3 click.
   */
  async listCandidatesForTicket(ticketId) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new AppError('PHIEU_KHONG_TON_TAI', `Không tìm thấy phiếu bảo hành ID ${ticketId}`);
    }

    const candidates = await this.technicians.findEligible(ticket.centerId, 3);

    // Sắp xếp ưu tiên: KTV có khối lượng công việc thấp nhất lên đầu (Cân bằng tải V3)
    candidates.sort((a, b) => a.workload - b.workload);

    return {
      ticket: {
        ticketId: ticket.ticketId,
        ticketCode: ticket.ticketCode,
        centerId: ticket.centerId,
        issueDesc: ticket.issueDesc,
        priority: ticket.priority,
        status: ticket.status
      },
      candidates
    };
  }

  async listAll(filters = {}) {
    return this.technicians.findMany(filters);
  }

  async getById(technicianId) {
    const tech = await this.technicians.findById(technicianId);
    if (!tech) {
      throw new AppError('KTV_KHONG_TON_TAI', `Không tìm thấy kỹ thuật viên ID ${technicianId}`);
    }
    return tech;
  }

  async createTechnician(data) {
    return this.technicians.create(data);
  }

  async updateTechnician(technicianId, data) {
    const existing = await this.technicians.findById(technicianId);
    if (!existing) {
      throw new AppError('KTV_KHONG_TON_TAI', `Không tìm thấy kỹ thuật viên ID ${technicianId}`);
    }
    return this.technicians.update(technicianId, data);
  }

  async softDeleteTechnician(technicianId) {
    const existing = await this.technicians.findById(technicianId);
    if (!existing) {
      throw new AppError('KTV_KHONG_TON_TAI', `Không tìm thấy kỹ thuật viên ID ${technicianId}`);
    }
    return this.technicians.delete(technicianId);
  }
}

module.exports = TechnicianService;

