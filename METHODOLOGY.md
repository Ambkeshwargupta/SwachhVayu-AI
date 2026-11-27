# VayuGuard — research, data and product methodology

**Version reviewed: 26 November 2026**

This document records what the prototype currently does, why specific product choices were made, what its data represents and where its limits are. The goal is to prevent a polished interface from overstating the reliability of an air-quality estimate.

## 1. Product principle

VayuGuard is a city air decision desk, not an AI-first dashboard. The intended user journey is:

1. **Understand the outlook.** See an air-quality estimate and the pollutants available in the model response.
2. **Interpret it.** Read a plain-language explanation with the index type and data provenance visible.
3. **Plan a routine.** Compare forecast hours, not hypothetical personal risk scores.
4. **Reduce avoidable sources.** Use source-control practices indoors and consider lower-emission travel where practical.
5. **Take civic action.** Prepare an observation note and hand it off to an official reporting channel.
6. **Verify.** Open the source documentation and understand the difference between model output and official measurements.

The interface deliberately avoids claims such as “AI-powered protection”, “safe time”, “cleanest street” or “real-time CPCB AQI” when the implementation cannot support them.

## 2. Research review and product decisions

The product review focused on established air-quality and citizen-information services. The observations below describe published product capabilities, not a claim that VayuGuard has the same data coverage or operational infrastructure.

### IQAir AirVisual

IQAir describes real-time air-quality and weather information, multiple pollutants (including PM2.5, PM10, ozone, NO2, CO2 and SO2), historical information, forecasts, health recommendations, saved-location widgets and configurable alerts. Its product pages also describe the integration of indoor monitors and air purifiers.

**VayuGuard decisions:** show six modelled pollutant concentrations; identify the highest available pollutant-specific AQI sub-index; show a five-day summary; support saved locations; offer an optional browser-local threshold alert. Historical station series, hardware integrations and purifier control are not claimed.

Reference: https://www.iqair.com/air-quality-monitors/air-quality-app

### Plume Labs and Flow

The current Flow product page says Flow and Flow 2 are no longer for sale. As a historical product reference, Plume documented pollution tracking indoors and outdoors, exposure history, movement/spot cards and route comparisons. These remain useful design lessons, but VayuGuard does not claim to provide Flow-like personal monitoring or route accuracy.

**VayuGuard decisions:** make the next useful time window easy to find and connect the forecast to routines. Do not claim street-by-street resolution or a lowest-exposure route from a global forecast grid of roughly 45 km.

Reference: https://plumelabs.com/en/flow/

### AirNow

The U.S. EPA AirNow mobile experience describes current and forecast AQI, multiple saved areas and map-based air-quality exploration. Its fire-and-smoke map also shows how different map layers and monitor types can be distinguished.

**VayuGuard decisions:** support a small saved-place watchlist and side-by-side comparison. The prototype does not add map layers or a U.S.-style fire/smoke layer because those data sources are not part of its current India-oriented data stack.

Reference: https://smoke.airnow.gov/airnow-mobile-app/

### CPCB SAMEER

CPCB's citizen guidance describes a public complaint process that can capture location, complaint category and photographs, issue an acknowledgement and allow the user to track the complaint history. Government material also describes agency routing for Delhi-NCR.

**VayuGuard decisions:** add a report-note builder and link users to CPCB's official instructions. The prototype does not submit a report, store uploaded evidence, integrate an agency complaint-management system or claim that a complaint has been filed.

References:
- https://cpcb.nic.in/air/Citizen_Guideliines_Air_Complaints.pdf
- https://data.gov.in/resource/real-time-air-quality-index-various-locations

### OpenAQ

OpenAQ describes itself as an open-access platform for ground-level ambient air-quality data. It focuses on physical pollutant measurements, not aggregated AQI values, and explicitly notes that its discovered dataset does not represent all air-quality monitoring data worldwide.

**VayuGuard decisions:** treat station data as a potential separate source, not a replacement for model data. A future integration must preserve station identity, measurement timestamp, pollutant, units, completeness and quality/provenance. It must not label all OpenAQ measurements as CPCB data.

References:
- https://openaq.org/platform/
- https://docs.openaq.org/about/about

