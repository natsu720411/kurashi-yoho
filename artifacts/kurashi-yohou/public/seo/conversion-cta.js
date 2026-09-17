(function () {
  if (document.documentElement.dataset.forecastCtaReady === "true") return;
  document.documentElement.dataset.forecastCtaReady = "true";

  const normalizePath = (value) => {
    const withoutIndex = value.replace(/index\.html$/, "");
    return withoutIndex.endsWith("/") ? withoutIndex : `${withoutIndex}/`;
  };

  const path = normalizePath(window.location.pathname);

  const configs = {
    "/refrigerator-lifespan/": {
      description:
        "冷蔵庫だけでなく、洗濯機・エアコン・車検・保険なども同じ時期に重なるかもしれません。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "冷蔵庫以外の買い替えもまとめて予報",
    },

    "/washing-machine-lifespan/": {
      description:
        "洗濯機だけでなく、冷蔵庫・エアコン・車検・保険なども同じ時期に重なるかもしれません。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "洗濯機以外の買い替えもまとめて予報",
    },

    "/aircon-lifespan/": {
      description:
        "エアコンだけでなく、冷蔵庫・洗濯機・車検・保険なども同じ時期に重なるかもしれません。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "家電全体の買い替え時期を予報",
    },

    "/appliance-savings-calculator/": {
      description:
        "家電の積立額だけでなく、車検・保険・定期支出なども同じ時期に重なるかもしれません。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "家電＋車検なども含めて積立額を予報",
    },

    "/appliance-replacement-cost/": {
      description:
        "家電の買い替え費用だけでなく、車検・保険・定期支出まで合わせると、必要なお金は変わります。くらし予報なら、わが家全体の予定をまとめて予報できます。",
      button: "家電＋車検などもまとめて予報",
    },

    "/appliance-5year-cost/": {
      description:
        "家電の5年間だけでなく、車検・保険・定期支出も同じタイムラインに重なるかもしれません。くらし予報なら、わが家全体の5年間をまとめて確認できます。",
      button: "わが家全体の5年間を予報",
    },

    "/single-appliance-cost/": {
      description:
        "一人暮らしでも、家電に加えて車検や保険、定期支出などの予定が重なることがあります。くらし予報なら、これからの出費をひとつにまとめて見通せます。",
      button: "一人暮らしの未来の出費をまとめて予報",
    },
           "/car-inspection-when/": {
      heading: "車検だけで大丈夫？",
      description:
        "車検だけでなく、冷蔵庫・洗濯機・エアコン・保険なども同じ時期に重なるかもしれません。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "車検＋家電などもまとめて予報",
    },

    "/car-insurance-renewal/": {
      heading: "自動車保険だけで大丈夫？",
      description:
        "自動車保険だけでなく、車検・家電の買い替え・定期支出なども同じ時期に重なるかもしれません。くらし予報なら、これからの出費をまとめて予報できます。",
      button: "保険＋車検＋家電もまとめて予報",
    },
        "/car-annual-cost/": {
      heading: "車の維持費だけで大丈夫？",
      description:
        "車の維持費に加えて、家電の買い替えや保険、その他の定期支出も重なることがあります。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "車＋家電などもまとめて予報",
    },
        "/water-heater-replacement-cost/": {
      heading: "給湯器だけで大丈夫？",
      description:
        "給湯器だけでなく、冷蔵庫・洗濯機・エアコン・車検などの出費も同じ時期に重なることがあります。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "住宅設備＋家電などもまとめて予報",
    },
        "/ecocute-replacement-cost/": {
      heading: "エコキュートだけで大丈夫？",
      description:
        "エコキュートだけでなく、給湯器・家電・車検などの出費も同じ時期に重なることがあります。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "住宅設備＋家電などもまとめて予報",
    },
        "/toilet-replacement-cost/": {
      heading: "トイレの出費だけで大丈夫？",
      description:
        "トイレの交換・リフォームだけでなく、給湯器・エコキュート・家電・車検などの出費も同じ時期に重なることがあります。くらし予報なら、これから1年・3年・5年の出費をまとめて予報できます。",
      button: "住宅設備＋家電などもまとめて予報",
    },
  };

  const config = configs[path];
  if (!config) return;

  const style = document.createElement("style");
  style.textContent = `
    .forecast-result-cta {
      align-items: center;
      background: linear-gradient(135deg, #fff9e8 0%, #eef9f7 100%);
      border: 1px solid #e7d8a8;
      border-radius: 22px;
      box-shadow: 0 10px 30px rgba(23, 93, 104, .08);
      display: grid;
      gap: 18px;
      grid-template-columns: auto minmax(0, 1fr) auto;
      margin-top: 24px;
      padding: 22px;
    }

    .forecast-result-cta-icon {
      align-items: center;
      background: #175d68;
      border-radius: 16px;
      color: #ffdc78;
      display: inline-flex;
      font-size: 24px;
      height: 52px;
      justify-content: center;
      width: 52px;
    }

    .forecast-result-cta h2 {
      color: #174f5b;
      font-size: 19px;
      line-height: 1.35;
      margin: 0 0 5px;
    }

    .forecast-result-cta p {
      color: #617b80;
      font-size: 13px;
      line-height: 1.75;
      margin: 0;
    }

    .forecast-result-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      margin-top: 10px;
    }

    .forecast-result-meta span {
      background: rgba(255,255,255,.85);
      border: 1px solid #d6e8e5;
      border-radius: 999px;
      color: #4d7478;
      font-size: 11px;
      font-weight: 800;
      padding: 4px 9px;
    }

    .forecast-result-button,
    .forecast-sticky-link {
      align-items: center;
      background: #175d68;
      border-radius: 14px;
      color: #fff;
      display: inline-flex;
      font-weight: 800;
      justify-content: center;
      min-height: 48px;
      padding: 10px 18px;
      text-align: center;
      text-decoration: none;
    }

    .forecast-result-button {
      font-size: 13px;
      max-width: 250px;
    }

    .forecast-result-button:hover,
    .forecast-sticky-link:hover {
      background: #0d4953;
    }

    .forecast-result-button:focus-visible,
    .forecast-sticky-link:focus-visible,
    .forecast-sticky-close:focus-visible {
      outline: 3px solid rgba(245,185,77,.65);
      outline-offset: 3px;
    }

    .forecast-capabilities {
      background: #fff;
      border: 1px solid #d5e8e5;
      border-radius: 22px;
      box-shadow: 0 8px 26px rgba(48,111,121,.06);
      padding: clamp(22px, 4vw, 34px);
    }

    .forecast-capabilities-kicker {
      color: #b17a26 !important;
      font-size: 11px !important;
      font-weight: 900;
      letter-spacing: .12em;
      margin-bottom: 6px;
    }

    .forecast-capabilities > h2 {
      margin-bottom: 18px;
    }

    .forecast-capabilities-grid {
      display: grid;
      gap: 12px;
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .forecast-capability {
      background: #eef8f7;
      border-radius: 16px;
      padding: 16px;
    }

    .forecast-capability strong {
      color: #175d68;
      display: block;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .forecast-capability span {
      color: #617b80;
      display: block;
      font-size: 12px;
      line-height: 1.6;
    }

    .forecast-sticky-cta {
      display: none;
    }

    @media (max-width: 720px) {
      body.forecast-sticky-active {
        padding-bottom: 92px;
      }

      .forecast-result-cta {
        align-items: flex-start;
        grid-template-columns: auto 1fr;
        padding: 18px;
      }

      .forecast-result-cta-icon {
        height: 44px;
        width: 44px;
      }

      .forecast-result-button {
        grid-column: 1 / -1;
        max-width: none;
        width: 100%;
      }

      .forecast-capabilities-grid {
        grid-template-columns: 1fr;
      }

      .forecast-sticky-cta {
        align-items: center;
        background: rgba(255,255,255,.97);
        border: 1px solid #cfe4e1;
        border-radius: 18px 18px 0 0;
        bottom: 0;
        box-shadow: 0 -10px 30px rgba(23,93,104,.13);
        display: grid;
        gap: 10px;
        grid-template-columns: minmax(0,1fr) auto;
        left: 0;
        padding: 10px 48px 10px 14px;
        position: fixed;
        right: 0;
        z-index: 50;
      }

      .forecast-sticky-copy strong,
      .forecast-sticky-copy small {
        display: block;
      }

      .forecast-sticky-copy strong {
        color: #174f5b;
        font-size: 12px;
      }

      .forecast-sticky-copy small {
        color: #6c8588;
        font-size: 10px;
        margin-top: 2px;
      }

      .forecast-sticky-link {
        font-size: 12px;
        min-height: 44px;
        padding: 8px 12px;
      }

      .forecast-sticky-close {
        align-items: center;
        background: #edf5f4;
        border: 0;
        border-radius: 999px;
        color: #537579;
        cursor: pointer;
        display: inline-flex;
        font-size: 17px;
        height: 30px;
        justify-content: center;
        padding: 0;
        position: absolute;
        right: 9px;
        top: 8px;
        width: 30px;
      }
    }
  `;

  document.head.appendChild(style);

  const calculator = document.querySelector("#calculator");
  const article = document.querySelector("article");

  if (!calculator || !article) return;

  const cta = document.createElement("section");
  cta.className = "forecast-result-cta";

  cta.innerHTML = `
    <span class="forecast-result-cta-icon" aria-hidden="true">☀</span>

    <div>
      <h2>${config.heading || "この家電だけで大丈夫？"}</h2>

      <p>${config.description}</p>

      <div class="forecast-result-meta">
        <span>無料</span>
        <span>登録不要</span>
        <span>約3分</span>
      </div>
    </div>

    <a class="forecast-result-button" href="/">
      ${config.button}
    </a>
  `;

  const calculatorAnchor =
    calculator.closest(".content-grid") || calculator;

  calculatorAnchor.insertAdjacentElement("afterend", cta);

  const capabilities = document.createElement("section");

  capabilities.className =
    "section forecast-capabilities";

  capabilities.innerHTML = `
    <p class="forecast-capabilities-kicker">
      くらし予報でできること
    </p>

    <h2>
      バラバラな予定を、1つの未来予報に。
    </h2>

    <div class="forecast-capabilities-grid">

      <div class="forecast-capability">
        <strong>① 家電の買い替え</strong>
        <span>冷蔵庫・洗濯機・エアコンなど</span>
      </div>

      <div class="forecast-capability">
        <strong>② 車の予定</strong>
        <span>車検・保険など</span>
      </div>

      <div class="forecast-capability">
        <strong>③ 定期的な支出</strong>
        <span>自分で予定を追加</span>
      </div>

    </div>
  `;

  const ctas = article.querySelectorAll(".cta-card");
  const lastCta = ctas[ctas.length - 1];

  if (lastCta && lastCta.parentNode) {
    lastCta.parentNode.insertBefore(
      capabilities,
      lastCta
    );
  } else {
    article.appendChild(capabilities);
  }

  const storageKey =
    `kurashi-forecast-sticky-closed:${path}`;

  let dismissed = false;

  try {
    dismissed =
      sessionStorage.getItem(storageKey) === "1";
  } catch (_) {}

  if (!dismissed) {
    const sticky =
      document.createElement("aside");

    sticky.className =
      "forecast-sticky-cta";

    sticky.innerHTML = `
      <div class="forecast-sticky-copy">
        <strong>わが家の出費を予報する</strong>
        <small>無料・登録不要</small>
      </div>

      <a class="forecast-sticky-link" href="/">
        予報をつくる
      </a>

      <button
        class="forecast-sticky-close"
        type="button"
        aria-label="この案内を閉じる"
      >
        ×
      </button>
    `;

    document.body.appendChild(sticky);

    document.body.classList.add(
      "forecast-sticky-active"
    );

    sticky
      .querySelector(".forecast-sticky-close")
      .addEventListener("click", function () {

        try {
          sessionStorage.setItem(
            storageKey,
            "1"
          );
        } catch (_) {}

        document.body.classList.remove(
          "forecast-sticky-active"
        );

        sticky.remove();
      });
  }
    const relatedLinks = document.querySelector(".related-links");

  if (
    relatedLinks &&
    path !== "/car-inspection-when/" &&
    !relatedLinks.querySelector('a[href="/car-inspection-when/"]')
  ) {
    const carLink = document.createElement("a");
    carLink.href = "/car-inspection-when/";
    carLink.textContent = "次の車検時期・積立額を計算";
    relatedLinks.appendChild(carLink);
  }
    if (
    relatedLinks &&
    path !== "/car-insurance-renewal/" &&
    !relatedLinks.querySelector('a[href="/car-insurance-renewal/"]')
  ) {
    const insuranceLink = document.createElement("a");
    insuranceLink.href = "/car-insurance-renewal/";
    insuranceLink.textContent = "自動車保険の更新日・積立額を計算";
    relatedLinks.appendChild(insuranceLink);
  }
    if (
    relatedLinks &&
    path !== "/car-annual-cost/" &&
    !relatedLinks.querySelector('a[href="/car-annual-cost/"]')
  ) {
    const annualCostLink = document.createElement("a");
    annualCostLink.href = "/car-annual-cost/";
    annualCostLink.textContent = "車の年間維持費を計算";
    relatedLinks.appendChild(annualCostLink);
  }
    if (
    relatedLinks &&
    path !== "/water-heater-replacement-cost/" &&
    !relatedLinks.querySelector('a[href="/water-heater-replacement-cost/"]')
  ) {
    const waterHeaterLink = document.createElement("a");
    waterHeaterLink.href = "/water-heater-replacement-cost/";
    waterHeaterLink.textContent = "給湯器の交換費用・積立額を計算";
    relatedLinks.appendChild(waterHeaterLink);
  }
    if (
    relatedLinks &&
    path !== "/ecocute-replacement-cost/" &&
    !relatedLinks.querySelector('a[href="/ecocute-replacement-cost/"]')
  ) {
    const ecocuteLink = document.createElement("a");
    ecocuteLink.href = "/ecocute-replacement-cost/";
    ecocuteLink.textContent = "エコキュートの交換費用・積立額を計算";
    relatedLinks.appendChild(ecocuteLink);
  }
    if (
    relatedLinks &&
    path !== "/toilet-replacement-cost/" &&
    !relatedLinks.querySelector('a[href="/toilet-replacement-cost/"]')
  ) {
    const toiletLink = document.createElement("a");
    toiletLink.href = "/toilet-replacement-cost/";
    toiletLink.textContent = "トイレ交換・リフォーム費用を計算";
    relatedLinks.appendChild(toiletLink);
  }
    if (
    relatedLinks &&
    !relatedLinks.querySelector('a[href="/life-cost-tools/"]')
  ) {
    const toolsLink = document.createElement("a");
    toolsLink.href = "/life-cost-tools/";
    toolsLink.textContent = "暮らしの出費計算ツール一覧";
    relatedLinks.appendChild(toolsLink);
  }
    const footerInner = document.querySelector(".seo-footer-inner");

  if (
    footerInner &&
    !footerInner.querySelector('a[href="/privacy-policy/"]')
  ) {
    const privacyLink = document.createElement("a");
    privacyLink.href = "/privacy-policy/";
    privacyLink.textContent = "プライバシーポリシー";
    footerInner.appendChild(privacyLink);
  }
})();
const analyticsScript = document.createElement("script");
analyticsScript.src = "/analytics.js";
document.body.appendChild(analyticsScript);
