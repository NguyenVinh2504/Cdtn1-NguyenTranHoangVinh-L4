const { AppError } = require('../errors/AppError');

// Thời hạn cam kết SLA tính theo giờ làm việc quy định tại QT-04
const SLA_HOURS = {
  CAO: 24,
  TRUNG_BINH: 72,
  THAP: 120
};

// Giới hạn số phiếu mở tối đa cho 1 KTV (QT-11)
const MAX_OPEN_TICKETS_PER_TECH = 8;

// Bản đồ vòng đời chuyển trạng thái hợp lệ theo QT-06 (một chiều, không đảo ngược)
const VALID_TRANSITIONS = {
  MOI: ['DA_PHAN_CONG', 'DA_HUY'],
  DA_PHAN_CONG: ['DANG_XU_LY', 'DA_PHAN_CONG', 'DA_HUY'], // Cho phép điều chuyển lại nếu cần
  DANG_XU_LY: ['CHO_LINH_KIEN', 'HOAN_TAT', 'DA_HUY'],
  CHO_LINH_KIEN: ['DANG_XU_LY', 'HOAN_TAT', 'DA_HUY'],
  HOAN_TAT: ['DA_DONG'],
  DA_DONG: [],
  DA_HUY: []
};

class TicketService {
  /**
   * Khởi tạo TicketService với các Repository phụ thuộc (Dependency Injection)
   * Giúp tách rời hoàn toàn khỏi hạ tầng CSDL và dễ dàng viết Unit Test với Mock Repositories
   */
  constructor(ticketRepo, technicianRepo, appointmentRepo, customerRepo) {
    this.tickets = ticketRepo;
    this.technicians = technicianRepo;
    this.appointments = appointmentRepo;
    this.customers = customerRepo;
  }

  /**
   * Tính toán thời hạn cam kết SLA tự động dựa trên mức ưu tiên (QT-04)
   * @param {Date|string} receivedAt Thời điểm tiếp nhận
   * @param {string} priority Mức độ ưu tiên ('CAO' | 'TRUNG_BINH' | 'THAP')
   * @returns {Date} Thời điểm hết hạn cam kết SLA
   */
  calculateDueDate(receivedAt, priority) {
    const hours = SLA_HOURS[priority];
    if (!hours) {
      throw new AppError(
        'UU_TIEN_KHONG_HOP_LE',
        `Mức độ ưu tiên '${priority}' không hợp lệ. Phải là CAO, TRUNG_BINH hoặc THAP.`
      );
    }
    const baseTime = receivedAt ? new Date(receivedAt).getTime() : Date.now();
    return new Date(baseTime + hours * 3600 * 1000);
  }

  /**
   * UC2: Phân công kỹ thuật viên cho phiếu bảo hành (Nghiệp vụ trọng tâm luồng L4)
   * Thi hành các quy tắc nghiệp vụ: QT-06, QT-07, QT-08, QT-11
   */
  async assignTechnician(ticketId, technicianId, changedBy = null, note = 'Phân công kỹ thuật viên') {
    // 1. Kiểm tra sự tồn tại của phiếu bảo hành
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new AppError('PHIEU_KHONG_TON_TAI', `Không tìm thấy phiếu bảo hành với mã ID ${ticketId}`);
    }

    // 2. Kiểm tra trạng thái phiếu: chỉ được phân công khi đang ở trạng thái 'MOI' hoặc 'DA_PHAN_CONG' (điều chuyển)
    if (!['MOI', 'DA_PHAN_CONG'].includes(ticket.status)) {
      throw new AppError(
        'TRANG_THAI_KHONG_HOP_LE',
        `Phiếu đang ở trạng thái '${ticket.status}', không được phép phân công hoặc điều chuyển.`
      );
    }

    // 3. Kiểm tra thông tin kỹ thuật viên
    const tech = await this.technicians.findById(technicianId);
    if (!tech || !tech.isActive) {
      throw new AppError(
        'KTV_KHONG_KHA_DUNG',
        `Kỹ thuật viên ID ${technicianId} không tồn tại hoặc đã ngừng hoạt động trong hệ thống.`
      );
    }

    // 4. QT-08 (Ràng buộc địa bàn): KTV phải cùng trung tâm với phiếu tiếp nhận
    if (String(tech.centerId) !== String(ticket.centerId)) {
      throw new AppError(
        'KTV_KHONG_CUNG_TRUNG_TAM',
        `Không thể phân công kỹ thuật viên (Trung tâm ${tech.centerId}) không thuộc trung tâm tiếp nhận phiếu (Trung tâm ${ticket.centerId}).`
      );
    }

    // 5. QT-08 (Ràng buộc năng lực): KTV phải có điểm tay nghề proficiency >= 3
    if (tech.proficiency < 3) {
      throw new AppError(
        'KTV_KHONG_DU_TAY_NGHE',
        `Kỹ thuật viên không đủ điều kiện chuyên môn (yêu cầu điểm tay nghề proficiency tối thiểu từ 3 trở lên, hiện tại: ${tech.proficiency}).`
      );
    }

    // 6. QT-11: Kiểm tra khối lượng công việc hiện tại (workload)
    const openCount = await this.tickets.countOpenByTechnician(technicianId);
    if (openCount >= MAX_OPEN_TICKETS_PER_TECH) {
      throw new AppError(
        'KTV_QUA_TAI',
        `Kỹ thuật viên ${tech.fullName} đang xử lý ${openCount} phiếu mở, vượt giới hạn tải cho phép (${MAX_OPEN_TICKETS_PER_TECH}).`
      );
    }

