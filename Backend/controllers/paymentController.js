const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");

// eSewa Config (Sandbox)
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8g7h9jk969a9"; // Sandbox Secret
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST"; // Sandbox Product Code
const ESEWA_GATEWAY_URL = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

/**
 * Generate eSewa Signature
 */
const generateSignature = (total_amount, transaction_uuid, product_code) => {
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(data)
    .digest("base64");
};

/**
 * @desc    Initiate eSewa Payment
 * @route   POST /api/payments/initiate
 * @access  Private
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { amount } = req.body; // Amount as number or string from frontend
    const userId = req.user.id;

    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    // Ensure amount is a string for eSewa
    const amountStr = String(amount);
    const transactionUuid = `WS-${Date.now()}-${userId.slice(-4)}`;

    // Create a pending payment record
    const payment = await Payment.create({
      userId,
      amount: Number(amount),
      transactionUuid,
      productCode: ESEWA_PRODUCT_CODE,
    });

    // Generate Signature using standardized string format
    const signature = generateSignature(amountStr, transactionUuid, ESEWA_PRODUCT_CODE);

    // Prepare eSewa form data (all values as strings)
    const formData = {
      amount: amountStr,
      failure_url: "http://localhost:5173/payment-failure",
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: ESEWA_PRODUCT_CODE,
      signature,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: "http://localhost:5173/payment-success",
      tax_amount: "0",
      total_amount: amountStr,
      transaction_uuid: transactionUuid,
    };

    console.log("eSewa Initiation:", { transactionUuid, amount: amountStr });

    res.status(200).json({
      success: true,
      url: ESEWA_GATEWAY_URL,
      formData,
    });
  } catch (error) {
    console.error("Payment Initiation Error:", error);
    res.status(500).json({ message: "Error initiating payment" });
  }
};

/**
 * @desc    Verify eSewa Payment
 * @route   GET /api/payments/verify
 * @access  Public (Called by eSewa redirect or frontend)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { data } = req.query; // eSewa returns encoded data in 'data' query param

    if (!data) {
      return res.status(400).json({ message: "No data received from eSewa" });
    }

    // Decode base64 data
    const decodedData = JSON.parse(Buffer.from(data, "base64").toString("utf-8"));
    const { status, total_amount, transaction_uuid, transaction_code } = decodedData;

    if (status !== "COMPLETE") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    // Find the payment record
    const payment = await Payment.findOne({ transactionUuid: transaction_uuid });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "completed") {
      return res.status(200).json({ success: true, message: "Payment already verified" });
    }

    // Validate signature from response (Optional but recommended)
    // For now, we trust the status 'COMPLETE' and total_amount for sandbox

    // Update payment record
    payment.status = "completed";
    payment.esewaTransactionId = transaction_code;
    await payment.save();

    // Upgrade User to Premium
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1); // 1 month premium

    await User.findByIdAndUpdate(payment.userId, {
      plan: "premium",
      subscriptionExpires: expirationDate,
    });

    res.status(200).json({
      success: true,
      message: "Payment successful and user upgraded to premium",
    });
  } catch (error) {
    console.error("Payment Verification Error:", error);
    res.status(500).json({ message: "Internal server error during verification" });
  }
};