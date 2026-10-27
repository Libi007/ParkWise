import { PredictionRecord, PredictionResponse, Facility } from '../types';

const SESSION_STORAGE_KEY = 'parkwise_session_predictions';

export function getSessionPredictions(): PredictionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSessionPrediction(
  res: PredictionResponse,
  facility?: Facility | null
): PredictionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const current = getSessionPredictions();
    const newRecord: PredictionRecord = {
      id: res.prediction_id,
      facility_id: facility?.id || 1,
      facility: {
        facility_code: res.facility_code,
        display_name: res.display_name,
        reference_capacity: res.reference_capacity,
      },
      requested_datetime: res.requested_datetime,
      timezone: res.effective_timezone,
      occupancy_percentage: res.occupancy_percentage,
      raw_occupancy_percentage: res.raw_occupancy_percentage,
      occupied_spaces: res.occupied_spaces,
      available_spaces: res.available_spaces,
      model_name: res.model_name,
      model_version: res.model_version,
      created_at: new Date().toISOString(),
    };

    const filtered = current.filter((item) => item.id !== newRecord.id);
    const updated = [newRecord, ...filtered];
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function clearSessionPredictions(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {}
}
