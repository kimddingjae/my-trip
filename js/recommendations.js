import { dom, state } from "./state.js";
import { getCityLabel, getCityName } from "./city-lookup.js";
import { fetchRecommendations } from "./gemini-api.js";
import { resetMapZoom, applyFocusDrawZoom } from "./map-zoom.js";
import { redraw } from "./map-render.js";

let recLoadTimer = null;

function clearRecLoadProgress() {
  if (recLoadTimer !== null) {
    clearInterval(recLoadTimer);
    recLoadTimer = null;
  }
}

function startRecLoadProgress() {
  clearRecLoadProgress();
  const fill = dom.resultBody?.querySelector(".rec-loading-bar-fill");
  if (!fill) return;

  let pct = 0;
  fill.style.width = "0%";
  recLoadTimer = setInterval(() => {
    if (pct < 90) {
      pct += (90 - pct) * 0.06 + 0.4;
      fill.style.width = `${Math.min(pct, 90)}%`;
    }
  }, 100);
}

function finishRecLoadProgress() {
  const fill = dom.resultBody?.querySelector(".rec-loading-bar-fill");
  if (fill) fill.style.width = "100%";
  clearRecLoadProgress();
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

function renderRecLoading() {
  dom.resultBody.innerHTML = `
          <div class="rec-loading">
            <div class="rec-loading-msg">AI가 맛집과 여행지를 찾고 있습니다…</div>
            <div class="rec-loading-bar" role="progressbar" aria-label="AI 추천 로딩 중">
              <div class="rec-loading-bar-fill"></div>
            </div>
            <div class="rec-skeleton"></div>
            <div class="rec-skeleton"></div>
            <div class="rec-skeleton"></div>
          </div>`;
  startRecLoadProgress();
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
  clearRecLoadProgress();
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
  renderRecLoading();
  applyFocusDrawZoom();

  fetchRecommendations(name)
    .then((data) => {
      if (token !== state.recLoadToken) return;
      finishRecLoadProgress();
      renderRecContent(data);
    })
    .catch((err) => {
      if (token !== state.recLoadToken) return;
      clearRecLoadProgress();
      renderRecError(
        err?.message || "AI와 연결하는 중 문제가 발생했습니다.",
      );
    });
}
