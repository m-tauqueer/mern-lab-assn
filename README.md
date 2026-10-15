# ShopKart

ShopKart is a customer store. A person creates an account, signs in, browses products, saves a wishlist, and checks out from a cart. Passwords are stored only as bcrypt hashes. The session JWT stays in an HttpOnly cookie named `token`.

The Razorpay key secret never leaves the backend. Copy `backend/.env.example` to `backend/.env` on your machine. Do not commit `.env`.

## Stack

- Node.js and Express
- MongoDB and Mongoose
- bcrypt, jsonwebtoken, and cookie-parser
- React, React Router, and Axios
- Tailwind CSS
- Razorpay test checkout

## Requirements

- Node.js 20 or newer
- MongoDB on `127.0.0.1:27017`

Start a local database if you do not already have one:

```bash
docker run -d --name shopkart-mongo -p 27017:27017 mongo:7
```

If that container already exists:

```bash
docker start shopkart-mongo
```

## Setup

Clone the repository, then start the API:

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and set `JWT_SECRET` to a long random string. Leave the Razorpay lines empty until you want to place a test order.

| Variable | What it does |
| --- | --- |
| `PORT` | API port. Default `5000`. |
| `MONGO_URI` | MongoDB database. Default `mongodb://127.0.0.1:27017/shopkart`. |
| `JWT_SECRET` | Secret used to sign the session cookie. Change the placeholder before you run the API. |
| `JWT_EXPIRES_IN` | How long a sign-in lasts. Default `7d`. |
| `CLIENT_URL` | Storefront origin allowed to send the cookie. Default `http://localhost:5173`. |
| `NODE_ENV` | `development` locally. |
| `RAZORPAY_KEY_ID` | Test mode key id. Starts with `rzp_test_`. Leave blank until checkout. |
| `RAZORPAY_KEY_SECRET` | Test mode secret. Backend only. Never put this in React or in git. |

The example file lists every variable:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/shopkart
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
```

```bash
npm install
npm run seed
npm run dev
```

`npm run seed` loads nine sample products in Electronics, Fashion, Books, and Home. One of them, Wireless Mouse, has no stock, so the add-to-cart button stays disabled. Running the seed again updates those nine products and does not insert duplicates. The API listens on `http://localhost:5000`.

`npm run dev` restarts the API when the code changes. `npm start` runs it once.

In another terminal, start the storefront:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The storefront calls the API on port `5000` of the same host, and it sends the session cookie with every request.

## Walkthrough

1. Create an account. The password must be at least 6 characters. A duplicate email is rejected.
2. Log in. A wrong email and a wrong password show the same message.
3. The home page shows the name, email, and phone from `GET /customers/me`. Logout clears the cookie.
4. Open Products. Search matches the name and ignores letter case. Filter by Electronics, Fashion, Books, or Home. Sort by price.
5. Open a product. Add to cart starts at quantity 1. Adding it again increases that same line. The button stops when the quantity reaches the stock.
6. Save it to the wishlist. The heart action toggles, and the navbar count updates. The wishlist page can remove a saved product.
7. Open the cart. Minus stops at 1. Remove deletes the line. The subtotal is price times quantity, using the current product price.
8. Checkout asks for full name, a 10-digit mobile number, address, city, state, and a 6-digit pincode. The name and phone are filled from the account.
9. Place order opens Razorpay only when the test keys are set. After a successful test payment, the cart becomes empty and the order appears under Orders.

Refreshing the page keeps the cart and the wishlist, because both are stored on the customer in MongoDB.

## Using the store

| Route | What it does |
| --- | --- |
| `/register` | Create an account |
| `/login` | Sign in |
| `/home` | Signed-in profile |
| `/products` | Search, filter, and sort the shelf |
| `/products/:id` | Product details, add to cart, save to wishlist |
| `/wishlist` | Saved products |
| `/cart` | Change quantity or remove a line |
| `/checkout` | Shipping form and Razorpay test payment |
| `/order-success/:id` | Confirmation after a verified payment |
| `/orders` | Orders for the signed-in customer |
| `/orders/:id` | One order, including the shipping address |

The navbar count for the cart is the total number of units. The wishlist count is the number of saved products. Both come from the API.

Checkout refuses an empty cart and a quantity that is above the current stock. The server calculates the total. The cart stays until the payment signature is verified.

## Tests

```bash
cd backend
npm test
```

```bash
cd frontend
npm test
```

## Razorpay test payment

Payment uses Razorpay test mode. Create test keys in the Razorpay dashboard while Test Mode is on, then put them in `backend/.env`:

```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=your_test_secret
```

Restart the API after saving the file. Use a Razorpay test card in the payment window. No real money is charged. Do not put these keys in React or in git.

Without the keys, the rest of the store still runs. Place order returns an error that the test keys are missing, and the cart is left as it was.

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

A wrong email and a wrong password both return `401` with the same message.

### Profile, logout, and password

Send the cookie with the request.

```http
GET /customers/me
POST /customers/logout
```

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

## Wishlist API

The wishlist stores product references for the signed-in customer. Adding the same product again returns `409`. `PATCH /wishlist/:productId/toggle` adds the product or removes it.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/wishlist/:productId` | Save a product |
| GET | `/wishlist` | Saved products for the current customer |
| PATCH | `/wishlist/:productId/toggle` | Save or remove that product |
| DELETE | `/wishlist/:productId` | Remove a saved product |

## Cart API

Every cart route needs the signed-in cookie. Each line stores a product reference and a quantity, not a copied price. Adding the same product again increases that row. A quantity below 1, or above the product's current stock, returns `400`. An invalid id returns `400`. An unknown product, or a product that is not in the cart, returns `404`.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/cart/:productId` | Add one unit, or increment the existing row |
| GET | `/cart` | Current cart, with each product filled in |
| PATCH | `/cart/:productId` | Set the quantity |
| DELETE | `/cart/:productId` | Remove that product |

## Orders API

Checkout sends only the shipping address. The server prices the order from the current products, checks stock, and creates a Razorpay test order. The cart stays until `POST /orders/verify-payment` accepts the payment signature.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/orders/create-payment-order` | Start payment for the current cart |
| POST | `/orders/verify-payment` | Confirm the Razorpay signature and place the order |
| GET | `/orders` | The signed-in customer's orders |
| GET | `/orders/:id` | One order owned by that customer |

An order stores the name, price, image, and quantity from the moment it was placed. A later price change does not rewrite old orders.

## Project layout

```text
backend/
  models/          Customer, Product, Order
  controllers/     Request handling
  routes/          Customer, product, wishlist, cart, order
  seed/products.js Sample shelf
  tests/           API tests
frontend/
  src/pages/       Register, login, home, catalog, wishlist, cart, checkout, orders
  src/components/  Navbar, product card, cart line, wishlist button
  src/context/     Shared cart state
  src/services/    Axios calls
```

`.env` is listed in `.gitignore`. `backend/.env.example` is the only environment file in git, and its Razorpay values are blank.
