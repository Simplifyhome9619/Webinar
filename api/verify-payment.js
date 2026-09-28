/* =========================================================
   POST /api/verify-payment
   Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   Checks HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET).
   Only a matching signature counts as paid.
   ========================================================= */

const crypto = require("crypto");
const { preflight, getKeys, readBody } = require("./_razorpay");

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;

  const keys = getKeys();
  if (!keys) {
    return res.status(500).json({ error: "Payment is not configured on the server." });
  }

  const body = readBody(req);
  const orderId   = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;

  if (
    typeof orderId !== "string" || !orderId ||
    typeof paymentId !== "string" || !paymentId ||
    typeof signature !== "string" || !signature
  ) {
    return res.status(400).json({ verified: false, error: "Missing payment details." });
  }

  const expected = crypto
    .createHmac("sha256", keys.keySecret)
    .update(orderId + "|" + paymentId)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  const match = a.length === b.length && crypto.timingSafeEqual(a, b);

  if (!match) {
    return res.status(400).json({ verified: false, error: "Payment verification failed." });
  }

  return res.status(200).json({
    verified: true,
    order_id: orderId,
    payment_id: paymentId
  });
};
