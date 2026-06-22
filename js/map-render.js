import { dom, state } from "./state.js";
import { getCode, getName } from "./geo-helpers.js";
import { buildProjection } from "./map-projection.js";
import {
  appendLabel,
  refreshSelectedLabel,
  restoreStyle,
  styleByCode,
} from "./map-styles.js";

function clearPopLayer() {
  dom.gPop.selectAll("*").remove();
}

function popSelectedRegion(code) {
  clearPopLayer();
  if (!code) return;
  const projection = buildProjection();
  const geoPath = d3.geoPath().projection(projection);
  (state.pathsByCode.get(code) || []).forEach((el) => {
    const f = el.datum();
    const c = geoPath.centroid(f);
    if (!isFinite(c[0]) || !isFinite(c[1])) return;
    const tx = (s) =>
      `translate(${c[0]},${c[1]}) scale(${s}) translate(${-c[0]},${-c[1]})`;
    dom.gPop
      .append("path")
      .datum(f)
      .attr("d", geoPath)
      .attr("fill", "#3b82f6")
      .attr("fill-opacity", 0.78)
      .attr("stroke", "#1d4ed8")
      .attr("stroke-width", 2.5)
      .attr("filter", "url(#pop-shadow)")
      .attr("transform", tx(0.88))
      .transition()
      .duration(520)
      .ease(d3.easeBackOut.overshoot(1.3))
      .attr("transform", tx(1.12));
  });
}

export function redraw() {
  const projection = buildProjection();
  const path = d3.geoPath().projection(projection);

  dom.gRegion.selectAll("path").remove();
  state.pathsByCode.clear();
  state.allFeatures.forEach((f) => {
    const code = getCode(f);
    const el = dom.gRegion.append("path").datum(f).attr("d", path);
    styleByCode(code)(el);
    if (!state.pathsByCode.has(code)) state.pathsByCode.set(code, []);
    state.pathsByCode.get(code).push(el);
  });

  dom.gBorder.selectAll("path").remove();
  state.provFeatures.forEach((f) => {
    dom.gBorder
      .append("path")
      .datum(f)
      .attr("d", path)
      .attr("fill", "none")
      .attr("stroke", "#444")
      .attr("stroke-width", 2)
      .attr("stroke-opacity", 0.8);
  });

  dom.gLabel.selectAll("text").remove();
  const cMap = new Map();
  state.allFeatures.forEach((f) => {
    const code = getCode(f);
    const c = path.centroid(f);
    if (!isFinite(c[0]) || !isFinite(c[1])) return;
    if (!cMap.has(code))
      cMap.set(code, { sx: 0, sy: 0, n: 0, name: getName(f) });
    const e = cMap.get(code);
    e.sx += c[0];
    e.sy += c[1];
    e.n++;
  });
  cMap.forEach(({ sx, sy, n, name }, code) => {
    const label = name
      .replace(/(?:특별자치|광역|특별)(?:시|도)$/, "")
      .replace(/(?:시|군)$/, "")
      .trim();
    appendLabel(code, sx / n, sy / n, label);
  });

  if (state.selectedCode) popSelectedRegion(state.selectedCode);
}

export function selectByCode(code) {
  if (state.selectedCode) {
    const prev = state.selectedCode;
    (state.pathsByCode.get(prev) || []).forEach((el) =>
      restoreStyle(prev)(el),
    );
  }
  clearPopLayer();
  state.selectedCode = code || null;
  if (!state.selectedCode) {
    refreshSelectedLabel();
    return;
  }
  (state.pathsByCode.get(state.selectedCode) || []).forEach((el) =>
    restoreStyle(state.selectedCode)(el),
  );
  refreshSelectedLabel();
  popSelectedRegion(state.selectedCode);
}

export function highlightSelection() {
  selectByCode(dom.citySel.value || null);
}
