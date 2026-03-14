# CoreInventory - Professional MERN Inventory Management System

CoreInventory is a production-grade full-stack application designed for granular inventory tracking across multiple warehouses and multi-zone locations. It features a robust Role-Based Access Control (RBAC) system, real-time stock lifecycle management, and professional business ID formatting.

---

## 🛠️ Technology Stack

### Frontend

- **Framework:** React (Vite)
- **State Management:** Zustand
- **Styling:** Tailwind CSS
- **Routing:** React Router DOM v6
- **Icons:** Lucide React
- **Data Visualization:** Recharts
- **HTTP Client:** Axios

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Validation:** Zod (Type-safe input validation)
- **Security:** JWT Authentication, Bcryptjs, Helmet, Express-Rate-Limit, CORS
- **Communication:** Nodemailer (OTP Services)

---

## 🚀 Key Features

- **RBAC Matrix:** Strict permission layers for Admin, Manager, and Staff roles.
- **Multi-Zone Tracking:** Support for warehouse "Rooms" and "Floors" with granular stock mapping.
- **Transaction Lifecycle:** "Planned" vs "Completed" states with automated inventory reconciliation.
- **Smart ID System:** Sequential, warehouse-specific transaction IDs (e.g., `AM/IN/001`).
- **Audit Logging:** Detailed history with "Ordered" and "Dispatched/Received" timestamps.

---

## 🔧 Installation & Setup

### 1. Database Configuration

Navigate to the `backend` folder and configure your `.env`:

```bash
cd backend
```

.env file is already provided in the backend folder.

### 2. Backend Initialization

```bash
npm install

npm run data:import

npm run dev
```

### 3. Frontend Initialization

In New Terminal

```bash
cd frontend
npm install
npm run dev
```

---

## 🔐 Administrative Credentials (Seeded)

| Role        | Username (Login ID)   | Password       |
| :---------- | :-------------------- | :------------- |
| **Admin**   | `admin@example.com`   | `Password@123` |
| **Manager** | `manager@example.com` | `Password@123` |
| **Staff**   | `staff@example.com`   | `Password@123` |

---

## 📄 License

Project developed for Odoo x Indus University Hackathon '26.
