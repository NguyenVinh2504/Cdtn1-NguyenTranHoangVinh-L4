const express = require('express');

module.exports = function authRoutes(authService) {
  const router = express.Router();

  /**
   * Đăng nhập hệ thống cấp phát JWT token
   * POST /api/auth/login
   */
  router.post('/login', async (req, res, next) => {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password);
      res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data: result
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
};

