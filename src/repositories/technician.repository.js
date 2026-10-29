const { prisma } = require('./prisma.client');

class TechnicianRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  withClient(client) {
    return new TechnicianRepository(client);
  }

  async findById(technicianId) {
    return this.client.technician.findUnique({
      where: { technicianId: BigInt(technicianId) },
      include: { serviceCenter: true }
    });
  }

  async findMany({ centerId, isActive = true } = {}) {
    const where = {};
    if (centerId) where.centerId = BigInt(centerId);
    if (isActive !== undefined) where.isActive = isActive;

    return this.client.technician.findMany({
      where,
      orderBy: [{ proficiency: 'desc' }, { fullName: 'asc' }],
      include: { serviceCenter: true }
    });
  }

  /**
   * Truy vấn danh sách KTV đủ điều kiện nhận phiếu theo QT-08:
   * 1. Cùng trung tâm (centerId)
   * 2. Đang hoạt động (isActive = true)
   * 3. Điểm tay nghề proficiency >= minProficiency (mặc định 3)
   */
  async findEligible(centerId, minProficiency = 3) {
    const techs = await this.client.technician.findMany({
      where: {
        centerId: BigInt(centerId),
        isActive: true,
        proficiency: { gte: minProficiency }
      },
      orderBy: [{ proficiency: 'desc' }, { fullName: 'asc' }],
      include: { serviceCenter: true }
    });

    // Tính kèm workload cho mỗi KTV
    const results = await Promise.all(
      techs.map(async tech => {
        const workload = await this.client.ticket.count({
          where: {
            technicianId: tech.technicianId,
            status: { in: ['DA_PHAN_CONG', 'DANG_XU_LY', 'CHO_LINH_KIEN'] }
          }
        });
        return {
          ...tech,
          workload
        };
      })
    );

    return results;
  }

  async create(data) {
    return this.client.technician.create({
      data: {
        employeeId: data.employeeId,
        fullName: data.fullName,
        centerId: BigInt(data.centerId),
        level: data.level,
        proficiency: Number(data.proficiency),
        isActive: data.isActive !== undefined ? data.isActive : true
      }
    });
  }

  async update(technicianId, data) {
    const updatePayload = {};
    if (data.fullName !== undefined) updatePayload.fullName = data.fullName;
    if (data.level !== undefined) updatePayload.level = data.level;
    if (data.proficiency !== undefined) updatePayload.proficiency = Number(data.proficiency);
    if (data.centerId !== undefined) updatePayload.centerId = BigInt(data.centerId);
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;

    return this.client.technician.update({
      where: { technicianId: BigInt(technicianId) },
      data: updatePayload
    });
  }

  async delete(technicianId) {
    // Soft delete QT-13
    return this.client.technician.update({
      where: { technicianId: BigInt(technicianId) },
      data: { isActive: false }
    });
  }
}

module.exports = TechnicianRepository;

