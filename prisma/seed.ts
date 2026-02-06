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
      phone: "6285157441749",
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

  console.log("Seeding 10 products with detailed specs...");
  const laptops = [
    {
      sku: "ASU-ROG-G16-01",
      name: "ASUS ROG Strix G16",
      brand: "ASUS",
      price: 24500000,
      stock: 10,
      description: "The ASUS ROG Strix G16 is designed for gamers who demand the absolute best performance. Powered by the latest Intel Core i9 processor and NVIDIA GeForce RTX 4080 graphics, this laptop can handle even the most demanding games with ease. The 16-inch QHD+ Nebula Display offers stunning visuals with a 240Hz refresh rate, while the advanced cooling system ensures that your laptop stays cool under pressure.",
      weight: 2500,
      condition: "NEW",
      warranty: "2 Years Official ASUS",
      specifications: {
        "Performance": {
          "Processor": "Intel Core i9-13980HX",
          "Graphics": "NVIDIA GeForce RTX 4080 12GB GDDR6",
          "RAM": "32GB DDR5-4800MHz",
          "Storage": "1TB PCIe 4.0 NVMe M.2 SSD"
        },
        "Display": {
          "Size": "16-inch",
          "Resolution": "QHD+ 16:10 (2560 x 1600, WQXGA)",
          "Refresh Rate": "240Hz",
          "Panel": "IPS-level (Nebula Display)"
        },
        "Connectivity": {
          "WiFi": "Wi-Fi 6E(802.11ax) (Triple band) 2*2",
          "Bluetooth": "Bluetooth 5.3",
          "Ports": "1x Thunderbolt 4, 1x USB 3.2 Gen 2 Type-C, 2x USB 3.2 Gen 2 Type-A, 1x HDMI 2.1"
        }
      },
      // Override images for this specific item to demonstrate carousel
      images: [
        "/laptops/asus.jpg",
        "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80"
      ]
    },
    {
      sku: "ASU-ZEN-D14-02",
      name: "ASUS Zenbook Duo 14",
      brand: "ASUS",
      price: 21000000,
      stock: 5,
      description: "The ASUS Zenbook Duo 14 is the laptop of tomorrow for the creators of today. It features a revolutionary ScreenPad Plus secondary touchscreen that tilts up for seamless multitasking. Powered by an Intel Core i7 processor and Intel Iris Xe graphics, it delivers powerful performance for creative workflows.",
      weight: 1750,
      condition: "NEW",
      warranty: "2 Years Official ASUS",
      specifications: {
        "Performance": {
          "Processor": "Intel Core i7-1355U",
          "Graphics": "Intel Iris Xe Graphics",
          "RAM": "16GB LPDDR5",
          "Storage": "1TB M.2 NVMe PCIe 4.0 SSD"
        },
        "Display": {
          "Main": "14.5-inch 2.8K (2880 x 1800) OLED 120Hz",
          "Second": "12.7-inch ScreenPad Plus (2880 x 864) IPS-level Support Stylus"
        },
        "Battery": {
          "Capacity": "76WHrs",
          "Chemistry": "4S1P, 4-cell Li-ion"
        }
      }
    },
    {
      sku: "LEN-LGN-5P-05",
      name: "Lenovo Legion 5 Pro",
      brand: "Lenovo",
      price: 22500000,
      stock: 12,
      description: "Pro-level gaming starts here. The Lenovo Legion 5 Pro is engineered to deliver devastation in and out of the arena. It features a massive 16-inch WQXGA display and is powered by the AMD Ryzen 7 7745HX processor and NVIDIA GeForce RTX 4070 graphics.",
      weight: 2500,
      condition: "NEW",
      warranty: "3 Years Legion Ultimate Support",
      specifications: {
        "Performance": {
          "Processor": "AMD Ryzen 7 7745HX",
          "Graphics": "NVIDIA GeForce RTX 4070 8GB GDDR6",
          "RAM": "16GB DDR5-5200MHz",
          "Storage": "1TB SSD M.2 2280 PCIe 4.0x4 NVMe"
        },
        "Display": {
          "Size": "16 inch WQXGA (2560x1600)",
          "Panel": "IPS 500nits Anti-glare",
          "Refresh Rate": "240Hz",
          "Features": "100% sRGB, DisplayHDR 400, Dolby Vision, G-SYNC, FreeSync"
        }
      }
    },
    {
      sku: "APP-MBP-14M3-09",
      name: "Apple MacBook Pro 14 M3",
      brand: "Apple",
      price: 35500000,
      stock: 10,
      description: "Mind-blowing. Head-turning. With the M3 Pro chip, the MacBook Pro 14 takes power and efficiency to new heights. It delivers exceptional performance whether it's plugged in or not, and now has even longer battery life. Combined with a stunning Liquid Retina XDR display and all the ports you need, this is a pro laptop without equal.",
      weight: 1600,
      condition: "NEW",
      warranty: "1 Year Official Apple Indonesia",
      specifications: {
        "Chip": {
          "Processor": "Apple M3 Pro chip",
          "CPU": "11-core CPU",
          "GPU": "14-core GPU",
          "Neural Engine": "16-core Neural Engine"
        },
        "Memory & Storage": {
          "RAM": "18GB Unified Memory",
          "SSD": "512GB SSD"
        },
        "Display": {
          "Type": "Liquid Retina XDR display",
          "Specs": "14.2-inch (diagonal) Liquid Retina XDR display; 3024-by-1964 native resolution"
        }
      }
    },
    {
      sku: "HP-SPE-X360-13",
      name: "HP Spectre x360 14",
      brand: "HP",
      price: 23500000,
      stock: 6,
      description: "Craftsmanship meets intelligence. The HP Spectre x360 2-in-1 PC automatically adjusts to your surroundings to give you the best on-screen image. But the heart of the smart is the Intel® Evo™ platform which gives you the performance and battery life you need.",
      weight: 1450,
      condition: "NEW",
      warranty: "2 Years HP Accidental Damage Protection",
      specifications: {
        "Performance": {
          "Processor": "Intel Core i7-1355U (up to 5.0 GHz with Intel Turbo Boost Technology)",
          "RAM": "16 GB LPDDR4x-4266 MHz RAM (onboard)",
          "Storage": "1 TB PCIe NVMe TLC M.2 SSD"
        },
        "Display": {
          "Type": "34.3 cm (13.5) diagonal, 3K2K (3000 x 2000), OLED",
          "Touch": "Multitouch-enabled, UWVA, edge-to-edge glass, micro-edge"
        }
      }
    },
    {
      sku: "DEL-XPS-13-17",
      name: "Dell XPS 13 9315",
      brand: "Dell",
      price: 17500000,
      stock: 12,
      description: "Our thinnest and lightest 13-inch XPS laptop is built for a lifestyle on the move. Expect long battery life from this compact laptop when streaming on the Netflix app for Windows 11: the FHD+ non-touch display offers up to 12 hours.",
      weight: 1170,
      condition: "NEW",
      warranty: "1 Year Premium Support",
      specifications: {
        "Performance": {
          "Processor": "12th Gen Intel Core i5-1230U (12 MB cache, 10 cores, 12 threads, up to 4.40 GHz Turbo)",
          "OS": "Windows 11 Home",
          "Graphics": "Intel Iris Xe Graphics"
        },
        "Memory & Storage": {
          "RAM": "8 GB, LPDDR5, 5200 MHz, integrated, dual-channel",
          "Storage": "256 GB, PCIe x2 NVMe, SSD onboard"
        },
        "Display": {
          "Specs": "13.4, FHD+ 1920 x 1200, 60Hz, Non-Touch, Anti-Glare, 500 nit, InfinityEdge"
        }
      }
    },
    {
      sku: "ACE-SWF-3-21",
      name: "Acer Swift 3 OLED",
      brand: "Acer",
      price: 13500000,
      stock: 22,
      description: "Say hello to the all-new pick-up-and-go. Bringing heavyweight performance within a color-washed lightweight shell, so you can make magic happen whenever, wherever—featuring 12th Gen Intel® Core™ processors and a brilliant OLED display.",
      weight: 1400,
      condition: "NEW",
      warranty: "2 Years Acer Warranty",
      specifications: {
        "Performance": {
          "Processor": "Intel Core i5-12500H processor",
          "Graphics": "Intel Iris Xe Graphics",
          "RAM": "16 GB LPDDR5 Dual Channel Memory"
        },
        "Display": {
          "Size": "14 inch 2.8K (2880 x 1800)",
          "Type": "OLED with Adobe100% DCI-P3 100%, 90 Hz refresh rate"
        }
      }
    },
    {
      sku: "MSI-RAI-GE78-27",
      name: "MSI Raider GE78 HX",
      brand: "MSI",
      price: 48500000,
      stock: 3,
      description: "Light 'em up. The mystic light with matrix lightbar design of Raider GE78 HX A13V is a game changer of RGB lighting. The matrix lightbar presents the new aesthetics of technology and future. With 16.8 million colors, it can personalize lighting and create a gaming atmosphere for gamers.",
      weight: 3100,
      condition: "NEW",
      warranty: "2 Years MSI Official Warranty",
      specifications: {
        "Performance": {
          "Processor": "Intel Core i9-13980HX",
          "Graphics": "NVIDIA GeForce RTX 4090 Laptop GPU 16GB GDDR6",
          "RAM": "64GB DDR5-5600",
          "Storage": "4TB (2TB x 2) NVMe PCIe Gen4x4 SSD"
        },
        "Display": {
          "Specs": "17 inch QHD+ (2560x1600), 240Hz, IPS-Level"
        }
      }
    },
    {
      sku: "RAZ-BLD-14-28",
      name: "Razer Blade 14",
      brand: "Razer",
      price: 36500000,
      stock: 6,
      description: "Small Size. Big Performance. The Razer Blade 14 is the ultimate 14-inch gaming laptop, featuring the latest AMD Ryzen™ 9 7940HS processor and NVIDIA® GeForce RTX™ 40 Series graphics. With a QHD+ 240Hz display, it provides the perfect balance of power and portability.",
      weight: 1780,
      condition: "NEW",
      warranty: "1 Year Razer Limited Warranty",
      specifications: {
        "Performance": {
          "Processor": "AMD Ryzen 9 7940HS Processor",
          "Graphics": "NVIDIA GeForce RTX 4070 (8GB GDDR6 VRAM)",
          "RAM": "16 GB DDR5-5600MHz",
          "Storage": "1 TB SSD (M.2 NVMe PCIe 4.0 x4)"
        },
        "Display": {
          "Specs": "14-inch QHD+ (2560 x 1600) 16:10, 240Hz Refresh Rate, AMD FreeSync Premium"
        }
      }
    },
    {
      sku: "ASU-TUF-A15-04",
      name: "ASUS TUF Gaming A15",
      brand: "ASUS",
      price: 15500000,
      stock: 15,
      description: "Geared for serious gaming and real-world durability, the TUF Gaming A15 is a fully-loaded Windows 11 gaming laptop that can carry you to victory. Powered by the latest AMD Ryzen 7 processor and GeForce RTX 40 Series GPU, action-packed gameplay is fast, fluid, and fully saturates speedy IPS-level displays up to 144Hz.",
      weight: 2200,
      condition: "NEW",
      warranty: "2 Years Global Warranty",
      specifications: {
        "Performance": {
          "Processor": "AMD Ryzen 7 7735HS Mobile Processor",
          "Graphics": "NVIDIA GeForce RTX 4060 Laptop GPU, 2420MHz* at 140W",
          "RAM": "16GB DDR5-4800, SO-DIMM x 2 slots, Max Capacity: 32GB",
          "Storage": "512GB PCIe 4.0 NVMe M.2 SSD"
        },
        "Display": {
          "Specs": "15.6-inch, FHD (1920 x 1080) 16:9, Value IPS-level, Anti-glare display, sRGB:100%, Refresh Rate:144Hz"
        }
      }
    }
  ];

  for (const laptop of laptops) {
    const laptopData = laptop as any;
    const images = laptopData.images || [`/laptops/${laptop.brand.toLowerCase()}.jpg`];
    // Remove images from spread to avoid conflict/duplication locally, though spread prioritizes last
    // But since we are constructing data explicitly, let's be safe.
    delete laptopData.images;

    await prisma.product.create({
      data: {
        ...laptopData,
        images: images
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