## 3. Current data architecture

The current frontend calls public endpoints directly from the browser. It has no backend, no server-side data cache and no private keys.

### 3.1 Outdoor atmospheric model

Endpoint:
- https://air-quality-api.open-meteo.com/v1/air-quality

Requested domain:
- `domains=cams_global`

Requested hourly fields:
- `us_aqi`
- `us_aqi_pm2_5`, `us_aqi_pm10`, `us_aqi_nitrogen_dioxide`, `us_aqi_ozone`, `us_aqi_sulphur_dioxide`, `us_aqi_carbon_monoxide`
- `pm2_5`, `pm10`, `nitrogen_dioxide`, `ozone`, `sulphur_dioxide`, `carbon_monoxide`

Forecast horizon:
- Five days, returned as hourly fields.

The Open-Meteo documentation describes the CAMS Global atmospheric composition forecast as having approximately 45 km spatial resolution, three-hourly temporal resolution and five-day forecast length (with forecast updates on a regular model cycle). The requested coordinates are therefore a location query into a regional/global model grid, not a guarantee of a measurement at the exact address.

The modelled pollutant concentrations are expressed in µg/m³. These fields should not be presented as measurements taken at a nearby CPCB monitor. The U.S. AQI fields use the U.S. index methodology and are labelled as such in the interface.

Reference: https://open-meteo.com/en/docs/air-quality-api

### 3.2 Weather context

Endpoint:
- https://api.open-meteo.com/v1/forecast

Requested fields:
- `current=relative_humidity_2m,wind_speed_10m`

The interface presents wind speed and relative humidity as context only. It does not claim to derive local dispersion, pollutant transport or exposure from two weather variables.

Reference: https://open-meteo.com/en/docs

### 3.3 Place-name search

Endpoint:
- https://geocoding-api.open-meteo.com/v1/search

Place selection resolves a place name into a latitude and longitude. The requested model grid may be offset from the exact coordinates; this should remain clear in future iterations.

Reference: https://open-meteo.com/en/docs/geocoding-api

### 3.4 Reverse geocoding of the current device location

When a visitor explicitly selects **Use my location** and grants the browser's Geolocation permission, the browser obtains the current coordinates. VayuGuard then calls BigDataCloud's free client-side reverse-geocoding endpoint directly from the browser:

- `https://api.bigdatacloud.net/data/reverse-geocode-client`
- Query parameters: current `latitude`, `longitude`, and `localityLanguage` (`en` or `hi`).

The application uses the returned `localityName`, `city`, `principalSubdivision` and `countryName` fields (deduplicated) to construct the visible current-area label. That label is displayed in the persistent top-bar area indicator and beside the dashboard briefing, while the chart context shows the same area name. Manually searched places instead carry the selected geocoding result and are labelled as a selected place.

The provider documents that this free endpoint is for direct client-side use of the device's current, consented location only; it must not be used for cached, stored, third-party or server-side coordinates. It also explains that the service observes the requesting IP alongside the current coordinates and aggregates those pairings anonymously to improve and validate its IP-geolocation data. VayuGuard therefore calls it only after an explicit location-button action and does not send saved or searched coordinates to this endpoint.

If reverse geocoding fails, the forecast still loads for the browser coordinates and the interface labels the area name as unavailable, showing the approximate coordinates instead. Device-derived coordinates are not written to VayuGuard's persistent forecast cache. A visitor must explicitly choose **Save place** to add a device location to the saved-place list.

References:
- BigDataCloud free client-side reverse-geocoding API and privacy explanation: https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free
- Client field names and fair-use constraints: https://github.com/bigdatacloudapi/js-reverse-geocode-client

### 3.5 Official Indian station information

India's National AQI is published by CPCB and uses a distinct index framework. CPCB describes eight pollutants: PM10, PM2.5, NO2, SO2, CO, O3, NH3 and Pb. The highest relevant pollutant sub-index determines the overall AQI; the six categories are Good, Satisfactory, Moderately polluted, Poor, Very Poor and Severe.

This prototype does **not** calculate CPCB AQI from CAMS fields. That would be an invalid substitution because the averaging periods, available pollutants, standards and source types differ.

