# Agency CRM System

A comprehensive Customer Relationship Management system for educational agencies, featuring lead management, student tracking, HR management, accounting, task management, and real-time communication.

## Features

### 1. User Management & Security
- Two user roles: Super Admin and Staff
- Permission-based access control
- Two-Factor Authentication (2FA) for all users
- JWT-based authentication

### 2. Lead Management
- Automatic lead capture from social media (extensible)
- Lead status tracking (new, contacted, qualified, proposal, negotiation, converted, lost)
- Follow-up scheduling and tracking
- Lead assignment to staff members
- Lead-to-student conversion
- Analytics and conversion rate tracking

### 3. Student Management
- Student registration and profile management
- Document upload with folder/category organization
- Follow-up tracking for students
- Counsellor assignment
- Student status management (active, inactive, graduated, etc.)

### 4. Task Management
- Task assignment to staff
- Priority levels (low, medium, high, urgent)
- Status tracking (pending, in_progress, completed, cancelled, delayed)
- Task comments and attachments
- Due date tracking and delayed task reports

### 5. HR Management
- **Attendance**: Check-in/check-out with location tracking
- **Leave Management**: Leave requests, approvals, and tracking
- **Salary Management**: Monthly salary processing with allowances and deductions

### 6. Accounting & Invoicing
- Invoice creation and management
- Multiple currency support
- Tax calculations
- Payment tracking (draft, sent, paid, partially_paid, overdue, cancelled)
- Revenue analytics

### 7. Internal Communication
- Real-time chat system using Socket.IO
- Direct messaging between staff
- Typing indicators
- Read receipts
- Unread message counters

### 8. Activity Logs
- Track all staff actions (create, update, delete, uploads, follow-ups)
- Full visibility for Super Admin
- Filterable by user, module, action, and date

### 9. Trash & Data Management
- Soft delete for all resources
- Only Super Admin can restore or permanently delete
- Trash management interface

### 10. Dashboard & Reports
- Overview statistics (leads, students, tasks, revenue)
- Lead analytics by status and source
- Revenue analytics by month and branch
- Staff performance metrics
- Visual charts and graphs

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO for real-time communication
- JWT for authentication
- Speakeasy for 2FA
- Bcrypt for password hashing
- Multer for file uploads

### Frontend
- React 19
- Vite (build tool)
- React Router v7 for routing
- Axios for API calls
- TanStack React Query for state management
- Recharts for data visualization
- Socket.IO Client for real-time features
- React Hot Toast for notifications

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

## Installation

### 1. Install MongoDB

**Windows:**
1. Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
2. Run the installer
3. Choose "Complete" installation
4. Install MongoDB as a Windows Service (recommended)
5. MongoDB will start automatically

**To verify MongoDB is running:**
```bash
# Open Command Prompt and run:
mongod --version

# To check if MongoDB service is running:
net start MongoDB
```

**Mac/Linux:**
```bash
# Mac (using Homebrew):
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian:
sudo apt-get install mongodb

# Verify:
mongod --version
```

### 2. Clone/Setup Project

```bash
cd C:\Users\Localadmin\Documents\projects\agency-management
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies (if not already installed)
npm install

# Configure environment variables
# Edit the .env file and update:
# - MONGODB_URI (should work with default: mongodb://localhost:27017/agency-crm)
# - JWT_SECRET (change to a secure random string)
# - SMTP settings (or leave as default to log emails to console)

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies (if not already installed)
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3000`

## Project Structure

```
agency-management/
├── backend/
│   ├── server.js                 # Entry point with Socket.IO
│   ├── src/
│   │   ├── app.js               # Express app configuration
│   │   ├── config/
│   │   │   └── database.js      # MongoDB connection
│   │   ├── models/              # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Lead.js
│   │   │   ├── Student.js
│   │   │   ├── Task.js
│   │   │   ├── Invoice.js
│   │   │   ├── Attendance.js
│   │   │   ├── Leave.js
│   │   │   ├── Salary.js
│   │   │   ├── Message.js
│   │   │   ├── Branch.js
│   │   │   ├── ActivityLog.js
│   │   │   └── Trash.js
│   │   ├── controllers/         # Route controllers
│   │   ├── routes/              # API routes
│   │   ├── middlewares/         # Custom middleware
│   │   │   ├── auth.js          # Authentication & authorization
│   │   │   ├── errorHandler.js
│   │   │   ├── activityLogger.js
│   │   │   └── upload.js        # File upload handling
│   │   ├── utils/               # Utility functions
│   │   │   ├── jwtHelper.js
│   │   │   └── emailService.js
│   │   └── services/
│   ├── uploads/                 # File uploads directory
│   ├── .env                     # Environment variables
│   └── package.json
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── src/
│   │   ├── main.jsx             # Entry point
│   │   ├── App.jsx              # Main App component
│   │   ├── components/          # Reusable components
│   │   ├── pages/               # Page components
│   │   ├── services/            # API service layer
│   │   ├── context/             # React Context for state
│   │   ├── hooks/               # Custom React hooks
│   │   └── utils/               # Utility functions
│   └── package.json
│
└── README.md                    # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user (Super Admin only)
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/auth/2fa/setup` - Setup 2FA
- `POST /api/auth/2fa/verify` - Verify and enable 2FA
- `POST /api/auth/2fa/disable` - Disable 2FA

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (soft delete)

