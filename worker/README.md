# VayuGuard Gemini Worker

This is the server-side proxy for the VayuGuard Air Guide. It keeps the Gemini API key out of the public GitHub Pages app.

## Runtime

- Cloudflare Workers
- Google Gemini API: `gemini-3.6-flash`
- Endpoint: `POST /ask` (runs a synchronous, non-stored Gemini interaction)
- Legacy status endpoint: `GET /status/{taskId}` (not used by the current frontend)
- Health check: `GET /health`
- CORS allow-list: `https://ambkeshwargupta.github.io` plus localhost development origins
- Rate limiter: 8 requests per 60 seconds per client IP in each Cloudflare location (approximate)

## Deployment via GitHub Actions

The workflow at `.github/workflows/deploy-ai-worker.yml` expects these repository Actions secrets:

- `GEMINI_API_KEY` — already stored in the repository.
- `CLOUDFLARE_API_TOKEN` — Cloudflare API token with Edit Cloudflare Workers permission, scoped to the target account.
- `CLOUDFLARE_ACCOUNT_ID` — target Cloudflare account ID.

Run **Actions → Deploy VayuGuard Gemini API → Run workflow** after adding the two Cloudflare secrets. The workflow deploys this Worker, uploads `GEMINI_API_KEY` as an encrypted Worker secret, verifies the Worker's health and key configuration without making a billable Gemini generation call, writes the public `/ask` endpoint to the root `ai-config.js` via the GitHub Contents API, and dispatches a GitHub Pages deployment. Live Gemini inference must be tested manually when the Google project has available quota.

## Local development

Create a local-only `.dev.vars` file in this folder:

```dotenv
GEMINI_API_KEY=your-local-test-key
```

Do not commit `.dev.vars`. Then run:

```bash
npx wrangler dev
```

The local app origin must be one of the local origins allowed in `src/index.js`.

## Test

Health:

```bash
curl http://127.0.0.1:8787/health
```

Ask (waits for Gemini and returns the completed answer directly):

```bash
curl -X POST http://127.0.0.1:8787/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What does my current air-quality outlook mean?",
    "language": "en",
    "context": {
      "area": "New Delhi, India",
      "aqi": 156,
      "category": "Unhealthy",
      "leadingPollutant": "PM2.5",
      "leadingSubIndex": 156,
      "pollutants": {"PM2.5": 78.2, "PM10": 91.4},
      "weather": {"windKmh": 4.2, "humidityPercent": 52},
      "next24Hours": []
    }
  }'
```

The sample uses illustrative values for local testing, not observed VayuGuard data. A successful `/ask` response contains `status: completed`, `answer`, `provider` and `model`. The Worker sends `store:false`; there is no browser polling loop.

## Safety and privacy

The Worker normalises context to a fixed allow-list. It does not accept arbitrary system instructions from the browser. Precise coordinates are not included. It does not log prompts or responses. Its system instruction requires model/CPCB distinctions, prohibits fabricated measurements, and prevents medical diagnosis or safety guarantees. The current `/ask` handler sends `store:false` and does not create a stored background interaction. Google still processes the request under its applicable Gemini API terms and data handling policies.

The public Worker URL is not a secret. The Gemini API key must remain only in GitHub Actions secrets and Cloudflare Worker secrets.
