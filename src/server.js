require('dotenv').config();
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 MEKONG MOBILE CRM - BACKEND SERVICE (BUỔI 7-10)`);
  console.log(`📡 Cổng dịch vụ: http://localhost:${PORT}`);
  console.log(`🩺 Health Check: http://localhost:${PORT}/health`);
  console.log(`📋 API Phiếu:    http://localhost:${PORT}/api/tickets/unassigned`);
  console.log(`👨‍🔧 API KTV:      http://localhost:${PORT}/api/technicians`);
  console.log(`=======================================================`);
});

