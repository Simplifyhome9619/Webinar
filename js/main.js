/* =========================================================
   main.js
   - Registration form success state (front-end only)
   - Testimonial fade carousel
   ========================================================= */

(function () {
  "use strict";

  /* ---- Registration form: save lead to Google Sheet, then redirect to TagMango payment ---- */

  // Google Apps Script Web App endpoint — appends each submission as a row in "Webinar Leads" sheet.
  const SHEET_URL = "https://script.google.com/macros/s/AKfycbzwwKYerLN7EWD2OTsG2gNYs2omKzwDKjmWd-sXQlq1K7iuBkClgQTWB_lWhS8gaVyxfg/exec";

  // TagMango payment link — paste the real URL here once purchased.
  // While it's the empty string, the form just saves the lead and shows the success message.
  const PAYMENT_URL = "";

  const form = document.getElementById("regForm");
  const success = document.getElementById("regSuccess");

  if (form && success) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = "Reserving…";

      const formData = new FormData(form);
      const data = {
        name:    formData.get("name")    || "",
        country: formData.get("country") || "",
        phone:   (formData.get("country") || "") + " " + (formData.get("phone") || ""),
        email:   formData.get("email")   || ""
      };

      // POST to Google Sheets. Uses no-cors because Apps Script doesn't set
      // CORS headers by default — the response is opaque, but the row still
      // gets written on the server side.
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

      form.hidden = true;
      success.hidden = false;

      if (PAYMENT_URL) {
        window.setTimeout(function () {
          window.location.href = PAYMENT_URL;
        }, 900);
      }

      // Safety: restore button state if the redirect is blocked or absent.
      window.setTimeout(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }, 6000);
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
