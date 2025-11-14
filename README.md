# 🔐 Blockchain-Based Secure Exam Paper Distribution System

A comprehensive examination management system using blockchain technology for secure, transparent, and tamper-proof distribution of exam papers.

## 🌟 Features

### 🔒 Security
- **AES-256 Encryption** for file protection
- **Blockchain Audit Trail** - Immutable record of all operations
- **JWT Authentication** with email verification
- **Time-based Access Control** - Files unlock automatically on exam date
- **Password Strength Validation** with real-time feedback
- **Account Security** - Failed login attempt tracking and auto-lockout

### 📧 Email Integration
- **OTP Verification** for account activation
- **Password Reset** via email
- **Welcome Emails** after successful verification
- **Professional HTML Templates**

### 👥 User Roles
1. **Examiner** - Upload, encrypt, and schedule exam papers
2. **Exam Center** - Download papers only on scheduled exam date
3. **Admin** - System monitoring and user management

### 🔗 Blockchain Features
- Proof-of-Work consensus mechanism
- SHA-256 cryptographic hashing
- Chain verification and integrity checking
- Complete file history tracking
- Tamper detection

## 🛠️ Tech Stack

### Frontend
- React 18.2.0
- Tailwind CSS (via CDN)
- Lucide React Icons
- Modern responsive design

### Backend
- Node.js + Express
- MongoDB with Mongoose
- Blockchain implementation
- Nodemailer for emails
- Multer for file uploads
- JWT authentication

### Security
- bcryptjs - Password hashing
- crypto-js - File encryption
- Helmet.js - HTTP security
- Express Rate Limiting

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Gmail account (for email functionality)

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/YOUR-USERNAME/exam-blockchain-system.git
cd exam-blockchain-system
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create `.env` file in backend folder:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/exam_blockchain
JWT_SECRET=your_jwt_secret_min_32_characters
JWT_EXPIRE=24h
ENCRYPTION_KEY=your_32_character_encryption_key
AES_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-gmail-app-password
EMAIL_FROM=Exam Portal <noreply@examportal.com>
MAX_FILE_SIZE=10485760
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
```

### 4. Start MongoDB
```bash
# Windows
net start MongoDB

# Mac/Linux
sudo systemctl start mongod
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 6. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 Usage

### For Examiners:
1. Register with email verification
2. Login to dashboard
3. Upload exam paper with date/time picker
4. Encrypt file (adds to blockchain)
5. File automatically unlocks on exam date

### For Exam Centers:
1. Register and verify email
2. Login to view available files
3. Files show "Locked" until exam date
4. Download becomes available on exam day
5. All downloads recorded on blockchain

## 🔐 Email Configuration

### Gmail Setup:
1. Enable 2-Step Verification
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App Passwords
3. Use the 16-character password in `.env`

## 🧪 Testing

### Test Backend:
```bash
cd backend
npm test
```

### Test Email:
```bash
cd backend
node test-email.js
```

## 📁 Project Structure
```
exam-blockchain-system/
├── backend/
│   ├── blockchain/         # Blockchain implementation
│   ├── config/            # Database configuration
│   ├── middleware/        # Auth, validation, rate limiting
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── services/          # Email, encryption services
│   ├── uploads/           # Temporary file storage
│   ├── .env              # Environment variables
│   └── server.js         # Entry point
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── ExamSystem.js  # Main component
│   │   └── index.css
│   └── package.json
└── README.md
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/verify-email` - Verify OTP
- `POST /api/auth/resend-otp` - Resend verification code
- `POST /api/auth/forgot-password` - Request reset code
- `POST /api/auth/reset-password` - Reset password with OTP

### Examiner
- `POST /api/examiner/upload` - Upload file
- `POST /api/examiner/encrypt/:fileId` - Encrypt file
- `GET /api/examiner/files` - Get uploaded files

### Exam Center
- `GET /api/center/files` - Get available files
- `GET /api/center/download/:fileId` - Download file (time-restricted)

### Blockchain
- `GET /api/blockchain/chain` - View blockchain
- `GET /api/blockchain/verify` - Verify integrity
- `GET /api/blockchain/history/:fileId` - Get file history

## 🛡️ Security Features

- **Password Requirements:**
  - Minimum 8 characters
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)

- **Account Protection:**
  - 5 failed login attempts → 2-hour lockout
  - Email verification required
  - JWT token expiration

- **File Security:**
  - AES-256-CBC encryption
  - SHA-256 file hashing
  - Blockchain immutability
  - Automatic file deletion after encryption

## 📊 Features Showcase

- ✅ Email verification with OTP
- ✅ Password strength indicator
- ✅ Forgot password flow
- ✅ Date/time picker for scheduling
- ✅ Real-time blockchain verification
- ✅ Professional email templates
- ✅ Responsive modern UI
- ✅ File encryption with blockchain proof
- ✅ Automatic time-based access control

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is created as a Final Year Project for academic purposes.

## 👨‍💻 Author

**Your Name**
- GitHub: [ashish220111331](https://github.com/ashish220111331)
- Email: ashishpadiyar92@gmail.com

## 🙏 Acknowledgments

- Blockchain technology inspiration
- Node.js community
- React documentation
- MongoDB Atlas
- All open-source contributors

## 📞 Support

For support,ashishpadiyar92@gmail.com or create an issue in the repository.

---

**⭐ Star this repository if you find it helpful!**