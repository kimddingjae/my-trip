export function getCode(f) {
  const p = f.properties;
  return String(p.code ?? p.CODE ?? p.adm_cd ?? p.SIG_CD ?? "00000");
}

export function getName(f) {
  const p = f.properties;
  return p.name ?? p.NAME ?? p.adm_nm ?? p.SIG_KOR_NM ?? "?";
}

export function getProvCode(f) {
  return getCode(f).slice(0, 2);
}

export async function fetchFirst(urls) {
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.json();
    } catch (_) {}
  }
  return null;
}