The Government of India's data.gov.in page for “Real time Air Quality Index from various locations” describes hourly field-instrument data and warns that abnormal values can occur. During this product review (26 November 2026), the page stated: “The API for this resource does not exist.” That is why this version links to the government dataset page instead of pretending to consume a direct official feed.

Official references:
- CPCB National AQI explainer: https://app.cpcbccr.com/ccr_docs/About_AQI.pdf
- data.gov.in resource: https://www.data.gov.in/resource/real-time-air-quality-index-various-locations
- CPCB air-quality portal: https://airquality.cpcb.gov.in/

### 3.6 Generative AI explanation service

VayuGuard's Air Guide uses Google's Gemini API through a Cloudflare Worker. The current configured model is `gemini-3.8-flash`.

Request path:
1. The visitor types a question and presses **Send** in the Air Guide.
2. The browser sends the question, selected language and a deliberately limited context packet to the Worker.
3. The Worker validates and normalises the question/context fields, applies a Cloudflare rate-limit binding, and calls Google's `generateContent` endpoint.
4. The Worker returns the generated answer to the browser. The Gemini API key remains in Cloudflare's encrypted Worker secret store; it is never shipped in the static site.
5. The frontend labels the connected model and displays a live response marker.

Context packet fields:
- selected area display name (not precise latitude/longitude);
- modelled U.S. AQI value and category;
- leading pollutant-specific U.S. AQI sub-index;
- six available pollutant concentration estimates;
- local wind speed and relative humidity, when present;
- forecast fetch timestamp and up to 24 future hourly modelled U.S. AQI values.

The model receives a fixed system instruction that explicitly distinguishes CAMS Global modelled U.S. AQI from CPCB National AQI and official CPCB station observations. It must not invent missing readings, promise a lower forecast hour is safe, diagnose a health condition, calculate personal exposure dose or recommend medication changes. It can only explain the context supplied by the app and general air-quality concepts; it does not browse the web or fetch other live sources.

Security controls include:
- Gemini key stored as a GitHub Actions secret and then uploaded to Cloudflare as an encrypted Worker secret.
- API key used only in a server-to-server request header; never embedded in client JavaScript.
- CORS allow-list limited to the production GitHub Pages origin and local development origins.
- Question length and request-body bounds.
- Cloudflare Worker rate-limit binding configured for 8 requests per minute per client IP within each Cloudflare location. Cloudflare documents this as approximate and location-local, not a strict global quota.
- No prompt/response logging in the Worker code.
- The browser receives generated text only; the Gemini provider/model label is returned with the response.

The deployment workflow requires GitHub repository secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, in addition to the existing `GEMINI_API_KEY`. It deploys the Worker, synchronises the Gemini secret and writes the resulting Worker URL into the public `ai-config.js` file. The endpoint URL is public by design; the Gemini API key is not.

## 4. What each calculation means

### 4.1 Current modelled U.S. AQI

The interface chooses the latest hourly timestamp that is not later than the browser's current time, when available. It displays the corresponding modelled U.S. AQI and pollutant concentrations. The “forecast fetched” label records when the browser fetched the response; it is not represented as a station-measurement timestamp.

U.S. AQI category labels follow the categories documented by Open-Meteo:
- 0–50: Good
- 51–100: Moderate
- 101–150: Unhealthy for sensitive groups
- 151–200: Unhealthy
- 201–300: Very unhealthy
- 301–500: Hazardous

The index is not India's CPCB National AQI. The dashboard makes that distinction visible.

### 4.2 Leading pollutant-specific signal

For the selected hourly slot, the app compares the available pollutant-specific U.S. AQI sub-indices returned by the API:
- PM2.5
- PM10
- NO2
- O3
- SO2
- CO

The largest available value is shown as the leading model signal. This is not source apportionment, chemical analysis or proof of which nearby activity caused pollution. If pollutant-specific sub-index fields are missing, the app does not fabricate them.

### 4.3 Five-day summary

For each calendar day in the forecast response, the interface calculates:
- daily descriptive mean: arithmetic mean of returned hourly `us_aqi` values;
- daily high: maximum returned hourly `us_aqi`.

