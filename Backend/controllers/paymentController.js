const crypto = require("crypto");
const axios = require("axios");
const Payment = require("../models/Payment");
const User = require("../models/User");

// eSewa Config — values from environment or sandbox defaults
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q";
const ESEWA_PRODUCT_CODE = process.env.ESEWA_PRODUCT_CODE || "EPAYTEST";
const ESEWA_GATEWAY_URL =
  process.env.ESEWA_GATEWAY_URL ||
  "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_STATUS_URL =
  process.env.ESEWA_STATUS_URL ||
  "https://rc.esewa.com.np/api/epay/transaction/status/";

// Frontend URLs for redirects
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

/**
 * Generate eSewa HMAC-SHA256 Signature (base64)
 * Input format: total_amount=<val>,transaction_uuid=<val>,product_code=<val>
 */
const generateSignature = (total_amount, transaction_uuid, product_code) => {
  const data = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
  return crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(data)
    .digest("base64");
};

/**
 * Verify signature from eSewa response
 * The response signed_field_names tells us which fields & order to use
 */
const verifyResponseSignature = (decodedData) => {
  const { signed_field_names, signature } = decodedData;
  if (!signed_field_names || !signature) return false;

  const fields = signed_field_names.split(",");
  const data = fields.map((field) => `${field}=${decodedData[field]}`).join(",");

  const expectedSignature = crypto
    .createHmac("sha256", ESEWA_SECRET_KEY)
    .update(data)
    .digest("base64");

  return expectedSignature === signature;
};

/**
 * @desc    Initiate eSewa Payment
 * @route   POST /api/payments/initiate
 * @access  Private
 */
exports.initiatePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    if (!amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ message: "A valid amount is required" });
    }

    const amountStr = String(amount);
    const transactionUuid = `WS-${Date.now()}-${userId.slice(-4)}`;

    // Create a pending payment record
    const payment = await Payment.create({
      userId,
      amount: Number(amount),
      transactionUuid,
      productCode: ESEWA_PRODUCT_CODE,
    });

    // Generate Signature
    const signature = generateSignature(
      amountStr,
      transactionUuid,
      ESEWA_PRODUCT_CODE
    );

    // Prepare eSewa form data — all values as strings per docs
    const formData = {
      amount: amountStr,
      failure_url: `${FRONTEND_URL}/payment-failure`,
      product_delivery_charge: "0",
      product_service_charge: "0",
      product_code: ESEWA_PRODUCT_CODE,
      signature,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      success_url: `${FRONTEND_URL}/payment-success`,
      tax_amount: "0",
      total_amount: amountStr,
      transaction_uuid: transactionUuid,
    };

    console.log("✅ eSewa Payment Initiated:", {
      transactionUuid,
      amount: amountStr,
      userId,
    });

    res.status(200).json({
      success: true,
      url: ESEWA_GATEWAY_URL,
      formData,
    });
  } catch (error) {
    console.error("❌ Payment Initiation Error:", error);
    res.status(500).json({ message: "Error initiating payment" });
  }
};

/**
 * @desc    Verify eSewa Payment (called when user is redirected back)
 * @route   GET /api/payments/verify
 * @access  Public (called via redirect from eSewa)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { data } = req.query;

    if (!data) {
      return res
        .status(400)
        .json({ message: "No payment data received from eSewa" });
    }

    // Decode the base64 response from eSewa
    let decodedData;
    try {
      decodedData = JSON.parse(
        Buffer.from(data, "base64").toString("utf-8")
      );
    } catch (parseErr) {
      console.error("❌ Failed to decode eSewa response:", parseErr);
      return res
        .status(400)
        .json({ message: "Invalid response data from eSewa" });
    }

    const {
      status,
      total_amount,
      transaction_uuid,
      transaction_code,
    } = decodedData;

    console.log("🔍 eSewa Verification Data:", decodedData);

    // 1. Verify the response signature for integrity
    const isSignatureValid = verifyResponseSignature(decodedData);
    if (!isSignatureValid) {
      console.error("❌ Signature mismatch — possible tampering");
      return res
        .status(400)
        .json({ message: "Signature verification failed" });
    }

    // 2. Check status
    if (status !== "COMPLETE") {
      return res
        .status(400)
        .json({ message: `Payment not completed. Status: ${status}` });
    }

    // 3. Find the payment record
    const payment = await Payment.findOne({
      transactionUuid: transaction_uuid,
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.status === "completed") {
      return res
        .status(200)
        .json({ success: true, message: "Payment already verified" });
    }

    // 4. Verify amount matches
    if (Number(total_amount) !== payment.amount) {
      console.error(
        `❌ Amount mismatch: expected ${payment.amount}, got ${total_amount}`
      );
      return res.status(400).json({ message: "Amount mismatch" });
    }

    // 5. Update payment record
    payment.status = "completed";
    payment.esewaTransactionId = transaction_code;
    await payment.save();

    // 6. Upgrade user to Premium (1 month)
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 1);

    await User.findByIdAndUpdate(payment.userId, {
      plan: "premium",
      subscriptionExpires: expirationDate,
    });

    console.log(
      `✅ Payment verified & user ${payment.userId} upgraded to premium`
    );

    res.status(200).json({
      success: true,
      message: "Payment successful and user upgraded to premium",
    });
  } catch (error) {
    console.error("❌ Payment Verification Error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during verification" });
  }
};

/**
 * @desc    Check eSewa transaction status (fallback when no redirect)
 * @route   GET /api/payments/status/:transactionUuid
 * @access  Private
 */
exports.checkPaymentStatus = async (req, res) => {
  try {
    const { transactionUuid } = req.params;

    // Find the payment record
    const payment = await Payment.findOne({ transactionUuid });
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // If already completed, return directly
    if (payment.status === "completed") {
      return res.status(200).json({
        success: true,
        status: "completed",
        message: "Payment already verified",
      });
    }

    // Query eSewa status check API
    const statusUrl = `${ESEWA_STATUS_URL}?product_code=${payment.productCode}&total_amount=${payment.amount}&transaction_uuid=${transactionUuid}`;

    const esewaRes = await axios.get(statusUrl);
    const esewaData = esewaRes.data;

    console.log("🔍 eSewa Status Check:", esewaData);

    if (esewaData.status === "COMPLETE") {
      // Update payment
      payment.status = "completed";
      payment.esewaTransactionId = esewaData.ref_id || "";
      await payment.save();

      // Upgrade user
      const expirationDate = new Date();
      expirationDate.setMonth(expirationDate.getMonth() + 1);

      await User.findByIdAndUpdate(payment.userId, {
        plan: "premium",
        subscriptionExpires: expirationDate,
      });

      return res.status(200).json({
        success: true,
        status: "completed",
        message: "Payment confirmed via status check",
      });
    }

    // Return current status from eSewa
    res.status(200).json({
      success: false,
      status: esewaData.status || "UNKNOWN",
      message: `Transaction status: ${esewaData.status}`,
    });
  } catch (error) {
    console.error("❌ Payment Status Check Error:", error.message);
    res
      .status(500)
      .json({ message: "Error checking payment status" });
  }
};