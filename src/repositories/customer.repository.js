const { prisma } = require('./prisma.client');

class CustomerRepository {
  constructor(client = prisma) {
    this.client = client;
  }

  async findById(customerId) {
    return this.client.customer.findUnique({
      where: { customerId: BigInt(customerId) },
      include: { devices: true }
    });
  }

  async findByPhone(phone) {
    return this.client.customer.findUnique({
      where: { phone }
    });
  }

  async search(query) {
    return this.client.customer.findMany({
      where: {
        OR: [
          { phone: { contains: query } },
          { fullName: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 20
    });
  }
}

module.exports = CustomerRepository;

