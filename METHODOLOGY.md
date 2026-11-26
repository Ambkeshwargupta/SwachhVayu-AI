# VayuGuard — Data, calculations and safety methodology

## 1. Outdoor air-quality data

The frontend requests the following hourly fields from the Open-Meteo Air Quality API:
- `us_aqi` — modelled United States Air Quality Index.
- `pm2_5` — modelled PM2.5 concentration in µg/m³.
- `pm10` — modelled PM10 concentration in µg/m³.

The app requests current wind speed and relative humidity from the Open-Meteo Forecast API. Place names are resolved using the Open-Meteo Geocoding API.

**Important distinction:** these are modelled products, not direct readings from an official monitoring station. The interface labels the index as modelled US AQI. It must not be described as India's CPCB National AQI. The US AQI and CPCB AQI are different scales with different breakpoints and should not be compared as if they were interchangeable.

## 2. Activity-window comparison

The daily planner sorts the next 24 available hourly modelled US AQI values and displays the four lowest. It is a relative time comparison only. It does not establish that a time is safe and does not account for a person's medical history, route, indoor/outdoor microenvironment, breathing rate or measured personal exposure.

## 3. Scenario explorer

The demonstration index is:

`relative activity index = modelled US AQI proxy × outdoor activity minutes × intensity factor`

The illustrative intensity factors are:
- Light: 0.75
- Moderate: 1.00
- High: 1.50

These are demonstration weights, not validated physiological multipliers. The result is **not** inhaled dose, pollutant concentration, clinical risk, a personal exposure estimate or an indoor PM2.5 prediction. Moving an activity indoors removes it from the *outdoor activity index* only; indoor air may still be polluted.

## 4. Commute comparison

The UI uses the following illustrative default factors in grams of CO₂ per passenger-kilometre:
- Petrol car: 192
- Petrol two-wheeler: 72
- Bus: 89
- Metro: 45
- Carpool (two occupants): 96
- Walk/cycle: 0 operational tailpipe emissions

The weekly estimate is:

`weekly CO₂ = one-way distance × 2 × commute days × factor ÷ 1000`

These defaults are not verified local fleet averages. Actual emissions vary by vehicle, fuel, occupancy, route, operating conditions and electricity mix. Upstream and lifecycle emissions are excluded. The calculator is not a personal pollution-exposure model.

## 5. Indoor air guidance

The indoor module gives source-control reminders only. It does not infer indoor PM2.5 from outdoor readings and does not simulate room-level concentrations. Guidance includes avoiding indoor combustion and smoke sources, using appropriate kitchen extraction, damp-cleaning dusty surfaces, addressing moisture and maintaining correctly sized particle filtration where used.

## 6. AI assistant

Vayu Mitra currently uses deterministic, keyword-based guidance. It uses the loaded forecast values only for simple factual responses and does not generate new sensor readings. It is not a diagnostic or treatment tool.

A future generative AI implementation should:
- Call the model through a secured backend, not a public browser key.
- Ground numeric claims in structured data supplied by the application.
- Clearly distinguish modelled forecasts, station observations and user-reported conditions.
- Validate output, rate-limit requests and log operational failures without retaining unnecessary personal data.
- Refuse to make medical diagnoses or promise safety.

## 7. Privacy and storage

Household profile, member nicknames and checklist progress are stored in the visitor's browser using local storage. The current prototype has no user accounts or server-side profile database. Avoid entering sensitive health details, especially on shared devices.

## 8. Safety statement

VayuGuard is an educational decision-support prototype, not a medical device, diagnostic tool or emergency service. Forecasts are uncertain and can change. Follow local public-health advisories and seek qualified medical guidance for health concerns. In an emergency, contact local emergency services.

## Source documentation
- [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api)
- [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
- [Open-Meteo Geocoding API](https://open-meteo.com/en/docs/geocoding-api)
