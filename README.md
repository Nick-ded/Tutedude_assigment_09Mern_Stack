<div align="center">

# 🛡️ PassGuard
### Visitor Pass Management System

**A full-stack MERN application to digitize and secure your organization's visitor management process.**

[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JWT](https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

---

> *Replace manual logbooks with a sleek, QR-powered digital visitor system.*

</div>

---

## 📸 Screenshots

| Login | Dashboard | Scanner |
|-------|-----------|---------|
| Split-panel with glassmorphism | Animated stat cards + live data | Live QR camera feed |

---

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based login with 30-day token expiry
- **4 roles**: Admin · Security · Employee · Visitor
- Route guards — users only see what they're allowed to

### 👤 Visitor Management
- Self pre-registration by external visitors (no account needed)
- Photo upload support
- Full visitor registry with search

### 📅 Appointments & Pre-Registration
- Visitors book slots in advance with host selection
- Host receives email notification (nodemailer ready)
- Hosts can **approve** or **reject** with one click

### 🎫 QR Pass Issuance
- Unique cryptographic QR code generated on approval
- Pass has a `validFrom` / `validUntil` window (24 hours)
- PDF badge generation ready via PDFKit

### 📷 Check-In / Check-Out
- Security staff scans QR via browser camera (no app needed)
- System **auto-detects** check-in vs check-out
- Every scan is timestamped and stored in CheckLogs

### 📊 Dashboard & Reports
- Real-time stat cards (total visitors, active passes, today's meetings, pending reviews)
- Appointment management with inline approve/reject
- Visitor registry with live search/filter
- Recent scan activity feed

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router v7, Axios, Recharts, html5-qrcode, Lucide Icons |
| **Backend** | Node.js, Express 4, Mongoose 8 |
| **Database** | MongoDB 7 |
| **Auth** | JWT (jsonwebtoken), bcryptjs |
| **QR Code** | `qrcode` package |
| **PDF** | PDFKit |
| **Email** | Nodemailer |
| **Build Tool** | Vite 8 |
| **Styling** | Pure CSS with glassmorphism + CSS variables |

---

## 📁 Project Structure

```
PassGuard/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Login, register, profile
│   │   ├── userController.js     # User CRUD + hosts list
│   │   ├── visitorController.js  # Visitor registration
│   │   ├── appointmentController.js  # CRUD + approve/reject + pre-register
│   │   ├── passController.js     # Pass retrieval + QR verify
│   │   └── checkLogController.js # Scan, check-in/out, recent logs
│   ├── middleware/
│   │   └── authMiddleware.js     # protect, admin, securityOrAdmin
│   ├── models/
│   │   ├── User.js               # Admin | Security | Employee
│   │   ├── Visitor.js            # External visitor profile
│   │   ├── Appointment.js        # Scheduled visits
│   │   ├── Pass.js               # QR pass with validity window
│   │   └── CheckLog.js           # Check-in/out audit log
│   ├── routes/                   # Express routers (mirrors controllers)
│   ├── utils/
│   │   └── generateToken.js      # JWT helper
│   ├── uploads/                  # Visitor photos (gitignored)
│   ├── seeder.js                 # Demo data seed script
│   ├── server.js                 # Express app entry point
│   └── .env                      # Environment variables
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── Header.jsx        # Sticky nav with role chip
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global auth state + axios defaults
    │   ├── pages/
    │   │   ├── Login.jsx         # Split-panel login with demo quick-fill
    │   │   ├── Dashboard.jsx     # Stats, appointments, visitor registry
    │   │   ├── SecurityScan.jsx  # Live QR scanner + recent activity
    │   │   └── VisitorRegister.jsx  # 3-step pre-registration wizard
    │   ├── App.jsx               # Routes + PrivateRoute guard
    │   ├── index.css             # Design system (dark theme, glassmorphism)
    │   └── App.css               # App-level layout overrides
    └── vite.config.js            # Vite + /api proxy to :5000
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version |
|------|---------|
| Node.js | v18+ |
| MongoDB Community Server | v7.0 |
| npm | v9+ |

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/passguard.git
cd passguard
```

### 2. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. Configure environment

The `backend/.env` is pre-configured for local MongoDB:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/visitor_management
JWT_SECRET=supersecretvisitorpasskey
```

> For MongoDB Atlas, replace `MONGO_URI` with your connection string.

### 4. Seed demo data

```bash
cd backend
node seeder.js
```

This creates:
- 4 staff users (Admin, Security, 2 Employees)
- 5 visitors
- 6 appointments (mix of Approved / Pending / Rejected)
- QR passes for approved appointments
- 1 active check-in log

### 5. Start the servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| 👑 Admin | `admin@example.com` | `password` |
| 🛡️ Security | `security@example.com` | `password` |
| 👤 Employee | `john@example.com` | `password` |
| 👤 Employee | `sarah@example.com` | `password` |

> Tip: Use the **quick-fill buttons** on the login page — one click fills credentials automatically.

---

## 🌐 API Reference

### Auth
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/auth/login` | Public | Login and get JWT |
| `POST` | `/api/auth/register` | Public | Register new staff user |
| `GET` | `/api/auth/profile` | Private | Get current user profile |

### Users
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/users` | Admin | Get all users |
| `GET` | `/api/users/hosts` | Public | Get available hosts (for visitor form) |
| `DELETE` | `/api/users/:id` | Admin | Delete a user |

### Visitors
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/visitors` | Public | Register a visitor |
| `GET` | `/api/visitors` | Security/Admin | Get all visitors |

### Appointments
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/appointments` | Private | Get appointments (role-filtered) |
| `POST` | `/api/appointments` | Private | Create appointment (by host) |
| `POST` | `/api/appointments/pre-register` | Public | Visitor self pre-registration |
| `PUT` | `/api/appointments/:id/approve` | Private | Approve + auto-issue pass |
| `PUT` | `/api/appointments/:id/reject` | Private | Reject appointment |

### Passes
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `GET` | `/api/passes/:id` | Private | Get pass + QR image |
| `POST` | `/api/passes/verify` | Security/Admin | Verify QR code data |

### Check Logs
| Method | Route | Access | Description |
|--------|-------|--------|-------------|
| `POST` | `/api/checklogs/scan` | Security/Admin | Scan QR — auto check-in/out |
| `GET` | `/api/checklogs` | Security/Admin | Get all logs |
| `GET` | `/api/checklogs/recent` | Security/Admin | Get last 20 logs |

---

## 🗄️ Database Schema

```
Users          Visitors         Appointments
─────────      ────────         ────────────
_id            _id              _id
name           name             host → Users
email          email            visitor → Visitors
password       phone            purpose
role           company          expectedDate
               photoUrl         status (Pending|Approved|Rejected)
                                notes

Passes         CheckLogs
──────         ─────────
_id            _id
appointment    pass → Passes
  → Appointments  securityPersonnel → Users
qrCodeData     checkInTime
pdfUrl         checkOutTime
validFrom
validUntil
status (Active|Expired|Used)
```

---

## 🔒 Role Permissions

| Feature | Admin | Security | Employee |
|---------|:-----:|:--------:|:--------:|
| View dashboard | ✅ | ✅ | ✅ |
| View all appointments | ✅ | ✅ | ❌ (own only) |
| Approve/reject appointments | ✅ | ❌ | ✅ (own only) |
| Access QR scanner | ✅ | ✅ | ❌ |
| Scan check-in/out | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |
| View all visitors | ✅ | ✅ | ❌ |

---

## 🧪 How to Test the Full Flow

```
1. Open /register-visitor
   → Fill out visitor form (pick "John Employee" as host)
   → Submit — appointment created with Pending status

2. Login as john@example.com (Employee)
   → See the new Pending appointment on Dashboard
   → Click Approve → pass auto-generated

3. Login as security@example.com
   → Go to /scan
   → (You need the QR code — check DB for qrCodeData or use existing seeded pass)

4. Check Dashboard stats update in real time
```

---

## 🗺️ Roadmap / Bonus Features

- [ ] Email notifications on approval (nodemailer integrated, template pending)
- [ ] PDF pass download with QR embedded (PDFKit ready)
- [ ] OTP-based visitor verification
- [ ] Multi-organization / multi-location support
- [ ] Analytics dashboard with Recharts
- [ ] Docker + Nginx deployment
- [ ] Audit log for all admin actions

---

## 📦 Scripts

### Backend
```bash
npm run dev          # Start with nodemon (watch mode)
npm start            # Start production
node seeder.js       # Seed demo data
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## 👨‍💻 Author

Built as **Assignment 09** for the MERN Stack course at **Tutedude**.

---

<div align="center">

Made with ❤️ and way too much ☕

**[⬆ Back to top](#-passguard)**

</div>
