import {
  DashboardStatistics,
  RecentAnalysisItem,
  AnalysisDetail,
  ChallengeGenerateResponse,
  ChallengeSubmitResponse,
  ModelInfo,
  SystemHealth,
  User,
  ProjectOutputsResponse,
} from '../types';
import { AUDITED_PROJECT_OUTPUTS, AUDITED_DASHBOARD_SNAPSHOT } from '../data/auditedProjectOutputs';

export function getCustomApiUrl(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('deepshield_api_url');
  }
  return null;
}

export function setCustomApiUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  if (url && url.trim()) {
    let cleanUrl = url.trim().replace(/\/+$/, '');
    if (!cleanUrl.endsWith('/api/v1') && !cleanUrl.includes('/api/')) {
      cleanUrl = `${cleanUrl}/api/v1`;
    }
    localStorage.setItem('deepshield_api_url', cleanUrl);
  } else {
    localStorage.removeItem('deepshield_api_url');
  }
}

export function getApiBaseUrl(): string {
  const custom = getCustomApiUrl();
  if (custom) return custom;
  const envUrl = (import.meta as any).env?.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api/v1') && !clean.includes('/api/')) {
      clean = `${clean}/api/v1`;
    }
    return clean;
  }
  return '/api/v1';
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('deepshield_token');
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

function parseErrorDetail(errData: any, fallback: string): string {
  if (!errData) return fallback;
  if (typeof errData === 'string') return errData;
  if (typeof errData.detail === 'string') return errData.detail;
  if (Array.isArray(errData.detail)) {
    return errData.detail.map((item: any) => item.msg || (typeof item === 'string' ? item : JSON.stringify(item))).join(', ');
  }
  if (typeof errData.detail === 'object' && errData.detail !== null) {
    return JSON.stringify(errData.detail);
  }
  if (errData.message && typeof errData.message === 'string') return errData.message;
  return fallback;
}

async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err: any) {
    if (
      err?.name === 'TypeError' ||
      (err?.message && (err.message.includes('fetch') || err.message.includes('network') || err.message.includes('Failed')))
    ) {
      throw new Error(`Unable to connect to DeepShield AI backend (${getApiBaseUrl()}). Please ensure the backend server is running.`);
    }
    throw err;
  }
}

export const api = {
  // Authentication
  async register(email: string, password: string, fullName: string, role = 'analyst'): Promise<{ access_token: string; user: User }> {
    const res = await safeFetch(`${getApiBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(err, 'Registration failed.'));
    }
    const data = await res.json();
    localStorage.setItem('deepshield_token', data.access_token);
    return data;
  },

  async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await safeFetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(err, 'Invalid email or password.'));
    }
    const data = await res.json();
    localStorage.setItem('deepshield_token', data.access_token);
    return data;
  },

  loginAsDemo(): User {
    const demoUser: User = {
      id: "usr_demo_analyst_01",
      email: "analyst@deepshield.ai",
      full_name: "Chief Forensic Analyst",
      role: "analyst",
      is_active: true,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('deepshield_token', 'demo_jwt_session_token_deepshield_ai');
    localStorage.setItem('deepshield_demo_user', JSON.stringify(demoUser));
    return demoUser;
  },

  async getMe(): Promise<User | null> {
    const token = localStorage.getItem('deepshield_token');
    if (!token) return null;
    if (token === 'demo_jwt_session_token_deepshield_ai') {
      try {
        const saved = localStorage.getItem('deepshield_demo_user');
        if (saved) return JSON.parse(saved);
      } catch {
        // Fall through
      }
      return {
        id: "usr_demo_analyst_01",
        email: "analyst@deepshield.ai",
        full_name: "Chief Forensic Analyst",
        role: "analyst",
        is_active: true,
        created_at: new Date().toISOString(),
      };
    }
    try {
      const res = await safeFetch(`${getApiBaseUrl()}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        localStorage.removeItem('deepshield_token');
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  },

  logout() {
    localStorage.removeItem('deepshield_token');
    localStorage.removeItem('deepshield_demo_user');
  },

  // Dashboard
  async getDashboardStatistics(): Promise<DashboardStatistics> {
    const res = await safeFetch(`${getApiBaseUrl()}/dashboard/statistics`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load dashboard statistics.');
    return res.json();
  },

  async getRecentAnalyses(): Promise<RecentAnalysisItem[]> {
    const res = await safeFetch(`${getApiBaseUrl()}/dashboard/recent`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load recent analyses.');
    return res.json();
  },

  // Forensic Analysis Uploads
  async uploadMedia(mediaType: 'audio' | 'image' | 'video', file: File): Promise<AnalysisDetail> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await safeFetch(`${getApiBaseUrl()}/analyses/${mediaType}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(err, `Analysis of ${mediaType} failed.`));
    }
    return res.json();
  },

  // Analysis History & Retrieval
  async listAnalyses(params: {
    page?: number;
    limit?: number;
    media_type?: string;
    risk_level?: string;
    status?: string;
    search?: string;
    sort_by?: string;
  } = {}): Promise<{ items: any[]; total: number; page: number; total_pages: number }> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.media_type) query.set('media_type', params.media_type);
    if (params.risk_level) query.set('risk_level', params.risk_level);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.sort_by) query.set('sort_by', params.sort_by);

    const res = await safeFetch(`${getApiBaseUrl()}/analyses?${query.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch analyses list.');
    return res.json();
  },

  async getAnalysisDetail(id: string): Promise<AnalysisDetail> {
    const res = await safeFetch(`${getApiBaseUrl()}/analyses/${id}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error(`Analysis with ID ${id} not found.`);
    return res.json();
  },

  async deleteAnalysis(id: string): Promise<void> {
    const res = await safeFetch(`${getApiBaseUrl()}/analyses/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to purge analysis record.');
  },

  // Dynamic Challenge-Response
  async generateChallenge(): Promise<ChallengeGenerateResponse> {
    const res = await safeFetch(`${getApiBaseUrl()}/verification/challenge`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(err, 'Failed to generate challenge.'));
    }
    return res.json();
  },

  async submitChallenge(sessionToken: string, audioBlob: Blob): Promise<ChallengeSubmitResponse> {
    const formData = new FormData();
    formData.append('session_token', sessionToken);
    const ext = audioBlob.type.includes('wav') ? 'wav' : (audioBlob.type.includes('ogg') ? 'ogg' : 'webm');
    formData.append('file', audioBlob, `response.${ext}`);

    const res = await safeFetch(`${getApiBaseUrl()}/verification/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(parseErrorDetail(err, 'Challenge verification failed.'));
    }
    return res.json();
  },

  // Models Status & Health
  async getModelsStatus(): Promise<ModelInfo[]> {
    const res = await safeFetch(`${getApiBaseUrl()}/models`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch model registry status.');
    return res.json();
  },

  async getHealth(): Promise<SystemHealth> {
    const res = await safeFetch(`${getApiBaseUrl()}/health`);
    if (!res.ok) throw new Error(`System health check failed: HTTP ${res.status}`);
    return res.json();
  },

  // Project Outputs & Benchmark Telemetry
  async getProjectOutputs(): Promise<ProjectOutputsResponse> {
    try {
      const res = await safeFetch(`${getApiBaseUrl()}/dashboard/project-outputs`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        // Verify minimal integrity of returned object
        if (data && data.in_distribution_test && data.in_distribution_test.new_model) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Live project outputs query unavailable, loading audited benchmark report:', err);
    }
    // Fall back immediately to authentic audited evaluation benchmark report
    return AUDITED_PROJECT_OUTPUTS;
  },
};