These are forecast summaries, not CPCB daily station AQIs or regulatory 24-hour averages. Hourly model fields may represent a forecast grid and should not be treated as a regulatory averaging series.

### 4.4 Activity-window finder

The planner takes future hourly modelled U.S. AQI values and sorts them in ascending order. It returns a small set of lower-valued hours, along with the chosen activity and duration.

It does not calculate personal inhaled dose, biological response, health risk, a safe threshold, or a route-specific exposure estimate. Lower forecast values are relative to the selected location and forecast period only.

### 4.5 Room air-cleaner sizing helper

The indoor section includes a simple planning calculator:

`estimated clean-air delivery (m³/h) = room floor area (m²) × ceiling height (m) × user-selected air changes per hour`

The result is also converted to cubic feet per minute using approximately 1 m³/h = 0.5886 CFM. For example, an 18 m² room with a 2.7 m ceiling and a user-selected target of 4 ACH gives 194.4 m³/h (about 115 CFM).

The chosen ACH is an input, not a universal health standard or app recommendation. The calculation does not consider leakage, mixing, furniture, filter bypass, fan speed, outdoor air exchange or pollutant generation. It does not certify a device. EPA guidance says to match a cleaner's CADR and manufacturer's room-size recommendation to the space; a higher CADR generally serves a larger area. For small particles, EPA points consumers to a high smoke CADR or HEPA designation. For gases, an activated-carbon or other appropriate sorbent is needed; particle filtration alone does not automatically remove gases. Avoid devices that intentionally generate ozone.

References:
- EPA Guide to Air Cleaners in the Home: https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home
- EPA Air Cleaners and HVAC Filters: https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-hvac-filters-and-respiratory-viruses

### 4.6 Respirator education

The indoor guidance includes a short, non-prescriptive explanation that a properly fitted, certified particulate respirator can reduce particle inhalation when used correctly, but filtering facepiece respirators do not protect against gases or vapours. Fit/seal and the product's applicable certification matter. The prototype does not recommend a particular product, determine medical suitability or replace occupational respiratory-protection requirements.

Reference:
- CDC / NIOSH Filtering Facepiece Respirators: https://www.cdc.gov/niosh/ppe/respirators/ffr.html

### 4.7 Household context

Household name, home type, cooking arrangement, purifier availability, simple routine labels and checklist completion are stored using browser local storage. They do not leave the browser. The prototype intentionally avoids collecting health diagnoses, symptoms, medication or sensitive personal details.

### 4.8 Indoor source-control checklist

Selected source labels produce a practical checklist:
- incense / dhoop;
- mosquito coils;
- smoking / vaping;
- cooking without extraction;
- frequent dry sweeping;
- dampness / visible mould;
- renovation or construction dust.

These are reminders to reduce or manage sources. They are not sensor readings, indoor PM2.5 estimates or building inspections.

### 4.9 Commute comparison

The illustrative passenger-kilometre factors used by the calculator are:
- petrol car: 192 g CO2 / passenger-km;
- petrol two-wheeler: 72 g CO2 / passenger-km;
- bus: 89 g CO2 / passenger-km;
- metro: 45 g CO2 / passenger-km;
- carpool with two occupants: 96 g CO2 / passenger-km;
- walking/cycling: 0 operational tailpipe emissions.

Formula:

`weekly CO2 estimate = one-way distance × 2 × travel days × factor ÷ 1000`

These factors are illustrative defaults, not verified local fleet factors. Actual emissions vary by vehicle age, fuel, load, occupancy, route, congestion, driving style and electricity mix. Upstream fuel, electricity and vehicle lifecycle emissions are excluded. The calculator is not a measure of a commuter's personal air-pollution exposure.

### 4.10 Browser-local alert

The visitor chooses a U.S. AQI threshold and explicitly grants browser notification permission. When a forecast is loaded or refreshed while the page is open, the app checks the currently selected modelled value and may show a local notification if the threshold is met.

This is not a remote push-notification system. It does not provide reliable background delivery, does not monitor continuously while the browser is closed and does not replace official emergency alerts.

### 4.11 Citizen report note

