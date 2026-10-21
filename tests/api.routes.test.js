const ticketRoutes = require('../src/routes/ticket.routes');
const { errorHandler } = require('../src/middlewares/errorHandler.middleware');
const { AppError } = require('../src/errors/AppError');

describe('TicketRoutes - Kiểm thử tầng HTTP & Middleware ánh xạ mã lỗi', () => {
  let mockTicketService;
  let router;

  beforeEach(() => {
    mockTicketService = {
      listUnassigned: jest.fn(async () => ({ total: 1, items: [{ ticketId: 1, status: 'MOI' }] })),
      assignTechnician: jest.fn(async (id, techId) => {
        if (techId === 999) {
          throw new AppError('KTV_KHONG_DU_TAY_NGHE', 'Điểm tay nghề không đủ');
        }
        return { ticketId: id, technicianId: techId, status: 'DA_PHAN_CONG' };
      })
    };

    router = ticketRoutes(mockTicketService);
  });

  function mockRequestResponse(reqOptions = {}) {
    const req = {
      query: {},
      params: {},
      body: {},
      headers: {},
      user: { id: 1, role: 'CENTER_MANAGER', centerId: 2 },
      ...reqOptions
    };

    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };

    return { req, res };
  }

  test('RT-1: GET /unassigned gọi service và trả về 200 kèm danh sách phiếu', async () => {
    const { req, res } = mockRequestResponse({ query: { centerId: '2' } });

    // Tìm route handler GET /unassigned
    const layer = router.stack.find(l => l.route && l.route.path === '/unassigned' && l.route.methods.get);
    expect(layer).toBeDefined();

    const handler = layer.route.stack[0].handle;
    await handler(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.total).toBe(1);
    expect(mockTicketService.listUnassigned).toHaveBeenCalledWith('2', expect.any(Object));
  });

  test('RT-2: POST /:id/assign hợp lệ trả về HTTP 200 và thông báo thành công', async () => {
    const { req, res } = mockRequestResponse({
      params: { id: '10' },
      body: { technicianId: 5, note: 'Giao phiếu' }
    });

    const layer = router.stack.find(l => l.route && l.route.path === '/:id/assign' && l.route.methods.post);
    const handler = layer.route.stack[0].handle;
    await handler(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(res.jsonData.data.status).toBe('DA_PHAN_CONG');
  });

  test('RT-3: ErrorHandler middleware ánh xạ lỗi KTV_KHONG_DU_TAY_NGHE thành HTTP 422', () => {
    const err = new AppError('KTV_KHONG_DU_TAY_NGHE', 'Kỹ thuật viên không đủ tay nghề');
    const { req, res } = mockRequestResponse();

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(422);
    expect(res.jsonData.success).toBe(false);
    expect(res.jsonData.error).toBe('KTV_KHONG_DU_TAY_NGHE');
  });

  test('RT-4: ErrorHandler middleware ánh xạ lỗi DU_LIEU_KHONG_HOP_LE thành HTTP 400', () => {
    const err = new AppError('DU_LIEU_KHONG_HOP_LE', 'Dữ liệu thiếu trường bắt buộc', [
      { field: 'technicianId', reason: 'Bắt buộc' }
    ]);
    const { req, res } = mockRequestResponse();

    errorHandler(err, req, res, () => {});

    expect(res.statusCode).toBe(400);
    expect(res.jsonData.error).toBe('DU_LIEU_KHONG_HOP_LE');
    expect(res.jsonData.chiTiet).toHaveLength(1);
  });

  test('RT-5: DELETE /:id gọi service deleteTicket và trả về HTTP 200', async () => {
    mockTicketService.deleteTicket = jest.fn(async id => ({ ticketId: id }));
    const { req, res } = mockRequestResponse({
      params: { id: '15' },
      body: { reason: 'Khách hủy sửa chữa' }
    });

    const layer = router.stack.find(l => l.route && l.route.path === '/:id' && l.route.methods.delete);
    expect(layer).toBeDefined();

    const handler = layer.route.stack[0].handle;
    await handler(req, res, () => {});

    expect(res.statusCode).toBe(200);
    expect(res.jsonData.success).toBe(true);
    expect(mockTicketService.deleteTicket).toHaveBeenCalledWith('15', 'Khách hủy sửa chữa');
  });
});

