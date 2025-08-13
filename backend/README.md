# Fly Destination Backend API

A scalable Express.js backend API for the Fly Destination travel application with MongoDB integration, JWT authentication, and comprehensive user management.

## Features

- 🔐 JWT Authentication & Authorization
- 👥 Multi-role user system (Agent, Customer, Admin)
- 🆔 Auto-generated Agent IDs (FD + 4 digits)
- 🔑 Multi-identifier Login (Email/Phone/Agent ID for agents)
- ✈️ Airport Management System
- 📱 SMS OTP verification via Twilio
- 📧 Email verification support
- 🛡️ Input validation and sanitization
- 📊 User management with blocking/unblocking
- 🔍 Advanced search and filtering
- 📈 User statistics and analytics
- 🚀 Scalable architecture

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **SMS Service**: Twilio
- **Security**: Helmet, CORS, Rate Limiting

## Project Structure

```
backend/
├── controllers/          # Business logic
│   ├── authController.js
│   ├── userController.js
│   └── airportController.js
├── middleware/           # Custom middleware
│   ├── auth.js
│   └── validation.js
├── models/              # Database models
│   ├── User.js
│   └── Airport.js
├── routes/              # API routes
│   ├── auth.routes.js
│   ├── user.routes.js
│   └── airport.routes.js
├── services/            # External services
│   └── smsService.js
├── utils/               # Utility functions
│   ├── responseHandler.js
│   └── otpGenerator.js
├── server.js            # Main application file
├── package.json
└── env.example          # Environment variables template
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- Twilio account (for SMS OTP)

### Installation

1. **Clone the repository**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/fly-destination
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRE=7d
   TWILIO_ACCOUNT_SID=your-twilio-account-sid
   TWILIO_AUTH_TOKEN=your-twilio-auth-token
   TWILIO_PHONE_NUMBER=your-twilio-phone-number
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

#### Public Endpoints

**POST** `/api/auth/register`
- Register a new user (Agent/Customer/Admin)
- **Body**: User registration data
- **Response**: User data + JWT token + Agent ID (for agents)

**POST** `/api/auth/login`
- User login (supports multiple identifiers for agents)
- **Body**: `{ identifier, password }`
  - `identifier`: Email, phone number, or agent ID (for agents)
  - `password`: User password
- **Response**: User data + JWT token

**POST** `/api/auth/send-otp`
- Send OTP to phone number
- **Body**: `{ phoneNumber }`
- **Response**: Success message

**POST** `/api/auth/verify-otp`
- Verify phone OTP
- **Body**: `{ phoneNumber, otp }`
- **Response**: Success message

#### Protected Endpoints (Require JWT)

**GET** `/api/auth/profile`
- Get current user profile
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User profile data

**PUT** `/api/auth/profile`
- Update user profile
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Profile update data
- **Response**: Updated user data

**PUT** `/api/auth/change-password`
- Change user password
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{ currentPassword, newPassword }`
- **Response**: Success message

**POST** `/api/auth/logout`
- User logout
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Success message

### User Management Routes (`/api/users`) - Admin Only

**GET** `/api/users`
- Get all users with pagination and filtering
- **Headers**: `Authorization: Bearer <admin-token>`
- **Query Parameters**: 
  - `page` (number): Page number
  - `limit` (number): Items per page
  - `userType` (string): Filter by user type
  - `isActive` (boolean): Filter by active status
  - `isBlocked` (boolean): Filter by blocked status
  - `search` (string): Search in email, phone, company name, agent ID

**GET** `/api/users/stats`
- Get user statistics
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: User count statistics

**GET** `/api/users/search`
- Advanced user search
- **Headers**: `Authorization: Bearer <admin-token>`
- **Query Parameters**: 
  - `q` (string): Search query
  - `userType` (string): Filter by user type
  - `isActive` (boolean): Filter by active status
  - `isBlocked` (boolean): Filter by blocked status

**GET** `/api/users/:id`
- Get user by ID
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: User data

**POST** `/api/users`
- Create new user (Admin only)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**: User data
- **Response**: Created user data + Agent ID (for agents)

**PUT** `/api/users/:id`
- Update user
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**: Update data
- **Response**: Updated user data

**DELETE** `/api/users/:id`
- Delete user
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Success message

**PATCH** `/api/users/:id/block`
- Block user
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**: `{ reason }` (optional)
- **Response**: Updated user data

**PATCH** `/api/users/:id/unblock`
- Unblock user
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Updated user data

**PATCH** `/api/users/:id/activate`
- Activate user
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Updated user data

