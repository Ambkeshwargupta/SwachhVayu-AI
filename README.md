# VayuGuard — City Air Desk

**A clearer view. A better next step.**

VayuGuard is a practical, bilingual (English / Hindi) urban-air decision-support prototype built for PromptWars Challenge 6. It is designed as a calm, dependable city air desk—not an “AI dashboard”. The product takes a forecast, explains what it can and cannot tell the user, and turns it into a small set of useful choices for the day.

**Live site:** https://ambkeshwargupta.github.io/SwachhVayu-AI/

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
| Place watchlist | Geocoding search, up to five saved places and side-by-side model-grid comparison |
| Local alerts | User-selected AQI threshold and browser notifications, subject to permission and the page being open |
| Household routines | Optional household context and daily habits stored in local browser storage |
| Indoor source guide | Select common sources to get practical source-control actions; it does not measure indoor air |
| Commute choices | Illustrative weekly passenger-transport CO2 comparison |
| Citizen action | Prepares and copies a pollution-observation note, then links to CPCB's official complaint guidance |
| Air guide | Transparent, deterministic question-and-answer rules grounded in the forecast loaded in the app |
| Language | English and Hindi interface |
| Briefing export | Browser print view, suitable for saving as PDF |

## Data sources and what the values mean

- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api), using the **CAMS Global** domain for modelled outdoor pollutant concentrations and U.S. AQI fields.
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs) for current wind speed and relative humidity.
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api) for place-name search.
- [CPCB National AQI method](https://app.cpcbccr.com/ccr_docs/About_AQI.pdf), [Government of India's real-time AQI dataset page](https://www.data.gov.in/resource/real-time-air-quality-index-various-locations) and [WHO 2021 Air Quality Guidelines](https://www.who.int/publications/i/item/9789240034228) are linked as authoritative references, not silently substituted into the model output.

### Important data distinction

The main dashboard displays **modelled U.S. AQI**, not India's CPCB National AQI. The CPCB system has a separate breakpoint framework and uses the highest relevant sub-index across eight pollutants. The app does not convert the CAMS model values into CPCB AQI or claim to display CPCB station observations.

The Government of India's data.gov.in page describes hourly CPCB field-instrument data and warns that live measurements can include abnormal values. As checked during this product review (26 November 2026), the resource page states that an API for this resource does not exist. Therefore this public static prototype does not claim that a direct CPCB data feed has been integrated. Use the official portal for station observations and advisories.

The CAMS Global model grid is approximately 45 km. A model-grid estimate can miss roadside, neighbourhood and building-level variation. The timestamp shown in the interface is the browser fetch time, not the time of a CPCB station observation or a guaranteed model-run publication time.

## Research-led product decisions

A review of established services informed the following choices:

- **IQAir AirVisual:** current conditions, pollutant breakdowns, forecasts, health guidance, saved locations and alerts. VayuGuard adopts a multi-pollutant view, a five-day outlook, saved locations and optional local alerts.
- **Plume Labs / Flow:** time-aware exposure planning, identifying comparatively cleaner moments and commute context. VayuGuard adopts a routine-led window finder, but does not claim street-by-street accuracy or cleanest-route routing from a 45 km model.
- **AirNow:** quick local and forecast views, multiple saved areas and map-based exploration. VayuGuard adopts multi-place comparison while keeping its model limitations visible.
- **CPCB SAMEER:** official public complaint workflows, including location, category, photo evidence, acknowledgement and tracking. VayuGuard adds a report-note preparation helper and a clear hand-off to CPCB guidance; it does not submit a complaint or represent an authority.
- **OpenAQ:** an open platform for harmonised ground-level measurements. It is a potential future station-observation source, but station coverage and source provenance must be checked; OpenAQ explicitly notes that its dataset does not represent all air-quality monitoring data worldwide and provides physical measurements rather than aggregated AQIs.

The differentiator is not a longer feature list. It is a clear chain from **forecast → explanation → household decision → community action**, with uncertainty and source provenance visible throughout.

## Important calculations and safeguards

- **AQI category:** the app uses the U.S. AQI categories returned by Open-Meteo. These categories must not be presented as CPCB categories.
- **Leading pollutant:** the app compares available pollutant-specific U.S. AQI sub-indices and displays the largest available component as the leading model signal. This is not a chemical source-apportionment study.
- **Daily average:** the five-day cards average the hourly modelled U.S. AQI values available for each calendar day in the API response. This is a descriptive forecast summary, not a regulatory 24-hour station average.
- **Activity windows:** the planner sorts future hourly model values and surfaces lower-ranked hours. Lower is relative, not a safety certification.
- **Indoor air:** outdoor model values are never converted into indoor PM2.5. Indoor advice is source-control guidance only.
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

GitHub Pages is configured to deploy through the workflow in `.github/workflows/pages.yml`.

1. Open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Open the **Actions** tab and confirm that **Deploy VayuGuard to GitHub Pages** completes successfully.
4. Visit the live site URL above.

## Privacy and security

- Saved places, household routines, household settings, checklist state, alert preferences and language preference are stored in the visitor's browser using local storage.
- There is no login, profile backend or server-side storage in this prototype.
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
