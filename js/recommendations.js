import { FOOD_TEMPLATES, SPOT_TEMPLATES } from "./constants.js";
import { dom, state } from "./state.js";
import { getCityLabel, getCityName } from "./city-lookup.js";
import { resetMapZoom, applyFocusDrawZoom } from "./map-zoom.js";
import { redraw } from "./map-render.js";

function mockRecommendations(label) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        spots: SPOT_TEMPLATES.map((t) => ({
          name: `${label} ${t.suffix}`,
          desc: t.desc,
          tag: t.tag,
        })),
        foods: FOOD_TEMPLATES.map((t) => ({
          name: `${label} ${t.suffix}`,
          desc: t.desc,
          tag: t.tag,
        })),
      });
    }, 1400);
  });
}

function renderRecCards(items) {
  return items
    .map(
      (item) =>
        `<article class="rec-card">
            <div class="rec-card-head">
              <span class="rec-name">${item.name}</span>
              <span class="rec-tag">${item.tag}</span>
            </div>
            <p class="rec-desc">${item.desc}</p>
          </article>`,
    )
    .join("");
}

function renderRecLoading() {
  dom.resultBody.innerHTML = `
          <div class="rec-loading-msg">추천 준비 중…</div>
          <div class="rec-skeleton"></div>
          <div class="rec-skeleton"></div>
          <div class="rec-skeleton"></div>`;
}

function renderRecContent(data) {
  dom.resultBody.innerHTML = `
          <div class="tab-panel active" data-panel="spots">
            ${renderRecCards(data.spots)}
          </div>
          <div class="tab-panel" data-panel="foods">
            ${renderRecCards(data.foods)}
          </div>`;
}

function setRecTab(tab) {
  dom.resultTabs.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  dom.resultBody.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tab);
  });
}

export function initRecommendations() {
  dom.resultTabs.forEach((btn) => {
    btn.addEventListener("click", () => setRecTab(btn.dataset.tab));
  });
}

export function collapseResultPanel() {
  state.recLoadToken++;
  state.mapFocusCode = null;
  resetMapZoom();
  dom.mainArea.classList.remove("has-result");
  dom.resultPanel.hidden = true;
  dom.resultIdle.hidden = false;
  redraw();
}

export function openResultPanel(cityCode) {
  const name = getCityName(cityCode);
  const label = getCityLabel(cityCode);
  if (!name) return;

  const token = ++state.recLoadToken;
  state.mapFocusCode = cityCode;
  dom.resultIdle.hidden = true;
  dom.resultPanel.hidden = false;
  dom.mainArea.classList.add("has-result");
  dom.resultRegion.textContent = name;
  setRecTab("spots");
  renderRecLoading();
  applyFocusDrawZoom();

  mockRecommendations(label).then((data) => {
    if (token !== state.recLoadToken) return;
    renderRecContent(data);
  });
}
