# ShopKart

ShopKart is a customer store. People create an account, sign in, and browse the product catalog. Passwords are stored only as bcrypt hashes. The session JWT stays in an HttpOnly cookie.

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

The API listens on `http://localhost:5000`. Load the sample shelf once:

```bash
npm run seed
```

```bash
npm test
```

In another terminal, start the storefront:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Create an account, then log in. The home page loads the signed-in customer from `GET /customers/me`. Products are at `/products`.

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

## Product API

Product creation is open. Listing and detail are public reads. The storefront still asks the customer to sign in before showing the shelf.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/products` | Create a product |
| GET | `/products` | List products |
| GET | `/products/:id` | One product, including its description |

`GET /products` accepts `search`, `category`, and `sort`. Search matches the product name and ignores letter case. `sort=price_asc` and `sort=price_desc` order the shelf by price. An unknown sort is ignored.

The list leaves out the description. A missing field, a price that is not above 0, or a stock value that is not a whole number of 0 or more returns `400`. An invalid id returns `400`. An unknown product returns `404`.

```http
GET /products?search=keyboard&category=Electronics&sort=price_asc
```

## Cart API

Every cart route needs the signed-in cookie. The cart stores a product reference and a quantity. It does not store the price. Adding the same product again increases that row. A quantity below 1, or above the product's current stock, returns `400`. An invalid id returns `400`. An unknown product, or a product that is not in the cart, returns `404`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/cart/:productId` | Add one unit, or increment the existing row |
| GET | `/cart` | Current cart, with each product filled in |
| PATCH | `/cart/:productId` | Set the quantity |
| DELETE | `/cart/:productId` | Remove that product |

The storefront keeps one shared cart. The navbar count is the total number of units, and the subtotal is calculated from the latest price.

## Wishlist API

The wishlist stores product references for the signed-in customer. It does not copy the product. Adding the same product again returns `409`. `PATCH /wishlist/:productId/toggle` adds the product or removes it.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/wishlist/:productId` | Save a product |
| GET | `/wishlist` | Saved products for the current customer |
| PATCH | `/wishlist/:productId/toggle` | Save or remove that product |
| DELETE | `/wishlist/:productId` | Remove a saved product |

## Orders and payment

Checkout sends only the shipping address. The server prices the order from the current products, checks stock, and creates a Razorpay test order. The cart stays until `POST /orders/verify-payment` accepts the payment signature. The Razorpay key secret stays in the backend environment.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/orders/create-payment-order` | Start payment for the current cart |
| POST | `/orders/verify-payment` | Confirm the Razorpay signature and place the order |
| GET | `/orders` | The signed-in customer's orders |
| GET | `/orders/:id` | One order owned by that customer |

Add the test keys to `backend/.env` before placing an order:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
```

## Project layout

```text
backend/     Customer, product, cart, wishlist, and order API
frontend/    Account pages, catalog, wishlist, cart, and checkout
```
