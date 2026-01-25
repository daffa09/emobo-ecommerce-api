import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up database...");
  await prisma.review.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding users...");
  const passwordHash = bcrypt.hashSync("password123", 10);

  // Admin User
  await prisma.user.create({
    data: {
      email: "admin@emobo.com",
      passwordHash,
      name: "Super Admin",
      role: "ADMIN",
    },
  });

  // Customer User
  await prisma.user.create({
    data: {
      email: "customer@emobo.com",
      passwordHash,
      name: "Valued Customer",
      role: "CUSTOMER",
    },
  });

  console.log("Seeding 30 products...");
  const laptops = [
    // ASUS
    { sku: "ASU-ROG-G16-01", name: "ASUS ROG Strix G16", brand: "ASUS", price: 24500000, stock: 10, description: "Intel i9-13980HX, RTX 4080, 32GB DDR5, 1TB SSD. The ultimate gaming beast." },
    { sku: "ASU-ZEN-D14-02", name: "ASUS Zenbook Duo 14", brand: "ASUS", price: 21000000, stock: 5, description: "Dual-screen innovation with Intel i7, 16GB RAM, and 1TB SSD for creators." },
    { sku: "ASU-VIV-O15-03", name: "ASUS Vivobook 15 OLED", brand: "ASUS", price: 11500000, stock: 20, description: "Vibrant OLED display with Intel i5, 8GB RAM, and 512GB SSD." },
    { sku: "ASU-TUF-A15-04", name: "ASUS TUF Gaming A15", brand: "ASUS", price: 15500000, stock: 15, description: "Military-grade durability with Ryzen 7 and RTX 4060." },
    
    // Lenovo
    { sku: "LEN-LGN-5P-05", name: "Lenovo Legion 5 Pro", brand: "Lenovo", price: 22500000, stock: 12, description: "Ryzen 7 7745HX, RTX 4070, 16GB RAM, 1TB SSD. Premium gaming experience." },
    { sku: "LEN-TPX1-C11-06", name: "Lenovo ThinkPad X1 Carbon Gen 11", brand: "Lenovo", price: 28500000, stock: 8, description: "The gold standard for business. Intel i7, vPro, 32GB RAM, 1TB SSD." },
    { sku: "LEN-YOG-9I-07", name: "Lenovo Yoga 9i Gen 8", brand: "Lenovo", price: 19500000, stock: 7, description: "Versatile 2-in-1 with 4K OLED, Intel i7, and Bowers & Wilkins sound." },
    { sku: "LEN-IDP-SL3-08", name: "Lenovo IdeaPad Slim 3", brand: "Lenovo", price: 7500000, stock: 30, description: "Reliable everyday performance with Ryzen 5 and 512GB SSD." },

    // Apple
    { sku: "APP-MBP-14M3-09", name: "Apple MacBook Pro 14 (M3 Pro)", brand: "Apple", price: 35500000, stock: 10, description: "Liquid Retina XDR, M3 Pro chip, 18GB Unified Memory, 512GB SSD." },
    { sku: "APP-MBP-16M3-10", name: "Apple MacBook Pro 16 (M3 Max)", brand: "Apple", price: 54500000, stock: 5, description: "The most powerful MacBook ever. M3 Max, 36GB Memory, 1TB SSD." },
    { sku: "APP-MBA-13M3-11", name: "Apple MacBook Air 13 (M3)", brand: "Apple", price: 18500000, stock: 25, description: "Impossibly thin, blazingly fast. M3 chip, 8GB Memory, 256GB SSD." },
    { sku: "APP-MBA-15M3-12", name: "Apple MacBook Air 15 (M3)", brand: "Apple", price: 22500000, stock: 20, description: "Big screen, thin profile. M3 chip, 16GB Memory, 512GB SSD." },

    // HP
    { sku: "HP-SPE-X360-13", name: "HP Spectre x360 14", brand: "HP", price: 23500000, stock: 6, description: "Elegant 2-in-1 with OLED touch, Intel i7, and exceptional stylus support." },
    { sku: "HP-ENV-16-14", name: "HP Envy 16", brand: "HP", price: 18500000, stock: 10, description: "Powerhouse for creators. Intel i7, RTX 4060, and color-accurate display." },
    { sku: "HP-VICT-15-15", name: "HP Victus 15", brand: "HP", price: 12500000, stock: 18, description: "Affordable gaming with Intel i5 and RTX 3050." },
    { sku: "HP-PAV-15-16", name: "HP Pavilion 15", brand: "HP", price: 9500000, stock: 25, description: "Solid build, great performance for work and study. Ryzen 5, 16GB RAM." },

    // Dell
    { sku: "DEL-XPS-13-17", name: "Dell XPS 13 9315", brand: "Dell", price: 17500000, stock: 12, description: "Ultra-portable design leader. Intel i5, 16GB RAM, 512GB SSD." },
    { sku: "DEL-XPS-15-18", name: "Dell XPS 15 9530", brand: "Dell", price: 32500000, stock: 8, description: "Incredible OLED InfinityEdge display with Intel i7 and RTX 4050." },
    { sku: "DEL-LAT-5440-19", name: "Dell Latitude 5440", brand: "Dell", price: 16500000, stock: 15, description: "Business reliability. Intel i5, 16GB RAM, extensive security features." },
    { sku: "DEL-ALI-M16-20", name: "Alienware m16 R2", brand: "Dell", price: 38500000, stock: 4, description: "Elite gaming hardware. Intel i9, RTX 4080, QHD+ 240Hz screen." },

    // Acer
    { sku: "ACE-SWF-3-21", name: "Acer Swift 3", brand: "Acer", price: 8500000, stock: 22, description: "Thin, light, and value-packed. Ryzen 5, 8GB RAM, 512GB SSD." },
    { sku: "ACE-PRE-HE5-22", name: "Acer Predator Helios Neo 16", brand: "Acer", price: 19500000, stock: 10, description: "Aggressive cooling and power. Intel i7, RTX 4060." },
    { sku: "ACE-ASP-5-23", name: "Acer Aspire 5", brand: "Acer", price: 6500000, stock: 35, description: "Versatile everyday laptop. Intel i3-12th gen, 8GB RAM, 256GB SSD." },
    { sku: "ACE-NIT-V15-24", name: "Acer Nitro V 15", brand: "Acer", price: 11500000, stock: 20, description: "Entry gaming redefined. Intel i5, RTX 2050, high refresh rate." },

    // MSI
    { sku: "MSI-KAT-15-25", name: "MSI Katana 15", brand: "MSI", price: 15500000, stock: 12, description: "Sharp gaming precision. Intel i7-13th gen, RTX 4050." },
    { sku: "MSI-PRE-14-26", name: "MSI Prestige 14 Evo", brand: "MSI", price: 14500000, stock: 8, description: "Elegance meets performance for business professionals. Intel i7." },
    { sku: "MSI-RAI-GE78-27", name: "MSI Raider GE78 HX", brand: "MSI", price: 48500000, stock: 3, description: "Desktop replacement. Intel i9, RTX 4090, 64GB RAM." },

    // Razer
    { sku: "RAZ-BLD-14-28", name: "Razer Blade 14", brand: "Razer", price: 36500000, stock: 6, description: "Compact power. Ryzen 9, RTX 4070, QHD+ 240Hz display." },
    { sku: "RAZ-BLD-16-29", name: "Razer Blade 16", brand: "Razer", price: 42500000, stock: 4, description: "World's first dual-mode mini-LED display. Intel i9, RTX 4080." },
    { sku: "RAZ-BLD-15-30", name: "Razer Blade 15", brand: "Razer", price: 29500000, stock: 10, description: "The classic portable powerhouse. Intel i7, RTX 3070 Ti." },
  ];

  for (const laptop of laptops) {
    await prisma.product.create({
      data: {
        ...laptop,
        images: [`/laptops/${laptop.brand.toLowerCase()}.jpg`] // Generic placeholder mapping
      },
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
