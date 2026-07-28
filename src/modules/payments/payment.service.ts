import prisma from "../../prisma";
import axios from "axios";

// Flip Configuration
const FLIP_SECRET_KEY = process.env.FLIP_SECRET_KEY || "";
const FLIP_AUTH_HEADER = "Basic " + Buffer.from(FLIP_SECRET_KEY + ":").toString("base64");
const FLIP_IS_PRODUCTION = process.env.FLIP_IS_PRODUCTION === "true";

const flipBillsUrl = FLIP_IS_PRODUCTION 
  ? "https://bigflip.id/api/v2/pwf/bill" 
  : "https://bigflip.id/big_sandbox_api/v2/pwf/bill";

// Midtrans Configuration
const MIDTRANS_IS_PRODUCTION = process.env.MIDTRANS_IS_PRODUCTION === "true";
const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const MIDTRANS_AUTH_HEADER = "Basic " + Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64");

const midtransSnapUrl = MIDTRANS_IS_PRODUCTION 
  ? "https://app.midtrans.com/snap/v1/transactions" 
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

const midtransApiUrl = MIDTRANS_IS_PRODUCTION
  ? "https://api.midtrans.com/v2"
  : "https://api.sandbox.midtrans.com/v2";

// ponytail: Midtrans Snap per-transaction limit; raise/lower if the account limit differs
const MIDTRANS_MAX_AMOUNT = 10_000_000;

// ponytail: arbitrary sane ceiling, raise if a real case needs more
const MAX_INSTALLMENTS = 12;

// Only the subtotal (goods) is split evenly. `extras` (shipping + app fee) is
// attached to the LAST installment, so shipping is never spread across payments.
//
// room = limit - extras leaves headroom for that last installment, otherwise
// ceil(total/limit) can produce a final installment above the Midtrans limit
// (e.g. subtotal 19_974_000 + extras 26_000 -> 2 x 9_987_000, last = 10_013_000).
//
// Guarantees: sum(parts) === subtotal + extras, every part is an integer <= limit.
// subtotal <= room -> [subtotal + extras] (single payment, as before).
export function splitInstallments(
  subtotal: number,
  extras = 0,
  limit = MIDTRANS_MAX_AMOUNT,
  count?: number
): number[] {
  const room = Math.max(1, limit - extras);
  const min = Math.max(1, Math.ceil(subtotal / room));
  // Clamping doubles as trust-boundary validation: `count` comes from the client.
  const n = Math.min(Math.max(count ?? min, min), MAX_INSTALLMENTS);
  const base = Math.floor(subtotal / n);
  const rem = subtotal - base * n; // 0..n-1, spread as +1 over the earliest installments
  const parts = Array.from({ length: n }, (_, i) => base + (i < rem ? 1 : 0));
  // rem <= n-1, so the last part never takes a +1 -> base + extras <= room + extras = limit
  parts[n - 1] += extras;
  return parts;
}

export const createPayment = async (orderId: string, installments?: number) => {
  const gateway = process.env.PAYMENT_GATEWAY || "midtrans";

  if (gateway === "flip") {
    return createFlipPayment(orderId);
  } else {
    return createMidtransPayment(orderId, installments);
  }
};

const createFlipPayment = async (orderId: string) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { profile: { include: { user: true } } },
  });

  if (!order) throw new Error("Order not found");

  const existing = await prisma.payment.findUnique({ where: { orderId } });
  if (existing && existing.redirectUrl) return existing;

  const frontendUrl = process.env.FRONTEND_URL || "https://skripsi.daffathan-labs.my.id";

  const payload = new URLSearchParams({
    title: `Payment for Order ${orderId}`,
    amount: order.total_grand.toString(),
    type: "SINGLE",
    expired_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 16),
    redirect_url: `${frontendUrl}/customer/transactions/${orderId}`,
    is_address_required: "0",
    is_phone_number_required: "0",
    sender_name: order.profile?.name || "Customer",
    sender_email: order.profile?.user?.email || "customer@example.com",
    sender_phone_number: order.phone || "08123456789",
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
        providerId: bill.link_id.toString(), 
        snapToken: "",
        redirectUrl: bill.link_url,
        amount: order.total_grand,
      },
      create: {
        orderId,
        provider: "flip",
        providerId: bill.link_id.toString(),
        snapToken: "",
        redirectUrl: bill.link_url,
        amount: order.total_grand,
        status: "PENDING",
      },
    });

    return payment;
  } catch (error: any) {
    console.error("Flip Create Bill Error:", error.response?.data || error.message);
    throw new Error("Failed to create Flip payment");
  }
};

