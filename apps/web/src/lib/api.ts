import axios from 'axios';

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ApiError';
    if (code) this.code = code;
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api/v1' : 'http://localhost:4000/api/v1'),
  withCredentials: true,
});
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mlrf-token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  const lang = localStorage.getItem('mlrf-lang') === 'ar' ? 'ar' : 'en';
  config.headers['Accept-Language'] = lang;
  return config;
});
export async function request<T>(
  path: string,
  method: 'get' | 'post' | 'put' = 'get',
  data?: unknown,
  params?: Record<string, string>,
) {
  try {
    const response = await api.request<{
      success: boolean;
      data: T;
      error: null | { code?: string; message: string };
    }>({ url: path, method, data, params });
    if (!response.data.success) {
      throw new ApiError(
        response.data.error?.message ?? 'Request failed',
        response.data.error?.code,
      );
    }
    return response.data.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (axios.isAxiosError(error)) {
      const body = error.response?.data as
        | { error?: { code?: string; message?: string } }
        | undefined;
      throw new ApiError(body?.error?.message ?? error.message, body?.error?.code);
    }
    throw error;
  }
}
