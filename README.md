# Real-Time Complaint Management System

A full-stack **MERN + Socket.IO** web application where users submit and track complaints while admins manage, filter, and update statuses in real time without manual page refreshes.

## Tech Stack
- **Frontend:** React.js (Vite), Tailwind CSS, Axios, React Router DOM, Socket.IO Client
- **Backend:** Node.js, Express.js (ES6 Modules), Socket.IO, Multer
- **Database:** MongoDB, Mongoose
- **Authentication:** JWT (`jsonwebtoken`) & `bcryptjs`

## Core Modules
1. **Authentication & Role Access:** User registration, login, hashed passwords, JWT verification (`protect`), and admin route guard (`adminOnly`).
2. **Complaint Submission:** Title, category, description, and optional image upload (`uploads/`).
3. **User Dashboard:** Personal complaint history with live status badges (`Pending`, `In Progress`, `Resolved`) and real-time alert notifications.
4. **Admin Dashboard:** Summary metrics, category/status filters, status update controls, complaint deletion with image cleanup, and live incoming complaint alerts.
5. **Real-Time Engine:** Socket.IO events (`newComplaint`, `complaintStatusUpdated`, `complaintDeleted`) syncing user and admin screens instantly.
