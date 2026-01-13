import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  // Clear existing data to avoid conflicts on unique fields like SKU
  await prisma.product.deleteMany({});
  
  const hash = bcrypt.hashSync("admin123", 10);
  
  // Upsert Admin
  await prisma.user.upsert({
    where: { email: "admin@emobo.local" },
    update: { passwordHash: hash },
    create: { email: "admin@emobo.local", passwordHash: hash, name: "Admin", role: "ADMIN" },
  });

  // Seed Products
  const products = [
    {
      sku: "LEN-X1-C11",
      name: "Lenovo ThinkPad X1 Carbon Gen 11",
      brand: "Lenovo",
      description: "Ultra-lightweight professional laptop with Intel i7, 16GB RAM, and 512GB SSD.",
      price: 19500000,
      stock: 15,
      images: ["/lenovo-thinkpad-laptop.jpg"]
    },
    {
      sku: "ASU-VB-P15",
      name: "ASUS Vivobook Pro 15 OLED",
      brand: "ASUS",
      description: "Stunning 15.6-inch OLED display with AMD Ryzen 7 and powerful graphics.",
      price: 13500000,
      stock: 25,
      images: ["/asus-vivobook-laptop.jpg"]
    },
    {
      sku: "HP-PV-15T",
      name: "HP Pavilion 15 Touch Screen",
      brand: "HP",
      description: "Versatile touchscreen laptop with Intel i5, 8GB RAM, and 256GB SSD.",
      price: 11250000,
      stock: 30,
      images: ["/hp-pavilion-laptop.jpg"]
    },
    {
      sku: "ACE-SW-3L",
      name: "Acer Swift 3 Thin & Light",
      brand: "Acer",
      description: "Perfect for students; portable, fast, and features a 512GB SSD.",
      price: 9750000,
      stock: 40,
      images: ["/acer-swift-laptop.jpg"]
    },
    {
      sku: "ASU-ROG-STR",
      name: "ASUS ROG Strix G16",
      brand: "ASUS",
      description: "High-performance gaming machine with Intel i9 and RGB lighting.",
      price: 22500000,
      stock: 10,
      images: ["/asus-vivobook-laptop.jpg"]
    },
    {
        sku: "LEN-LGN-5P",
        name: "Lenovo Legion 5 Pro",
        brand: "Lenovo",
        description: "Excellent gaming laptop with Ryzen 7 and RTX 3070.",
        price: 20950000,
        stock: 12,
        images: ["/lenovo-thinkpad-laptop.jpg"]
    }
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
