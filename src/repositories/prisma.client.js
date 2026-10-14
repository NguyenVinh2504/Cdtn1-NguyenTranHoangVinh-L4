const { PrismaClient } = require('@prisma/client');

// Khắc phục lỗi TypeError: Do not know how to serialize a BigInt khi res.json()
BigInt.prototype.toJSON = function () {
  const intVal = Number(this);
  return Number.isSafeInteger(intVal) ? intVal : this.toString();
};

let prisma;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });
} catch (e) {
  console.warn('[PRISMA] Prisma client initialization notice:', e.message);
}

module.exports = { prisma };