The report helper creates a local draft containing the selected source category, user-entered location, observation time and description. It copies the note to the clipboard. Nothing is submitted to CPCB, SAMEER or any other authority by the app. The user must review the information and use the official route.

Safety principle: users should not trespass, confront suspected polluters or approach dangerous smoke, traffic or industrial activity to collect evidence.

## 5. Health guidance and interpretation

WHO's 2021 Global Air Quality Guidelines provide concentration guideline levels for key pollutants and specify averaging periods. Those guideline values are not interchangeable with an hourly U.S. AQI value, and VayuGuard does not calculate compliance with WHO annual or 24-hour guideline levels from a single hourly model field.

Reference: https://www.who.int/publications/i/item/9789240034228

Public guidance in this prototype is intentionally general:
- reduce or avoid prolonged strenuous outdoor activity during higher pollution conditions;
- consider the needs of people more sensitive to air pollution;
- keep indoor environments smoke-free and reduce combustion sources;
- ventilate when outdoor conditions are comparatively better while accounting for weather, safety and building circumstances;
- follow official local advisories and qualified health guidance.

The application does not diagnose, treat, assess individual susceptibility or promise that an activity is safe.

## 6. User experience and interaction design

### Competitive interface review (26 November 2026)

The review considered product and help pages from IQAir AirVisual, EPA AirNow, OpenAQ Explorer, Google's Air Quality API, Plume Flow and the World Air Quality Index project. The application does not copy a competitor's visual identity; it translates useful interaction patterns into a different, source-honest product.

- **IQAir AirVisual:** product information describes current local air, multiple pollutant detail, 7-day forecasts, smart alerts, broad location coverage and monitor/purifier integration. The visual lesson is that an AQI number needs supporting pollutant detail, forecast context and location controls—not a decorative number alone. VayuGuard uses a compact current reading, six pollutant cards, a daily outlook, saved locations and a visible model-data label. It does not claim IQAir's monitor network or coverage. Reference: https://www.iqair.com/in-en/air-quality-monitors/air-quality-app
- **EPA AirNow:** its help pages explain the local current AQI dial alongside the update time, primary pollutant, steps to reduce exposure, other pollutants, forecasts, recent trends and routes to maps/monitors. The lesson is to make the current status and the next useful action immediately legible. VayuGuard places the current model reading, dominant model sub-index, plain-language interpretation and forecast windows at the top. It does not use an AirNow dial or claim EPA monitoring. Reference: https://www.airnow.gov/how-to-use-this-site/
- **OpenAQ Explorer:** its workflow uses place search, a map, monitor/sensor filters, provider selection and a detail panel with latest readings and patterns. It distinguishes reference-grade monitors from smaller air sensors and exposes raw pollutant measurements rather than silently turning them into an AQI. The lesson for VayuGuard is provenance-first presentation: model estimates, station measurements and sensor data must have visually distinct labels. The current VayuGuard prototype has no station map, so it does not invent monitor dots or neighbourhood-level readings. Reference: https://explore.openaq.org/getting-started
- **Google Maps Platform Air Quality API:** documentation describes current conditions, hourly history for up to 30 days, hourly forecasts up to 96 hours, heatmap tiles and pollutant/health-recommendation details, with coverage-dependent air-quality indexes and a documented 500 × 500 m resolution. This informed a future-oriented hierarchy of now, trend, outlook and pollutant context. It is not integrated into this static app; the current data contract remains Open-Meteo CAMS Global. Reference: https://developers.google.com/maps/documentation/air-quality/overview
- **Plume Flow:** this is now a historical design reference—Plume states Flow and Flow 2 are no longer for sale. The documented product emphasized indoor/outdoor exposure, time and place, maps and route comparisons. VayuGuard borrows the principle that air information should connect to everyday routines, but it does not claim personal sensor exposure or cleanest-street routing. Reference: https://plumelabs.com/en/flow/
- **World Air Quality Index project:** its published app-history material describes station maps, pollutant graphs, wind conditions, forecasts, widgets and threshold notifications. This supports a product principle: users benefit from seeing weather and pollutant changes alongside an index, but any station or forecast source needs to remain explicit. Reference: https://aqicn.org/faq/

