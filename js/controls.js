import { PROV_NAMES, regions, sigun, visitedCodes } from "./city.js";
import { dom, state } from "./state.js";
import { highlightSelection, selectByCode, redraw } from "./map-render.js";
import {
  collapseResultPanel,
  openResultPanel,
} from "./recommendations.js";

const visitedSet = new Set(visitedCodes);
const selectedProvs = new Set();
let spinLabel = null;

const PROV_SHORT = {
  11: "서울",
  21: "부산",
  22: "대구",
  23: "인천",
  24: "광주",
  25: "대전",
  26: "울산",
  29: "세종",
  41: "경기",
  42: "강원",
  43: "충북",
  44: "충남",
  45: "전북",
  46: "전남",
  47: "경북",
  48: "경남",
};

function fillCitySelect(provCodes) {
  dom.citySel.innerHTML = '<option value="">시/군/구</option>';
  provCodes.forEach((provCode) => {
    getAvailableCities(provCode).forEach((c) => {
      const o = document.createElement("option");
      o.value = c.code;
      o.textContent = c.label;
      dom.citySel.appendChild(o);
    });
  });
}

function getAvailableCities(provCode) {
  return (sigun[provCode] || []).filter(
    (city) => !visitedSet.has(city.code),
  );
}

function availableProvCodes() {
  return regions.filter((code) => getAvailableCities(code).length);
}

function selectedCodes() {
  return regions.filter((code) => selectedProvs.has(code));
}

function pickFrom(codes) {
  const available = codes.filter((code) => getAvailableCities(code).length);
  if (!available.length) return null;
  return available[Math.floor(Math.random() * available.length)];
}

function pickRandomCity(provCode) {
  const cities = getAvailableCities(provCode);
  if (!cities.length) return null;
  return cities[Math.floor(Math.random() * cities.length)];
}

function selectionLabel() {
  if (spinLabel != null) return spinLabel;
  const codes = selectedCodes();
  if (!codes.length) return "전국";
  if (codes.length === 1) return PROV_NAMES[codes[0]] ?? codes[0];
  const names = codes.map((code) => PROV_SHORT[code] ?? PROV_NAMES[code] ?? code);
  if (names.length === 2) return names.join(", ");
  return `${names[0]}, ${names[1]} 외 ${names.length - 2}`;
}

function renderProvLabel() {
  if (!dom.provLabel || !dom.provTrigger) return;
  const label = selectionLabel();
  dom.provLabel.textContent = label;
  if (spinLabel != null) {
    dom.provTrigger.title = label;
    return;
  }
  const full = selectedCodes()
    .map((code) => PROV_NAMES[code] ?? code)
    .join(", ");
  dom.provTrigger.title = full || "전국";
}

function paintProvOptions() {
  if (!dom.provPanel) return;
  dom.provPanel.querySelectorAll(".multi-combo-option").forEach((row) => {
    const code = row.dataset.code || "";
    const selected =
      code === "" ? selectedProvs.size === 0 : selectedProvs.has(code);
    row.setAttribute("aria-selected", selected ? "true" : "false");
  });
}

function onProvFilterChange() {
  paintProvOptions();
  renderProvLabel();
  fillCitySelect(selectedCodes());
  dom.citySel.value = "";
  selectByCode(null);
  collapseResultPanel();
}

function setNationwide() {
  if (!selectedProvs.size) return;
  selectedProvs.clear();
  onProvFilterChange();
}

function toggleProv(code) {
  if (selectedProvs.has(code)) selectedProvs.delete(code);
  else selectedProvs.add(code);
  onProvFilterChange();
}

function makeOption(code, label) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "multi-combo-option";
  row.setAttribute("role", "option");
  row.dataset.code = code;
  const check = document.createElement("span");
  check.className = "multi-combo-check";
  check.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = label;
  row.append(check, text);
  row.addEventListener("click", (event) => {
    event.stopPropagation();
    if (state.spinning) return;
    if (code === "") setNationwide();
    else toggleProv(code);
  });
  return row;
}

function buildProvOptions() {
  dom.provPanel.replaceChildren();
  dom.provPanel.append(makeOption("", "전국"));
  const divider = document.createElement("div");
  divider.className = "multi-combo-divider";
  dom.provPanel.append(divider);
  availableProvCodes().forEach((code) => {
    dom.provPanel.append(makeOption(code, PROV_NAMES[code] ?? code));
  });
  paintProvOptions();
}

