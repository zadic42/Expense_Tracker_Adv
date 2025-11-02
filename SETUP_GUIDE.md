# Expense Tracker - Complete Setup Guide

## Backend Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `backend` directory:
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/expense-tracker
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development

# Email configuration (optional - for password reset functionality)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### 3. Start MongoDB
Make sure MongoDB is running:
- **Windows/Mac/Linux**: Start MongoDB service
- **MongoDB Atlas (Cloud)**: Update `MONGODB_URI` with your connection string

### 4. Run Backend Server
```bash
cd backend
npm start
# OR for development with auto-restart:
npm run dev
```

Backend will run on `http://localhost:3001`

## Frontend Setup

### 1. Install Frontend Dependencies (if not already done)
```bash
cd frontend
npm install
```

### 2. Run Frontend
```bash
cd frontend
npm run dev
```

Frontend will run on `http://localhost:5173` (or similar port)

## API Endpoints Reference

### Authentication
- `POST /api/auth/signup` - Register new user
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/login` - Login user
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```

- `POST /api/auth/forgot-password` - Request password reset
  ```json
  {
    "email": "john@example.com"
  }
  ```

### Transactions
- `GET /api/transactions` - Get all transactions (query params: `type`, `category`, `startDate`, `endDate`, `limit`)
- `GET /api/transactions/:id` - Get single transaction
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get single account
- `POST /api/accounts` - Create account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account
- `POST /api/accounts/transfer` - Transfer funds between accounts

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (query params: `startDate`, `endDate`)

### User Profile
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `PUT /api/user/password` - Change password

### File Upload
- `POST /api/upload` - Upload file (form-data with `file` field)
- `GET /api/upload/:filename` - Get uploaded file

## Authentication

All protected routes require JWT token in header:
```
Authorization: Bearer <token>
```

## Backend Structure

```
backend/
├── config/
│   ├── database.js       # MongoDB connection
│   └── multer.js         # File upload configuration
├── middleware/
│   └── auth.js           # Authentication middleware
├── models/
│   ├── User.js           # User model
│   ├── Transaction.js    # Transaction model
│   └── Account.js        # Account model
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── transactions.js   # Transaction routes
│   ├── accounts.js       # Account routes
│   ├── dashboard.js      # Dashboard routes
│   ├── user.js           # User profile routes
│   └── upload.js         # File upload routes
├── utils/
│   └── generateToken.js  # JWT token generation
├── uploads/              # Uploaded files (created automatically)
├── .env                  # Environment variables
├── .gitignore
├── package.json
├── server.js             # Main server file
└── README.md
```

## Features Implemented

✅ User Authentication (Signup, Login, Password Reset)
✅ Transaction Management (CRUD operations)
✅ Account Management (Multi-account support)
✅ Dashboard Statistics (Expense breakdown, Income vs Expense charts)
✅ File Upload for transaction attachments
✅ User Profile Management
✅ Fund Transfer between accounts
✅ Data Filtering and Search
✅ JWT-based Authentication
✅ MongoDB Database Integration

## Testing the Backend

### 1. Health Check
```bash
curl http://localhost:3001/api/health
```

### 2. Register a User
```bash
curl -X POST http://localhost:3001/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

### 3. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Use the returned token for authenticated requests.

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env` file
- For MongoDB Atlas, whitelist your IP address

### Port Already in Use
- Change `PORT` in `.env` file
- Kill the process using port 3001

### CORS Issues
- Backend already has CORS enabled for all origins
- Check browser console for specific errors

### File Upload Issues
- Ensure `uploads` directory exists (created automatically)
- Check file size limits (5MB max)
- Verify file types (JPG, PNG, PDF only)

## Next Steps

To fully integrate the frontend with the backend:

1. Update frontend components to use the API utility (`frontend/src/utils/api.js`)
2. Replace local state management with API calls
3. Add loading states and error handling
4. Implement proper authentication checks

The backend is ready and all endpoints are functional!

