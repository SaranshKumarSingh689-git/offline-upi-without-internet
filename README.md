# Offline UPI Payment System

A full-stack UPI-inspired payment application designed to support online payments, offline transaction queuing, QR-based payments, and secure transaction synchronization.

The project combines a Next.js frontend with a Node.js and Express backend, using MongoDB for data persistence. Its offline transaction layer incorporates signed payment packets, packet-expiry validation, replay protection, and transaction synchronization.

**Note:** This is an educational project, not a production banking or UPI service.

## Features

* User registration and login.
* JWT-based authentication for protected API endpoints.
* UPI PIN setup and verification.
* Recipient lookup using a UPI ID.
* Online money transfers.
* QR code generation and scanning.
* Transaction history and transaction details.
* Offline transaction queuing and synchronization.
* Signed payment packets and signature verification.
* Packet-expiry validation.
* Replay protection against duplicate packet processing.
* Transaction synchronization with integrity safeguards.
* Tests for packet tampering, expiry, replay attempts, and concurrent processing.

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* html5-qrcode
* qrcode.react

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JSON Web Tokens (JWT)
* bcryptjs
* CryptoJS
* qrcode

### Development and Testing

* npm
* Node.js test scripts
* MongoDB

## Project Structure

```
offline-upi-backend/
├── frontend/
│   ├── app/                 # Next.js application pages
│   ├── lib/                 # Frontend utilities and helpers
│   ├── public/              # Static assets
│   ├── tests/               # Frontend testing utilities
│   ├── package.json
│   └── .gitignore
├── src/
│   ├── config/              # Database configuration
│   ├── controllers/         # API request handlers
│   ├── mesh/                # Offline transaction queue
│   ├── middleware/          # Authentication middleware
│   ├── models/              # MongoDB models
│   ├── routes/              # API route definitions
│   ├── services/            # Payment and security services
│   ├── tests/               # Backend tests
│   └── utils/               # Utility functions
├── server.js                # Backend entry point
├── package.json             # Backend dependencies and scripts
├── package-lock.json
└── README.md
```


## Prerequisites

Before running the application, install:

* Node.js and npm.
* MongoDB, either locally or through a MongoDB hosting service.
* A modern web browser.
* Camera access for QR scanning.

## Environment Configuration

Create a `.env` file in the backend root directory and configure the following environment variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Environment Variables

* **PORT:** The port on which the backend server runs. Defaults to `5000` if not specified.
* **MONGODB_URI:** The MongoDB connection string used to connect to the database.
* **JWT_SECRET:** The secret key used to sign authentication tokens.

**Important:** Replace the example values with your actual local configuration. Never commit your `.env` file, database credentials, or secret keys to GitHub.


## Installation and Setup

### 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/SaranshKumarSingh689-git/offline-upi-without-internet.git
cd offline-upi-without-internet
```


### 2. Install Backend Dependencies

From the backend root directory, run:

```
npm install
```

### 3. Configure MongoDB

Configure your environment variables and ensure that MongoDB is running and accessible.

### 4. Start the Backend

Run the following command from the backend root directory:

```
node server.js
```

The backend uses port 5000 by default unless another port is specified through the `PORT` environment variable.

To verify that the server is running, open:

http://localhost:5000/

Expected response:

```
Server is running
```

### 5. Install Frontend Dependencies

Open another terminal and navigate to the frontend directory:

```
cd frontend
npm install
```

### 6. Start the Frontend

Run:

```
npm run dev
```

Open the application in your browser:

http://localhost:3000/

The backend CORS configuration currently allows requests from `http://localhost:3000`.

## API Documentation

The backend base URL is:

http://localhost:5000

Protected endpoints require a valid JWT in the authorization header:

```
Authorization: Bearer <token>
```

### Authentication Endpoints

Base path: `/api/auth`

| Method | Endpoint             | Authentication | Description         |
| ------ | -------------------- | -------------- | ------------------- |
| POST   | `/api/auth/register` | Public         | Register a new user |
| POST   | `/api/auth/login`    | Public         | Authenticate a user |

