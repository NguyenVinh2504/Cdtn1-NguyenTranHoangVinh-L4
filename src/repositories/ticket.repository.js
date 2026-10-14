const { prisma } = require('./prisma.client');

class TicketRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  async findById(ticketId) {
    return this.client.ticket.findUnique({
      where: { ticketId: BigInt(ticketId) },
      include: {
        customer: true,
        device: true,
        serviceCenter: true,
        technician: true,
        category: true
      }
    });
  }

  async findMany({ centerId, status, categoryId, priority, limit = 50, offset = 0 } = {}) {
    const where = {};
    if (centerId) where.centerId = BigInt(centerId);
    if (status) where.status = status;
    if (categoryId) where.categoryId = Number(categoryId);
    if (priority) where.priority = priority;

    const [total, items] = await Promise.all([
      this.client.ticket.count({ where }),
      this.client.ticket.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { receivedAt: 'desc' },
        include: {
          customer: true,
          device: true,
          category: true,
          technician: true
        }
      })
    ]);

    return { total, items };
  }

  async findUnassigned(centerId, { priority, categoryId, limit = 50, offset = 0 } = {}) {
    const where = {
      status: 'MOI',
      technicianId: null
    };
    if (centerId) where.centerId = BigInt(centerId);
    if (priority) where.priority = priority;
    if (categoryId) where.categoryId = Number(categoryId);

    const [total, items] = await Promise.all([
      this.client.ticket.count({ where }),
      this.client.ticket.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { receivedAt: 'asc' }, // Phiếu vào trước xử lý trước
        include: {
          customer: true,
          device: true,
          category: true
        }
      })
    ]);

    return { total, items };
  }

  async findByTechnician(technicianId, { status, limit = 50, offset = 0 } = {}) {
    const where = { technicianId: BigInt(technicianId) };
    if (status) {
      where.status = status;
    }

    const [total, items] = await Promise.all([
      this.client.ticket.count({ where }),
      this.client.ticket.findMany({
        where,
        take: Number(limit),
        skip: Number(offset),
        orderBy: { dueDate: 'asc' }, // SLA sắp đến hạn trước xếp đầu
        include: {
          customer: true,
          device: true,
          category: true
        }
      })
    ]);

    return { total, items };
  }

  async countOpenByTechnician(technicianId) {
    return this.client.ticket.count({
      where: {
        technicianId: BigInt(technicianId),
        status: { in: ['DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN'] }
      }
    });
  }

  async create(data) {
    return this.client.ticket.create({
      data: {
        ticketCode: data.ticketCode,
        customerId: BigInt(data.customerId),
        deviceId: BigInt(data.deviceId),
        centerId: BigInt(data.centerId),
        categoryId: data.categoryId ? Number(data.categoryId) : null,
        technicianId: data.technicianId ? BigInt(data.technicianId) : null,
        issueDesc: data.issueDesc,
        priority: data.priority,
        status: data.status || 'MOI',
        dueDate: data.dueDate,
        receivedAt: data.receivedAt || new Date(),
        statusHistory: data.statusHistory || []
      },
      include: {
        customer: true,
        device: true,
        category: true
      }
    });
  }

  async update(ticketId, data) {
    const updatePayload = {};
    if (data.technicianId !== undefined) {
      updatePayload.technicianId = data.technicianId ? BigInt(data.technicianId) : null;
    }
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.statusHistory !== undefined) updatePayload.statusHistory = data.statusHistory;
    if (data.closedAt !== undefined) updatePayload.closedAt = data.closedAt;
    if (data.appointmentAt !== undefined) updatePayload.appointmentAt = data.appointmentAt;
    if (data.appointmentStatus !== undefined) updatePayload.appointmentStatus = data.appointmentStatus;
    if (data.issueDesc !== undefined) updatePayload.issueDesc = data.issueDesc;
    if (data.priority !== undefined) updatePayload.priority = data.priority;

    return this.client.ticket.update({
      where: { ticketId: BigInt(ticketId) },
      data: updatePayload,
      include: {
        customer: true,
        device: true,
        category: true,
        technician: true
      }
    });
  }

  async delete(ticketId) {
    // Soft delete / delete
    return this.client.ticket.delete({
      where: { ticketId: BigInt(ticketId) }
    });
  }

  async generateTicketCode(centerId) {
    const count = await this.client.ticket.count({
      where: { centerId: BigInt(centerId) }
    });
    const year = new Date().getFullYear();
    const seq = String(count + 1).padStart(5, '0');
    return `BH-${centerId}-${seq}/${year}`;
  }
}

module.exports = TicketRepository;

