# ParkWise Backend — Flask REST API & ML Service

This service provides the Flask REST API, SQLite database storage, and LightGBM model inference engine for **ParkWise — Smart Parking Occupancy Prediction System**.

---

## Model Pipeline Architecture

The model was trained in Google Colab on historical smart parking sensor records from **The Hague / Scheveningen, Netherlands**.

### Features Used (`FEATURES`)
The trained LightGBM pipeline expects exactly these 7 input features in this specific order:
1. `facility_label` (categorical string, e.g. `'PF01'` through `'PF11'`)
2. `reference_capacity` (integer, trusted facility parking space capacity)
3. `time_slot` (integer, `(hour * 4) + (minute // 15)`, range `0`–`95`)
4. `day_of_week` (integer, Monday = `0` through Sunday = `6`)
5. `is_weekend` (integer, `1` if Saturday or Sunday, else `0`)
6. `month` (integer, `1`–`12`)
7. `day_of_year` (integer, `1`–`366`)

### Target (`TARGET`)
- `occupancy_percentage` (numerical float, clipped to `[0.0, 100.0]`)

### Space Calculation Invariants
- `occupied_spaces = round(reference_capacity * occupancy_percentage / 100)`
- `available_spaces = reference_capacity - occupied_spaces`
- Guaranteed constraint: `occupied_spaces + available_spaces == reference_capacity`

---

## Model Artifact Placement

The serialized pipeline is loaded from:
```
artifacts/parkwise_lightgbm_model.pkl
```

### Exporting Model from Google Colab (If Missing)
If you are deploying on a new machine where the artifact is missing:
```python
import pickle
# In Google Colab after fitting your Pipeline:
with open('parkwise_lightgbm_model.pkl', 'wb') as f:
    pickle.dump(best_pipeline, f)

# Download to your machine and place in:
# backend/artifacts/parkwise_lightgbm_model.pkl
```

---

## Timezone Architecture

- **Default Timezone**: `Europe/Amsterdam` (configured via `PARKWISE_TIMEZONE`).
- Timestamps with explicit offsets (e.g., `+02:00` or `Z`) are normalized to `Europe/Amsterdam`.
- Timestamps without explicit offsets are treated as local `Europe/Amsterdam` time.
- All 7 temporal features are derived from the normalized local datetime.
- Prediction records are archived with timestamps in UTC.

---

## Setup and Local Run Instructions

### 1. Create Virtual Environment
```bash
# On Linux / macOS
python3 -m venv venv
source venv/bin/activate

# On Windows (cmd / PowerShell)
python -m venv venv
venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
```

### 4. Run Pytest Suite
```bash
pytest -v
```

### 5. Start Development Server
```bash
python run.py
# Server runs on http://127.0.0.1:5000
```

### 6. Production Deployment (Gunicorn WSGI)
```bash
gunicorn --workers 4 --bind 127.0.0.1:5000 "app:create_app('production')"
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/health` | Liveness probe returning service status |
| `GET` | `/api/v1/health/ready` | Readiness probe checking DB and model |
| `GET` | `/api/v1/facilities` | List monitored parking facilities |
| `GET` | `/api/v1/facilities/<code\>` | Retrieve facility details |
| `PATCH` | `/api/v1/facilities/<code\>` | Update display name / active status |
| `POST` | `/api/v1/predictions` | Generate occupancy forecast |
| `GET` | `/api/v1/predictions/history` | Paginated forecast audit log |
| `GET` | `/api/v1/predictions/<id\>` | Retrieve single prediction record |