### User Management Endpoints

Base path: `/api/users`

| Method | Endpoint                | Authentication | Description                               |
| ------ | ----------------------- | -------------- | ----------------------------------------- |
| GET    | `/api/users/profile`    | Required       | Retrieve the authenticated user's profile |
| POST   | `/api/users/set-pin`    | Required       | Set the UPI PIN                           |
| POST   | `/api/users/verify-pin` | Required       | Verify the UPI PIN                        |
| GET    | `/api/users/recipient`  | Required       | Find a recipient using a UPI ID           |

### Transaction Endpoints

Base path: `/api/transactions`

| Method | Endpoint                    | Authentication | Description                             |
| ------ | --------------------------- | -------------- | --------------------------------------- |
| POST   | `/api/transactions/send`    | Required       | Initiate a money transfer               |
| GET    | `/api/transactions/history` | Required       | Retrieve transaction history            |
| POST   | `/api/transactions/sync`    | Required       | Synchronize queued offline transactions |

### QR Payment Endpoints

Base path: `/api/qr`

| Method | Endpoint           | Authentication | Description               |
| ------ | ------------------ | -------------- | ------------------------- |
| GET    | `/api/qr/generate` | Required       | Generate a QR code        |
| POST   | `/api/qr/scan`     | Required       | Process a scanned QR code |

### Server Health Endpoint

| Method | Endpoint | Description                                 |
| ------ | -------- | ------------------------------------------- |
| GET    | `/`      | Check whether the backend server is running |

### API Request and Response Details

The exact request-body fields, validation rules, and response formats depend on the controller implementations.

Refer to the following files for implementation details:

* `src/controllers/authController.js`
* `src/controllers/userController.js`
* `src/controllers/transactioncontroller.js`
* `src/controllers/qrController.js`

## Testing

The backend defines npm scripts for testing packet verification, tampering, expiry, replay protection, and concurrent processing.

### Run Packet Verification Tests

```
npm test
```

### Test Tampered Packets

```
npm run test:tampered
```

### Test Expired Packets

```
npm run test:expired
```

### Test Explicit Expiry Rules

```
npm run test:expiry
```

### Test Replay Protection

```
npm run test:replay
```

### Test Concurrent Packet Processing

```
npm run test:concurrency
```

These commands run the test files configured in `package.json`. Database-dependent tests may require a valid MongoDB connection and appropriate environment variables.

## Security and Reliability

### JWT Authentication

Protected endpoints use authentication middleware to restrict access to authenticated users.

### UPI PIN Verification

The payment workflow includes UPI PIN verification to help prevent unauthorized payment requests.

### Signed Payment Packets

Payment packets are signed and verified to detect unauthorized changes to signed transaction data.

### Packet Expiry Validation

Packets are checked against configured validity rules to reject expired or otherwise invalid packets.

### Replay Protection

The system tracks processed packets to prevent a previously processed signed packet from being accepted for settlement again.

### Protected Transaction Synchronization

The synchronization endpoint requires authentication, and the synchronization logic includes safeguards intended to prevent duplicate settlement and preserve transaction integrity.

These mechanisms improve the reliability of the project but do not, by themselves, establish production-grade banking security or regulatory compliance.

## Current Limitations

* This is an educational payment-system simulation, not an official UPI integration.
* The backend requires an accessible MongoDB database.
* QR scanning requires camera permission and compatible browser hardware.
* Production deployment would require additional security reviews, monitoring, operational safeguards, and deployment-specific configuration.

## Future Improvements

* Rate limiting for repeated incorrect UPI PIN attempts.
* More comprehensive automated end-to-end tests.
* Transaction reconciliation and recovery workflows.
* Improved monitoring and audit logging.
* Production deployment and security hardening.

## Disclaimer

This project is intended for educational and demonstration purposes. It does not connect to official banking infrastructure and should not be used to process real financial transactions.
