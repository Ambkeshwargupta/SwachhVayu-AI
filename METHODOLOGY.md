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

Plume Labs presents pollution peaks and comparatively cleaner moments, street-level maps, and a Flow companion experience with exposure history and commute-route context.

**VayuGuard decisions:** make the next useful time window easy to find and connect the forecast to routines. Do not claim street-by-street resolution or a lowest-exposure route from a global forecast grid of roughly 45 km.

Reference: https://plumelabs.com/air/

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

### 3.4 Official Indian station information

India's National AQI is published by CPCB and uses a distinct index framework. CPCB describes eight pollutants: PM10, PM2.5, NO2, SO2, CO, O3, NH3 and Pb. The highest relevant pollutant sub-index determines the overall AQI; the six categories are Good, Satisfactory, Moderately polluted, Poor, Very Poor and Severe.

This prototype does **not** calculate CPCB AQI from CAMS fields. That would be an invalid substitution because the averaging periods, available pollutants, standards and source types differ.

The Government of India's data.gov.in page for “Real time Air Quality Index from various locations” describes hourly field-instrument data and warns that abnormal values can occur. During this product review (26 November 2026), the page stated: “The API for this resource does not exist.” That is why this version links to the government dataset page instead of pretending to consume a direct official feed.

Official references:
- CPCB National AQI explainer: https://app.cpcbccr.com/ccr_docs/About_AQI.pdf
- data.gov.in resource: https://www.data.gov.in/resource/real-time-air-quality-index-various-locations
- CPCB air-quality portal: https://airquality.cpcb.gov.in/

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

### 4.5 Household context

Household name, home type, cooking arrangement, purifier availability, simple routine labels and checklist completion are stored using browser local storage. They do not leave the browser. The prototype intentionally avoids collecting health diagnoses, symptoms, medication or sensitive personal details.

### 4.6 Indoor source-control checklist

Selected source labels produce a practical checklist:
- incense / dhoop;
- mosquito coils;
- smoking / vaping;
- cooking without extraction;
- frequent dry sweeping;
- dampness / visible mould;
- renovation or construction dust.

These are reminders to reduce or manage sources. They are not sensor readings, indoor PM2.5 estimates or building inspections.

### 4.7 Commute comparison

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

### 4.8 Browser-local alert

The visitor chooses a U.S. AQI threshold and explicitly grants browser notification permission. When a forecast is loaded or refreshed while the page is open, the app checks the currently selected modelled value and may show a local notification if the threshold is met.

This is not a remote push-notification system. It does not provide reliable background delivery, does not monitor continuously while the browser is closed and does not replace official emergency alerts.

### 4.9 Citizen report note

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

The current redesign intentionally moves away from generic AI/SaaS visual conventions:
- editorial typography and a restrained civic/environmental palette;
- direct air briefing as the first screen, not an AI chatbot;
- visible labels for modelled data and index type;
- short, task-oriented navigation;
- actionable planning, location watchlist, household, indoor, commute and civic-report sections;
- English and Hindi UI;
- browser print view for saving a briefing;
- responsive layout and reduced-motion preference support;
- browser-local storage with no account requirement.

The design aims to reduce the number of steps between looking up a location and taking an action.

## 7. Privacy and security controls

- No sign-in or server-side profile store.
- No private API credentials in the frontend.
- Local preferences are stored in local storage.
- Geocoding and forecast calls send the searched coordinates to public Open-Meteo endpoints.
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
- no backend cache or scheduled push alerts;
- no generative AI model integration;
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
