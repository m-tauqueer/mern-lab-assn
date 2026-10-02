# ShopKart

ShopKart is a customer store. People create an account, sign in, and see their profile. Passwords are stored only as bcrypt hashes. The session JWT stays in an HttpOnly cookie.

## Stack

- Node.js and Express
- MongoDB and Mongoose
- bcrypt, jsonwebtoken, and cookie-parser
- React, React Router, and Axios
- Tailwind CSS

## Requirements

- Node.js 20 or newer
- MongoDB listening on `127.0.0.1:27017`

If you already use the local Docker container:

```bash
docker start shopkart-mongo
```

## Setup

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

The API listens on `http://localhost:5000`.

```bash
npm test
```

In another terminal, start the storefront:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Create an account, then log in. The home page loads the signed-in customer from `GET /customers/me`.

```bash
cd frontend
npm test
```

## Customer API

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/customers/register` | No | Create an account |
| POST | `/customers/login` | No | Sign in and set the auth cookie |
| GET | `/customers/me` | Yes | Current customer profile |
| POST | `/customers/logout` | Yes | Clear the auth cookie |
| PATCH | `/customers/change-password` | Yes | Replace the password after checking the current one |

### Register

```http
POST /customers/register
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@gmail.com",
  "password": "john123",
  "phone": "9876543210"
}
```

Missing fields and passwords shorter than 6 characters return `400`. A duplicate email returns `409`.

### Login

```http
POST /customers/login
Content-Type: application/json

{
  "email": "john@gmail.com",
  "password": "john123"
}
```

A wrong email and a wrong password both return `401` with the same message. The JWT is set as an HttpOnly cookie named `token`.

### Profile and logout

Send the cookie with the request.

```http
GET /customers/me
POST /customers/logout
```

### Change password

```http
PATCH /customers/change-password
Content-Type: application/json

{
  "oldPassword": "john123",
  "newPassword": "john456"
}
```

## Project layout

```text
backend/     Customer API
frontend/    Register, login, and home pages
```
