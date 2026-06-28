const VERCEL_URL = "https://trip-backend-sable.vercel.app/api/chat";

const AI_ERROR_MESSAGES = {
  depleted:
    "AI 사용량이 소진되었습니다. 잠시 후 다시 시도해 주세요.",
  overloaded:
    "AI 서버가 혼잡합니다. 잠시 후 다시 시도해 주세요.",
  default: "AI와 연결하는 중 문제가 발생했습니다.",
};

function toUserErrorMessage(text) {
  const msg = String(text || "").toLowerCase();
  if (
    msg.includes("prepayment credits are depleted") ||
    msg.includes("billing") ||
    msg.includes("quota") ||
    msg.includes("resource exhausted")
  ) {
    return AI_ERROR_MESSAGES.depleted;
  }
  if (
    msg.includes("high demand") ||
    msg.includes("overloaded") ||
    msg.includes("503") ||
    msg.includes("unavailable")
  ) {
    return AI_ERROR_MESSAGES.overloaded;
  }
  return null;
}

function buildPrompt(fullName) {
  return `${fullName} 여행지 3곳, 맛집 3곳 추천해줘. 상세한 설명은 빼고, 장소 이름과 한 줄 요약만 깔끔하게 리스트로 보여줘.

반드시 아래 JSON 형식만 출력해줘 (다른 문장 없이):
{"spots":[{"name":"장소명","desc":"한줄요약"}],"foods":[{"name":"장소명","desc":"한줄요약"}]}
각 배열은 정확히 3개 항목이어야 해.`;
}

export async function callGemini(text) {
  try {
    const response = await fetch(VERCEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text }),
    });

    if (!response.ok) throw new Error("서버 응답 오류");

    const result = await response.json();
    const reply = result.reply || result.error || "";
    const userError = toUserErrorMessage(reply);
    if (userError) throw new Error(userError);
    if (!reply) throw new Error(AI_ERROR_MESSAGES.default);
    return reply;
  } catch (err) {
    console.error("연결 에러:", err);
    if (
      err instanceof Error &&
      Object.values(AI_ERROR_MESSAGES).includes(err.message)
    ) {
      throw err;
    }
    throw new Error(AI_ERROR_MESSAGES.default);
  }
}

function normalizeItem(item, defaultTag) {
  return {
    name: String(item?.name || item?.title || "이름 없음").trim(),
    desc: String(item?.desc || item?.summary || item?.description || "").trim(),
    tag: String(item?.tag || defaultTag).trim(),
  };
}

function normalizeRecData(data) {
  const spots = (data.spots || [])
    .slice(0, 3)
    .map((item) => normalizeItem(item, "볼거리"));
  const foods = (data.foods || [])
    .slice(0, 3)
    .map((item) => normalizeItem(item, "맛집"));
  if (!spots.length && !foods.length) return null;
  return { spots, foods };
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function parseRecommendations(text) {
  if (!text) return null;

  const trimmed = text.trim();
  const direct = tryParseJson(trimmed);
  if (direct) {
    const data = normalizeRecData(direct);
    if (data) return data;
  }

  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlock) {
    const data = normalizeRecData(tryParseJson(codeBlock[1].trim()));
    if (data) return data;
  }

  const brace = trimmed.match(/\{[\s\S]*\}/);
  if (brace) {
    const data = normalizeRecData(tryParseJson(brace[0]));
    if (data) return data;
  }

  return parseTextFallback(trimmed);
}

function parseTextFallback(text) {
  const spots = [];
  const foods = [];
  let section = null;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    if (/여행|볼거리|관광|spot/i.test(line)) {
      section = "spots";
      continue;
    }
    if (/맛집|음식|food|식당/i.test(line)) {
      section = "foods";
      continue;
    }

    const cleaned = line.replace(/^[-*•\d.)\s]+/, "").trim();
    if (!cleaned) continue;

    const split = cleaned.split(/[:\-–—|]/);
    const name = (split[0] || cleaned).trim();
    const desc = (split.slice(1).join(" ") || "").trim();

    if (section === "foods") {
      foods.push({ name, desc: desc || "추천 맛집", tag: "맛집" });
    } else {
      spots.push({ name, desc: desc || "추천 여행지", tag: "볼거리" });
    }
  }

  if (!spots.length && !foods.length) return null;
  return {
    spots: spots.slice(0, 3),
    foods: foods.slice(0, 3),
  };
}

export async function fetchRecommendations(fullName) {
  const reply = await callGemini(buildPrompt(fullName));
  const userError = toUserErrorMessage(reply);
  if (userError) throw new Error(userError);
  const data = parseRecommendations(reply);
  if (!data) {
    throw new Error(AI_ERROR_MESSAGES.default);
  }
  return data;
}
