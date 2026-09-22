/* =========================================================
   main.js
   - Registration form success state (front-end only)
   - Testimonial fade carousel
   ========================================================= */

(function () {
  "use strict";

  /* ---- Registration form: swap for success state ---- */
  const form = document.getElementById("regForm");
  const success = document.getElementById("regSuccess");

  if (form && success) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      // Basic client-side validity gate
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // TODO: wire to backend (Elementor form action / CRM webhook / Google Sheet)
      // For now, capture values so they're available for a future integration.
      const data = Object.fromEntries(new FormData(form).entries());
      // eslint-disable-next-line no-console
      console.log("[reg] submitted", data);

      form.hidden = true;
      success.hidden = false;
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
