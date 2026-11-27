// Stable model documented for Gemini Interactions API and background execution.
const MODEL = "gemini-3.6-flash";
const API_REVISION = "2026-05-20";
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

function cleanString(value, max = 160) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function safeNumber(value, min = -1e9, max = 1e9) {
  return typeof value === "number" && Number.isFinite(value) && value >= min && value <= max
    ? value
    : null;
}

function hasGeminiKey(env) {
  return typeof env.GEMINI_API_KEY === "string" && env.GEMINI_API_KEY.trim().length > 0;
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

async function upstreamJson(url, options, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    const data = await response.json().catch(() => ({}));
    return { response, data };
  } finally {
    clearTimeout(timeout);
  }
}

function responseText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const steps = Array.isArray(data?.steps) ? data.steps : [];
  return steps
    .filter((step) => step && step.type === "model_output")
    .flatMap((step) => Array.isArray(step.content) ? step.content : [])
    .filter((part) => part && part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function providerError(status, data) {
  const code = cleanString(data?.error?.status || data?.error?.code, 50);
  if (status === 429) return "Gemini project/model quota reached (RESOURCE_EXHAUSTED). Check AI Studio Rate Limits for RPM, TPM and RPD. Per-day limits reset at midnight Pacific; no automatic retry was made.";
  if (status === 401 || status === 403) return "Gemini authentication or project access was rejected. Check the API key and Gemini API access.";
  if (status === 400) return "Gemini rejected the request configuration" + (code ? " (" + code + ")" : "") + ".";
  if (status >= 500) return "Gemini is temporarily experiencing a service issue. Please try again.";
  return "The Gemini service could not complete this request (HTTP " + status + ").";
}

function interactionFailureReason(data) {
  const code = interactionFailureCode(data);
  if (code === "RESOURCE_EXHAUSTED") {
    return "Gemini project/model quota reached (RPM, TPM or RPD). Check the AI Studio Rate Limit page. Daily request quotas reset at midnight Pacific; wait for reset or increase the project's usage tier.";
  }
  const issue = data && (data.error || (Array.isArray(data.errors) ? data.errors[0] : null));
  const message = issue && (issue.message || issue.status || issue.code);
  if (typeof message === "string" && message.trim()) return cleanString(message, 280);
  return "The provider marked this interaction as failed without a detailed message.";
}

function interactionFailureCode(data) {
  const issue = data && (data.error || (Array.isArray(data.errors) ? data.errors[0] : null));
  return cleanString(issue && (issue.code || issue.status), 60).toUpperCase();
}

// Some Gemini background jobs can fail during generation with a generic INVALID_ARGUMENT
// message even when the same request shape is valid; expose this narrow case for one client retry.
function isRetryableInteractionFailure(data) {
  const code = interactionFailureCode(data);
  const message = interactionFailureReason(data).toLowerCase();
  return ["INTERNAL", "UNAVAILABLE", "DEADLINE_EXCEEDED"].includes(code) ||
    (code === "INVALID_ARGUMENT" && message.includes("there was a problem processing your request"));
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

    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({ error: "Origin not allowed." }, 403, "");

    if (request.method === "GET" && url.pathname === "/health") {
      return json({
        status: "ok",
        service: "VayuGuard Gemini assistant",
        model: MODEL,
        api: "Gemini Interactions API (synchronous)",
        modelSupport: "Model generation is executed in the request; the response is returned directly without a background task.",
        ready: hasGeminiKey(env),
        readinessScope: "Worker and encrypted API key only; model quota is checked when a user submits a question."
      }, 200, origin);
    }

    if (request.method === "GET" && url.pathname.startsWith("/status/")) {
      if (!hasGeminiKey(env)) return json({ error: "The Gemini service is not configured yet." }, 503, origin);
      const taskId = url.pathname.slice("/status/".length);
      if (!/^[A-Za-z0-9_-]{6,200}$/.test(taskId)) return json({ error: "Invalid interaction ID." }, 400, origin);

      try {
        const { response, data } = await upstreamJson(
          "https://generativelanguage.googleapis.com/v1beta/interactions/" + encodeURIComponent(taskId),
          {
            method: "GET",
            headers: {
              "x-goog-api-key": env.GEMINI_API_KEY,
              "Api-Revision": API_REVISION
            }
          },
          15000
        );
        if (!response.ok) return json({ error: providerError(response.status, data) }, 502, origin);
        if (data.status === "failed") return json({
          error: "Gemini interaction failed: " + interactionFailureReason(data),
          providerCode: interactionFailureCode(data),
          retryable: isRetryableInteractionFailure(data)
        }, 502, origin);
        if (data.status === "completed") {
          const answer = responseText(data);
          if (!answer) return json({ error: "Gemini completed the interaction without a text answer. Please try again." }, 502, origin);
          return json({
            status: "completed",
            answer: answer.slice(0, 9000),
            model: MODEL,
            provider: "Google Gemini",
            basedOn: "The question and current VayuGuard page context supplied with this request."
          }, 200, origin);
        }
        return json({ status: data.status || "in_progress" }, 202, origin);
      } catch (error) {
        if (error && error.name === "AbortError") return json({ error: "Gemini status check timed out. Please try again." }, 504, origin);
        return json({ error: "The Gemini service is temporarily unavailable." }, 502, origin);
      }
    }

    if (request.method !== "POST" || url.pathname !== "/ask") return json({ error: "Not found." }, 404, origin);
    if (!hasGeminiKey(env)) return json({ error: "The Gemini service is not configured yet." }, 503, origin);

    const clientIp = request.headers.get("CF-Connecting-IP") || "anonymous";
    if (env.AI_LIMITER) {
      const { success } = await env.AI_LIMITER.limit({ key: clientIp });
      if (!success) return json({ error: "Too many questions in a short period. Please wait a minute and try again." }, 429, origin);
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
    if (question.length < 2) return json({ error: "Please enter a question of at least two characters." }, 400, origin);

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

    try {
      const { response, data } = await upstreamJson(
        "https://generativelanguage.googleapis.com/v1beta/interactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.GEMINI_API_KEY,
            "Api-Revision": API_REVISION
          },
          body: JSON.stringify({
            model: MODEL,
            input: prompt,
            system_instruction: SYSTEM_INSTRUCTION + "\n\nRespond in " + language + ".",
            generation_config: { max_output_tokens: 700 },
            store: false
          })
        },
        50000
      );

      if (!response.ok) {
        return json({
          error: providerError(response.status, data),
          providerCode: cleanString(data && data.error && (data.error.status || data.error.code), 60) || null
        }, response.status === 429 ? 429 : 502, origin);
      }

      const answer = responseText(data);
      if (!answer) {
        const status = cleanString(data && data.status, 40);
        if (status === "failed") {
          return json({ error: "Gemini could not complete this answer. Please try again." }, 502, origin);
        }
        return json({
          error: "Gemini returned no text answer" + (status ? " (status: " + status + ")" : "") + ". Please try again."
        }, 502, origin);
      }

      return json({
        status: "completed",
        answer: answer.slice(0, 9000),
        model: MODEL,
        provider: "Google Gemini"
      }, 200, origin);
    } catch (error) {
      if (error && error.name === "AbortError") return json({ error: "Gemini generation timed out after 50 seconds. Please try again." }, 504, origin);
      return json({ error: "The Gemini service is temporarily unavailable." }, 502, origin);
    }
  }
};
