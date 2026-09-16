(function () {
  const GA_ID = "G-3B091E5CBH";

  if (window.__kurashiAnalyticsLoaded) return;
  window.__kurashiAnalyticsLoaded = true;

  window.dataLayer = window.dataLayer || [];

  function gtag() {
    window.dataLayer.push(arguments);
  }

  window.gtag = gtag;

  const script = document.createElement("script");
  script.async = true;
  script.src =
    "https://www.googletagmanager.com/gtag/js?id=" +
    encodeURIComponent(GA_ID);

  document.head.appendChild(script);

  gtag("js", new Date());

  gtag("config", GA_ID, {
    send_page_view: true,
  });

  function sendEvent(name, params) {
    if (typeof window.gtag !== "function") return;

    window.gtag("event", name, {
      ...params,
      page_path: window.location.pathname,
      page_title: document.title,
    });
  }

  document.addEventListener("click", function (event) {
    const target = event.target.closest("a, button");

    if (!target) return;

    const text =
      target.textContent
        ?.replace(/\s+/g, " ")
        .trim()
        .slice(0, 100) || "";

    if (
      target.matches(".forecast-result-button") ||
      target.matches(".forecast-sticky-link") ||
      target.matches(".primary-cta") ||
      target.matches(".header-cta")
    ) {
      sendEvent("seo_cta_click", {
        cta_text: text,
        cta_location:
          target.className || "seo_cta",
        destination:
          target.getAttribute("href") || "",
      });
    }

    if (
      target.matches('[data-testid="button-start"]')
    ) {
      sendEvent("forecast_start", {
        button_text: text,
      });
    }
  });
})();
