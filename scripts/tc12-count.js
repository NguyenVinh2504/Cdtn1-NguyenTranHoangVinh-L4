const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const out = {
    service_center: await p.serviceCenter.count(),
    issue_category: await p.issueCategory.count(),
    technician: await p.technician.count(),
    customer: await p.customer.count(),
    device: await p.device.count(),
    ticket: await p.ticket.count(),
  };
  console.log(JSON.stringify(out));
  const t = await p.ticket.findMany({ select: { ticketCode: true }, orderBy: { ticketCode: 'asc' } });
  console.log('ticket_code = ' + t.map((x) => x.ticketCode).join(','));
  const c = await p.customer.findMany({ select: { phone: true }, orderBy: { phone: 'asc' } });
  console.log('phone = ' + c.map((x) => x.phone).join(','));
  await p.$disconnect();
})();
