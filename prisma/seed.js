const { PrismaClient } = require('@prisma/client');

// Khắc phục BigInt serialization
BigInt.prototype.toJSON = function () {
  const intVal = Number(this);
  return Number.isSafeInteger(intVal) ? intVal : this.toString();
};

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Bắt đầu nạp dữ liệu mẫu Mekong Mobile CRM (Idempotent Seed)...');

  // 1. Danh mục 6 Trung tâm bảo hành (Mekong Mobile)
  const centersData = [
    { centerId: 1n, centerName: 'TTBH Mekong Quận 10', address: '123 Ba Tháng Hai, P.11, Q.10', phone: '02838331122', city: 'TP.HCM' },
    { centerId: 2n, centerName: 'TTBH Mekong Tân Bình', address: '456 Cộng Hòa, P.13, Q.Tân Bình', phone: '02838442233', city: 'TP.HCM' },
    { centerId: 3n, centerName: 'TTBH Mekong Thủ Đức', address: '789 Võ Văn Ngân, P.Linh Chiểu, TP.Thủ Đức', phone: '02838553344', city: 'TP.HCM' },
    { centerId: 4n, centerName: 'TTBH Mekong Cần Thơ Ninh Kiều', address: '12 Đại lộ Hòa Bình, Q.Ninh Kiều', phone: '02923881122', city: 'Can Tho' },
    { centerId: 5n, centerName: 'TTBH Mekong Cần Thơ Cái Răng', address: '34 Đường 30/4, Q.Cái Răng', phone: '02923883344', city: 'Can Tho' },
    { centerId: 6n, centerName: 'TTBH Mekong Hà Nội Cầu Giấy', address: '100 Cầu Giấy, Q.Cầu Giấy', phone: '02439998877', city: 'Ha Noi' }
  ];

  for (const c of centersData) {
    await prisma.serviceCenter.upsert({
      where: { centerId: c.centerId },
      update: { centerName: c.centerName, address: c.address, phone: c.phone, city: c.city },
      create: c
    });
  }
  console.log('✅ Đã nạp 6 Trung tâm bảo hành.');

  // 2. Danh mục 6 Nhóm sự cố
  const categoriesData = [
    { categoryId: 1, categoryName: 'MAN_HINH', defaultPriority: 'CAO' },
    { categoryId: 2, categoryName: 'PIN', defaultPriority: 'TRUNG_BINH' },
    { categoryId: 3, categoryName: 'SAC', defaultPriority: 'TRUNG_BINH' },
    { categoryId: 4, categoryName: 'PHAN_MEM', defaultPriority: 'THAP' },
    { categoryId: 5, categoryName: 'NUOC_VAO', defaultPriority: 'CAO' },
    { categoryId: 6, categoryName: 'KHAC', defaultPriority: 'TRUNG_BINH' }
  ];

  for (const cat of categoriesData) {
    await prisma.issueCategory.upsert({
      where: { categoryId: cat.categoryId },
      update: { categoryName: cat.categoryName, defaultPriority: cat.defaultPriority },
      create: cat
    });
  }
  console.log('✅ Đã nạp 6 Nhóm sự cố.');

  // 3. Kỹ thuật viên (Đặc biệt: Trung tâm 2 Tân Bình có cả KTV thợ chính proficiency >= 3 và thợ phụ proficiency = 2 để test)
  const techsData = [
    { technicianId: 1n, employeeId: 'NV-KTV-001', fullName: 'Phạm Minh Tuấn', centerId: 1n, level: 'CAO_CAP', proficiency: 5 },
    { technicianId: 2n, employeeId: 'NV-KTV-002', fullName: 'Ngô Thanh Hải', centerId: 1n, level: 'TRUNG_CAP', proficiency: 3 },
    // Trung tâm 2 Tân Bình
    { technicianId: 3n, employeeId: 'NV-KTV-003', fullName: 'Nguyễn Văn A', centerId: 2n, level: 'CAO_CAP', proficiency: 5 },
    { technicianId: 4n, employeeId: 'NV-KTV-004', fullName: 'Trần Văn Cường', centerId: 2n, level: 'TRUNG_CAP', proficiency: 4 },
    { technicianId: 5n, employeeId: 'NV-KTV-005', fullName: 'Đỗ Hữu Thắng', centerId: 2n, level: 'TRUNG_CAP', proficiency: 3 }, // Biên đạt chuẩn (proficiency = 3)
    { technicianId: 6n, employeeId: 'NV-KTV-006', fullName: 'Lê Quốc Bảo (Học việc)', centerId: 2n, level: 'SO_CAP', proficiency: 2 }, // Biên rớt (proficiency = 2 < 3)
    // Các trung tâm khác
    { technicianId: 7n, employeeId: 'NV-KTV-007', fullName: 'Huỳnh Bá Đạt', centerId: 3n, level: 'CAO_CAP', proficiency: 4 },
    { technicianId: 8n, employeeId: 'NV-KTV-008', fullName: 'Vũ Đức Trọng', centerId: 4n, level: 'TRUNG_CAP', proficiency: 4 }
  ];

  for (const t of techsData) {
    await prisma.technician.upsert({
      where: { technicianId: t.technicianId },
      update: { fullName: t.fullName, centerId: t.centerId, level: t.level, proficiency: t.proficiency },
      create: t
    });
  }
  console.log('✅ Đã nạp danh sách Kỹ thuật viên (kèm KTV proficiency=2 và proficiency=3).');

  // 4. Khách hàng
  const customersData = [
    { customerId: 1n, fullName: 'Nguyễn Thị Mai', phone: '0901234567', email: 'mai.nguyen@gmail.com', address: 'Quận 10, TP.HCM', segment: 'VIP' },
    { customerId: 2n, fullName: 'Trần Văn Nam', phone: '0912345678', email: 'nam.tran@yahoo.com', address: 'Tân Bình, TP.HCM', segment: 'THUONG_XUYEN' },
    { customerId: 3n, fullName: 'Lê Thị Thu', phone: '0933456789', email: 'thu.le@gmail.com', address: 'Thủ Đức, TP.HCM', segment: 'MOI' },
    { customerId: 4n, fullName: 'Hoàng Minh Đức', phone: '0944567890', email: 'duc.hoang@gmail.com', address: 'Ninh Kiều, Cần Thơ', segment: 'THUONG_XUYEN' }
  ];

  for (const c of customersData) {
    await prisma.customer.upsert({
      where: { customerId: c.customerId },
      update: { fullName: c.fullName, phone: c.phone, email: c.email },
      create: c
    });
  }
  console.log('✅ Đã nạp Khách hàng.');

  // 5. Thiết bị
  const devicesData = [
    { deviceId: 1n, customerId: 1n, serialNo: 'MK-IP15P-9921', productName: 'iPhone 15 Pro Max 256GB', warrantyMonths: 12 },
    { deviceId: 2n, customerId: 2n, serialNo: 'MK-SS24U-7712', productName: 'Samsung Galaxy S24 Ultra', warrantyMonths: 24 },
    { deviceId: 3n, customerId: 3n, serialNo: 'MK-XIA14-3341', productName: 'Xiaomi 14 Ultra', warrantyMonths: 18 },
    { deviceId: 4n, customerId: 4n, serialNo: 'MK-OPF25-1109', productName: 'Oppo Find X7', warrantyMonths: 12 }
  ];

  for (const d of devicesData) {
    await prisma.device.upsert({
      where: { deviceId: d.deviceId },
      update: { serialNo: d.serialNo, productName: d.productName },
      create: d
    });
  }
  console.log('✅ Đã nạp Thiết bị.');

  // 6. Phiếu bảo hành (Các trạng thái khác nhau: MOI, DA_PHAN_CONG, DANG_XU_LY, HOAN_TAT)
  const now = new Date();
  const ticketsData = [
    {
      ticketId: 1n,
      ticketCode: 'BH-2-00001/2026',
      customerId: 1n,
      deviceId: 1n,
      centerId: 2n,
      categoryId: 1, // MAN_HINH
      technicianId: null, // Phiếu mới chờ phân công
      issueDesc: 'Màn hình bị sọc xanh dọc thân máy sau khi va chạm nhẹ, cảm ứng góc phải bị liệt',
      priority: 'CAO',
      status: 'MOI',
      receivedAt: new Date(now.getTime() - 2 * 3600 * 1000),
      dueDate: new Date(now.getTime() + 22 * 3600 * 1000), // SLA 24h
      statusHistory: [
        { from: null, to: 'MOI', at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(), by: null, note: 'Tiếp nhận phiếu mới' }
      ]
    },
    {
      ticketId: 2n,
      ticketCode: 'BH-2-00002/2026',
      customerId: 2n,
      deviceId: 2n,
      centerId: 2n,
      categoryId: 2, // PIN
      technicianId: null, // Phiếu mới chờ phân công
      issueDesc: 'Pin tụt nhanh từ 100% xuống 20% trong 2 giờ sử dụng, máy nóng ran vùng lưng',
      priority: 'TRUNG_BINH',
      status: 'MOI',
      receivedAt: new Date(now.getTime() - 10 * 3600 * 1000),
      dueDate: new Date(now.getTime() + 62 * 3600 * 1000), // SLA 72h
      statusHistory: [
        { from: null, to: 'MOI', at: new Date(now.getTime() - 10 * 3600 * 1000).toISOString(), by: null, note: 'Tiếp nhận phiếu mới' }
      ]
    },
    {
      ticketId: 3n,
      ticketCode: 'BH-2-00003/2026',
      customerId: 3n,
      deviceId: 3n,
      centerId: 2n,
      categoryId: 3, // SAC
      technicianId: 3n, // Đã gán cho Nguyễn Văn A
      issueDesc: 'Cắm sạc không nhận tín hiệu, chập chờn khi cắm cáp Type-C zin theo máy',
      priority: 'TRUNG_BINH',
      status: 'DA_PHAN_CONG',
      receivedAt: new Date(now.getTime() - 20 * 3600 * 1000),
      dueDate: new Date(now.getTime() + 52 * 3600 * 1000),
      appointmentAt: new Date(now.getTime() + 4 * 3600 * 1000),
      appointmentStatus: 'SCHEDULED',
      statusHistory: [
        { from: null, to: 'MOI', at: new Date(now.getTime() - 20 * 3600 * 1000).toISOString(), by: null, note: 'Tiếp nhận phiếu' },
        { from: 'MOI', to: 'DA_PHAN_CONG', at: new Date(now.getTime() - 18 * 3600 * 1000).toISOString(), by: 1, note: 'Phân công kỹ thuật viên Nguyễn Văn A' }
      ]
    },
    {
      ticketId: 4n,
      ticketCode: 'BH-2-00004/2026',
      customerId: 4n,
      deviceId: 4n,
      centerId: 2n,
      categoryId: 4, // PHAN_MEM
      technicianId: 4n, // Trần Văn Cường
      issueDesc: 'Treo logo khởi động liên tục sau khi cập nhật phiên bản hệ điều hành mới',
      priority: 'THAP',
      status: 'DANG_XU_LY',
      receivedAt: new Date(now.getTime() - 30 * 3600 * 1000),
      dueDate: new Date(now.getTime() + 90 * 3600 * 1000), // SLA 120h
      statusHistory: [
        { from: null, to: 'MOI', at: new Date(now.getTime() - 30 * 3600 * 1000).toISOString(), by: null, note: 'Tiếp nhận' },
        { from: 'MOI', to: 'DA_PHAN_CONG', at: new Date(now.getTime() - 28 * 3600 * 1000).toISOString(), by: 1, note: 'Phân công KTV' },
        { from: 'DA_PHAN_CONG', to: 'DANG_XU_LY', at: new Date(now.getTime() - 25 * 3600 * 1000).toISOString(), by: 4, note: 'Bắt đầu nạp lại ROM gốc' }
      ]
    }
  ];

  for (const t of ticketsData) {
    await prisma.ticket.upsert({
      where: { ticketId: t.ticketId },
      update: {
        status: t.status,
        technicianId: t.technicianId,
        statusHistory: t.statusHistory,
        appointmentAt: t.appointmentAt,
        appointmentStatus: t.appointmentStatus
      },
      create: t
    });
  }
  console.log('✅ Đã nạp các Phiếu bảo hành mẫu với đầy đủ JSONB status_history.');
  console.log('🎉 Hoàn tất Seed dữ liệu mẫu thành công!');
}

main()
  .catch(e => {
    console.error('❌ Lỗi khi nạp dữ liệu seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

