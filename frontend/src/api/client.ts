import axios, { AxiosError } from 'axios';
import {
  ApiResponse,
  Facility,
  HealthStatus,
  PredictionRecord,
  PredictionRequest,
  PredictionResponse,
  ReadinessStatus,
} from '../types';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const serverMsg = err.response?.data?.message;
    if (serverMsg) return serverMsg;
    if (err.code === 'ERR_NETWORK') {
      return 'Unable to connect to the ParkWise backend server. Please check if Flask is running at ' + API_BASE_URL;
    }
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'An unexpected error occurred.';
}

export const api = {
  // Health & Readiness
  getHealth: async (): Promise<ApiResponse<HealthStatus>> => {
    const res = await apiClient.get<ApiResponse<HealthStatus>>('/health');
    return res.data;
  },

  getReadiness: async (): Promise<ApiResponse<ReadinessStatus>> => {
    const res = await apiClient.get<ApiResponse<ReadinessStatus>>('/health/ready');
    return res.data;
  },

  // Facilities
  getFacilities: async (activeOnly = false): Promise<ApiResponse<Facility[]>> => {
    const res = await apiClient.get<ApiResponse<Facility[]>>('/facilities', {
      params: activeOnly ? { active_only: 'true' } : {},
    });
    return res.data;
  },

  getFacility: async (facilityCode: string): Promise<ApiResponse<Facility>> => {
    const res = await apiClient.get<ApiResponse<Facility>>(`/facilities/${encodeURIComponent(facilityCode)}`);
    return res.data;
  },

  updateFacility: async (
    facilityCode: string,
    payload: { display_name?: string; is_active?: boolean }
  ): Promise<ApiResponse<Facility>> => {
    const res = await apiClient.patch<ApiResponse<Facility>>(
      `/facilities/${encodeURIComponent(facilityCode)}`,
      payload
    );
    return res.data;
  },

  // Predictions
  createPrediction: async (
    payload: PredictionRequest
  ): Promise<ApiResponse<PredictionResponse>> => {
    const res = await apiClient.post<ApiResponse<PredictionResponse>>('/predictions', payload);
    return res.data;
  },

  getPredictionHistory: async (params?: {
    facility_code?: string;
    start_date?: string;
    end_date?: string;
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<PredictionRecord[]>> => {
    const res = await apiClient.get<ApiResponse<PredictionRecord[]>>('/predictions/history', {
      params,
    });
    return res.data;
  },

  getPredictionById: async (id: number): Promise<ApiResponse<PredictionRecord>> => {
    const res = await apiClient.get<ApiResponse<PredictionRecord>>(`/predictions/${id}`);
    return res.data;
  },

  clearPredictionHistory: async (): Promise<ApiResponse<{ deleted_count: number }>> => {
    const res = await apiClient.delete<ApiResponse<{ deleted_count: number }>>('/predictions/history');
    return res.data;
  },
};
