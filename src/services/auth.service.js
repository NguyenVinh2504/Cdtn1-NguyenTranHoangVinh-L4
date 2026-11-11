const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET } = require('../config/jwt.config');
const { AppError } = require('../errors/AppError');

// BUG-06 fix: KHÔNG lưu mật khẩu plaintext — chỉ lưu bcrypt hash.
// Mật khẩu demo gốc vẫn là 'password123' nhưng được băm khi nạp module.
const DEMO_USERS = [
  {
    username: 'manager_tt2',
    passwordHash: bcrypt.hashSync('password123', 10),
    id: 1,
    fullName: 'Trần Văn Quản Lý (TT2)',
    role: 'CENTER_MANAGER',
    centerId: 2
  },
  {
    username: 'ktv_nguyenvana',
    passwordHash: bcrypt.hashSync('password123', 10),
    id: 3,
    fullName: 'Nguyễn Văn A (KTV Chuyên Sâu)',
    role: 'TECHNICIAN',
    centerId: 2
  },
  {
    username: 'ktv_dohuuthang',
    passwordHash: bcrypt.hashSync('password123', 10),
    id: 5,
    fullName: 'Đỗ Hữu Thắng (KTV Trung Cấp)',
    role: 'TECHNICIAN',
    centerId: 2
  },
  {
    username: 'ktv_lequocbao',
    passwordHash: bcrypt.hashSync('password123', 10),
    id: 6,
    fullName: 'Lê Quốc Bảo (KTV Sơ Cấp)',
    role: 'TECHNICIAN',
    centerId: 2
  }
];

class AuthService {
  async login(username, password) {
    if (!username || !password) {
      throw new AppError('DU_LIEU_KHONG_HOP_LE', 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
    }

    const user = DEMO_USERS.find(u => u.username === username.trim());

    if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
      throw new AppError('XAC_THUC_KHONG_HOP_LE', 'Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    const payload = {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      centerId: user.centerId
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    return {
      token,
      user: payload
    };
  }
}

module.exports = AuthService;

