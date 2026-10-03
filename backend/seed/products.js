const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Product = require("../models/product.model");

dotenv.config({ path: path.join(__dirname, "../.env") });

const products = [
  {
    name: "Noise Cancelling Headphones",
    description: "Wireless over-ear headphones with active noise cancellation.",
    price: 4999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=70",
    stock: 25,
  },
  {
    name: "Mechanical Keyboard",
    description: "RGB mechanical keyboard with blue switches.",
    price: 2999,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?auto=format&fit=crop&w=800&q=70",
    stock: 10,
  },
  {
    name: "Wireless Mouse",
    description: "Compact wireless mouse with a quiet click.",
    price: 899,
    category: "Electronics",
    image:
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=70",
    stock: 0,
  },
  {
    name: "Cotton Crew T-Shirt",
    description: "Soft cotton t-shirt with a regular fit.",
    price: 799,
    category: "Fashion",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=70",
    stock: 40,
  },
  {
    name: "Running Shoes",
    description: "Lightweight trainers for daily runs.",
    price: 3499,
    category: "Fashion",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=70",
    stock: 8,
  },
  {
    name: "Paperback Novel",
    description: "A pocket paperback for the commute.",
    price: 649,
    category: "Books",
    image:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=800&q=70",
    stock: 15,
  },
  {
    name: "Illustrated Story Collection",
    description: "Short stories with full-page illustrations.",
    price: 1199,
    category: "Books",
    image:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=800&q=70",
    stock: 6,
  },
  {
    name: "Ceramic Table Lamp",
    description: "A small lamp for a desk or bedside table.",
    price: 1899,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=70",
    stock: 12,
  },
  {
    name: "Two-Seat Sofa",
    description: "A compact sofa with firm cushions.",
    price: 18999,
    category: "Home",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=70",
    stock: 3,
  },
];

async function seedProducts() {
  await mongoose.connect(process.env.MONGO_URI);

  for (const product of products) {
    await Product.updateOne({ name: product.name }, product, { upsert: true });
  }

  console.log(`Seeded ${products.length} products`);
  await mongoose.disconnect();
}

seedProducts().catch((error) => {
  console.error("Product seed failed:", error.message);
  process.exit(1);
});
