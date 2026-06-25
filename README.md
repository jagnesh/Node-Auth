# Authentication Project

This repository implements a Node.js/Express authentication demo with JWT and role-based access control.

## Branch Overview

- `main`
  - Base implementation of the authentication server.
  - Includes user signup and login flows.
  - Provides token authentication and refresh token support.
  - Serves as the stable default branch.

- `jwt-auth`
  - Focused on JSON Web Token authentication.
  - Includes login, token issuance, refresh token flow, and protected user endpoints.

- `RBAC`
  - Adds role-based access control (RBAC).
  - Includes admin-only routes such as `/admin/users`.
  - Uses middleware to restrict access based on `req.user.role`.

## Functional Summary

The app exposes these main routes:

- `POST /user/signup`
  - Register a new user.
  - Stores password as a hashed secret with salt.

- `POST /user/login`
  - Authenticate an existing user.
  - Returns a JWT access token and a refresh token.

- `POST /user/refresh`
  - Refreshes the access token using a valid refresh token.

- `GET /user`
  - Returns the authenticated user profile.
  - Requires a valid `Authorization: Bearer <token>` header.

- `PATCH /user`
  - Updates the authenticated user's name.
  - Requires authentication.

- `GET /admin/users`
  - Returns the user list.
  - Available only on the `RBAC` branch.
  - Requires authenticated admin role.

## Branch Links

- [main branch](https://github.com/jagnesh/Node-Auth/tree/main)
- [jwt-auth branch](https://github.com/jagnesh/Node-Auth/tree/jwt-auth)
- [RBAC branch](https://github.com/jagnesh/Node-Auth/tree/RBAC)

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set environment variables in a `.env` file:
   ```env
   PORT=8000
   JWT_SECRET=your_jwt_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ```
3. Start the server:
   ```bash
   npm run dev
   ```

## Notes

- The server uses `express.json()` for JSON body parsing.
- The authentication middleware checks for `Authorization: Bearer <token>`.
- Role restrictions are enforced through middleware in the `RBAC` branch.
- Database migrations and admin features are available via Drizzle and the database schema.
