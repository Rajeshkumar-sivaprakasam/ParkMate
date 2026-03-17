import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Cache for parsed token to avoid repeated JSON parsing
let cachedToken: string | null = null;
let cachedTokenParseAttempted = false;

const getToken = (): string | null => {
  if (cachedToken !== null) {
    return cachedToken;
  }

  if (cachedTokenParseAttempted) {
    return null;
  }

  try {
    const token = localStorage.getItem("auth-storage");
    if (token) {
      const parsed = JSON.parse(token);
      cachedToken = parsed.state?.token || null;
    }
  } catch {
    cachedToken = null;
  }

  cachedTokenParseAttempted = true;
  return cachedToken;
};

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      cachedToken = null; // Clear cached token on auth error
      localStorage.removeItem("auth-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Listen for logout events from auth store
if (typeof window !== "undefined") {
  window.addEventListener("auth-logout", () => {
    cachedToken = null;
  });
}

// ============================================
// ANOMALY API
// ============================================

export interface Anomaly {
  _id: string;
  userId?: string;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "investigating" | "resolved" | "false_positive";
  description: string;
  details: {
    ipAddress?: string;
    userAgent?: string;
    threshold?: number;
    actualValue?: number;
    metadata?: Record<string, unknown>;
  };
  relatedEntityType?: string;
  relatedEntityId?: string;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  flaggedBy: "system" | "admin";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AnomalyStats {
  total: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  pendingCount: number;
  criticalCount: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const anomalyApi = {
  getAnomalies: async (params?: {
    page?: number;
    limit?: number;
    severity?: string;
    status?: string;
    userId?: string;
  }): Promise<PaginatedResponse<Anomaly>> => {
    const response = await api.get("/anomalies", { params });
    return response.data;
  },

  getAnomalyStats: async (): Promise<{ data: AnomalyStats }> => {
    const response = await api.get("/anomalies/stats");
    return response.data;
  },

  getAnomalyById: async (id: string): Promise<{ data: Anomaly }> => {
    const response = await api.get(`/anomalies/${id}`);
    return response.data;
  },

  resolveAnomaly: async (
    id: string,
    resolution: string,
  ): Promise<{ data: Anomaly }> => {
    const response = await api.post(`/anomalies/${id}/resolve`, { resolution });
    return response.data;
  },

  markAsFalsePositive: async (
    id: string,
    reason: string,
  ): Promise<{ data: Anomaly }> => {
    const response = await api.post(`/anomalies/${id}/false-positive`, {
      reason,
    });
    return response.data;
  },
};

export default api;