**Design decisions from the review:** keep the current reading and main interpretation above the fold; show the pollutant breakdown as a compact set of comparable data tiles; give forecasts their own visual hierarchy; allow fast place switching; make actionable guidance discoverable; and distinguish model data from official observations in the interface itself. Do not add a map, station ranking, trend history or sensor state unless an appropriate data source exists.

### VayuGuard visual system — Human Field Journal

The latest visual pass responds to product feedback that the earlier neutral dashboard felt too much like a generic collection of white SaaS cards and that labels were too small. The new direction is a **Human Field Journal**: an environmental field desk with warmer paper-like surfaces, expressive data colour and a chart that feels like a real instrument panel.

- **Warm city-paper canvas:** sage-grey background with subtle light gradients, replacing the flat white work surface.
- **Deep forest navigation:** retains the dark identity rail and lime active-state marker, with clear icons, bigger labels and consistent hit areas.
- **A hero with a human voice:** the current model summary and plain-language interpretation are larger and easier to scan, with the data type visible rather than hidden in a footnote.
- **Pollutant tiles as a visual family:** six distinct, softly tinted pollutant cards use a clear typographic scale, consistent units and a small colour cue for faster comparison.
- **Weather as a supporting strip:** wind and humidity are presented as legible context, not competing hero metrics.
- **A real forecast instrument:** the 24-hour chart uses a dark forest surface, a lime forecast curve, a soft area fill, larger axis labels and a small number of readable time ticks.
- **A warm planning companion:** the relatively lower-hour list uses a parchment/amber surface and clear time/value rows. It never labels a lower hour as safe.
- **A more human daily outlook:** the five-day tiles use a restrained palette of sage, ochre, clay, teal and muted violet to help each day read as a separate card.
- **Readable everywhere:** body copy, form controls, chart labels and supporting notes were increased; responsive layouts keep the chart and comparison panels usable on narrow screens.
- **Consistent interaction:** forms, alerts, chips, location controls, quick actions, keyboard focus, reduced motion and mobile behaviour share one design system.

### Indoor air page treatment

The Indoor Air workspace now follows the same Human Field Journal system without simply repeating the dashboard cards:

- A warm, paper-toned room guide presents kitchen, bedroom, living-space and whole-home actions as four clearly numbered room entries with consistent iconography.
- A deep-forest source-audit panel provides seven selectable household source categories. Selection state and a progress count are visible immediately; a concise, numbered action list is generated from the selected sources.
- The source-audit choices are stored only in browser local storage under a separate key. They are not transmitted to an API.
- The room guide and source audit use a fixed two-column `minmax(0,...)` layout at wide widths and collapse to one column at narrower widths. This prevents the source panel from being cut off by intrinsic grid sizing.
- Equipment guidance uses warm, differentiated cards for room sizing, CADR/filter basics, respirator limitations and source-first practices. The CADR helper remains an arithmetic illustration, not a device recommendation or certification.

The intent is not to imitate a competitor's screen. It is to combine AirNow's immediate "current air → primary pollutant → what to do" hierarchy, IQAir's auto-location/forecast/alert discovery, OpenAQ's source-aware data presentation and Google Air Quality's now/history/forecast mental model into a distinct, calmer product.


## 7. Privacy and security controls

- No sign-in or server-side profile store.
- No private API credentials in the frontend.
- The Gemini API key is stored as an encrypted Cloudflare Worker secret. The static page contains only the public Worker endpoint URL.
- When the visitor submits an Air Guide question, the prompt and selected-area forecast context packet are sent to Cloudflare and Google Gemini. Precise device latitude/longitude is not included in this AI packet.
- The application does not collect AI chat history into an account or server-side user profile. The current conversation remains in the active browser page only.
- Local preferences are stored in local storage.
- Place-name search uses Open-Meteo Geocoding. When the visitor explicitly uses browser geolocation, current coordinates are also sent directly from the browser to BigDataCloud's free reverse-geocoding endpoint to resolve a visible locality/city label. Its documented IP-and-coordinate aggregation practice is described in section 3.4.
- The optional **Use my location** button calls the browser Geolocation API only after a user click. Browser permission is required; denied, unavailable, timed-out and insecure-context cases show an explanatory message.
- Device-derived coordinates are held in the active page session and are not written to the persistent forecast cache by that request. A visitor may explicitly choose **Save place** to add the current location to the browser-local saved-place list.
- Citizen report notes are not transmitted by the app.
- Browser notifications are opt-in and use the visitor's browser permission.

