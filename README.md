# VayuGuard — City Air Desk

**A clearer view. A better next step.**

VayuGuard is a practical, bilingual (English / Hindi) urban-air decision-support prototype built for PromptWars Challenge 6. It is designed as a calm, dependable city air desk—not an “AI dashboard”. The product takes a forecast, explains what it can and cannot tell the user, and turns it into a small set of useful choices for the day.

**Live site:** https://ambkeshwargupta.github.io/SwachhVayu-AI/

## Interface direction

The current interface uses a “Human Field Journal” direction: warm sage-grey city-paper surfaces, deep forest-green navigation, lime highlights, larger readable typography, six softly tinted pollutant tiles, a dark forecast instrument with an illuminated trend line, warmer planning cards and distinct room/source-control surfaces on the Indoor Air page. It is intentionally less like a generic white SaaS dashboard and more like a calm, practical environmental field desk. Responsive layouts, focus states and reduced-motion preferences are included.

A product-interface review informed the hierarchy:
- **IQAir AirVisual:** current air, pollutant breakdowns, forecasts, smart alerts and location views.
- **EPA AirNow:** current AQI with primary pollutant and actions, plus forecasts, recent trends, weather and access to maps.
- **OpenAQ Explorer:** place search, map exploration, source/monitor-type filters, and a visible distinction between reference monitors and air sensors.
- **Google Air Quality API:** current conditions, hourly history, forecasts, heatmap tiles, pollutant details and recommendations.
- **Plume Flow:** historical example of connecting indoor/outdoor exposure to time, place and everyday routes; Flow and Flow 2 are no longer for sale.

These were used as design references, not as claims that their data feeds are integrated. VayuGuard's main dashboard remains based on Open-Meteo CAMS Global model output, and it does not invent monitor locations, street-level routes or historical station records. See [METHODOLOGY.md](METHODOLOGY.md) for the review and design decisions.

## Product direction

Air-quality apps already do a good job of showing numbers, maps and alerts. VayuGuard focuses on the gap between seeing a number and knowing what to do next:

1. **Understand:** explain the current modelled outlook and the pollutant-specific signal behind it.
2. **Plan:** compare relatively lower forecast windows for a routine, without calling any hour “safe”.
3. **Personalise locally:** save places and routine context on the device, without requiring an account.
4. **Act:** reduce indoor sources, compare commute choices and prepare a citizen-report note for the official reporting route.
5. **Trust:** label the data as modelled U.S. AQI, distinguish it from CPCB National AQI and show source and limitations beside the experience.

## What's in the application

| Area | Capability |
| --- | --- |
| Air briefing | Current modelled U.S. AQI, plain-language interpretation and the leading pollutant-specific AQI sub-index |
| Pollutants | Modelled PM2.5, PM10, NO2, O3, SO2 and CO concentrations |
| Weather context | Wind speed and relative humidity |
| Outlook | 24-hour curve and five-day daily summary from the forecast response |
| Day planner | Finds comparatively lower modelled hours for a selected activity and duration |
| Place watchlist | Geocoding search, one-tap browser geolocation, up to five saved places and side-by-side model-grid comparison |
| Local alerts | User-selected AQI threshold and browser notifications, subject to permission and the page being open; cached forecast fallback and 15-minute refresh while open |
| Household routines | Optional household context and daily habits stored in local browser storage |
| Indoor source guide | Redesigned room-by-room field guide, selectable home-source audit with saved selections, live progress and prioritised action list, CADR sizing helper, purifier filter guidance and respirator limitations; it does not measure indoor air |
| Commute choices | Illustrative weekly passenger-transport CO2 comparison |
| Citizen action | Prepares and copies a pollution-observation note, then links to CPCB's official complaint guidance |
| Air guide | Live Gemini 3.5 Flash-Lite answers via the Gemini GenerateContent API through a server-side Cloudflare Worker, grounded in the selected area and currently loaded forecast; English and Hindi |
| Language | English and Hindi interface |
| Briefing export | Browser print view, suitable for saving as PDF |
| Quick actions | One-click routes from the briefing to planning, indoor controls and citizen reporting |
| Routine explanation | Personalised “why this / why now / what changes” cards based on current model category and selected routine, not a personal health-risk score |

## Data sources and what the values mean

- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api), using the **CAMS Global** domain for modelled outdoor pollutant concentrations and U.S. AQI fields.
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) for current wind speed and relative humidity.
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) for place-name search.
- [Google Gemini API](https://ai.google.dev/gemini-api/docs) using Gemini 3.5 Flash-Lite through the GenerateContent API for dynamic, context-aware Air Guide responses. The API key is kept as an encrypted Cloudflare Worker secret and never included in the public frontend.
- [BigDataCloud free client-side reverse-geocoding API](https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free) to turn the visitor's permissioned, current device coordinates into a readable locality/city label. This service is used only to name the area; it does not provide the air-quality forecast.
- [EPA Guide to Air Cleaners in the Home](https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home) and [CDC/NIOSH filtering facepiece respirator guidance](https://www.cdc.gov/niosh/ppe/respirators/ffr.html).
- [CPCB National AQI method](https://app.cpcbccr.com/ccr_docs/About_AQI.pdf), [Government of India's real-time AQI dataset page](https://www.data.gov.in/resource/real-time-air-quality-index-various-locations) and [WHO 2021 Air Quality Guidelines](https://www.who.int/publications/i/item/9789240034228) are linked as authoritative references, not silently substituted into the model output.

### Important data distinction

The main dashboard displays **modelled U.S. AQI**, not India's CPCB National AQI. The CPCB system has a separate breakpoint framework and uses the highest relevant sub-index across eight pollutants. The app does not convert the CAMS model values into CPCB AQI or claim to display CPCB station observations.

The Government of India's data.gov.in page describes hourly CPCB field-instrument data and warns that live measurements can include abnormal values. As checked during this product review (26 November 2026), the resource page states that an API for this resource does not exist. Therefore this public static prototype does not claim that a direct CPCB data feed has been integrated. Use the official portal for station observations and advisories.

The CAMS Global model grid is approximately 45 km. A model-grid estimate can miss roadside, neighbourhood and building-level variation. The timestamp shown in the interface is the browser fetch time, not the time of a CPCB station observation or a guaranteed model-run publication time.

## Research-led product decisions

A review of established services informed the following choices:

- **IQAir AirVisual:** current conditions, pollutant breakdowns, forecasts, health guidance, saved locations and alerts. VayuGuard adopts a multi-pollutant view, a five-day outlook, saved locations and optional local alerts.
- **Plume Labs / Flow:** its Flow product page says Flow and Flow 2 are no longer for sale. As a historical design reference, it demonstrated personal exposure history, movement/spot views and route context. VayuGuard adopts time-aware planning but does not claim device-level or street-route accuracy.
- **AirNow:** quick local and forecast views, multiple saved areas and map-based exploration. VayuGuard adopts multi-place comparison while keeping its model limitations visible.
- **CPCB SAMEER:** official public complaint workflows, including location, category, photo evidence, acknowledgement and tracking. VayuGuard adds a report-note preparation helper and a clear hand-off to CPCB guidance; it does not submit a complaint or represent an authority.
- **OpenAQ:** an open platform for harmonised ground-level measurements. It is a potential future station-observation source, but station coverage and source provenance must be checked; OpenAQ explicitly notes that its dataset does not represent all air-quality monitoring data worldwide and provides physical measurements rather than aggregated AQIs.

The differentiator is not a longer feature list. It is a clear chain from **forecast → explanation → household decision → community action**, with uncertainty and source provenance visible throughout.

## Important calculations and safeguards

- **AQI category:** the app uses the U.S. AQI categories returned by Open-Meteo. These categories must not be presented as CPCB categories.
- **Leading pollutant:** the app compares available pollutant-specific U.S. AQI sub-indices and displays the largest available component as the leading model signal. This is not a chemical source-apportionment study.
- **Daily average:** the five-day cards average the hourly modelled U.S. AQI values available for each calendar day in the API response. This is a descriptive forecast summary, not a regulatory 24-hour station average.
- **Activity windows:** the planner sorts future hourly model values and surfaces lower-ranked hours. Lower is relative, not a safety certification.
- **Indoor air:** outdoor model values are never converted into indoor PM2.5. Indoor advice is source-control guidance plus a room-volume × user-selected ACH arithmetic helper. The ACH is a user input, not a universal health target. EPA advises matching CADR and room size, checking smoke CADR for smaller particles, using sorbent media for gases where appropriate and avoiding ozone-generating devices. Particle respirators do not filter gases or vapours; fit and standard matter.
- **Commute:** illustrative default factors in g CO2 per passenger-kilometre: petrol car 192, petrol two-wheeler 72, bus 89, metro 45, carpool (two occupants) 96, walk/cycle 0 operational tailpipe emissions. These are not verified local fleet factors; upstream lifecycle emissions are excluded.
- **Local alert:** browser notification permission is optional. The prototype checks the threshold when data is loaded/refreshed while the page is open. It is not a server push service and cannot guarantee delivery in the background.
- **Report helper:** the app copies a draft note only. A user must review it and submit through the official route. No complaint, photo or location is transmitted by VayuGuard.

## Run locally

No build step or package installation is required.

```bash
python -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

### Static website

GitHub Pages is configured to deploy through `.github/workflows/pages.yml`.

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Confirm that **Deploy VayuGuard to GitHub Pages** completes successfully.

### Secure Gemini assistant backend

The Gemini key must never be placed in `index.html`, `ai-config.js`, or any public repository file. The application calls a Cloudflare Worker, which reads the encrypted `GEMINI_API_KEY` secret and calls Google's Gemini GenerateContent API server-to-server. The Worker returns the generated text directly to the browser; no background interaction or polling endpoint is used.

The repository already includes `worker/src/index.js`, `worker/wrangler.toml` and `.github/workflows/deploy-ai-worker.yml`. The deployment workflow also writes the resulting `workers.dev` URL into `ai-config.js` and triggers a GitHub Pages redeployment.

Add these two additional **GitHub Actions repository secrets**:

| Secret name | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | A Cloudflare API token with the **Edit Cloudflare Workers** permission, scoped to the account that will host the Worker |
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account ID where the Worker will be deployed |

The existing `GEMINI_API_KEY` GitHub secret is reused by the workflow and uploaded to Cloudflare as an encrypted Worker secret.

Steps:
1. Create or sign in to a Cloudflare account.
2. In **Profile → API Tokens**, create a custom token with **Account → Workers Scripts → Edit** (Cloudflare's “Edit Cloudflare Workers” permission) for the intended account.
3. Copy the account ID from **Workers & Pages → Overview**.
4. Add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` under GitHub **Settings → Secrets and variables → Actions**.
5. Open the failed **Deploy VayuGuard Gemini API** run and choose **Re-run failed jobs**, or use **Actions → Deploy VayuGuard Gemini API → Run workflow**.
6. The workflow deploys the Worker, copies the existing Gemini key into Cloudflare's encrypted Worker secret store, checks the Worker health endpoint without making a billable Gemini generation request, configures the frontend endpoint and triggers a Pages deployment.
7. Check the Air Guide for the **Gemini AI connected** indicator before recording a GenAI demonstration.

The Worker applies an approximate limit of 8 requests per minute per client IP within each Cloudflare location. Cloudflare documents that its Worker rate-limiting counters are approximate and local to a Cloudflare location. This is a prototype safeguard, not a strict global quota or user authentication system.

## Privacy and security

- Saved places, household routines, household settings, checklist state, alert preferences and language preference are stored in the visitor's browser using local storage.
- Browser location is requested only after the visitor selects **Use my location** and grants permission. Coordinates are sent to Open-Meteo for the forecast and to BigDataCloud's free client-side reverse-geocoder to resolve a readable area name. BigDataCloud says it observes the requesting IP alongside the current coordinates and aggregates those pairings anonymously to improve IP-geolocation data. Coordinates are held in the active page session and excluded from the persistent forecast cache. They are stored in the saved-place list only if the visitor explicitly chooses **Save place**.
- There is no login or server-side profile storage in this prototype. The Gemini Worker is a narrow inference proxy, not a user-account backend.
- When a visitor submits a question in Air Guide, the question and a limited context packet (selected area name, modelled AQI, pollutant estimates, weather context and a short hourly outlook) are sent to the Cloudflare Worker and then to Google Gemini to generate the response. The app does not send the browser's precise latitude/longitude in this AI context packet. The app uses the direct GenerateContent endpoint and does not create an Interactions API record. Google still processes the request under the applicable Gemini API terms and data handling policies.
- The Gemini GenerateContent API returns a direct response, so there is no background-task polling or separate Gemini interaction history. Quota exhaustion and provider errors are surfaced to the user and are not retried.
- Do not enter symptoms, diagnoses, medication details or other sensitive personal information into the AI chat.
- Avoid entering sensitive health or personal details, especially on shared devices.
- Public browser code contains no private API keys. The air-quality, weather and geocoding requests use public endpoints.

## Limitations and next engineering steps

This is a static prototype, not a production public-health system. Forecasts can be wrong; the model grid is coarse relative to a street; the app does not measure indoor air or personal exposure; the rule-based guide is not a clinician or generative AI; transport factors are illustrative; local notifications depend on the browser.

The highest-value next steps are:
1. Establish a permitted, dependable official station-data integration with source timestamp, station ID, pollutant completeness, quality flags and a separate CPCB AQI implementation.
2. Add a secure backend for caching, monitoring, scheduled alerts, abuse protection and auditable data provenance.
3. Validate forecast performance against nearby official monitors and show model-versus-station error where matched data is available.
4. Add map and route functionality only when suitable street-level observations and route-specific data exist.
5. Conduct accessibility, Hindi-language, mobile, privacy and public-health content reviews before public deployment.

VayuGuard is an educational decision-support prototype, not a medical device, diagnostic tool or emergency service. Follow official local advisories and seek qualified health guidance for health concerns.