### Leads
- `GET /api/leads` - Get all leads (with filters & pagination)
- `GET /api/leads/stats` - Get lead statistics
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead (soft delete)
- `POST /api/leads/:id/follow-up` - Add follow-up
- `PATCH /api/leads/:id/follow-up/:followUpId` - Update follow-up
- `POST /api/leads/:id/convert` - Convert lead to student
- `PATCH /api/leads/:id/assign` - Assign lead to user

### Students
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/:id/documents` - Upload document
- `POST /api/students/:id/follow-up` - Add follow-up

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/:id/comments` - Add comment to task

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Delete invoice
- `PATCH /api/invoices/:id/pay` - Mark invoice as paid

### HR - Attendance
- `GET /api/hr/attendance` - Get attendance records
- `POST /api/hr/attendance/checkin` - Check in
- `PATCH /api/hr/attendance/checkout` - Check out

### HR - Leaves
- `GET /api/hr/leaves` - Get leave requests
- `POST /api/hr/leaves` - Create leave request
- `PATCH /api/hr/leaves/:id/approve` - Approve leave
- `PATCH /api/hr/leaves/:id/reject` - Reject leave

### HR - Salary
- `GET /api/hr/salary` - Get salary records
- `POST /api/hr/salary` - Process salary
- `GET /api/hr/salary/user/:userId` - Get salary by user

### Messages
- `GET /api/messages/rooms` - Get chat rooms
- `GET /api/messages/:userId` - Get messages with a user
- `GET /api/messages/unread/count` - Get unread message count
- `PATCH /api/messages/:userId/read` - Mark messages as read
- `DELETE /api/messages/:messageId` - Delete message

### Branches
- `GET /api/branches` - Get all branches
- `GET /api/branches/:id` - Get branch by ID
- `POST /api/branches` - Create branch (Super Admin)
- `PUT /api/branches/:id` - Update branch (Super Admin)
- `DELETE /api/branches/:id` - Delete branch (Super Admin)

### Trash
- `GET /api/trash` - Get trash items
- `PATCH /api/trash/:id/restore` - Restore item (Super Admin)
- `DELETE /api/trash/:id/permanent` - Permanently delete (Super Admin)

### Activity Logs
- `GET /api/activity-logs` - Get activity logs
- `GET /api/activity-logs/stats/:userId` - Get user activity stats

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/leads/analytics` - Get lead analytics
- `GET /api/dashboard/revenue/analytics` - Get revenue analytics
- `GET /api/dashboard/staff/performance` - Get staff performance

## Development Notes

### Email Configuration
The system is configured to log emails to the console in development mode. When you set up 2FA or receive notifications, check the backend console for the codes/links.

To enable actual email sending:
1. Update `.env` in the backend folder
2. Set valid SMTP credentials (Gmail, SendGrid, etc.)
3. Restart the backend server

### Default Super Admin
You'll need to create a Super Admin user first. You can do this via MongoDB directly or by temporarily removing the `protect` and `authorize` middleware from the register route.

Example using MongoDB shell:
```javascript
// Connect to MongoDB
mongosh

// Use the database
use agency-crm

// Create a super admin (password will be hashed on first login)
db.users.insertOne({
  firstName: "Admin",
  lastName: "User",
  email: "admin@agency.com",
  password: "$2a$10$placeholder", // You'll need to hash this properly
  role: "super_admin",
  isActive: true,
  twoFactorEnabled: false,
  createdAt: new Date()
})
```

Better approach: Temporarily modify the register route to allow unauthenticated access for creating the first user, then restore the protection.

### File Uploads
Files are stored in the `backend/uploads/` directory. For production, consider using cloud storage (AWS S3, Cloudinary, etc.).

### Socket.IO Real-time Features
- Chat messages are sent in real-time
- User online/offline status
- Typing indicators

## Scaling Considerations

For production deployment:
1. Use environment-specific `.env` files
2. Enable MongoDB replica sets for high availability
3. Use a process manager like PM2 for the backend
4. Implement rate limiting and request throttling
5. Add input validation and sanitization
6. Set up proper HTTPS/SSL certificates
7. Use a CDN for static assets
8. Implement proper logging (Winston, Morgan)
9. Set up monitoring (New Relic, DataDog)
10. Use Redis for session management and caching

## License

Proprietary - All rights reserved

## Support

For issues or questions, please create an issue in the repository or contact the development team.
