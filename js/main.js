/* =========================================================
   main.js
   - Registration form: lead save + Razorpay Checkout
   - Testimonial fade carousel
   ========================================================= */

(function () {
  "use strict";

  /* ---- Countdown to the live session (supports multiple countdowns on the page) ---- */
  // Target: Saturday, 10 October 2026, 6:00 PM IST (UTC+5:30)
  const WEBINAR_TS = new Date("2026-10-10T18:00:00+05:30").getTime();
  const WEBINAR_LEN_MS = 90 * 60 * 1000; // 90 min live window

  const countdownEls = document.querySelectorAll(".countdown");

  if (countdownEls.length) {
    const pad = (n) => String(n).padStart(2, "0");

    function renderMsg(el, cls, text) {
      el.innerHTML =
        '<div class="countdown__msg ' + cls + '">' + text + "</div>";
    }

    let timer;
    function tick() {
      const diff = WEBINAR_TS - Date.now();

      if (diff <= 0) {
        countdownEls.forEach(function (el) {
          if (diff > -WEBINAR_LEN_MS) {
            renderMsg(el, "", "Session is live now &mdash; join on Zoom");
          } else {
            renderMsg(el, "countdown__msg--ended", "Session ended.");
          }
        });
        window.clearInterval(timer);
        return;
      }

      const d = pad(Math.floor(diff / 86400000));
      const h = pad(Math.floor((diff % 86400000) / 3600000));
      const m = pad(Math.floor((diff % 3600000) / 60000));
      const s = pad(Math.floor((diff % 60000) / 1000));

      countdownEls.forEach(function (el) {
        const dEl = el.querySelector("[data-d]");
        const hEl = el.querySelector("[data-h]");
        const mEl = el.querySelector("[data-m]");
        const sEl = el.querySelector("[data-s]");
        if (dEl) dEl.textContent = d;
        if (hEl) hEl.textContent = h;
        if (mEl) mEl.textContent = m;
        if (sEl) sEl.textContent = s;
      });
    }

    tick();
    timer = window.setInterval(tick, 1000);
  }

  /* ---- Mobile menu toggle ---- */
  const menuToggle = document.getElementById("menuToggle");
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuClose = document.getElementById("mobileMenuClose");

  if (menuToggle && mobileMenu) {
    function setMenu(open) {
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      mobileMenu.hidden = !open;
      document.body.classList.toggle("menu-open", open);
    }

    menuToggle.addEventListener("click", function () {
      const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
      setMenu(!isOpen);
    });

    if (mobileMenuClose) {
      mobileMenuClose.addEventListener("click", function () { setMenu(false); });
    }

    // Close when any link inside the menu is tapped (so scroll-to-anchor works)
    mobileMenu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !mobileMenu.hidden) setMenu(false);
    });

    // Close if viewport widens back to desktop (avoids stuck-open menu on rotate/resize)
    const mq = window.matchMedia("(min-width: 961px)");
    mq.addEventListener("change", function (e) {
      if (e.matches && !mobileMenu.hidden) setMenu(false);
    });
  }

  /* ---- Registration form: save lead to Google Sheet, then Razorpay Checkout ---- */

  // Google Apps Script Web App endpoint — appends each submission as a row in "Webinar Leads" sheet.
  const SHEET_URL = "https://script.google.com/macros/s/AKfycbzwwKYerLN7EWD2OTsG2gNYs2omKzwDKjmWd-sXQlq1K7iuBkClgQTWB_lWhS8gaVyxfg/exec";

  // Payment API (Vercel serverless functions in the Webinar repo: /api/create-order,
  // /api/verify-payment). Both landing pages are on GitHub Pages, so they call the
  // Vercel deployment directly; on the Vercel domain itself a relative path works.
  const PAY_API = /\.vercel\.app$/.test(window.location.hostname)
    ? ""
    : "https://webinar-psi-nine.vercel.app";

  const form = document.getElementById("regForm");
  const success = document.getElementById("regSuccess");
  const formError = document.getElementById("regError");

  function showFormError(msg) {
    if (!formError) { window.alert(msg); return; }
    formError.textContent = msg;
    formError.hidden = !msg;
  }

  async function postJSON(path, payload) {
    const res = await fetch(PAY_API + path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    let json = {};
    try { json = await res.json(); } catch (e) { /* non-JSON error page */ }
    if (!res.ok) {
      throw new Error(json.error || "Something went wrong. Please try again.");
    }
    return json;
  }

  if (form && success) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      showFormError("");

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.textContent = "Reserving…";

      function resetBtn() {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
      }

      // Detect source from the current hostname so the SAME main.js can be
      // deployed to both landing pages without any per-file editing.
      // (connect.jairajjagadeesh.com → "connect", anything else → "webinar")
      const host = (window.location.hostname || "").toLowerCase();
      const source = host.indexOf("connect.") === 0 || host.indexOf("connect-") === 0
        ? "connect"
        : "webinar";

      const formData = new FormData(form);
      const data = {
        name:    formData.get("name")    || "",
        country: formData.get("country") || "",
        phone:   (formData.get("country") || "") + " " + (formData.get("phone") || ""),
        email:   formData.get("email")   || "",
        source:  source  // A/B test tag: auto-detected from hostname
      };

      // 1) Save the lead first, so we keep it even if they abandon payment.
      // Uses no-cors because Apps Script doesn't set CORS headers by default —
      // the response is opaque, but the row still gets written on the server side.
      try {
        await fetch(SHEET_URL, {
          method: "POST",
          mode: "no-cors",
          body: JSON.stringify(data)
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("[reg] sheet-save error:", err);
      }

      // 2) Create the Razorpay order (amount is fixed on the server).
      let order;
      try {
        order = await postJSON("/api/create-order", {
          name: data.name,
          email: data.email,
          phone: data.phone,
          source: source
        });
      } catch (err) {
        showFormError(err.message);
        resetBtn();
        return;
      }

      if (typeof window.Razorpay !== "function") {
        showFormError("Payment window couldn't load. Please check your connection and try again.");
        resetBtn();
        return;
      }

      // 3) Open the Razorpay modal.
      submitBtn.textContent = "Opening payment…";

      const rzp = new window.Razorpay({
        key: order.key_id,
        order_id: order.order_id,
        amount: order.amount,
        currency: order.currency,
        name: "Jairaj Jagadeesh",
        description: "Live Webinar — Seat Reservation",
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone.replace(/\s+/g, "")
        },
        notes: { source: source },
        theme: { color: "#E0A43A" },

        // 4) On success, verify the signature on the server before confirming.
        handler: async function (resp) {
          submitBtn.textContent = "Confirming payment…";
          try {
            const result = await postJSON("/api/verify-payment", {
              razorpay_order_id:   resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature:  resp.razorpay_signature
            });
            if (!result.verified) throw new Error("Payment verification failed.");

            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
              event: "webinar_payment_success",
              source: source,
              value: order.amount / 100,
              currency: order.currency,
              transaction_id: resp.razorpay_payment_id
            });

            form.hidden = true;
            success.hidden = false;
          } catch (err) {
            showFormError(
              "We couldn't confirm your payment. If money was deducted, please WhatsApp us with Payment ID " +
              resp.razorpay_payment_id + "."
            );
            resetBtn();
          }
        },

        modal: {
          ondismiss: function () {
            showFormError("Payment cancelled — your seat isn't reserved yet.");
            resetBtn();
          }
        }
      });

      rzp.on("payment.failed", function (resp) {
        const reason = resp && resp.error && resp.error.description;
        showFormError("Payment failed" + (reason ? ": " + reason.replace(/\.?\s*$/, ".") : ".") + " Please try again.");
        // The modal stays open so they can retry; ondismiss resets the button if they close it.
      });

      rzp.open();
    });
  }

  /* ---- Testimonial fade carousel ---- */
  const quotesWrap = document.getElementById("quotes");
  const dotsWrap = document.getElementById("quotesDots");
  const prevBtn = document.getElementById("quotesPrev");
  const nextBtn = document.getElementById("quotesNext");

  if (quotesWrap && dotsWrap) {
    const quotes = Array.from(quotesWrap.querySelectorAll(".quote"));
    let idx = quotes.findIndex((q) => q.classList.contains("is-active"));
    if (idx < 0) idx = 0;

    // Build dots
    quotes.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("role", "tab");
      b.setAttribute("aria-label", `Show testimonial ${i + 1}`);
      b.setAttribute("aria-selected", i === idx ? "true" : "false");
      b.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(b);
    });

    const dots = Array.from(dotsWrap.querySelectorAll("button"));

    function go(next, fromClick) {
      const target = ((next % quotes.length) + quotes.length) % quotes.length;
      if (target === idx) return;
      quotes[idx].classList.remove("is-active");
      dots[idx].setAttribute("aria-selected", "false");
      idx = target;
      quotes[idx].classList.add("is-active");
      dots[idx].setAttribute("aria-selected", "true");
      if (fromClick) restart();
    }

    let timer = window.setInterval(() => go(idx + 1), 6000);

    function restart() {
      window.clearInterval(timer);
      timer = window.setInterval(() => go(idx + 1), 6000);
    }

    // Prev / Next arrow buttons
    if (prevBtn) prevBtn.addEventListener("click", () => go(idx - 1, true));
    if (nextBtn) nextBtn.addEventListener("click", () => go(idx + 1, true));

    // Keyboard: arrow keys navigate when carousel is focused
    quotesWrap.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { go(idx - 1, true); e.preventDefault(); }
      if (e.key === "ArrowRight") { go(idx + 1, true); e.preventDefault(); }
    });

    // Pause on hover for readability
    const pauseWrap = document.querySelector(".quotes-wrap") || quotesWrap;
    pauseWrap.addEventListener("mouseenter", () => window.clearInterval(timer));
    pauseWrap.addEventListener("mouseleave", restart);
  }
})();
