import { getCode } from "./geo-helpers.js";
import { dom, state } from "./state.js";

const TRAVEL_URL = "https://trip-backend-sable.vercel.app/api/travel";

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("이 브라우저는 위치 정보를 지원하지 않습니다."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12000,
      maximumAge: 300000,
    });
  });
}

function getDestinationLngLat(cityCode) {
  const feats = state.allFeatures.filter((f) => getCode(f) === cityCode);
  if (!feats.length) return null;
  const center = turf.centroid(turf.featureCollection(feats));
  return center.geometry.coordinates;
}

export async function loadTravelHints(cityCode) {
  const dest = getDestinationLngLat(cityCode);
  if (!dest) throw new Error("목적지 좌표를 찾을 수 없습니다.");

  const pos = await getCurrentPosition();
  const originLng = pos.coords.longitude;
  const originLat = pos.coords.latitude;

  const res = await fetch(TRAVEL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      originLng,
      originLat,
      destLng: dest[0],
      destLat: dest[1],
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "교통 정보를 가져오지 못했습니다.");
  }

  return {
    originLabel: data.originLabel || "현재 위치",
    hints: data.hints || [],
    transitNote: data.transitNote || null,
  };
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function travelHintsInner() {
  return dom.travelHints?.querySelector(".travel-hints-inner");
}

function setTravelSummary(text) {
  const summary = dom.travelHints?.querySelector(".travel-hints-summary");
  if (summary) summary.textContent = text;
}

function formatHintsSummary(hints) {
  if (!hints.length) return "🧭 교통 힌트";
  const car = hints.find((h) => h.label === "자차");
  const primary = car || hints[0];
  const extra = hints.length > 1 ? ` 외 ${hints.length - 1}건` : "";
  return `🧭 ${primary.icon} ${primary.time} · ${primary.distance}${extra}`;
}

function renderHintRows(hints) {
  if (!hints.length) {
    return '<p class="travel-hints-msg">대중교통 경로를 찾지 못했습니다.</p>';
  }
  return hints
    .map(
      (h) => `
        <div class="travel-hint-row">
          <span class="travel-hint-icon" aria-hidden="true">${h.icon}</span>
          <span class="travel-hint-label">${escapeHtml(h.label)}</span>
          <span class="travel-hint-time">${escapeHtml(h.time)}</span>
          <span class="travel-hint-dist">${escapeHtml(h.distance)}</span>
          ${h.note ? `<span class="travel-hint-note">${escapeHtml(h.note)}</span>` : ""}
        </div>`,
    )
    .join("");
}

export function renderTravelHintsLoading() {
  if (!dom.travelHints) return;
  dom.travelHints.hidden = false;
  dom.travelHints.open = true;
  setTravelSummary("🧭 경로 조회 중…");
  const inner = travelHintsInner();
  if (inner) inner.innerHTML = '<p class="travel-hints-msg">잠시만 기다려 주세요.</p>';
}

export function renderTravelHints({ originLabel, hints, transitNote }) {
  if (!dom.travelHints) return;
  dom.travelHints.hidden = false;
  dom.travelHints.open = false;
  setTravelSummary(formatHintsSummary(hints));
  const inner = travelHintsInner();
  if (!inner) return;
  inner.innerHTML = `
    <p class="travel-hints-origin">출발 · ${escapeHtml(originLabel)}</p>
    <div class="travel-hints-list">${renderHintRows(hints)}</div>
    ${transitNote ? `<p class="travel-hints-msg">${escapeHtml(transitNote)}</p>` : ""}
    <p class="travel-hints-source">TMAP 실시간 경로 데이터</p>`;
}

export function renderTravelHintsError(message) {
  if (!dom.travelHints) return;
  dom.travelHints.hidden = false;
  dom.travelHints.open = true;
  setTravelSummary("🧭 교통 힌트");
  const inner = travelHintsInner();
  if (inner) inner.innerHTML = `<p class="travel-hints-msg">${escapeHtml(message)}</p>`;
}

export function clearTravelHints() {
  if (!dom.travelHints) return;
  dom.travelHints.hidden = true;
  dom.travelHints.open = false;
  setTravelSummary("🧭 교통 힌트");
  const inner = travelHintsInner();
  if (inner) inner.innerHTML = "";
}
