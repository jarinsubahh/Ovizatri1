# 🚀 Ovizatri Tourism Management System - Backend

Production-grade, modular Node.js + Express + PostgreSQL REST API backend built for the **Ovizatri** travel platform.

---

## 🌟 Key Features

1. **Role-Based Authentication & Authorization (3 Roles)**:
   - **Traveler**: Full traveler signup with profile setup, package browsing, and booking access.
   - **Agency**: Complete agency signup with trade license, contact person, verified status workflow, and tour package creation.
   - **Admin**: Auto-seeded superadmin login (via environment variables) with full platform stats, user management, and agency verification capabilities.
2. **Enterprise Security**:
   - Password hashing using `bcrypt` (10 salt rounds).
   - Secure JWT token generation and validation.
   - SQL Injection protection via parameterized queries (`pg` pool).
   - CORS enabled for frontend interoperability (React, Vite, Next.js).
   - Input validation & sanitation with `express-validator`.
3. **Database Integrity**:
   - Matches standard DBMS relational schemas (Users $\leftrightarrow$ Traveler Profiles, Users $\leftrightarrow$ Agency Profiles, Packages, Bookings).
   - Atomic database transactions (`BEGIN` / `COMMIT` / `ROLLBACK`) for multi-table signups.

---

## 📁 Directory Structure

```text
backend/
├── src/
│   ├── config/
│   │   └── db.js                 # PostgreSQL connection pool configuration
│   ├── controllers/
│   │   ├── authController.js     # Signup (Traveler/Agency), Login, Current User, Logout
│   │   ├── userController.js     # User profile update logic
│   │   ├── packageController.js  # Tour packages CRUD & agency management
│   │   └── adminController.js    # Admin analytics & user/agency verification
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification & role-based route guard
│   │   └── validate.js           # express-validator response formatter
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth routes
│   │   ├── userRoutes.js         # /api/users routes
│   │   ├── packageRoutes.js      # /api/packages routes
│   │   └── adminRoutes.js        # /api/admin routes
│   ├── utils/
│   │   ├── token.js              # JWT helper methods
│   │   ├── seedAdmin.js          # Auto-seed system administrator from .env
│   │   ├── testDb.js             # Standalone DB connection tester
│   │   └── initDb.js             # Standalone schema builder
│   └── server.js                 # Express application entry point
├── database_setup.sql            # Ready-to-run PostgreSQL schema script
├── .env.example                  # Environment template
├── package.json                  # Dependencies & start scripts
└── README.md                     # Comprehensive setup guide
```

---

## 🛠️ Step-by-Step Installation & Setup

### 1. Prerequisites
- **Node.js** (v16.x or higher)
- **PostgreSQL** (v13.x or higher) installed and running

### 2. Configure Environment Variables
Inside the `backend/` folder, duplicate `.env.example` to create `.env`:
```bash
cp .env.example .env
```
Edit `.env` with your PostgreSQL database credentials:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=ovizatri_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=ovizatri_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d

ADMIN_NAME="System Administrator"
ADMIN_EMAIL=admin@ovizatri.com
ADMIN_PASSWORD=Admin@123456
ADMIN_PHONE="+8801700000000"
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Setup Database
Create the database in PostgreSQL if it doesn't already exist:
```sql
CREATE DATABASE ovizatri_db;
```
Then run the automated database initialization script:
```bash
npm run init-db
```
*(This creates all required tables and automatically seeds your admin account).*

### 5. Start the Server
- **Development mode (with auto-reload):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

---

## 📡 API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/signup/traveler` | Register new Traveler account | Public |
| `POST` | `/api/auth/signup/agency` | Register new Agency account | Public |
| `POST` | `/api/auth/login` | Login (Traveler / Agency / Admin) | Public |
| `GET` | `/api/auth/me` | Fetch currently logged-in user profile | Authenticated |
| `POST` | `/api/auth/logout` | Invalidate user session | Public / Auth |

### 📦 Packages (`/api/packages`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/packages` | List all active packages (filters available) | Public |
| `GET` | `/api/packages/:id` | Get package details | Public |
| `POST` | `/api/packages` | Create new tour package | Agency / Admin |
| `GET` | `/api/packages/agency/my-packages` | List agency's own packages | Agency |

### 🛡️ Admin (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/stats` | Dashboard statistics & analytics | Admin |
| `GET` | `/api/admin/users` | List all users across all roles | Admin |
| `PATCH` | `/api/admin/users/:id/status`| Deactivate/activate user | Admin |
| `PATCH` | `/api/admin/agencies/:agencyUserId/verify` | Verify agency | Admin |

---

## 🔗 Connecting with the Frontend

1. Ensure the frontend API base URL points to `http://localhost:5000`.
2. On successful login/signup, store `response.data.token` in `localStorage` or `sessionStorage`.
3. Set the Authorization header in all authenticated requests:
   ```javascript
   headers: {
     'Authorization': `Bearer ${localStorage.getItem('token')}`
   }
   ```
