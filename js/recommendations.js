import { dom, state } from "./state.js";
import { getCityName } from "./city-lookup.js";
import { fetchRecommendations } from "./gemini-api.js";
import { resetMapZoom, applyFocusDrawZoom } from "./map-zoom.js";
import { redraw } from "./map-render.js";

function showAiLoading() {
  if (!dom.aiLoadingOverlay) return;
  dom.aiLoadingOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function hideAiLoading() {
  if (!dom.aiLoadingOverlay) return;
  dom.aiLoadingOverlay.hidden = true;
  document.body.style.overflow = "";
}

function renderRecCards(items) {
  return items
    .map(
      (item) =>
        `<article class="rec-card">
            <div class="rec-card-head">
              <span class="rec-name">${escapeHtml(item.name)}</span>
              <span class="rec-tag">${escapeHtml(item.tag)}</span>
            </div>
            <p class="rec-desc">${escapeHtml(item.desc)}</p>
          </article>`,
    )
    .join("");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRecError(message) {
  dom.resultBody.innerHTML = `
          <div class="rec-error">${escapeHtml(message)}</div>`;
}

function renderRecContent(data) {
  dom.resultBody.innerHTML = `
          <div class="tab-panel active" data-panel="spots">
            ${data.spots.length ? renderRecCards(data.spots) : '<p class="rec-empty">볼거리 추천이 없습니다.</p>'}
          </div>
          <div class="tab-panel" data-panel="foods">
            ${data.foods.length ? renderRecCards(data.foods) : '<p class="rec-empty">맛집 추천이 없습니다.</p>'}
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
  hideAiLoading();
  state.mapFocusCode = null;
  resetMapZoom();
  dom.mainArea.classList.remove("has-result");
  dom.resultPanel.hidden = true;
  dom.resultIdle.hidden = false;
  redraw();
}

export function openResultPanel(cityCode) {
  const name = getCityName(cityCode);
  if (!name) return;

  const token = ++state.recLoadToken;
  state.mapFocusCode = cityCode;
  dom.resultIdle.hidden = true;
  dom.resultPanel.hidden = false;
  dom.mainArea.classList.add("has-result");
  dom.resultRegion.textContent = name;
  setRecTab("spots");
  dom.resultBody.innerHTML = "";
  showAiLoading();
  applyFocusDrawZoom();

  fetchRecommendations(name)
    .then((data) => {
      if (token !== state.recLoadToken) return;
      hideAiLoading();
      renderRecContent(data);
    })
    .catch((err) => {
      if (token !== state.recLoadToken) return;
      hideAiLoading();
      renderRecError(
        err?.message || "AI와 연결하는 중 문제가 발생했습니다.",
      );
    });
}
