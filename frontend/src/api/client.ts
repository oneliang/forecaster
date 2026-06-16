import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || 'http://localhost:8484/api'
})

export interface Project {
  id: string
  name: string
  description: string
  created_at: string
}

export interface Record {
  id: string
  project_id: string
  amount: string
  direction: number  // 0=收 1=付
  type: number       // 0=计划应该 1=实际应该 2=实际
  time: string
  amount_time: string
  key: string
  note: string
  created_at: string
  updated_at: string
}

export interface ForecastOutput {
  total_plan_should_receive: string
  total_plan_should_pay: string
  total_plan_should_different: string
  total_actual_should_receive: string
  total_actual_should_pay: string
  total_actual_should_different: string
  total_actual_receive: string
  total_actual_pay: string
  total_actual_different: string
  balance: string
  plan_should_receive: string
  plan_should_pay: string
  plan_should_different: string
  actual_should_receive: string
  actual_should_pay: string
  actual_should_different: string
  actual_receive: string
  actual_pay: string
  actual_different: string
  time: string
}

export const projectApi = {
  list: () => api.get<Project[]>('/projects').then(r => r.data),
  get: (id: string) => api.get<Project>(`/projects/${id}`).then(r => r.data),
  create: (data: { name: string; description: string }) =>
    api.post<Project>('/projects', data).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
}

export const recordApi = {
  list: (projectId: string) =>
    api.get<Record[]>(`/projects/${projectId}/records`).then(r => r.data),
  create: (projectId: string, data: Partial<Record>) =>
    api.post<Record>(`/projects/${projectId}/records`, data).then(r => r.data),
  update: (projectId: string, recordId: string, data: Partial<Record>) =>
    api.put<Record>(`/projects/${projectId}/records/${recordId}`, data).then(r => r.data),
  delete: (projectId: string, recordId: string) =>
    api.delete(`/projects/${projectId}/records/${recordId}`),
}

export const forecastApi = {
  run: (projectId: string) =>
    api.get<ForecastOutput[]>(`/projects/${projectId}/forecast`).then(r => r.data),
}
