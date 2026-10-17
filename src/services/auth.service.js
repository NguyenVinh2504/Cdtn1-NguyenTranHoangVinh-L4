const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/auth.middleware');
const { AppError } = require('../errors/AppError');

// Danh sách tài khoản demo mẫu phục vụ chạy thử nghiệm
const DEMO_USERS = [
  {
    username: 'manager_tt2',
    password: 'password123',
    id: 1,
    fullName: 'Trần Văn Quản Lý (TT2)',
    role: 'CENTER_MANAGER',
    centerId: 2
  },
  {
    username: 'ktv_nguyenvana',
    password: 'password123',
    id: 5,
    fullName: 'Nguyễn Văn A (KTV Chuyên Sâu)',
    role: 'TECHNICIAN',
    centerId: 2
  },
  {
    username: 'ktv_lequocbao',
    password: 'password123',
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

    const user = DEMO_USERS.find(
      u => u.username === username.trim() && u.password === password
    );

    if (!user) {
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