**PATCH** `/api/users/:id/deactivate`
- Deactivate user
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Updated user data

### Airport Management Routes (`/api/airports`) - Admin Only

**GET** `/api/airports`
- Get all airports with pagination and filtering
- **Headers**: `Authorization: Bearer <admin-token>`
- **Query Parameters**: 
  - `page` (number): Page number
  - `limit` (number): Items per page
  - `isActive` (boolean): Filter by active status
  - `country` (string): Filter by country
  - `city` (string): Filter by city
  - `search` (string): Search in airport code, name, city, country

**GET** `/api/airports/stats`
- Get airport statistics
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Airport count statistics

**GET** `/api/airports/search`
- Advanced airport search
- **Headers**: `Authorization: Bearer <admin-token>`
- **Query Parameters**: 
  - `q` (string): Search query
  - `country` (string): Filter by country
  - `city` (string): Filter by city
  - `isActive` (boolean): Filter by active status

**GET** `/api/airports/code/:code`
- Get airport by airport code (e.g., DEL, BOM, JFK)
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Airport data

**GET** `/api/airports/:id`
- Get airport by ID
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Airport data

**POST** `/api/airports`
- Create new airport
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**: Airport data
- **Response**: Created airport data

**POST** `/api/airports/bulk-import`
- Bulk import airports
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**: `{ airports: [...] }`
- **Response**: Import results

**PUT** `/api/airports/:id`
- Update airport
- **Headers**: `Authorization: Bearer <admin-token>`
- **Body**: Update data
- **Response**: Updated airport data

**DELETE** `/api/airports/:id`
- Delete airport
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Success message

**PATCH** `/api/airports/:id/activate`
- Activate airport
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Updated airport data

**PATCH** `/api/airports/:id/deactivate`
- Deactivate airport
- **Headers**: `Authorization: Bearer <admin-token>`
- **Response**: Updated airport data

## Data Models

### User Model Schema

#### Common Fields
- `userType`: 'agent' | 'customer' | 'admin'
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `phoneNumber`: String (required, unique)
- `isActive`: Boolean (default: true)
- `isBlocked`: Boolean (default: false)
- `isEmailVerified`: Boolean (default: false)
- `isPhoneVerified`: Boolean (default: false)

#### Agent-Specific Fields
- `agentId`: String (auto-generated, format: FD + 4 digits, e.g., FD8930)
- `companyName`: String (required for agents)
- `landlineNumber`: String
- `gst`: String (required for agents)
- `pan`: String (required for agents)
- `panName`: String (required for agents)
- `contactPersonName`: String (required for agents)
- `contactPersonDesignation`: String (required for agents)
- `contactPersonEmail`: String (required for agents)
- `contactPersonMobile`: String (required for agents)
- `address`: String (required for agents)
- `city`: String (required for agents)
- `state`: String (required for agents)
- `country`: String (required for agents)
- `pincode`: String (required for agents)
- `remark`: String

### Airport Model Schema

#### Required Fields
- `airportCode`: String (3 uppercase letters, e.g., DEL, BOM, JFK)
- `airportName`: String (airport name)
- `city`: String (city name)
- `country`: String (country name)
- `createdBy`: ObjectId (reference to User who created it)

#### Optional Fields
- `state`: String (state/province)
- `timezone`: String (default: 'UTC')
- `latitude`: Number (-90 to 90 degrees)
- `longitude`: Number (-180 to 180 degrees)
- `description`: String (max 500 characters)
- `isActive`: Boolean (default: true)
- `updatedBy`: ObjectId (reference to User who last updated it)

## Agent ID Generation

### Format
- **Pattern**: `FD` + 4 random numeric digits
- **Examples**: FD8930, FD1234, FD5678, FD9999
- **Uniqueness**: Each agent ID is unique across the system
- **Auto-generation**: Automatically generated when a new agent is registered

### Features
- ✅ **Automatic Generation**: No manual input required
- ✅ **Unique Validation**: Ensures no duplicate agent IDs
- ✅ **Format Validation**: Strict format enforcement (FD + 4 digits)
- ✅ **Searchable**: Can be used in search queries
- ✅ **Immutable**: Cannot be manually updated after creation

## Multi-Identifier Login

### Supported Identifiers for Agents
Agents can login using any of the following identifiers:

1. **Email Address**: `agent@example.com`
2. **Phone Number**: `+919876543210`
3. **Agent ID**: `FD8930`

### Login Request Format
```json
{
  "identifier": "FD8930",  // or email or phone number
  "password": "SecurePass123"
}
```