For production, add a privacy notice, retention policy, backend request limits, logging rules, security review and data protection assessment before collecting accounts, precise histories, or uploaded evidence.

## 8. Quality checks and known gaps

Before treating the app as operational public infrastructure, conduct:
1. API schema checks and graceful handling of missing pollutant arrays.
2. Automated category-boundary tests for AQI breakpoints.
3. Time-zone and daylight-saving tests for forecast-hour grouping.
4. Model-versus-monitor validation across urban and rural locations.
5. Offline, timeout, stale-data and API outage tests.
6. Screen-reader, keyboard, contrast and mobile accessibility checks.
7. Hindi translation review by fluent speakers.
8. Privacy, threat-model and public-health content review.

Known gaps:
- no official CPCB station feed;
- no independent sensor network;
- no historical personal or station time series;
- no street-level map, route optimisation or source-attribution layer;
- no shared backend profile store, forecast cache or scheduled push alerts;
- the Gemini assistant requires the separate Cloudflare Worker deployment and its encrypted Gemini secret to be active;
- commute factors are illustrative;
- no indoor sensor integration.

## 9. Future architecture (only after data and permissions are secured)

A responsible next version should separate the data types:
- **Model forecast service:** CAMS model run, grid resolution, response time, forecast horizon and model version.
- **Official station service:** station ID, source agency, observation timestamp, pollutant, averaging period, unit, completeness and quality flag.
- **Index service:** independent CPCB National AQI computation only from valid observations and required averaging periods; never relabel modelled U.S. AQI.
- **Notification service:** opt-in preferences, threshold policy, quiet hours, delivery status and abuse protections.
- **Community-report service:** only after official API/partner permission, clear consent, secure evidence handling and transparent acknowledgement/status integration.
- **Decision layer:** routine guidance linked to provenance and uncertainty, with no health diagnosis or safety guarantee.

This separation is the foundation for a credible product rather than a visually impressive but untrustworthy dashboard.

## 10. Primary references

1. Open-Meteo Air Quality API: https://open-meteo.com/en/docs/air-quality-api
2. Open-Meteo Weather Forecast API: https://open-meteo.com/en/docs
3. Open-Meteo Geocoding API: https://open-meteo.com/en/docs/geocoding-api
4. IQAir AirVisual app: https://www.iqair.com/air-quality-monitors/air-quality-app
5. Plume Labs Air: https://plumelabs.com/air/
6. AirNow mobile app: https://smoke.airnow.gov/airnow-mobile-app/
7. CPCB National AQI method: https://app.cpcbccr.com/ccr_docs/About_AQI.pdf
8. Government of India real-time AQI resource: https://www.data.gov.in/resource/real-time-air-quality-index-various-locations
9. CPCB citizen complaint guidance: https://cpcb.nic.in/air/Citizen_Guideliines_Air_Complaints.pdf
10. OpenAQ platform: https://openaq.org/platform/
11. OpenAQ API overview: https://docs.openaq.org/about/about
12. WHO 2021 Global Air Quality Guidelines: https://www.who.int/publications/i/item/9789240034228
13. Gemini API documentation: https://ai.google.dev/gemini-api/docs
14. Cloudflare Workers GitHub Actions deployment: https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
15. Cloudflare Workers rate limiting: https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
13. BigDataCloud free client-side reverse geocoding and privacy: https://www.bigdatacloud.com/docs/article/why-is-reverse-geocoding-api-free
14. BigDataCloud JavaScript client field reference and fair-use policy: https://github.com/bigdatacloudapi/js-reverse-geocode-client
13. EPA Guide to Air Cleaners in the Home: https://www.epa.gov/indoor-air-quality-iaq/guide-air-cleaners-home
14. CDC / NIOSH Filtering Facepiece Respirators: https://www.cdc.gov/niosh/ppe/respirators/ffr.html