function setProvOpen(open) {
  if (!dom.provPanel || !dom.provTrigger) return;
  dom.provPanel.hidden = !open;
  dom.provTrigger.classList.toggle("open", open);
  dom.provTrigger.setAttribute("aria-expanded", open ? "true" : "false");
}

function commitDrawnProv(code) {
  selectedProvs.clear();
  if (code) selectedProvs.add(code);
  spinLabel = null;
  paintProvOptions();
  fillCitySelect(code ? [code] : []);
  renderProvLabel();
}

export function initControls() {
  if (!dom.provTrigger || !dom.provPanel || !dom.citySel) return;

  if (dom.visitCount) {
    dom.visitCount.textContent = String(visitedCodes.length);
  }

  buildProvOptions();
  renderProvLabel();

  dom.provTrigger.addEventListener("click", (event) => {
    event.stopPropagation();
    if (state.spinning) return;
    setProvOpen(dom.provPanel.hidden);
  });

  dom.provPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => setProvOpen(false));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setProvOpen(false);
  });

  document.getElementById("random-btn").addEventListener("click", () => {
    if (state.spinning) return;
    const lockedProvs = selectedCodes();
    const pool = lockedProvs.length ? lockedProvs : regions;
    if (!pickFrom(pool)) {
      alert(
        lockedProvs.length
          ? "선택한 지역에 추첨 가능한 미방문 시/군/구가 없습니다."
          : "추첨 가능한 미방문 지역이 없습니다.",
      );
      return;
    }

    state.spinning = true;
    setProvOpen(false);
    dom.provTrigger.disabled = true;
    const btn = document.getElementById("random-btn");
    btn.style.animation = "spin 0.4s linear infinite";

    selectByCode(null);
    collapseResultPanel();
    if (lockedProvs.length) fillCitySelect(lockedProvs);

    let finalProv = pickFrom(pool);
    let finalCity = pickRandomCity(finalProv)?.code || "";

    const duration = 1000;
    const startTime = Date.now();

    function finishSpin() {
      spinLabel = null;
      if (!lockedProvs.length) commitDrawnProv(finalProv);
      else renderProvLabel();
      dom.citySel.value = finalCity;
      openResultPanel(finalCity);
      highlightSelection();
      btn.style.animation = "";
      dom.provTrigger.disabled = false;
      state.spinning = false;
    }

    function tick() {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        finishSpin();
        return;
      }

      const spinProv = pickFrom(pool);
      if (spinProv && (!lockedProvs.length || lockedProvs.length > 1)) {
        spinLabel = PROV_NAMES[spinProv] ?? spinProv;
        renderProvLabel();
      }
      if (!lockedProvs.length && spinProv) fillCitySelect([spinProv]);
      const spinCity = spinProv && pickRandomCity(spinProv);
      if (spinCity) dom.citySel.value = spinCity.code;

      setTimeout(tick, 60 + Math.pow(elapsed / duration, 2) * 340);
    }
    tick();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (state.spinning) return;
    selectedProvs.clear();
    spinLabel = null;
    setProvOpen(false);
    paintProvOptions();
    renderProvLabel();
    fillCitySelect([]);
    selectByCode(null);
    collapseResultPanel();
    redraw();
  });

  window.addEventListener("resize", redraw);
}

export function initDomRefs() {
  dom.provTrigger = document.getElementById("prov-sel");
  dom.provPanel = document.getElementById("prov-panel");
  dom.provLabel = document.getElementById("prov-label");
  dom.citySel = document.getElementById("city-sel");
  dom.mainArea = document.getElementById("main-area");
  dom.resultIdle = document.getElementById("result-idle");
  dom.resultPanel = document.getElementById("result-panel");
  dom.resultRegion = document.getElementById("result-region");
  dom.resultBody = document.getElementById("result-body");
  dom.resultTabs = dom.resultPanel?.querySelectorAll(".result-tab") ?? [];
  dom.travelHints = document.getElementById("travel-hints");
  dom.aiLoadingOverlay = document.getElementById("ai-loading-overlay");
  dom.visitCount = document.getElementById("visit-count");
}
