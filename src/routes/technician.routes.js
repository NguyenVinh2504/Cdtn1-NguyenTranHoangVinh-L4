const express = require('express');
const { validateCreateTechnician } = require('../validators/technician.validator');

module.exports = function technicianRoutes(technicianService) {
  const router = express.Router();

  /**
   * Lấy danh sách kỹ thuật viên
   * GET /api/technicians?centerId=2
   */
  router.get('/', async (req, res, next) => {
    try {
      const centerId = req.query.centerId || req.user?.centerId;
      const techs = await technicianService.listAll({ centerId });
      res.status(200).json({
        success: true,
        data: techs
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * NFR4: Gợi ý danh sách KTV đủ tiêu chuẩn cho 1 phiếu (cùng TT, proficiency >= 3, kèm workload)
   * GET /api/technicians/candidates-for-ticket/:ticketId
   */
  router.get('/candidates-for-ticket/:ticketId', async (req, res, next) => {
    try {
      const result = await technicianService.listCandidatesForTicket(req.params.ticketId);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Lấy chi tiết một kỹ thuật viên
   * GET /api/technicians/:id
   */
  router.get('/:id', async (req, res, next) => {
    try {
      const tech = await technicianService.getById(req.params.id);
      res.status(200).json({
        success: true,
        data: tech
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Thêm mới kỹ thuật viên (Thao tác Create của CRUD Entity 2)
   * POST /api/technicians
   */
  router.post('/', async (req, res, next) => {
    try {
      const input = validateCreateTechnician(req.body);
      const newTech = await technicianService.createTechnician(input);
      res.status(201).json({
        success: true,
        message: 'Thêm mới kỹ thuật viên thành công',
        data: newTech
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Cập nhật thông tin/tay nghề kỹ thuật viên (Thao tác Update của CRUD Entity 2)
   * PUT /api/technicians/:id
   */
  router.put('/:id', async (req, res, next) => {
    try {
      const updated = await technicianService.updateTechnician(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Cập nhật kỹ thuật viên thành công',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  });

  /**
   * Vô hiệu hóa kỹ thuật viên (Soft delete theo QT-13 - Thao tác Delete của CRUD Entity 2)
   * DELETE /api/technicians/:id
   */
  router.delete('/:id', async (req, res, next) => {
    try {
      await technicianService.softDeleteTechnician(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Vô hiệu hóa kỹ thuật viên thành công (Soft Delete QT-13)'
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};

