const { prisma } = require('./prisma.client');

class AppointmentRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  /**
   * Kiểm tra trùng lịch hẹn của KTV trong vòng +/- 45 phút
   */
  async hasConflict(technicianId, appointmentDate, excludeTicketId = null) {
    const targetTime = new Date(appointmentDate).getTime();
    const windowMs = 45 * 60 * 1000; // Khung giờ xung đột 45 phút
    const startRange = new Date(targetTime - windowMs);
    const endRange = new Date(targetTime + windowMs);

    const where = {
      technicianId: BigInt(technicianId),
      appointmentAt: {
        gte: startRange,
        lte: endRange
      },
      appointmentStatus: { in: ['SCHEDULED', 'CONFIRMED'] }
    };

    if (excludeTicketId) {
      where.ticketId = { not: BigInt(excludeTicketId) };
    }

    const conflicting = await this.client.ticket.findFirst({
      where,
      select: { ticketId: true, ticketCode: true, appointmentAt: true }
    });

    return conflicting;
  }

  async findByTechnician(technicianId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.client.ticket.findMany({
      where: {
        technicianId: BigInt(technicianId),
        appointmentAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      include: { customer: true, device: true },
      orderBy: { appointmentAt: 'asc' }
    });
  }
}

module.exports = AppointmentRepository;

