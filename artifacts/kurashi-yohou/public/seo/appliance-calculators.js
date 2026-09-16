(function () {
  const APPLIANCES = {
    冷蔵庫: { years: 10, cost: 120000, note: "大きさと省エネ性能で幅があります" },
    洗濯機: { years: 8, cost: 100000, note: "乾燥機能つきは高めです" },
    エアコン: { years: 10, cost: 120000, note: "設置工事費を含む目安です" },
    テレビ: { years: 10, cost: 100000, note: "サイズ別の平均的な目安です" },
    掃除機: { years: 7, cost: 55000, note: "コードレスは電池交換も考慮します" },
    電子レンジ: { years: 10, cost: 45000, note: "オーブン機能つきの平均です" },
    炊飯器: { years: 6, cost: 35000, note: "容量により変わります" },
  };

  const CURRENT_YEAR = new Date().getFullYear();
  const yen = (value) => `${new Intl.NumberFormat("ja-JP").format(Math.round(value))}円`;
  const yenApprox = (value) => `約${yen(value)}`;
  const formatYear = (value) => `${value}年`;

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = CURRENT_YEAR;
  });

  function yearOptions(selectedYear) {
    const selected = Number(selectedYear) || CURRENT_YEAR - 5;
    return Array.from({ length: 41 }, (_, index) => CURRENT_YEAR - index)
      .map((year) => `<option value="${year}"${year === selected ? " selected" : ""}>${year}年</option>`)
      .join("");
  }

  function defaultYear(key, index) {
    const defaults = {
      冷蔵庫: CURRENT_YEAR - 6,
      洗濯機: CURRENT_YEAR - 5,
      エアコン: CURRENT_YEAR - 4,
      テレビ: CURRENT_YEAR - 3,
      掃除機: CURRENT_YEAR - 4,
      電子レンジ: CURRENT_YEAR - 2,
      炊飯器: CURRENT_YEAR - 3,
    };
    return defaults[key] || CURRENT_YEAR - (index + 3);
  }

  function applianceRows(keys, options = {}) {
    const defaultOwned = options.defaultOwned || keys.slice(0, 3);
    return keys
      .map((key, index) => {
        const item = APPLIANCES[key];
        const owned = defaultOwned.includes(key);
        return `<div class="appliance-row">
          <div class="appliance-row-main">
            <span class="appliance-icon" aria-hidden="true">☼</span>
            <span class="appliance-name">${key}</span>
            <label class="owned-toggle"><input type="checkbox" class="appliance-owned" data-key="${key}"${owned ? " checked" : ""} /><span class="toggle-ui"></span><span class="owned-state">${owned ? "持っている" : "持っていない"}</span></label>
          </div>
          <div class="appliance-row-detail">
            <label for="year-${index}-${key}">購入年</label>
            <select id="year-${index}-${key}" class="purchase-year" data-key="${key}" aria-label="${key}の購入年">${yearOptions(defaultYear(key, index))}</select>
            <span class="life-note">目安 ${item.years}年</span>
          </div>
        </div>`;
      })
      .join("");
  }

  function readItems(root, keys) {
    return keys
      .map((key) => {
        const owned = root.querySelector(`.appliance-owned[data-key="${key}"]`);
        const year = root.querySelector(`.purchase-year[data-key="${key}"]`);
        return {
          key,
          owned: Boolean(owned && owned.checked),
          purchaseYear: Number(year && year.value),
          ...APPLIANCES[key],
        };
      })
      .filter((item) => item.owned);
  }

  function syncOwnedLabels(root) {
    root.querySelectorAll(".owned-toggle").forEach((label) => {
      const checkbox = label.querySelector(".appliance-owned");
      const state = label.querySelector(".owned-state");
      if (checkbox && state) state.textContent = checkbox.checked ? "持っている" : "持っていない";
    });
  }

  function nextReplacementYear(item) {
    let year = item.purchaseYear + item.years;
    while (year <= CURRENT_YEAR) year += item.years;
    return year;
  }

  function futureEvents(items, horizon) {
    const events = [];
    items.forEach((item) => {
      let year = nextReplacementYear(item);
      const endYear = CURRENT_YEAR + horizon;
      while (year <= endYear) {
        events.push({ ...item, replacementYear: year });
        year += item.years;
      }
    });
    return events.sort((a, b) => a.replacementYear - b.replacementYear || b.cost - a.cost);
  }

  function resultCard(label, value, note) {
    return `<div class="result-card"><span>${label}</span><strong>${value}</strong>${note ? `<small>${note}</small>` : ""}</div>`;
  }

  function emptyState(message) {
    return `<div class="empty-calculator"><span aria-hidden="true">☁</span><p>${message}</p></div>`;
  }

  function renderSavings(root, keys) {
    root.innerHTML = `<div class="appliance-list">${applianceRows(keys)}</div>
      <div class="calculator-results" aria-live="polite"></div>
      <p class="calculation-note">所有している家電の購入年をもとに、次の買い替え時期から計算します。</p>`;
    const results = root.querySelector(".calculator-results");
    const render = () => {
      syncOwnedLabels(root);
      const items = readItems(root, keys);
      const fiveYearEvents = futureEvents(items, 5);
      const tenYearEvents = futureEvents(items, 10);
      const fiveTotal = fiveYearEvents.reduce((sum, event) => sum + event.cost, 0);
      const tenTotal = tenYearEvents.reduce((sum, event) => sum + event.cost, 0);
      const monthly = fiveTotal / 60;
      const next = items.map((item) => ({ ...item, replacementYear: nextReplacementYear(item) })).sort((a, b) => a.replacementYear - b.replacementYear);
      results.innerHTML = `<div class="result-grid">
        ${resultCard("今後5年間の予想買い替え費用", yen(fiveTotal), "購入予定がない場合は0円")}
        ${resultCard("今後10年間の予想買い替え費用", yen(tenTotal), "買い替えが複数回含まれる場合があります")}
        ${resultCard("これから備えるなら", `毎月 ${yenApprox(monthly)}`, "5年間の合計を60か月で割った目安")}
      </div>
      <div class="next-list"><h3>次回買い替え予想</h3>${next.length ? next.map((item) => `<div class="next-item"><span>${item.key}</span><strong>${formatYear(item.replacementYear)}</strong><em>${yenApprox(item.cost)}</em></div>`).join("") : emptyState("持っている家電を選ぶと予想が表示されます")}</div>`;
    };
    root.addEventListener("change", render);
    render();
  }

  function renderReplacementCost(root, keys) {
    root.innerHTML = `<div class="appliance-list cost-list">${applianceRows(keys, { defaultOwned: ["冷蔵庫", "洗濯機", "エアコン"] })}</div>
      <div class="calculator-results" aria-live="polite"></div>
      <p class="calculation-note">選択した家電の買い替え費用の目安を合計します。</p>`;
    const results = root.querySelector(".calculator-results");
    const render = () => {
      syncOwnedLabels(root);
      const items = readItems(root, keys);
      const total = items.reduce((sum, item) => sum + item.cost, 0);
      results.innerHTML = `<div class="result-grid"><div class="result-card result-card-wide"><span>選択した家電の買い替え費用合計</span><strong>${yen(total)}</strong><small>購入年にかかわらず、目安費用を合計しています</small></div></div>
        <div class="selected-costs">${items.length ? items.map((item) => `<div class="next-item"><span>${item.key}</span><strong>${yen(item.cost)}</strong></div>`).join("") : emptyState("家電を選ぶと合計が表示されます")}</div>`;
    };
    root.addEventListener("change", render);
    render();
  }

  function timelineMarkup(events) {
    if (!events.length) return emptyState("5年以内の買い替え予定はありません");
    return `<div class="forecast-timeline">${events.map((event, index) => `<div class="forecast-event"><div class="forecast-date"><span>${index + 1}</span><strong>${formatYear(event.replacementYear)}</strong></div><div class="forecast-event-body"><span class="forecast-weather" aria-hidden="true">${event.replacementYear % 2 ? "☀" : "☼"}</span><div><strong>${event.key}</strong><small>買い替え費用の目安 ${yenApprox(event.cost)}</small></div></div></div>`).join("")}</div>`;
  }

  function renderFiveYear(root, keys) {
    root.innerHTML = `<div class="appliance-list">${applianceRows(keys)}</div>
      <div class="calculator-results" aria-live="polite"></div>
      <p class="calculation-note">今後5年間に買い替え時期を迎える可能性がある家電を、未来のタイムラインで表示します。</p>`;
    const results = root.querySelector(".calculator-results");
    const render = () => {
      syncOwnedLabels(root);
      const events = futureEvents(readItems(root, keys), 5);
      const total = events.reduce((sum, event) => sum + event.cost, 0);
      results.innerHTML = `<div class="result-grid">
        ${resultCard("5年間合計", yen(total), "買い替え時期の目安をもとに試算")}
        ${resultCard("毎月積立目安", `毎月 ${yenApprox(total / 60)}`, "5年間で備える場合")}
      </div><h3 class="timeline-heading">わが家の家電出費予報</h3>${timelineMarkup(events)}`;
    };
    root.addEventListener("change", render);
    render();
  }

  function renderSingle(root, keys) {
    root.innerHTML = `<div class="appliance-list">${applianceRows(keys, { defaultOwned: ["冷蔵庫", "洗濯機", "電子レンジ", "炊飯器"] })}</div>
      <div class="calculator-results" aria-live="polite"></div>
      <p class="calculation-note">一人暮らしで使う家電を選び、購入後の買い替え費用を期間別に確認します。</p>`;
    const results = root.querySelector(".calculator-results");
    const render = () => {
      syncOwnedLabels(root);
      const items = readItems(root, keys);
      const fiveEvents = futureEvents(items, 5);
      const tenEvents = futureEvents(items, 10);
      const fiveTotal = fiveEvents.reduce((sum, event) => sum + event.cost, 0);
      const tenTotal = tenEvents.reduce((sum, event) => sum + event.cost, 0);
      results.innerHTML = `<div class="result-grid">
        ${resultCard("5年間の買い替え費用", yen(fiveTotal), "購入後の買い替え時期を目安に計算")}
        ${resultCard("10年間の買い替え費用", yen(tenTotal), "長く使う場合の資金計画")}
        ${resultCard("5年間の毎月積立目安", `毎月 ${yenApprox(fiveTotal / 60)}`, "5年間で備える場合")}
      </div>`;
    };
    root.addEventListener("change", render);
    render();
  }

  const calculator = document.querySelector("[data-calculator]");
  const app = document.querySelector("#calculator-app");
  if (!calculator || !app) return;
  const keys = calculator.dataset.appliances
    ? calculator.dataset.appliances.split(",").map((key) => key.trim()).filter((key) => APPLIANCES[key])
    : Object.keys(APPLIANCES);
  const type = calculator.dataset.calculator;
  if (type === "savings") renderSavings(app, keys);
  if (type === "replacement-cost") renderReplacementCost(app, keys);
  if (type === "five-year") renderFiveYear(app, keys);
  if (type === "single") renderSingle(app, keys);
})();
const conversionScript = document.createElement("script");
conversionScript.src = "/seo/conversion-cta.js";
document.body.appendChild(conversionScript);
