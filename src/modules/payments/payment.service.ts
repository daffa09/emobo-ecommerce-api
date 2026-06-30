import prisma from "../../prisma";
import axios from "axios";

const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_AUTH_HEADER = "Basic " + Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");

const midtransSnapUrl = MIDTRANS_IS_PRODUCTION 
  ? "https://app.midtrans.com/snap/v1/transactions" 
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

const midtransApiUrl = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

export const createMidtransPayment = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      profile: { include: { user: true } },
      items: {
        include: { product: true },
      },
    },
  });

  if (!order) throw new Error("Order not found");

  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing && existing.redirectUrl) return existing;

  const frontendUrl = process.env.FRONTEND_URL || "https://skripsi.daffathan-labs.my.id";
  const payload = {
    transaction_details: {
      order_id: orderId,
      gross_amount: Number(order.total_grand),
    },
    customer_details: {
      first_name: order.profile?.name || "Customer",
      email: order.profile?.user?.email || "customer@example.com",
      phone: order.phone || "08123456789",
    },
    callbacks: {
      finish: `${frontendUrl}/account/orders`
    }
  };

  console.log("Midtrans Payload:", JSON.stringify(payload));

  try {
    const response = await axios.post(midtransSnapUrl, payload, {
      headers: {
        "Authorization": MIDTRANS_AUTH_HEADER,
        "Content-Type": "application/json",
      },
    });

    const snapData = response.data;
    
    const payment = await prisma.payment.upsert({
      where: { orderId },
      update: {
        provider: "midtrans",
        providerId: orderId,
        snapToken: snapData.token,
        redirectUrl: snapData.redirect_url,
        amount: order.total_grand,
      },
      create: {
        orderId,
        provider: "midtrans",
        providerId: orderId,
        snapToken: snapData.token,
        redirectUrl: snapData.redirect_url,
        amount: order.total_grand,
        status: "PENDING",
      },
    });

    return payment;
  } catch (error: any) {
    console.error("Midtrans Create Transaction Error:", error.response?.data || error.message);
    throw new Error("Failed to create Midtrans payment");
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

  if (transactionStatus === "settlement" || transactionStatus === "capture") {
    paymentStatus = "PAID";
  } else if (
    transactionStatus === "deny" ||
    transactionStatus === "cancel" ||
    transactionStatus === "expire" ||
    transactionStatus === "failure"
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
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (order && order.status === "PENDING") {
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: orderId },
          data: { status: "CANCELLED" }
        });
        
        for (const item of order.items) {
          await tx.monitorStock.update({
            where: { productId: item.productId },
            data: { currentStock: { increment: item.qty } }
          });
        }
      });
      console.log(`[PAYMENT DEBUG] Order ${orderId} cancelled and stock restored`);
    }
  }

  return updatedPayment;
};

export const handleMidtransCallback = async (data: any) => {
  console.log("Handling Midtrans Notification (Webhook)");
  
  let parsedData = data;
  if (typeof data === "string") {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.log("Could not parse string data as JSON");
    }
  }

  const providerId = parsedData.order_id?.toString();

  if (!providerId) {
    console.error("Midtrans payload invalid:", parsedData);
    throw new Error("Invalid Midtrans callback payload");
  }

  console.log(`[PAYMENT DEBUG] Webhook trigger received for order_id ${providerId}`);

  const payment = await prisma.payment.findFirst({ where: { providerId } });
  
  if (!payment) {
    console.error(`[PAYMENT DEBUG] Payment not found in database for order_id: ${providerId}`);
    return null; 
  }

  console.log(`[PAYMENT DEBUG] Verifying payment for Order ID ${payment.orderId} from Webhook trigger...`);
  return verifyPayment(payment.orderId);
};

export const verifyPayment = async (orderId: string) => {
  console.log(`Verifying payment for order ${orderId}...`);
  const payment = await prisma.payment.findUnique({ where: { orderId } });
  if (!payment) throw new Error("Payment not found");

  if (payment.status === "PAID") return payment;

  try {
    const statusUrl = `${midtransApiUrl}/${payment.providerId}/status`;
      
    const response = await axios.get(statusUrl, {
      headers: {
        "Authorization": MIDTRANS_AUTH_HEADER,
        "Accept": "application/json",
      },
    });
    
    const paymentDataResponse = response.data;
    console.log(`Midtrans payment check response for ${payment.providerId}:`, JSON.stringify(paymentDataResponse));
    
    const finalStatus = paymentDataResponse.transaction_status || "PENDING";
    
    return await updatePaymentAndOrder(payment.providerId!, finalStatus);
  } catch (err: any) {
    console.error("Midtrans status check error:", err.response?.data || err.message);
    return payment;
  }
};
