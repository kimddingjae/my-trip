import { MAP_FOCUS_FIT_SCALE } from "./constants.js";
import { dom, state } from "./state.js";
import { getCode } from "./geo-helpers.js";

export function buildProjection() {
  const { width: W, height: H } = dom.wrap.getBoundingClientRect();
  const projection = d3.geoMercator();

  if (state.mapFocusCode) {
    const feats = state.allFeatures.filter(
      (f) => getCode(f) === state.mapFocusCode,
    );
    if (feats.length) {
      const geo =
        feats.length === 1
          ? feats[0]
          : { type: "FeatureCollection", features: feats };
      const padX = W * 0.18;
      const padY = H * 0.18;
      projection.fitExtent([[padX, padY], [W - padX, H - padY]], geo);
      const s0 = projection.scale();
      const [tx0, ty0] = projection.translate();
      const k = MAP_FOCUS_FIT_SCALE;
      projection
        .scale(s0 * k)
        .translate([W / 2 - k * (W / 2 - tx0), H / 2 - k * (H / 2 - ty0)]);
      return projection;
    }
  }

  const scale = Math.min(W / 0.081, H / 0.103);
  return projection
    .center([127.85, 36.45])
    .scale(scale)
    .translate([W / 2, H / 2]);
}
