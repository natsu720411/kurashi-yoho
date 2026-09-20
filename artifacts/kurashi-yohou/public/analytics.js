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

    if (target.matches("[data-home-featured]")) {
      sendEvent("home_feature_click", {
        feature_category:
          target.getAttribute("data-featured-category") || "",
        link_text: text,
        destination:
          target.getAttribute("href") || "",
      });
    }

    if (target.matches("[data-home-tool]")) {
      sendEvent("home_tool_click", {
        link_text: text,
        destination:
          target.getAttribute("href") || "",
      });
    }

    if (target.matches("[data-home-guide]")) {
      sendEvent("home_guide_click", {
        link_text: text,
        destination:
          target.getAttribute("href") || "",
      });
    }

    if (
      normalizePath(window.location.pathname) === "/life-cost-tools/" &&
      target.matches(".tool-card")
    ) {
      sendEvent("tools_hub_click", {
        link_text: text,
        destination:
          target.getAttribute("href") || "",
      });
    }
  });
})();
