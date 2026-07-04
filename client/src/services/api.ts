/**
 * API 客户端
 * 统一处理请求、token、错误
 */
import axios from 'axios';
import type { ApiResponse } from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// 请求拦截：附加 token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截：统一错误处理
api.interceptors.response.use(
  res => res,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============ Auth ============
export const auth = {
  register: (data: { email: string; password: string; name: string }) =>
    api.post<ApiResponse>('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse>('/auth/login', data),
  getMe: () => api.get<ApiResponse>('/auth/me'),
  getProfile: () => api.get<ApiResponse>('/auth/profile'),
  updateProfile: (data: any) => api.put<ApiResponse>('/auth/profile', data),
};

// ============ Recipes ============
export const recipes = {
  getSystem: (category?: string) =>
    api.get<ApiResponse>('/recipes/system', { params: { category } }),
  list: (params?: any) => api.get<ApiResponse>('/recipes', { params }),
  get: (id: string) => api.get<ApiResponse>(`/recipes/${id}`),
  create: (data: any) => api.post<ApiResponse>('/recipes', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/recipes/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/recipes/${id}`),
  toggleFavorite: (id: string) => api.post<ApiResponse>(`/recipes/${id}/favorite`),
};

// ============ Records ============
export const records = {
  list: (params?: any) => api.get<ApiResponse>('/records', { params }),
  today: (date?: string) => api.get<ApiResponse>('/records/today', { params: { date } }),
  create: (data: any) => api.post<ApiResponse>('/records', data),
  delete: (id: string) => api.delete<ApiResponse>(`/records/${id}`),
};

// ============ Meal Plans ============
export const mealPlans = {
  list: () => api.get<ApiResponse>('/meal-plans'),
  active: () => api.get<ApiResponse>('/meal-plans/active'),
  get: (id: string) => api.get<ApiResponse>(`/meal-plans/${id}`),
  generate: (options?: any) => api.post<ApiResponse>('/meal-plans/generate', options || {}),
  delete: (id: string) => api.delete<ApiResponse>(`/meal-plans/${id}`),
  toggleLock: (planId: string, dayPlanId: string, meals?: string[]) =>
    api.put<ApiResponse>(`/meal-plans/${planId}/lock/${dayPlanId}`, { meals }),
  regenerate: (planId: string, targets: any[]) =>
    api.post<ApiResponse>(`/meal-plans/${planId}/regenerate`, { targets }),
};

// ============ Inventory ============
export const inventory = {
  list: (params?: any) => api.get<ApiResponse>('/inventory', { params }),
  create: (data: any) => api.post<ApiResponse>('/inventory', data),
  update: (id: string, data: any) => api.put<ApiResponse>(`/inventory/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse>(`/inventory/${id}`),
};

// ============ Shopping ============
export const shopping = {
  list: (params?: any) => api.get<ApiResponse>('/shopping', { params }),
  create: (data: any) => api.post<ApiResponse>('/shopping', data),
  toggle: (id: string) => api.patch<ApiResponse>(`/shopping/${id}/toggle`),
  delete: (id: string) => api.delete<ApiResponse>(`/shopping/${id}`),
};

// ============ Stats ============
export const stats = {
  overview: () => api.get<ApiResponse>('/stats/overview'),
  weight: (days?: number) => api.get<ApiResponse>('/stats/weight', { params: { days } }),
};

// ============ Water ============
export const water = {
  today: () => api.get<ApiResponse>('/water/today'),
  add: (amountMl: number) => api.post<ApiResponse>('/water', { amountMl }),
};

// ============ Weight ============
export const weight = {
  list: (days?: number) => api.get<ApiResponse>('/weight', { params: { days } }),
  record: (data: any) => api.post<ApiResponse>('/weight', data),
  delete: (id: string) => api.delete<ApiResponse>(`/weight/${id}`),
};

// ============ AI ==========
export const ai = {
  chat: (message: string, clearHistory?: boolean) =>
    api.post<ApiResponse>('/ai/chat', { message, clearHistory }),
  recommend: (mealType?: string) =>
    api.post<ApiResponse>('/ai/recommend', { mealType }),
  fridge: (ingredients?: string[]) =>
    api.post<ApiResponse>('/ai/fridge', { ingredients }),
  generatePlan: (options?: any) =>
    api.post<ApiResponse>('/ai/generate-plan', options || {}),
  getHistory: () => api.get<ApiResponse>('/ai/history'),
  clearHistory: () => api.delete<ApiResponse>('/ai/history'),
};

// ============ Upload ============
export const upload = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<ApiResponse>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
