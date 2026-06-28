import { PROV_NAMES, regions, sigun } from "./city.js";
import { dom, state } from "./state.js";
import { highlightSelection, selectByCode, redraw } from "./map-render.js";
import {
  collapseResultPanel,
  openResultPanel,
} from "./recommendations.js";

function fillCitySelect(provCode) {
  dom.citySel.innerHTML = '<option value="">시/군/구</option>';
  if (provCode && sigun[provCode]) {
    sigun[provCode].forEach((c) => {
      const o = document.createElement("option");
      o.value = c.code;
      o.textContent = c.label;
      dom.citySel.appendChild(o);
    });
  }
}

function pickRandomCity(provCode) {
  const cities = sigun[provCode] || [];
  if (!cities.length) return null;
  return cities[Math.floor(Math.random() * cities.length)];
}

export function initControls() {
  regions.forEach((code) => {
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
    if (lockedProv && !(sigun[lockedProv]?.length)) {
      alert("선택한 지역에 시/군이 없습니다.");
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
      finalProv = regions[Math.floor(Math.random() * regions.length)];
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
        const rProv = regions[Math.floor(Math.random() * regions.length)];
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
  dom.resultTabs = dom.resultPanel.querySelectorAll(".result-tab");
  dom.cntEl = document.getElementById("cnt");
  dom.cntEl.textContent = state.visitCodes.size;
  dom.aiLoadingOverlay = document.getElementById("ai-loading-overlay");
}
