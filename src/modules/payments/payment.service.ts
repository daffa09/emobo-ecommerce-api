import prisma from "../../prisma";
import axios from "axios";

const FLIP_IS_PRODUCTION = process.env.FLIP_IS_PRODUCTION === "true";
const FLIP_SECRET_KEY = process.env.FLIP_SECRET_KEY || "";
const FLIP_AUTH_HEADER = "Basic " + Buffer.from(FLIP_SECRET_KEY + ":").toString("base64");

// 1. UPDATE: Gunakan endpoint API v3
const flipBillsUrl = FLIP_IS_PRODUCTION 
  ? "https://bigflip.id/api/v2/pwf/bill" 
  : "https://bigflip.id/big_sandbox_api/v2/pwf/bill";

export const createFlipPayment = async (orderId: number) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: true,
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  // 2. FIX LOCALHOST ERROR: Pastikan FRONTEND_URL bukan localhost saat di lempar ke Flip
  // Solusi: Gunakan Ngrok saat testing lokal, atau pass URL dummy saat masih di localhost
  const rawFrontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const frontendUrl = rawFrontendUrl.includes("localhost") 
    ? "https://b95b-2404-8000-1004-491d-68ed-8b1a-eb94-1b6.ngrok-free.app" // Ganti dengan URL Ngrok/tunneling kamu
    : rawFrontendUrl.replace(/\/$/, "");
    
  const redirectUrl = `${frontendUrl}/customer/transactions/${orderId}`;

  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing && existing.redirectUrl) return existing;

  const payload = new URLSearchParams({
    title: `Order No ${orderId}`,
    type: "SINGLE",
    amount: order.totalAmount.toString(),
    redirect_url: redirectUrl,
    is_address_required: "0",
    is_phone_number_required: "0",
    step: "2", 
    sender_name: order.user.name || "Customer",
    sender_email: order.user.email,
    sender_phone_number: order.phone || "",
  });

  console.log("Flip Payload:", payload.toString());

  try {
    const response = await axios.post(flipBillsUrl, payload, {
      headers: {
        "Authorization": FLIP_AUTH_HEADER,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const bill = response.data;
    
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: {
        provider: "flip",
        // FYI: Menggunakan .toString() di sini sudah SANGAT TEPAT karena per 10 April 2026, 
        // Flip akan mengubah link_id menjadi 19 digit yang tidak muat di integer standard JavaScript.
        providerId: bill.link_id.toString(), 
        snapToken: "",
        redirectUrl: bill.link_url,
        amount: order.totalAmount,
      },
      create: {
        orderId,
        provider: "flip",
        providerId: bill.link_id.toString(),
        snapToken: "",
        redirectUrl: bill.link_url,
        amount: order.totalAmount,
        status: "PENDING",
      },
    });

    return payment;
  } catch (error: any) {
    console.error("Flip Create Bill Error:", error.response?.data || error.message);
    throw new Error("Failed to create Flip payment");
  }
};

// Helper function to handle status updates and DB changes
const updatePaymentAndOrder = async (providerId: string, transactionStatus: string) => {
  console.log(`[PAYMENT DEBUG] Processing status update for providerId ${providerId}`);
  console.log(`[PAYMENT DEBUG] Transaction Status: ${transactionStatus}`);

  const payment = await prisma.payment.findFirst({ where: { providerId } });
  if (!payment) {
    console.error(`[PAYMENT DEBUG] Payment not found in database for providerId: ${providerId}`);
    // Do not throw to return gracefully to webhook caller if not found
    return null;
  }

  const orderId = payment.orderId;

  console.log(`[PAYMENT DEBUG] Found payment record for Order ID ${orderId} with status: ${payment.status}`);

  let paymentStatus: "PAID" | "FAILED" | "PENDING" = "PENDING";

  if (transactionStatus === "SUCCESSFUL") {
    paymentStatus = "PAID";
  } else if (
    transactionStatus === "CANCELLED" ||
    transactionStatus === "FAILED"
  ) {
    paymentStatus = "FAILED";
  } else {
    paymentStatus = "PENDING";
  }

  console.log(`[PAYMENT DEBUG] Determined final payment status: ${paymentStatus}`);

  const updatedPayment = await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: paymentStatus === "PAID" ? "PAID" : paymentStatus === "FAILED" ? "FAILED" : "PENDING",
      paidAt: paymentStatus === "PAID" ? new Date() : null,
    },
  });

  console.log(`[PAYMENT DEBUG] Updated payment record in DB. New status: ${updatedPayment.status}`);

  if (paymentStatus === "PAID") {
    console.log(`[PAYMENT DEBUG] Updating Order ${orderId} status to PROCESSING`);
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING" },
    });
    console.log(`[PAYMENT DEBUG] Order ${orderId} updated successfully to ${updatedOrder.status}`);
  } else if (paymentStatus === "FAILED") {
    console.log(`[PAYMENT DEBUG] Handling failed payment for Order ${orderId}`);
    // Restore stock if payment failed/expired/cancelled
    await prisma.$transaction(async (tx: any) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });

      // Only restore if it was still PENDING to avoid double restoration
      if (order && order.status === "PENDING") {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } }
          });
        }
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" }
        });
        console.log(`[PAYMENT DEBUG] Order ${orderId} cancelled and stock restored`);
      }
    });
  }

  return updatedPayment;
};

