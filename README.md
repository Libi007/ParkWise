# ParkWise — Smart Parking Occupancy Prediction System

ParkWise is a full-stack, machine learning-driven web application designed to forecast parking facility occupancy across 11 capacity-stable monitored facilities in The Hague / Scheveningen, Netherlands.

The system integrates a tuned **LightGBM regression pipeline** serialized in Python with a **Flask REST API**, **SQLite/SQLAlchemy database**, and a responsive **React + Vite + TypeScript + Tailwind CSS** frontend.

---

## 1. System Architecture

```
                                  ┌────────────────────────┐
                                  │   Browser / Client     │
                                  │  React + Vite + TS     │
                                  │  Tailwind CSS          │
                                  └───────────┬────────────┘
                                              │ REST (Axios)
                                              ▼
                                  ┌────────────────────────┐
                                  │    Flask Backend       │
                                  │    API v1 Endpoints    │
                                  └─────┬────────────┬─────┘
                                        │            │
                    SQLAlchemy ORM      │            │ Pickle Pipeline
                                        ▼            ▼
                           ┌────────────────┐   ┌─────────────────────────┐
                           │ SQLite DB      │   │ LightGBM Pipeline       │
                           │ - facilities   │   │ - OneHotEncoder (PFxx)  │
                           │ - predictions  │   │ - Passthrough Numerics  │
                           └────────────────┘   │ - LGBMRegressor         │
                                                └─────────────────────────┘
```

---

## 2. Monorepo Directory Structure

```
Project (ParkWise)/
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts           # Centralized Axios client
│   │   ├── components/
│   │   │   ├── ConfirmationModal.tsx
│   │   │   ├── EditFacilityModal.tsx
│   │   │   ├── ErrorAlert.tsx
│   │   │   ├── LoadingSkeleton.tsx
│   │   │   ├── OccupancyGauge.tsx
│   │   │   ├── PredictionResultCard.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── StatusBadge.tsx
│   │   ├── layouts/
│   │   │   └── AppLayout.tsx       # Sidebar navigation and system status
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx   # Operational dashboard with real history charts
│   │   │   ├── PredictionPage.tsx  # Forecast generator with facility presets
│   │   │   ├── FacilitiesPage.tsx  # Display name editor and active status toggle
│   │   │   ├── HistoryPage.tsx     # Filterable paginated forecast history
│   │   │   └── NotFoundPage.tsx    # 404 handler
│   │   ├── types/
│   │   │   └── index.ts            # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── formatters.ts       # Date and badge theme formatters
│   │   ├── App.tsx                 # Route configuration
│   │   └── main.tsx                # React DOM mount
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── .env.example
├── backend/
│   ├── app/
│   │   ├── __init__.py             # Application factory & CORS
│   │   ├── config.py               # Environment configuration
│   │   ├── extensions.py           # SQLAlchemy, Migrate, CORS
│   │   ├── models/
│   │   │   ├── facility.py         # Monitored parking facilities model
│   │   │   └── prediction.py       # Past forecast history model
│   │   ├── routes/
│   │   │   ├── health.py           # /health and /health/ready probes
│   │   │   ├── facilities.py       # /facilities endpoints (list, get, patch)
│   │   │   └── predictions.py      # /predictions and /predictions/history
│   │   ├── services/
│   │   │   ├── facility_service.py # Idempotent seeding & facility queries
│   │   │   ├── model_service.py    # LightGBM pipeline inference & status
│   │   │   └── timezone_service.py # Timezone normalization (Europe/Amsterdam)
│   │   ├── schemas/
│   │   │   └── validators.py       # Input schema validation
│   │   └── utils/
│   │       └── responses.py        # Consistent JSON response utilities
│   ├── artifacts/
│   │   └── parkwise_lightgbm_model.pkl # Trained LightGBM model pipeline
│   ├── tests/
│   │   ├── conftest.py             # Test fixtures
│   │   ├── test_app_startup.py     # Liveness and readiness tests
│   │   ├── test_facilities_api.py  # Facility seeding and patch tests
│   │   ├── test_model_service.py   # Inference, clipping, and status tests
│   │   ├── test_prediction_history.py # Pagination and filtering tests
│   │   ├── test_predictions_api.py # Prediction endpoint validation
│   │   └── test_temporal_features.py  # Timezone and 7-feature derivation
│   ├── pytest.ini
│   ├── requirements.txt
│   ├── .env.example
│   └── run.py                      # Flask development entrypoint
├── .gitignore
└── README.md
```

---

## 3. Machine Learning Model Integration

The model artifact `backend/artifacts/parkwise_lightgbm_model.pkl` is an `sklearn.pipeline.Pipeline` consisting of:
1. `preprocessor`: `ColumnTransformer` with `OneHotEncoder(handle_unknown='ignore')` applied to `facility_label` and `passthrough` for 6 numeric features.
2. `model`: `LGBMRegressor` tuned with:
   - `n_estimators`: 300
   - `learning_rate`: 0.03
   - `max_depth`: 6
   - `num_leaves`: 31
   - `min_child_samples`: 100
   - `colsample_bytree`: 0.8
   - `reg_alpha`: 0.5
   - `reg_lambda`: 1.0

