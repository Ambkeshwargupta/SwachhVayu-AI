# VayuGuard — Urban Air Quality Assistant

**Breathe smarter. Live safer. Protect every breath.**

VayuGuard is a responsive web application prototype for PromptWars Challenge 6. It turns outdoor air-quality forecasts into practical household decisions. Instead of displaying a pollution number alone, it helps a family explore when to plan outdoor activities, how to reduce indoor pollution sources and which everyday travel choices may reduce emissions.

## Open the application

After GitHub Pages is enabled, the application will be available at:

`https://ambkeshwargupta.github.io/SwachhVayu-AI/`

## Run locally

This is a static web app with no build step or package installation. Open `index.html` in a modern browser, or run:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Features

| Module | What it does |
| --- | --- |
| Air briefing | Live modelled outdoor US AQI, PM2.5, PM10, wind and humidity |
| Hourly outlook | 24-hour chart of modelled air-quality forecast |
| Location search | Resolve a city/locality and refresh the forecast |
| Daily planner | Compare the four lowest modelled AQI hours in the next 24 hours |
| Household | Save a household profile and member routine context locally |
| Indoor air lab | Select common indoor sources and see practical source-control steps |
| Scenario explorer | Compare a clearly labelled relative activity index |
| Low-emission choices | Illustrative weekly commute CO₂ comparison |
| Vayu Mitra | Built-in rule-based assistant for common air-quality questions |
| Methodology | Data provenance, assumptions and scientific limitations |

## Data sources

- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) — modelled hourly US AQI, PM2.5 and PM10.
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) — current wind speed and relative humidity.
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) — city/locality search.

**Data honesty:** the dashboard labels the index as modelled US AQI. It does not claim to display official CPCB station observations or India's CPCB National AQI. These AQI systems use different scales and must not be conflated.

## Deploy with GitHub Pages

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`.
4. Save and wait for the Pages deployment to complete.
5. Open the URL above. If it does not load immediately, allow a few minutes for the first deployment.

## Scientific and safety limitations

- Modelled outdoor estimates can differ from local monitoring-station observations.
- Outdoor air data does not measure indoor air or personal exposure.
- The scenario explorer's AQI-proxy × duration × intensity index is an arbitrary comparison, not inhaled dose, pollutant concentration or clinical risk.
- The indoor module gives source-control reminders; it does not estimate indoor PM2.5.
- Commute emission factors are broad illustrative defaults, not verified local fleet averages; upstream lifecycle emissions are excluded.
- Forecasts are uncertain and may change.
- VayuGuard is an educational decision-support prototype, not a medical device, diagnostic tool or emergency service. Follow local public-health advisories and professional guidance.

Read [METHODOLOGY.md](METHODOLOGY.md) for the detailed assumptions and limitations.

## Privacy

Household settings, member nicknames and checklist progress are stored in browser local storage. There is no account system or server-side profile database. Avoid entering sensitive personal or health details, especially on shared devices.

## AI roadmap

Vayu Mitra currently uses deterministic, rule-based guidance. A production generative AI integration should run through a secured backend, keep API keys server-side, ground numeric claims in validated application data, validate responses and apply rate limits. Never publish a secret API key in frontend code or commit it to this repository.

## Next development priorities

1. Add backend services and secure server-side AI orchestration.
2. Add official monitoring-station observations as a separate source where lawful, permitted and technically available.
3. Add caching, retries, data freshness indicators and automated tests.
4. Replace illustrative commute factors with documented, location-appropriate emission factors.
5. Develop any personal exposure model only after documenting pollutant concentrations, breathing-rate assumptions, time-activity patterns and microenvironments.
6. Complete accessibility, cross-browser and mobile QA.
