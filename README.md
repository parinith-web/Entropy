# Entropy — Live Medical Stress Index

> Real-time hospital surge predictions for Indian regions, powered by AI.

🔗 **Live:** [entropy-in.vercel.app](https://entropy-in.vercel.app)

---

## What is Entropy?

Entropy is a predictive intelligence platform that tracks and forecasts **medical stress levels** across government hospitals in India. It surfaces real-time risk signals so that patients, caregivers, and health administrators can make informed decisions before a hospital visit.

Predictions are generated **every 3 hours**, forecasting the expected hospital load for the **next 3-hour window** — giving actionable, near-term insight rather than vague long-range estimates.

---

## Current Features

- **Live Medical Stress Index** — a continuously updated score reflecting current hospital load conditions
- **AI-Powered Surge Predictions** — models trained on multiple contributing factors to predict hospital stress 3 hours ahead
- **3-Hour Refresh Cycle** — predictions are recalculated every 3 hours for accuracy and relevance
- **Multi-Factor Analysis** — predictions factor in variables such as time of day, day of week, seasonal patterns, historical admission trends, and regional disease activity
- **Government Hospital Coverage** — currently covers government hospital data across Indian regions
- **Web Interface** — clean, accessible frontend for real-time monitoring

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | TypeScript, HTML, CSS |
| Backend | Python |
| ML / Analysis | Jupyter Notebooks, scikit-learn / ML libraries |
| Deployment | Vercel (frontend) |
| CI/CD | GitHub Actions |

---

## Project Structure

```
Entropy/
├── frontend/          # TypeScript web interface
├── backend/           # Python prediction API
├── docs/              # Documentation
└── .github/workflows/ # CI/CD pipelines
```

---

## Getting Started

### Prerequisites

- Node.js (for frontend)
- Python 3.9+ (for backend)

### Run Locally

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

**Backend**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

---

## Roadmap & Future Improvements

These are the planned upgrades for upcoming versions:

- **Nationwide Healthcare Data** — expand beyond government hospitals to include private hospitals, clinics, and diagnostic centres across India
- **Docker Deployment** — containerise the full stack (frontend + backend + model) for reproducible, one-command deployment
- **Region-Wise Analysis** — dedicated dashboards and stress indices broken down by state, district, and city
- **Area-Based Feed** — personalised feed that surfaces predictions relevant to a user's location or selected area
- **Real-Time Data Pipelines** — direct integrations with health department APIs and HMIS systems for live data ingestion
- **Mobile App** — iOS and Android app for on-the-go access and push alerts when nearby hospitals reach critical stress levels
- **Alert System** — configurable notifications for when a hospital or region crosses a stress threshold
- **Historical Trend Viewer** — explore past stress patterns to identify recurring surges (weekends, festivals, monsoon season, etc.)
- **Model Explainability** — surface which factors are driving a prediction so users can understand the "why" behind the index
- **Open Data API** — public REST API for researchers, NGOs, and health departments to consume Entropy's predictions

---

## Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE)