export const handleFlipCallback = async (data: any) => {
  console.log("Handling Flip Notification (Webhook)");
  
  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.log("Could not parse string data as JSON");
    }
  } else if (data.data) {
    try {
      parsedData = JSON.parse(data.data);
    } catch (e) {
      parsedData = data.data; // Try using data object directly
    }
  }

  // Antisipasi jika Flip mengirimkan data dalam bentuk Array (sering terjadi di webhook Bill API v2)
  if (Array.isArray(parsedData)) {
    parsedData = parsedData[0];
  }

  // Mengambil ID dari payload (Bisa bernama bill_link_id, link_id, atau id)
  const providerId = parsedData.bill_link_id?.toString() || parsedData.link_id?.toString() || parsedData.id?.toString();

  if (!providerId) {
    console.error("Payload Flip tidak terbaca:", parsedData);
    throw new Error("Invalid Flip callback payload");
  }

  console.log(`[PAYMENT DEBUG] Webhook trigger received for providerId ${providerId}`);

  const payment = await prisma.payment.findFirst({ where: { providerId } });
  
  if (!payment) {
    console.error(`[PAYMENT DEBUG] Payment not found in database for providerId: ${providerId}`);
    return null; // Return null agar Flip tidak terus-terusan retry webhook
  }

  // BEST PRACTICE: 
  // Alih-alih mengandalkan status teks dari webhook, kita gunakan webhook HANYA sebagai pelatuk.
  // Panggil fungsi verifyPayment agar backend cross-check langsung ke server Flip untuk status yang paling update.
  console.log(`[PAYMENT DEBUG] Verifying payment for Order ID ${payment.orderId} from Webhook trigger...`);
  return verifyPayment(payment.orderId);
};

export const verifyPayment = async (orderId: number) => {
  console.log(`Verifying payment for order ${orderId}...`);
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new Error("Payment not found");

  if (payment.status === "PAID") return payment;

  // If status is not PAID, check with Flip directly to see if any successful payment exists
  try {
    const paymentUrl = FLIP_IS_PRODUCTION 
      ? "https://bigflip.id/api/v2/pwf/payment" 
      : "https://bigflip.id/big_sandbox_api/v2/pwf/payment";
      
    const response = await axios.get(paymentUrl, {
      params: { bill_link_id: payment.providerId },
      headers: {
        "Authorization": FLIP_AUTH_HEADER,
      },
    });
    
    const paymentDataResponse = response.data;
    console.log(`Flip payment check response for ${payment.providerId}:`, JSON.stringify(paymentDataResponse));
    
    // Default to PENDING
    let finalStatus = "PENDING";
    
    if (paymentDataResponse && paymentDataResponse.data && Array.isArray(paymentDataResponse.data)) {
      // Check if there is any successful payment
      const hasSuccessful = paymentDataResponse.data.some((p: any) => p.status === "SUCCESSFUL");
      if (hasSuccessful) {
        finalStatus = "SUCCESSFUL";
      } else {
         // If no successful payments but we know it's not active anymore or failed
         // We might decide it's failed, but letting it be PENDING unless we query the bill again.
         // Let's also check if there are cancelled/failed payments
         const hasFailed = paymentDataResponse.data.some((p: any) => p.status === "FAILED" || p.status === "CANCELLED");
         if (hasFailed) finalStatus = "FAILED";
      }
    }
    
    // If we didn't find any successful payments, let's also check the bill status 
    // to see if it's INACTIVE (expired)
    if (finalStatus === "PENDING") {
       const billResponse = await axios.get(flipBillsUrl, {
         params: { id: payment.providerId },
         headers: { "Authorization": FLIP_AUTH_HEADER },
       });
       const statusResponse = billResponse.data;
       const billData = Array.isArray(statusResponse) ? statusResponse[0] : statusResponse;
       
       if (billData && billData.status === "INACTIVE") {
         finalStatus = "FAILED"; // Expired/Cancelled
       }
    }
    
    return await updatePaymentAndOrder(payment.providerId!, finalStatus);
  } catch (err: any) {
    console.error("Flip status check error:", err.response?.data || err.message);
    return payment;
  }
};