const createMidtransPayment = async (orderId: string, installments?: number) => {
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
  // The active installment link is still alive (unpaid) -> reuse it. If redirectUrl
  // was cleared (installment advanced / retry) -> generate a new one below.
  if (existing && existing.redirectUrl && existing.status === "PENDING") return existing;

  const total = Math.round(Number(order.total_grand));
  const extras = Math.round(Number(order.shippingCost) + Number(order.appFee));

  // The installment count is locked when the payment row is first created; later
  // calls (retry / next installment) always reuse the stored value.
  const chosen = existing?.installmentTotal ?? installments;
  const amounts = splitInstallments(total - extras, extras, MIDTRANS_MAX_AMOUNT, chosen);
  const installmentNo = existing?.installmentNo ?? 1;
  const installmentTotal = amounts.length;
  const gross = amounts[installmentNo - 1];
  const midtransOrderId = installmentTotal > 1 ? `${orderId}-${installmentNo}` : orderId;

  const frontendUrl = process.env.FRONTEND_URL || "https://skripsi.daffathan-labs.my.id";
  const payload = {
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: gross,
    },
    customer_details: {
      first_name: order.profile?.name || "Customer",
      email: order.profile?.user?.email || "customer@example.com",
      phone: order.phone || "08123456789",
    },
    callbacks: {
      finish: `${frontendUrl}/customer/transactions/${orderId}`
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
        providerId: midtransOrderId,
        snapToken: snapData.token,
        redirectUrl: snapData.redirect_url,
        amount: gross,
        installmentNo,
        installmentTotal,
        status: "PENDING",
        // paidAmount is deliberately left alone here so earlier installments stay accumulated
      },
      create: {
        orderId,
        provider: "midtrans",
        providerId: midtransOrderId,
        snapToken: snapData.token,
        redirectUrl: snapData.redirect_url,
        amount: gross,
        installmentNo,
        installmentTotal,
        status: "PENDING",
      },
    });

    return payment;
  } catch (error: any) {
    console.error("Midtrans Create Transaction Error:", error.response?.data || error.message);
    throw new Error("Failed to create Midtrans payment");
  }
};

const updatePaymentAndOrder = async (providerId: string, transactionStatus: string) => {
  console.log(`[PAYMENT DEBUG] Processing status update for providerId ${providerId}`);
  console.log(`[PAYMENT DEBUG] Transaction Status: ${transactionStatus}`);

  const payment = await prisma.payment.findFirst({ where: { providerId } });
  if (!payment) {
    console.error(`[PAYMENT DEBUG] Payment not found in database for providerId: ${providerId}`);
    return null;
  }

  const orderId = payment.orderId;

  console.log(`[PAYMENT DEBUG] Found payment record for Order ID ${orderId} with status: ${payment.status}`);

  let paymentStatus: "PAID" | "FAILED" | "PENDING" = "PENDING";

  if (transactionStatus === "SUCCESSFUL" || transactionStatus === "settlement" || transactionStatus === "capture") {
    paymentStatus = "PAID";
  } else if (
    transactionStatus === "CANCELLED" ||
    transactionStatus === "FAILED" ||
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

  // Installments: an order can be paid in stages. paidAmount accumulates as each
  // installment settles; the order only moves to PROCESSING after the last one.
  const isLastInstallment = payment.installmentNo >= payment.installmentTotal;

  if (paymentStatus === "PAID") {
    const paidNow = Number(payment.paidAmount) + Number(payment.amount);

    if (!isLastInstallment) {
      // This installment settled but others remain. Advance; the order stays PENDING.
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          paidAmount: paidNow,
          installmentNo: payment.installmentNo + 1,
          status: "PENDING",
          redirectUrl: null,
          snapToken: null,
          providerId: null, // rotated: a replayed webhook for the old installment finds no row -> no double-advance
          paidAt: null,
          amount: 0, // set again when createPayment generates the next installment
        },
      });
      console.log(`[PAYMENT DEBUG] Installment ${payment.installmentNo}/${payment.installmentTotal} PAID for ${orderId}. Advancing; paidAmount=${paidNow}`);
      return updatedPayment;
    }

    // Last installment -> fully paid.
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAmount: paidNow, paidAt: new Date() },
    });
    console.log(`[PAYMENT DEBUG] Order ${orderId} fully paid. Updating status to PROCESSING`);
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: "PROCESSING" },
    });
    console.log(`[PAYMENT DEBUG] Order ${orderId} updated successfully to ${updatedOrder.status}`);
    return updatedPayment;
  }

  if (paymentStatus === "FAILED") {
    console.log(`[PAYMENT DEBUG] Handling failed payment for Order ${orderId}`);
    // ponytail: partial refunds are out of scope; a failed installment is simply retried
    if (Number(payment.paidAmount) > 0) {
      // Some installments are already paid -> do not cancel the order or restore stock.
      // Just reset the active installment link so it can be retried.
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "PENDING", redirectUrl: null, snapToken: null },
      });
      console.log(`[PAYMENT DEBUG] Installment failed but ${orderId} is partially paid; link reset for retry`);
      return updatedPayment;
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", paidAt: null },
    });
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
    return updatedPayment;
  }

  // PENDING
  return prisma.payment.update({
    where: { id: payment.id },
    data: { status: "PENDING", paidAt: null },
  });
};

