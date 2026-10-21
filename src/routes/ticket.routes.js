const express = require('express');
const {
  validateCreateTicket,
  validateAssignTechnician,
  validateTransitionStatus,
  validateScheduleAppointment
} = require('../validators/ticket.validator');

module.exports = function ticketRoutes(ticketService) {
  const router = express.Router();

  /**
   * UC1: Danh sách phiếu chờ phân công tại trung tâm (MOI)
   * GET /api/tickets/unassigned?centerId=2&priority=CAO
   */
  router.get('/unassigned', async (req, res, next) => {
    try {
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
      const technicianId = req.query.technicianId || req.user?.id || 5;
      const { status, limit, offset } = req.query;

      const result = await ticketService.listTechnicianTickets(technicianId, {
        status,
        limit,
        offset
      });

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
      const ticket = await ticketService.getTicketDetail(req.params.id);
      res.status(200).json({
        success: true,
        data: ticket
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
        input.note
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

