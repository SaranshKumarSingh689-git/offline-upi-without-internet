# System Architecture — Offline UPI Payment System

## 1. Overview

The Offline UPI Payment System is a full-stack application built with Next.js, Node.js, Express, and MongoDB. It supports online payments, QR-based payments, offline transaction queuing, and synchronization of queued transactions.

The system uses JWT authentication, UPI PIN verification, signed payment packets, packet-expiry validation, and replay protection to improve transaction security and reliability.

**Disclaimer:** This is an educational payment-system simulation. It is not an official UPI integration and must not be used for real financial transactions.

## 2. Technology Stack

| Component                       | Technology                            |
| ------------------------------- | ------------------------------------- |
| Frontend                        | Next.js, React, TypeScript            |
| Backend                         | Node.js, Express.js                   |
| Database                        | MongoDB                               |
| Database ODM                    | Mongoose                              |
| Authentication                  | JSON Web Tokens (JWT)                 |
| Password hashing                | bcryptjs                              |
| Packet signing and verification | CryptoJS / HMAC-based packet security |
| QR generation                   | qrcode                                |
| QR scanning                     | html5-qrcode                          |
| QR rendering in frontend        | qrcode.react                          |

## 3. High-Level Architecture

```text
+--------------------------------------+
|           Next.js Frontend           |
|                                      |
| Register | Login | Dashboard         |
| Send Money | Scan & Pay              |
| Transactions | Profile               |
+-------------------+------------------+
                    |
                    | HTTP / JSON
                    | JWT Authorization
                    v
+--------------------------------------+
|          Express.js Backend          |
|                                      |
| Authentication and User Routes      |
| Transaction Routes                  |
| QR Payment Routes                    |
| Authentication Middleware           |
+-------------------+------------------+
                    |
                    v
+--------------------------------------+
|         Controllers / Services       |
|                                      |
| User and PIN Operations              |
| Payment Processing                  |
| Offline Queue and Synchronization   |
| Packet Validation and Replay Checks |
+-------------------+------------------+
                    |
                    v
+--------------------------------------+
|               MongoDB                |
|                                      |
| Users | Transactions                 |
| Offline Queue / Packet Records       |
| Replay Protection Records            |
+--------------------------------------+
```

*Note: This diagram describes the logical architecture. Exact database collections and module responsibilities should be checked against the implementation.*

## 4. Frontend Architecture

The frontend is implemented using Next.js, React, and TypeScript.

The application includes pages and workflows for:

* User registration and login.
* Dashboard and account information.
* Sending money.
* Generating and scanning QR codes.
* Viewing transaction history and transaction details.
* Managing profile settings.
* Synchronizing queued offline transactions.

The frontend communicates with the backend through HTTP requests. Authenticated requests use a JWT in the authorization header.

## 5. Backend Architecture

The backend uses Express.js to expose REST API endpoints.

### Main components

| Component          | Responsibility                                       |
| ------------------ | ---------------------------------------------------- |
| `server.js`        | Initializes the backend server and mounts API routes |
| `src/config/`      | Database configuration                               |
| `src/controllers/` | Handles API requests and application operations      |
| `src/middleware/`  | Authentication and request middleware                |
| `src/models/`      | MongoDB data models                                  |
| `src/routes/`      | Defines API endpoints                                |
| `src/services/`    | Payment and security-related operations              |
| `src/mesh/`        | Offline transaction queue functionality              |
| `src/utils/`       | Shared utility functions                             |
| `src/tests/`       | Backend test scripts                                 |

## 6. Authentication Flow

1. A user registers through the frontend.
2. The backend processes registration and stores the user record.
3. The user logs in with their credentials.
4. The backend validates the credentials and issues a JWT.
5. The frontend uses the token for authenticated API requests.
6. Authentication middleware validates the token before allowing access to protected endpoints.

Protected requests use the following header:

```http
Authorization: Bearer <token>
```

The JWT secret is configured through the backend environment variables.

## 7. Online Payment Flow

The general online payment workflow is:

1. The sender selects a recipient.
2. The frontend submits the payment details.
3. The backend authenticates the request.
4. The payment workflow verifies the UPI PIN.
5. The backend validates the payment details and available balance.
6. The transaction is processed and persisted.
7. The frontend displays the result and updates the transaction view.

The exact validation order and database operations depend on the implementation in the transaction controller and related services.

## 8. QR Payment Flow

The application supports QR code generation and scanning.

1. A user opens the QR payment interface.
2. The application generates or scans a QR code.
3. The QR data is submitted to the relevant backend endpoint when required.
4. The recipient or payment details are used to prepare the payment.
5. The payment follows the application's transaction validation and authorization workflow.

