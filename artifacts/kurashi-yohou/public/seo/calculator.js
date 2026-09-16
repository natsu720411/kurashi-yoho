(function () {
  const root = document.querySelector("[data-lifespan]");
  const select = document.querySelector("#purchase-year");
  const yearOutput = document.querySelector("#replacement-year");
  const detailOutput = document.querySelector("#replacement-detail");
  if (!root || !select || !yearOutput || !detailOutput) return;

  const lifespan = Number(root.dataset.lifespan);
  const cost = Number(root.dataset.cost);
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year >= currentYear - 40; year -= 1) {
    const option = document.createElement("option");
    option.value = String(year);
    option.textContent = `${year}年`;
    if (year === currentYear - 6) option.selected = true;
    select.appendChild(option);
  }

  const formatYen = (value) => `約${new Intl.NumberFormat("ja-JP").format(value)}円`;

  const render = () => {
    const purchaseYear = Number(select.value);
    const replacementYear = purchaseYear + lifespan;
    const yearsRemaining = replacementYear - currentYear;
    yearOutput.textContent = `${replacementYear}年ごろ`;
    detailOutput.textContent =
      yearsRemaining <= 0
        ? "買い替え時期が近づいている可能性があります"
        : `現在からあと約${yearsRemaining}年`;
    document.querySelector("#replacement-cost").textContent = formatYen(cost);
  };

  select.addEventListener("change", render);
  render();
})();
const conversionScript = document.createElement("script");
conversionScript.src = "/seo/conversion-cta.js";
document.body.appendChild(conversionScript);
