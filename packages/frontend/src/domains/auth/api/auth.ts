import { apiClient } from '../../../shared/lib/api-client';

export async function loginApi(email: string, password: string) {
  const { data } = await apiClient.post('/auth/login', { email, password });
  return data.data as { accessToken: string };
}

export async function signupApi(email: string, password: string, name: string, inviteCode?: string) {
  const { data } = await apiClient.post('/auth/signup', { email, password, name, inviteCode });
  return data.data as { userId: string };
}

export async function logoutApi() {
  await apiClient.post('/auth/logout');
}

export async function refreshApi() {
  const { data } = await apiClient.post('/auth/refresh');
  return data.data as { accessToken: string };
}

export async function getMeApi() {
  const { data } = await apiClient.get('/users/me');
  return data.data;
}
