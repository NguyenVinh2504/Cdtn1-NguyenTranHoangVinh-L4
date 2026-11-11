const express = require('express');
const {
  validateCreateTicket,
  validateAssignTechnician,
  validateTransitionStatus,
  validateScheduleAppointment
} = require('../validators/ticket.validator');
const { AppError } = require('../errors/AppError');

module.exports = function ticketRoutes(ticketService) {
  const router = express.Router();

  /**
   * Danh sách tất cả phiếu bảo hành (Thao tác Read của CRUD Entity 1)
   * GET /api/tickets?centerId=2&status=MOI&priority=CAO&limit=50&offset=0
   */
  router.get('/', async (req, res, next) => {
    try {
      const { centerId, status, categoryId, priority, limit, offset } = req.query;
      // BUG-07 (A01/QT-14): truyền req.user xuống service để áp phạm vi chủ sở hữu
      // khi vai trò là TECHNICIAN.
      const result = await ticketService.listTickets({
        centerId: centerId || req.user?.centerId,
        status,
        categoryId,
        priority,
        limit,
        offset
      }, req.user || null);

      res.status(200).json({
        success: true,
        data: result.items,
        total: result.total
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * UC1: Danh sách phiếu chờ phân công tại trung tâm (MOI)
   * GET /api/tickets/unassigned?centerId=2&priority=CAO
   */
  router.get('/unassigned', async (req, res, next) => {
    try {
      // BUG-07 (A01/QT-14): KTV không được xem danh sách phiếu chờ phân công của cả trung tâm.
      if (req.user?.role === 'TECHNICIAN') {
        throw new AppError(
          'KHONG_CO_QUYEN',
          'Bạn không có quyền xem danh sách phiếu chờ phân công của trung tâm'
        );
      }

      const centerId = req.query.centerId || req.user?.centerId || 2;
      const { priority, categoryId, limit, offset } = req.query;

      const result = await ticketService.listUnassigned(centerId, {
        priority,
        categoryId,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        data: result.items,
        total: result.total
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * UC3: Danh sách phiếu của Kỹ thuật viên đang đăng nhập, sắp xếp theo SLA due_date
   * GET /api/tickets/technician/mine
   */
  router.get('/technician/mine', async (req, res, next) => {
    try {
      // BUG-07 (A01/QT-14): với vai trò TECHNICIAN, danh tính lấy từ token/header đã xác thực;
      // tham số technicianId trên query KHÔNG được phép chỉ định phiếu của KTV khác.
      const isTechnician = req.user?.role === 'TECHNICIAN';
      const requestedTechnicianId = req.query.technicianId;
      const technicianId = isTechnician
        ? req.user.id
        : (requestedTechnicianId || req.user?.id || 3);
      const { status, limit, offset } = req.query;

      if (isTechnician && requestedTechnicianId && Number(requestedTechnicianId) !== Number(req.user.id)) {
        throw new AppError(
          'KHONG_CO_QUYEN',
          'Bạn không có quyền xem phiếu bảo hành của kỹ thuật viên khác'
        );
      }

      const result = await ticketService.listTechnicianTickets(
        technicianId,
        { status, limit, offset },
        req.user || null
      );

      // Che số điện thoại khách hàng cho vai trò KTV theo QT-15 & NFR2
      const items = (result.items || []).map(t => {
        if (t.customer && t.customer.phone) {
          const raw = String(t.customer.phone).trim();
          const masked = raw.length === 10
            ? raw.slice(0, 3) + '****' + raw.slice(7)
            : raw.replace(/(\d{3})\d+(\d{3})/, '$1****$2');
          return {
            ...t,
            customer: {
              ...t.customer,
              phone: masked
            }
          };
        }
        return t;
      });

      res.status(200).json({
        success: true,
        data: items,
        total: result.total
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Xem chi tiết một phiếu bảo hành kèm lịch sử JSONB status_history
   * GET /api/tickets/:id
   */
  router.get('/:id', async (req, res, next) => {
    try {
      // BUG-07 (A01/QT-14): KTV chỉ được xem chi tiết phiếu của chính mình.
      const ticket = await ticketService.getTicketDetail(req.params.id, req.user || null);
      res.status(200).json({
        success: true,
        data: ticket
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Cập nhật thông tin phiếu bảo hành (Thao tác Update của CRUD Entity 1)
   * PUT /api/tickets/:id
   */
  router.put('/:id', async (req, res, next) => {
    try {
      const updated = await ticketService.updateTicket(req.params.id, req.body, req.user || null);
      res.status(200).json({
        success: true,
        message: 'Cập nhật phiếu bảo hành thành công',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Tiếp nhận phiếu bảo hành mới (Thao tác Create của CRUD Entity 1)
   * POST /api/tickets
   */
  router.post('/', async (req, res, next) => {
    try {
      const input = validateCreateTicket(req.body);
      const ticket = await ticketService.createTicket(input);
      res.status(201).json({
        success: true,
        message: 'Tiếp nhận phiếu bảo hành mới thành công',
        data: ticket
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * UC2: Phân công kỹ thuật viên cho phiếu bảo hành (Nghiệp vụ cốt lõi)
   * POST /api/tickets/:id/assign
   */
  router.post('/:id/assign', async (req, res, next) => {
    try {
      const input = validateAssignTechnician(req.body);
      const updatedTicket = await ticketService.assignTechnician(
        req.params.id,
        input.technicianId,
        req.user?.id,
        input.note
      );

      res.status(200).json({
        success: true,
        message: 'Phân công kỹ thuật viên thành công',
        data: updatedTicket
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * UC6: Cập nhật tiến độ & Chuyển trạng thái theo vòng đời không đảo ngược (QT-06)
   * PATCH /api/tickets/:id/status
   */
  router.patch('/:id/status', async (req, res, next) => {
    try {
      const input = validateTransitionStatus(req.body);
      const updatedTicket = await ticketService.transitionStatus(
        req.params.id,
        input.status,
        req.user?.id,
        input.note,
        req.user || null
      );

      res.status(200).json({
        success: true,
        message: `Chuyển trạng thái phiếu sang '${input.status}' thành công`,
        data: updatedTicket
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * UC4: Đặt hoặc cập nhật lịch hẹn giao nhận máy (FR4)
   * POST /api/tickets/:id/appointment
   */
  router.post('/:id/appointment', async (req, res, next) => {
    try {
      const input = validateScheduleAppointment(req.body);
      const updatedTicket = await ticketService.scheduleAppointment(
        req.params.id,
        input.appointmentAt,
        input.appointmentStatus
      );

      res.status(200).json({
        success: true,
        message: 'Đặt lịch hẹn giao nhận máy thành công',
        data: updatedTicket
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Xóa phiếu bảo hành tiếp nhận mới (Thao tác Delete của CRUD Entity 1)
   * DELETE /api/tickets/:id
   */
  router.delete('/:id', async (req, res, next) => {
    try {
      await ticketService.deleteTicket(req.params.id, req.body?.reason);
      res.status(200).json({
        success: true,
        message: `Đã xóa phiếu bảo hành ID ${req.params.id} thành công`
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};

