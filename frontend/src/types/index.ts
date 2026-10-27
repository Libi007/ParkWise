export interface Facility {
  id: number;
  facility_code: string;
  source_uuid: string;
  display_name: string;
  reference_capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PredictionRequest {
  facility_code: string;
  datetime: string;
}

export type ParkingStatus = 'Low' | 'Moderate' | 'High' | 'Nearly Full';

export interface PredictionResponse {
  prediction_id: number;
  facility_code: string;
  display_name: string;
  reference_capacity: number;
  requested_datetime: string;
  requested_datetime_utc: string;
  effective_timezone: string;
  occupancy_percentage: number;
  raw_occupancy_percentage: number;
  occupied_spaces: number;
  available_spaces: number;
  parking_status: ParkingStatus;
  model_name: string;
  model_version: string;
  disclaimer: string;
}

export interface PredictionRecord {
  id: number;
  facility_id: number;
  facility: {
    facility_code: string;
    display_name: string;
    reference_capacity: number;
  } | null;
  requested_datetime: string;
  timezone: string;
  occupancy_percentage: number;
  raw_occupancy_percentage: number;
  occupied_spaces: number;
  available_spaces: number;
  model_name: string;
  model_version: string;
  created_at: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
  meta?: PaginationMeta | Record<string, any>;
  errors?: any;
}

export interface HealthStatus {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export interface ReadinessStatus {
  ready: boolean;
  database: {
    status: string;
    facility_count: number;
  };
  model: {
    status: string;
    name: string;
    version: string;
    error: string | null;
  };
  timestamp: string;
}
