import {
  GU_CITY,
  METRO,
  MUNI_METRO,
  OLD_TO_NEW_PC,
  PROV_ALIASES,
  GEOJSON_CDN,
  GEOJSON_RAW,
} from "./constants.js";
import { state } from "./state.js";
import { getCode, getName, getProvCode, fetchFirst } from "./geo-helpers.js";
import { redraw } from "./map-render.js";
import { applyMapZoom } from "./map-zoom.js";

export async function loadMapData() {
  const [muniData, pData] = await Promise.all([
    fetchFirst([
      GEOJSON_CDN + "skorea-municipalities-2018-geo.json",
      GEOJSON_RAW + "skorea-municipalities-2018-geo.json",
    ]),
    fetchFirst([
      GEOJSON_CDN + "skorea-provinces-2018-geo.json",
      GEOJSON_RAW + "skorea-provinces-2018-geo.json",
    ]),
  ]);
  if (!muniData || !pData) {
    alert("지도 데이터를 불러올 수 없습니다.");
    return;
  }

  pData.features.forEach((f) =>
    state.provNameToCode.set(getName(f), getCode(f).slice(0, 2)),
  );
  for (const [alias, code] of Object.entries(PROV_ALIASES)) {
    if (!state.provNameToCode.has(alias)) state.provNameToCode.set(alias, code);
  }

  pData.features
    .filter((f) => METRO.has(getProvCode(f)))
    .forEach((f) => {
      const pc = getProvCode(f);
      const name = getName(f);
      const feat = { ...f, properties: { ...f.properties, code: pc } };
      state.allFeatures.push(feat);
      state.nameToCode.set(name, pc);
      state.codeToName.set(pc, name);
      if (!state.provCityToCode.has(pc)) state.provCityToCode.set(pc, new Map());
      state.provCityToCode.get(pc).set(name, pc);
    });

  const doAll = muniData.features.filter(
    (f) => !MUNI_METRO.has(getProvCode(f)),
  );
  const siGunFeats = doAll.filter((f) => {
    const n = getName(f);
    return n.endsWith("시") || n.endsWith("군");
  });
  const guFeats = doAll.filter((f) => getName(f).endsWith("구"));
  const covered = new Set(siGunFeats.map((f) => getCode(f).slice(0, 4)));

  const guGroups = {};
  guFeats.forEach((f) => {
    const k = getCode(f).slice(0, 4);
    if (!covered.has(k)) (guGroups[k] = guGroups[k] || []).push(f);
  });

  const VALID_PC = new Set(["31", "32", "33", "34", "35", "36", "37", "38", "39"]);
  const mergedFeats = [];
  for (const [k, grp] of Object.entries(guGroups)) {
    if (!VALID_PC.has(k.slice(0, 2))) continue;
    if (!GU_CITY[k]) continue;
    const cityCode = k + "0";
    const cityName = GU_CITY[k];
    grp.forEach((f) => {
      const feat = JSON.parse(JSON.stringify(f));
      feat.properties = { code: cityCode, name: cityName };
      mergedFeats.push(feat);
    });
  }

  [...siGunFeats, ...mergedFeats].forEach((f) => {
    const code = getCode(f);
    const name = getName(f);
    const rawPc = code.slice(0, 2);
    const pc = OLD_TO_NEW_PC[rawPc] || rawPc;
    state.allFeatures.push(f);
    state.nameToCode.set(name, code);
    state.codeToName.set(code, name);
    if (!state.provCityToCode.has(pc)) state.provCityToCode.set(pc, new Map());
    state.provCityToCode.get(pc).set(name, code);
  });

  state.provFeatures = pData.features;
  redraw();
  applyMapZoom();
}