QR scanning requires a compatible browser and camera permission.

## 9. Offline Transaction Architecture

The offline transaction layer allows payment packets to be queued and synchronized later.

The logical workflow is:

```text
Create Offline Payment
          |
          v
Construct Payment Packet
          |
          v
Sign Packet
          |
          v
Queue Pending Transaction
          |
          v
Connection Available
          |
          v
Submit Queue for Synchronization
          |
          v
Validate Packet and Signature
          |
          v
Check Expiry and Replay Status
          |
          v
Validate and Settle Transaction
          |
          v
Record Successful Settlement
```

The offline workflow is intended to ensure that queued transactions are validated before settlement.

Offline queuing does not mean that a payment is immediately settled by a real banking network. Final processing in this project occurs through the application's synchronization logic.

## 10. Signed Payment Packets

Payment packets contain transaction-related information used by the offline synchronization workflow.

The packet fields used by the implementation include:

* `packetId`
* `txnId`
* `version`
* `sender`
* `receiver`
* `amount`
* `nonce`
* `timestamp`
* `expiresAt`
* `ttl`
* `hops`
* `status`
* `signature`

The packet-signing process generates a signature over the packet's canonical representation.

During verification, the backend checks the signature and validates relevant packet fields. Modifying signed fields without generating a valid signature causes verification to fail.

The implementation uses HMAC-based signing, which depends on a shared secret. It should not be described as public-key digital signing.

## 11. Packet Expiry Validation

Packets contain timestamp and expiry information.

The backend rejects packets that fail its configured validity checks, including expired packets and invalid timestamp/expiry combinations.

Expiry validation limits the period during which a queued packet can be accepted for synchronization.

## 12. Replay Protection

Replay protection prevents the same signed payment packet from being settled repeatedly.

The synchronization workflow checks whether a packet has already been processed. The implementation uses replay records associated with packet identifiers and transaction information.

The replay test verifies that:

1. The first synchronization succeeds.
2. A replay attempt using the same packet is rejected.
3. Only one transaction is created for the tested packet.

The replay-protection record model also uses expiry information for record cleanup.

## 13. Transaction Synchronization and Concurrency

The synchronization workflow validates queued packets before processing them.

The implementation includes database transaction handling and replay protection to reduce the risk of duplicate settlement.

The concurrency test starts two synchronization attempts for the same packet. The tested result is:

* Exactly one synchronization succeeds.
* The competing attempt fails.
* The sender's balance changes by the intended amount only once.
* The receiver's balance changes by the intended amount only once.
* Only one transaction is created.

A concurrent request may encounter a database write conflict. Production-grade reliability would benefit from carefully designed retry handling and additional failure-recovery testing.

## 14. API Groups

| API group      | Base path           | Purpose                                           |
| -------------- | ------------------- | ------------------------------------------------- |
| Authentication | `/api/auth`         | Registration and login                            |
| Users          | `/api/users`        | Profile, recipient lookup, and UPI PIN operations |
| Transactions   | `/api/transactions` | Payments, history, and offline synchronization    |
| QR payments    | `/api/qr`           | QR generation and scanning                        |
| Health check   | `/`                 | Backend availability check                        |

See `README.md` for the endpoint list and local setup instructions.

## 15. Security and Reliability Tests

The backend test suite includes:

| Test                       | Purpose                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| Packet verification        | Validates packet signatures and packet fields                       |
| Tampered packet            | Checks rejection of modified signed data                            |
| Expired packet             | Checks rejection of expired packets                                 |
| Explicit expiry            | Checks invalid timestamp and expiry combinations                    |
| Replay protection          | Checks rejection of previously processed packets                    |
| Concurrent synchronization | Checks that a packet is settled only once under concurrent requests |

The tests passing confirms the tested scenarios, not the absence of every possible vulnerability.

## 16. Current Limitations

* This is an educational payment-system simulation, not an official UPI integration.
* It does not connect to real banking infrastructure.
* Offline transactions require synchronization with the backend to be processed by the application.
* MongoDB must be accessible for backend persistence and database-dependent tests.
* Production deployment would require further security assessment, monitoring, operational controls, and recovery procedures.
* Repeated incorrect UPI PIN attempts would benefit from additional rate limiting and abuse protection.

## 17. Future Improvements

* Rate limiting for repeated incorrect PIN attempts.
* More extensive end-to-end and failure-recovery tests.
* Better handling and retry policies for transient database conflicts.
* Improved transaction reconciliation and audit logging.
* Deployment configuration and production-oriented monitoring.
* Further security review of authentication, transaction validation, and offline synchronization.