### Identifier Detection Logic
The system automatically detects the identifier type:
- **Agent ID**: Matches pattern `FD` + 4 digits (e.g., FD8930)
- **Email**: Contains `@` symbol
- **Phone Number**: Numeric format with optional `+` prefix

## Request/Response Examples

### Register Agent
```bash
POST /api/auth/register
Content-Type: application/json

{
  "userType": "agent",
  "email": "agent@example.com",
  "password": "SecurePass123",
  "phoneNumber": "+919876543210",
  "companyName": "Travel Agency Ltd",
  "landlineNumber": "022-12345678",
  "gst": "27AABCT1234A1Z5",
  "pan": "ABCDE1234F",
  "panName": "Travel Agency Ltd",
  "contactPersonName": "John Doe",
  "contactPersonDesignation": "Manager",
  "contactPersonEmail": "john@travelagency.com",
  "contactPersonMobile": "+919876543211",
  "address": "123 Main Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "pincode": "400001",
  "remark": "Premium travel partner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Agent registered successfully with ID: FD8930. Please verify your phone number.",
  "data": {
    "user": {
      "userType": "agent",
      "agentId": "FD8930",
      "email": "agent@example.com",
      "phoneNumber": "+919876543210",
      "companyName": "Travel Agency Ltd",
      // ... other fields
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Login with Different Identifiers

#### Login with Email
```bash
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "agent@example.com",
  "password": "SecurePass123"
}
```

#### Login with Phone Number
```bash
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "+919876543210",
  "password": "SecurePass123"
}
```

#### Login with Agent ID
```bash
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "FD8930",
  "password": "SecurePass123"
}
```

**Response (same for all login methods):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "userType": "agent",
      "agentId": "FD8930",
      "email": "agent@example.com",
      "phoneNumber": "+919876543210",
      // ... other fields
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Create Airport
```bash
POST /api/airports
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "airportCode": "DEL",
  "airportName": "Indira Gandhi International Airport",
  "city": "New Delhi",
  "country": "India",
  "state": "Delhi",
  "timezone": "Asia/Kolkata",
  "latitude": 28.5562,
  "longitude": 77.1000,
  "description": "Primary international airport serving Delhi"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Airport created successfully",
  "data": {
    "airport": {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "airportCode": "DEL",
      "airportName": "Indira Gandhi International Airport",
      "city": "New Delhi",
      "country": "India",
      "state": "Delhi",
      "timezone": "Asia/Kolkata",
      "latitude": 28.5562,
      "longitude": 77.1000,
      "description": "Primary international airport serving Delhi",
      "isActive": true,
      "createdBy": {
        "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
        "email": "admin@flydestination.com",
        "userType": "admin"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Get Airports
```bash
GET /api/airports?page=1&limit=10&country=India&isActive=true
Authorization: Bearer <admin-token>
```

### Search Airports
```bash
GET /api/airports/search?q=delhi&country=India
Authorization: Bearer <admin-token>
```

### Get Airport by Code
```bash
GET /api/airports/code/DEL
Authorization: Bearer <admin-token>
```

### Bulk Import Airports
```bash
POST /api/airports/bulk-import
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "airports": [
    {
      "airportCode": "BOM",
      "airportName": "Chhatrapati Shivaji Maharaj International Airport",
      "city": "Mumbai",
      "country": "India",
      "state": "Maharashtra",
      "timezone": "Asia/Kolkata"
    },
    {
      "airportCode": "BLR",
      "airportName": "Kempegowda International Airport",
      "city": "Bangalore",
      "country": "India",
      "state": "Karnataka",
      "timezone": "Asia/Kolkata"
    }
  ]
}
```

## Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "identifier",
      "message": "Please provide a valid email address, phone number, or agent ID",
      "value": "invalid-input"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Agent ID Specific Errors
```json
{
  "success": false,
  "message": "Registration failed: Unable to generate unique agent ID. Please try again.",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Login Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "identifier",
      "message": "Please provide a valid email address, phone number, or agent ID",
      "value": "invalid-identifier"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Airport Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "airportCode",
      "message": "Airport code must be exactly 3 characters",
      "value": "DE"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Role-based Access**: Admin-only endpoints protection
- **Agent ID Protection**: Agent IDs cannot be manually modified
- **Multi-identifier Security**: All login methods use the same security validation
- **Airport Code Validation**: Strict format enforcement for airport codes

## Development

### Running Tests
```bash
npm test
```

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Consistent error handling
- Comprehensive logging

## Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set strong JWT secret
4. Configure Twilio credentials
5. Set up proper CORS origins
6. Use PM2 or similar process manager

## Support

For issues and questions, please refer to the project documentation or create an issue in the repository. 