export const handleWebhookCallback = async (data: any) => {
  console.log("Handling Webhook Notification");
  
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
      parsedData = data.data; 
    }
  }

  if (Array.isArray(parsedData)) {
    parsedData = parsedData[0];
  }

  const providerId = parsedData.order_id?.toString() || parsedData.bill_link_id?.toString() || parsedData.link_id?.toString() || parsedData.id?.toString();

  if (!providerId) {
    console.error("Payload invalid, cannot find order_id or link_id:", parsedData);
    throw new Error("Invalid callback payload");
  }

  console.log(`[PAYMENT DEBUG] Webhook trigger received for providerId/order_id ${providerId}`);

  const payment = await prisma.payment.findFirst({ where: { providerId } });
  
  if (!payment) {
    console.error(`[PAYMENT DEBUG] Payment not found in database for providerId: ${providerId}`);
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

  if (payment.provider === "flip") {
    try {
      const paymentUrl = FLIP_IS_PRODUCTION 
        ? "https://bigflip.id/api/v2/pwf/payment" 
        : "https://bigflip.id/big_sandbox_api/v2/pwf/payment";
        
      const response = await axios.get(paymentUrl, {
        params: { bill_link_id: payment.providerId },
        headers: { "Authorization": FLIP_AUTH_HEADER },
      });
      
      const paymentDataResponse = response.data;
      console.log(`Flip payment check response for ${payment.providerId}:`, JSON.stringify(paymentDataResponse));
      
      let finalStatus = "PENDING";
      
      if (paymentDataResponse && paymentDataResponse.data && Array.isArray(paymentDataResponse.data)) {
        const hasSuccessful = paymentDataResponse.data.some((p: any) => p.status === "SUCCESSFUL");
        if (hasSuccessful) {
          finalStatus = "SUCCESSFUL";
        } else {
           const hasFailed = paymentDataResponse.data.some((p: any) => p.status === "FAILED" || p.status === "CANCELLED");
           if (hasFailed) finalStatus = "FAILED";
        }
      }
      
      if (finalStatus === "PENDING") {
         const billResponse = await axios.get(flipBillsUrl, {
           params: { id: payment.providerId },
           headers: { "Authorization": FLIP_AUTH_HEADER },
         });
         const statusResponse = billResponse.data;
         const billData = Array.isArray(statusResponse) ? statusResponse[0] : statusResponse;
         
         if (billData && billData.status === "INACTIVE") {
           finalStatus = "FAILED";
         }
      }
      
      return await updatePaymentAndOrder(payment.providerId!, finalStatus);
    } catch (err: any) {
      console.error("Flip status check error:", err.response?.data || err.message);
      return payment;
    }
  } else {
    // midtrans logic
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
  }
};