    // 7. Chuẩn bị lịch sử trạng thái mới (Document-in-Row JSONB array)
    const currentHistory = Array.isArray(ticket.statusHistory) ? ticket.statusHistory : [];
    const newHistoryEntry = {
      from: ticket.status,
      to: 'DA_PHAN_CONG',
      at: new Date().toISOString(),
      by: changedBy || technicianId,
      note: note || (ticket.status === 'DA_PHAN_CONG' ? 'Điều chuyển KTV' : 'Phân công kỹ thuật viên')
    };

    // 8. Cập nhật phiếu trong database (nguyên tử)
    return this.tickets.update(ticketId, {
      technicianId,
      status: 'DA_PHAN_CONG',
      statusHistory: [...currentHistory, newHistoryEntry]
    });
  }

  /**
   * UC6: Cập nhật tiến độ & Chuyển trạng thái theo vòng đời một chiều (QT-06)
   */
  async transitionStatus(ticketId, nextStatus, changedBy = null, note = null) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new AppError('PHIEU_KHONG_TON_TAI', `Không tìm thấy phiếu bảo hành ID ${ticketId}`);
    }

    // Kiểm tra quy tắc chuyển trạng thái hợp lệ
    const allowed = VALID_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(nextStatus)) {
      throw new AppError(
        'TRANG_THAI_KHONG_HOP_LE',
        `Không thể chuyển trạng thái từ '${ticket.status}' sang '${nextStatus}' theo quy tắc vòng đời không đảo ngược (QT-06).`
      );
    }

    const currentHistory = Array.isArray(ticket.statusHistory) ? ticket.statusHistory : [];
    const newEntry = {
      from: ticket.status,
      to: nextStatus,
      at: new Date().toISOString(),
      by: changedBy || ticket.technicianId,
      note: note || `Chuyển sang trạng thái ${nextStatus}`
    };

    const updatePayload = {
      status: nextStatus,
      statusHistory: [...currentHistory, newEntry]
    };

    if (['HOAN_TAT', 'DA_DONG'].includes(nextStatus)) {
      updatePayload.closedAt = new Date();
    }

    return this.tickets.update(ticketId, updatePayload);
  }

  /**
   * UC4: Đặt hoặc điều chỉnh lịch hẹn giao nhận máy (FR4)
   * Tự động kiểm tra xung đột khung giờ của KTV
   */
  async scheduleAppointment(ticketId, appointmentAt, appointmentStatus = 'SCHEDULED') {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new AppError('PHIEU_KHONG_TON_TAI', `Không tìm thấy phiếu bảo hành ID ${ticketId}`);
    }

    if (!ticket.technicianId) {
      throw new AppError(
        'TRANG_THAI_KHONG_HOP_LE',
        'Phiếu bảo hành chưa được phân công kỹ thuật viên, không thể đặt lịch hẹn.'
      );
    }

    // Kiểm tra xung đột lịch hẹn
    if (this.appointments) {
      const conflict = await this.appointments.hasConflict(
        ticket.technicianId,
        appointmentAt,
        ticketId
      );
      if (conflict) {
        throw new AppError(
          'LICH_HEN_XUNG_DOT',
          `Kỹ thuật viên đã có lịch hẹn khác (phiếu ${conflict.ticketCode}) trong khung giờ này. Vui lòng chọn thời gian khác.`
        );
      }
    }

    return this.tickets.update(ticketId, {
      appointmentAt: new Date(appointmentAt),
      appointmentStatus
    });
  }

  /**
   * Tiếp nhận phiếu mới
   */
  async createTicket(input) {
    const dueDate = this.calculateDueDate(input.receivedAt || new Date(), input.priority);
    const ticketCode = await this.tickets.generateTicketCode(input.centerId);

    const initialHistory = [
      {
        from: null,
        to: 'MOI',
        at: new Date().toISOString(),
        by: null,
        note: 'Tiếp nhận phiếu mới tại trung tâm'
      }
    ];

    return this.tickets.create({
      ...input,
      ticketCode,
      dueDate,
      status: 'MOI',
      statusHistory: initialHistory
    });
  }

  /**
   * Lấy danh sách phiếu chờ phân công tại trung tâm
   */
  async listUnassigned(centerId, options = {}) {
    return this.tickets.findUnassigned(centerId, options);
  }

  /**
   * Lấy danh sách phiếu được giao cho một KTV theo SLA (UC3)
   */
  async listTechnicianTickets(technicianId, options = {}) {
    return this.tickets.findByTechnician(technicianId, options);
  }

  /**
   * Lấy chi tiết phiếu
   */
  async getTicketDetail(ticketId) {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new AppError('PHIEU_KHONG_TON_TAI', `Không tìm thấy phiếu bảo hành ID ${ticketId}`);
    }
    return ticket;
  }

  /**
   * Thao tác Delete của CRUD Entity 1 (Ticket)
   * Cho phép Quản lý xóa phiếu bảo hành khi còn ở trạng thái tiếp nhận mới (MOI)
   */
  async deleteTicket(ticketId, reason = 'Quản lý xóa phiếu bảo hành') {
    const ticket = await this.tickets.findById(ticketId);
    if (!ticket) {
      throw new AppError('PHIEU_KHONG_TON_TAI', `Không tìm thấy phiếu bảo hành ID ${ticketId}`);
    }

    // Ràng buộc nghiệp vụ: Không được xóa phiếu đang xử lý hoặc đã hoàn tất
    if (['DANG_XU_LY', 'CHO_LINH_KIEN', 'HOAN_TAT', 'DA_DONG'].includes(ticket.status)) {
      throw new AppError(
        'KHONG_THE_XOA_PHIEU',
        `Không thể xóa phiếu đang ở trạng thái '${ticket.status}'. Chỉ được phép xóa phiếu ở trạng thái 'MOI'.`
      );
    }

    return this.tickets.delete(ticketId);
  }
}

module.exports = TicketService;

