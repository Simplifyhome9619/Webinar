/* =========================================================
   _razorpay.js — shared helpers for the /api functions
   (files starting with "_" are not exposed as routes on Vercel)
   ========================================================= */

const Razorpay = require("razorpay");

// Pages allowed to call this API. Both landing pages live on GitHub
// Pages, so the browser calls this Vercel deployment cross-origin.
const ALLOWED_ORIGINS = [
  "https://webinar.jairajjagadeesh.com",
  "https://connect.jairajjagadeesh.com",
  "https://webinar-psi-nine.vercel.app",
  "http://localhost:3000",
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

function applyCors(req, res) {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.indexOf(origin) !== -1) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Max-Age", "86400");
}

// Handles CORS preflight + method check. Returns true if the request
// has already been answered and the handler should stop.
function preflight(req, res) {
  applyCors(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return true;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    res.status(405).json({ error: "Method not allowed" });
    return true;
  }
  return false;
}

function getKeys() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId: keyId, keySecret: keySecret };
}

function getClient(keys) {
  return new Razorpay({ key_id: keys.keyId, key_secret: keys.keySecret });
}

// Vercel parses JSON bodies automatically; this also copes with a raw string.
function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch (e) { return {}; }
  }
  return req.body;
}

module.exports = { preflight, getKeys, getClient, readBody };
