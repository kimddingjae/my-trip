import { PROV_NAMES, regions, sigun, visitedCodes } from "./city.js";
import { dom, state } from "./state.js";
import { highlightSelection, selectByCode, redraw } from "./map-render.js";
import {
  collapseResultPanel,
  openResultPanel,
} from "./recommendations.js";

const visitedSet = new Set(visitedCodes);

function fillCitySelect(provCode) {
  dom.citySel.innerHTML = '<option value="">시/군/구</option>';
  if (provCode && sigun[provCode]) {
    getAvailableCities(provCode).forEach((c) => {
      const o = document.createElement("option");
      o.value = c.code;
      o.textContent = c.label;
      dom.citySel.appendChild(o);
    });
  }
}

function getAvailableCities(provCode) {
  return (sigun[provCode] || []).filter(
    (city) => !visitedSet.has(city.code),
  );
}

function pickRandomCity(provCode) {
  const cities = getAvailableCities(provCode);
  if (!cities.length) return null;
  return cities[Math.floor(Math.random() * cities.length)];
}

function pickRandomProv() {
  const availableRegions = regions.filter(
    (code) => getAvailableCities(code).length,
  );
  if (!availableRegions.length) return null;
  return availableRegions[Math.floor(Math.random() * availableRegions.length)];
}

export function initControls() {
  if (!dom.provSel || !dom.citySel) return;

  if (dom.visitCount) {
    dom.visitCount.textContent = String(visitedCodes.length);
  }

  regions
    .filter((code) => getAvailableCities(code).length)
    .forEach((code) => {
    const o = document.createElement("option");
    o.value = code;
    o.textContent = PROV_NAMES[code] ?? code;
    dom.provSel.appendChild(o);
    });

  dom.provSel.addEventListener("change", () => {
    fillCitySelect(dom.provSel.value);
    selectByCode(null);
    collapseResultPanel();
  });

  document.getElementById("random-btn").addEventListener("click", () => {
    if (state.spinning) return;
    state.spinning = true;
    const btn = document.getElementById("random-btn");
    btn.style.animation = "spin 0.4s linear infinite";

    selectByCode(null);
    collapseResultPanel();

    const lockedProv = dom.provSel.value;
    if (lockedProv && !getAvailableCities(lockedProv).length) {
      alert("선택한 지역에 추첨 가능한 미방문 시/군/구가 없습니다.");
      btn.style.animation = "";
      state.spinning = false;
      return;
    }

    let finalProv;
    let finalCity;
    if (lockedProv) {
      finalProv = lockedProv;
      finalCity = pickRandomCity(lockedProv)?.code || "";
    } else {
      finalProv = pickRandomProv();
      if (!finalProv) {
        alert("추첨 가능한 미방문 지역이 없습니다.");
        btn.style.animation = "";
        state.spinning = false;
        return;
      }
      finalCity = pickRandomCity(finalProv)?.code || "";
    }

    const duration = 1000;
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        if (!lockedProv) {
          dom.provSel.value = finalProv;
          fillCitySelect(finalProv);
        }
        dom.citySel.value = finalCity;
        openResultPanel(finalCity);
        highlightSelection();
        btn.style.animation = "";
        state.spinning = false;
        return;
      }

      if (lockedProv) {
        const spinCity = pickRandomCity(lockedProv);
        if (spinCity) dom.citySel.value = spinCity.code;
      } else {
        const rProv = pickRandomProv();
        if (!rProv) return;
        const rCity = pickRandomCity(rProv);
        dom.provSel.value = rProv;
        fillCitySelect(rProv);
        if (rCity) dom.citySel.value = rCity.code;
      }

      setTimeout(tick, 60 + Math.pow(elapsed / duration, 2) * 340);
    }
    tick();
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    dom.provSel.value = "";
    fillCitySelect("");
    selectByCode(null);
    collapseResultPanel();
    redraw();
  });

  window.addEventListener("resize", redraw);
}

export function initDomRefs() {
  dom.provSel = document.getElementById("prov-sel");
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
