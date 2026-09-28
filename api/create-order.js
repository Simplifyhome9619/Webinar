/* =========================================================
   POST /api/create-order
   Creates a Razorpay order for one webinar seat.
   The amount is fixed server-side (WEBINAR_PRICE_PAISE) —
   the browser can't change what it gets charged.
   Returns: { order_id, amount, currency, key_id }
   ========================================================= */

const { preflight, getKeys, getClient, readBody } = require("./_razorpay");

const clip = (v, n) => String(v || "").trim().slice(0, n);

module.exports = async function handler(req, res) {
  if (preflight(req, res)) return;

  const keys = getKeys();
  if (!keys) {
    return res.status(500).json({ error: "Payment is not configured on the server." });
  }

  const amount = parseInt(process.env.WEBINAR_PRICE_PAISE || "9900", 10);
  if (!Number.isInteger(amount) || amount < 100) {
    return res.status(500).json({ error: "Invalid price configured (minimum is 100 paise)." });
  }

  const body = readBody(req);
  const source = body.source === "connect" ? "connect" : "webinar";

  try {
    const order = await getClient(keys).orders.create({
      amount: amount,
      currency: "INR",
      receipt: (source === "connect" ? "cn_" : "wb_") + Date.now(), // max 40 chars
      notes: {
        name:   clip(body.name, 100),
        email:  clip(body.email, 120),
        phone:  clip(body.phone, 30),
        source: source
      }
    });

    return res.status(200).json({
      order_id: order.id,
      amount:   order.amount,
      currency: order.currency,
      key_id:   keys.keyId // public key — safe for the browser
    });
  } catch (err) {
    const status = err && err.statusCode;
    // eslint-disable-next-line no-console
    console.error("[create-order]", status, err && err.error ? err.error : err);
    if (status === 401) {
      return res.status(401).json({ error: "Payment gateway authentication failed." });
    }
    return res.status(500).json({ error: "Could not start payment. Please try again." });
  }
};
