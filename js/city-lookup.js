import { PROV_NAMES, sigun, visitSigun } from "./city.js";
import { state } from "./state.js";

export function findCityEntry(code) {
  if (!code) return null;
  for (const prov of Object.keys(sigun)) {
    const entry = (sigun[prov] || []).find((c) => c.code === code);
    if (entry) return { prov, entry };
  }
  for (const prov of Object.keys(visitSigun)) {
    const entry = (visitSigun[prov] || []).find((c) => c.code === code);
    if (entry) return { prov, entry };
  }
  return null;
}

export function getCityLabel(code) {
  const hit = findCityEntry(code);
  if (hit) return hit.entry.label;
  return state.codeToName.get(code) || code;
}

export function getCityName(code) {
  const hit = findCityEntry(code);
  if (!hit) return state.codeToName.get(code) || code;
  const { prov, entry } = hit;
  if (entry.code !== prov && PROV_NAMES[prov]) {
    return `${PROV_NAMES[prov]} ${entry.name}`;
  }
  return entry.name;
}
