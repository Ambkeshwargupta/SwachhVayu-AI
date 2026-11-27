const MODEL = "gemini-3.8-flash";
const ALLOWED_ORIGINS = new Set([
  "https://ambkeshwargupta.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000"
]);

const SYSTEM_INSTRUCTION = [
  "You are VayuGuard's environmental information assistant.",
  "Explain the air-quality information supplied by the VayuGuard application and answer the user's question in clear, practical language.",
  "",
  "Non-negotiable accuracy rules:",
  "- The app's air-quality index is a modelled United States AQI estimate from the CAMS Global model, served by Open-Meteo. It is NOT India's CPCB National AQI and is NOT a nearby CPCB station observation.",
  "- Concentrations and forecast values are estimates for a model grid, not measurements at the exact street, home, school or workplace.",
  "- Do not invent missing pollutants, measurements, station readings, official alerts, forecast hours or data sources.",
  "- A comparatively lower forecast hour is not safe. Never guarantee safety or calculate a person's dose or personal health risk.",
  "- Do not diagnose, prescribe or recommend changing medication. Do not infer a medical condition. Give general exposure-reduction information only, and direct urgent or medical concerns to local emergency services or a qualified health professional.",
  "- Outdoor readings do not measure indoor air. Never claim to know the user's indoor PM2.5.",
  "- The transport calculator uses illustrative emissions factors, not verified local fleet data.",
  "- If the supplied context is absent or stale, say so clearly. Do not pretend to have live internet search or data beyond the supplied context.",
  "",
  "Response style:",
  "- Answer directly and naturally, like a knowledgeable human product guide.",
  "- Use the selected language requested by the caller (English or Hindi).",
  "- Refer to the selected area by name, but do not repeat precise coordinates.",
  "- When relevant, explain which supplied data points support the answer, then give one or two practical next steps.",
  "- Be concise but useful. Avoid generic AI disclaimers, fabricated citations, excessive bullet lists and overconfident health wording.",
  "- If a question is unrelated to air quality, explain briefly what VayuGuard can help with."
].join("\n");

function json(data, status, origin) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Vary": "Origin"
  };
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Access-Control-Max-Age"] = "86400";
  }
  return new Response(JSON.stringify(data), { status, headers });
}

function hasGeminiKey(env) {
  return typeof env.GEMINI_API_KEY === "string" && env.GEMINI_API_KEY.trim().length > 0;
}

function cleanString(value, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeNumber(value, min = -1e9, max = 1e9) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
}

function cleanContext(input) {
  const c = input && typeof input === "object" ? input : {};
  const pollutantsIn = c.pollutants && typeof c.pollutants === "object" ? c.pollutants : {};
  const pollutants = {};
  for (const key of ["PM2.5", "PM10", "NO2", "O3", "SO2", "CO"]) {
    pollutants[key] = safeNumber(pollutantsIn[key], 0, 100000);
  }
  const forecast = Array.isArray(c.next24Hours)
    ? c.next24Hours.slice(0, 24).map((item) => ({
        time: cleanString(item && item.time, 40),
        usAqi: safeNumber(item && item.usAqi, 0, 500)
      })).filter((item) => item.time && item.usAqi !== null)
    : [];
  return {
    area: cleanString(c.area, 120) || "Selected area",
    indexType: "Modelled U.S. AQI from CAMS Global via Open-Meteo; not CPCB National AQI or a CPCB station observation",
    aqi: safeNumber(c.aqi, 0, 500),
    category: cleanString(c.category, 50),
    leadingPollutant: cleanString(c.leadingPollutant, 60),
    leadingSubIndex: safeNumber(c.leadingSubIndex, 0, 500),
    pollutantsUgM3: pollutants,
    weather: {
      windKmh: safeNumber(c.weather && c.weather.windKmh, 0, 300),
      humidityPercent: safeNumber(c.weather && c.weather.humidityPercent, 0, 100)
    },
    fetchedAt: cleanString(c.fetchedAt, 60),
    next24Hours: forecast
  };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed." }, 403, "");
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin || "https://ambkeshwargupta.github.io",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ error: "Origin not allowed." }, 403, "");
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        status: "ok",
        service: "VayuGuard Gemini assistant",
        model: MODEL,
        ready: hasGeminiKey(env)
      }, 200, origin);
    }

    if (request.method !== "POST" || url.pathname !== "/ask") {
      return json({ error: "Not found." }, 404, origin);
    }

    if (!hasGeminiKey(env)) {
      return json({ error: "The Gemini service is not configured yet." }, 503, origin);
    }

    const clientIp = request.headers.get("CF-Connecting-IP") || "anonymous";
    if (env.AI_LIMITER) {
      const { success } = await env.AI_LIMITER.limit({ key: clientIp });
      if (!success) {
        return json({ error: "Too many questions in a short period. Please wait a minute and try again." }, 429, origin);
      }
    }

    const contentLength = Number(request.headers.get("Content-Length") || "0");
    if (contentLength > 12000) return json({ error: "The request is too large." }, 413, origin);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Please send a valid JSON request." }, 400, origin);
    }

    const question = cleanString(body && body.question, 1600);
    if (question.length < 2) {
      return json({ error: "Please enter a question of at least two characters." }, 400, origin);
    }

    const language = body && body.language === "hi" ? "Hindi" : "English";
    const context = cleanContext(body && body.context);
    const prompt = [
      "User's question:",
      question,
      "",
      "Current VayuGuard page context (validated and normalised by the server):",
      JSON.stringify(context, null, 2),
      "",
      "Answer using this supplied context. Clearly state when a detail is not available."
    ].join("\n");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const upstream = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION + "\n\nRespond in " + language + "." }]
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.35, maxOutputTokens: 850 }
          }),
          signal: controller.signal
        }
      );

      if (!upstream.ok) {
        if (upstream.status === 429) {
          return json({ error: "Gemini is busy or the API quota has been reached. Please try again shortly." }, 429, origin);
        }
        if ([400, 403, 404].includes(upstream.status)) {
          return json({ error: "Gemini rejected the request. Check the API key, model access and Gemini API configuration." }, 502, origin);
        }
        return json({ error: "The Gemini service could not complete the request right now." }, 502, origin);
      }

      const data = await upstream.json();
      const parts = data && data.candidates && data.candidates[0] &&
        data.candidates[0].content && data.candidates[0].content.parts || [];
      const answer = parts.filter((part) => part && part.thought !== true).map((part) => typeof part.text === "string" ? part.text : "").join("\n").trim();

      if (!answer) {
        return json({ error: "Gemini returned no text for this question. Try rephrasing it." }, 502, origin);
      }

      return json({
        answer: answer.slice(0, 9000),
        model: MODEL,
        provider: "Google Gemini",
        basedOn: "The question and current VayuGuard page context supplied with this request."
      }, 200, origin);
    } catch (error) {
      if (error && error.name === "AbortError") {
        return json({ error: "The Gemini response took too long. Please try again." }, 504, origin);
      }
      return json({ error: "The Gemini service is temporarily unavailable." }, 502, origin);
    } finally {
      clearTimeout(timeout);
    }
  }
};
