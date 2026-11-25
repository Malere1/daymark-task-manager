# Daymark Task Manager

A full-stack task manager built with React, Express, MongoDB and JWT authentication.

## Requirements
- Node.js 18+
- MongoDB running locally, or a MongoDB Atlas connection string

## 1. Install dependencies
Open this folder in VS Code. Open Terminal > New Terminal and run:

```bash
npm run install:all
```

## 2. Configure the backend
In `server`, copy `.env.example` to `.env` and update `MONGO_URI`.
For local MongoDB, the default URI is:
`mongodb://127.0.0.1:27017/daymark`

Use a long random value for `JWT_SECRET`.

## 3. Start the app
From the project root:

```bash
npm run dev
```

Open http://localhost:5173

The React app proxies `/api` requests to Express at port 5000.

## API
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/me`
- GET `/api/tasks`
- POST `/api/tasks`
- PATCH `/api/tasks/:id`
- DELETE `/api/tasks/:id`

All task endpoints require `Authorization: Bearer <token>`.
Each task is scoped to the authenticated user's MongoDB ID.

## Notes
This is a development starter. Before production deployment, use HTTPS, set secure deployment secrets, configure a production CORS origin, add rate limiting and email verification/password reset, and review logging and backups.