### Exact Model Features
The backend automatically derives all 7 inputs from the database and the requested timestamp:
```python
FEATURES = [
    "facility_label",      # Stable identifier: 'PF01' through 'PF11'
    "reference_capacity",  # Trusted space capacity from database
    "time_slot",           # (hour * 4) + (minute // 15), range 0–95
    "day_of_week",         # Monday = 0 through Sunday = 6
    "is_weekend",          # 1 if Saturday or Sunday, else 0
    "month",               # 1 through 12
    "day_of_year"          # 1 through 366
]
```

### Invariant Space Calculation
```python
raw_prediction = pipeline.predict(df)[0]
occupancy_percentage = np.clip(raw_prediction, 0.0, 100.0)
occupied_spaces = round(reference_capacity * occupancy_percentage / 100)
available_spaces = reference_capacity - occupied_spaces
# Guaranteed: occupied_spaces + available_spaces == reference_capacity
```

### Parking Status Thresholds
- **Low**: < 40% occupancy
- **Moderate**: 40% to < 75% occupancy
- **High**: 75% to < 90% occupancy
- **Nearly Full**: 90% to 100% occupancy

---

## 4. Timezone Handling

- **Facility Dataset Origin**: The Hague / Scheveningen, Netherlands (`Europe/Amsterdam`).
- **Configuration**: Configurable via `PARKWISE_TIMEZONE` (defaults to `Europe/Amsterdam`).
- **Timestamp Parsing**:
  - Timestamps with timezone offsets (e.g. `2026-10-20T10:30:00+02:00` or `Z`) are normalized to `Europe/Amsterdam`.
  - Timestamps without explicit offsets are treated as local `Europe/Amsterdam` time.
  - Daylight-saving transitions (CET $\leftrightarrow$ CEST) are automatically handled by Python's `zoneinfo.ZoneInfo`.
  - Historical records are stored with timestamps in UTC for unambiguous cross-timezone querying.

---

## 5. Quickstart Guide: Running Locally

### Prerequisites
- Python 3.10+ (tested on Python 3.14 with scikit-learn 1.6.1)
- Node.js 18+ and npm 9+

---

### Step A: Backend Setup

1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Linux / macOS
   python3 -m venv venv
   source venv/bin/activate

   # Windows
   python -m venv venv
   venv\Scripts\activate
   ```

3. Install required Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. Create the environment configuration:
   ```bash
   cp .env.example .env
   ```

5. Run automated backend tests (22 test suite):
   ```bash
   pytest -v
   ```

6. Start the Flask API server:
   ```bash
   python run.py
   ```
   The API will start at `http://127.0.0.1:5000`. Database tables and 11 facilities seed automatically on startup.

---

### Step B: Frontend Setup

1. Open a second terminal in the `frontend/` directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Create the frontend environment configuration:
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   Open your browser to: `http://localhost:5173`

5. (Optional) Run the production build check:
   ```bash
   npm run build
   ```

---

## 6. Seeded Facilities Specification

| Code | Initial Display Name | Source UUID | Trusted Capacity |
|---|---|---|---:|
| **PF01** | Parking Facility 01 | 3ac12f33-cd9d-43a2-a595-67c3262cd25f | 84 |
| **PF02** | Parking Facility 02 | 81155f5d-497d-4bf3-b7b5-e9912ba75632 | 27 |
| **PF03** | Parking Facility 03 | 816c56b2-a5de-449f-a66a-eadddc1432fb | 71 |
| **PF04** | Parking Facility 04 | 9c0bb2df-8c90-4476-91bc-8b9b34c75133 | 112 |
| **PF05** | Parking Facility 05 | a668360d-b4c6-45ca-a2ab-16d5d0641dbe | 24 |
| **PF06** | Parking Facility 06 | e1f4421c-81c4-4daf-944b-e73dfc36d5e4 | 104 |
| **PF07** | Parking Facility 07 | ecea9356-1026-4afc-98eb-dda9a63e187a | 94 |
| **PF08** | Parking Facility 08 | efd74fae-42ce-4321-813b-80b57f2bfdd4 | 243 |
| **PF09** | Parking Facility 09 | fbf36ac7-f492-4017-b834-142a326c8703 | 250 |
| **PF10** | Parking Facility 10 | 2cc6b90a-8460-4b11-a52e-5f9319ffd64b | 499 |
| **PF11** | Parking Facility 11 | 2e7daa83-19e3-4133-8d57-3911d7681d40 | 238 |

Display names can be customized via the UI without modifying database capacity or stable model input labels.
Seeding is idempotent: custom display names survive application restarts.

---

## 7. Production WSGI Deployment

For production deployments, execute the Flask application using Gunicorn:

```bash
cd backend
venv/bin/gunicorn --workers 4 --bind 127.0.0.1:5000 "app:create_app('production')"
```

Configure a reverse proxy (e.g. Nginx or Caddy) to:
- Serve static assets from `frontend/dist`
- Proxy `/api/` traffic to `http://127.0.0.1:5000`
- Handle SSL/TLS certificates
