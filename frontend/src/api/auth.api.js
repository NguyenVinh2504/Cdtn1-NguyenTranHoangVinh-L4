import { request } from './client';

export async function loginApi(username, password) {
  const result = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  return result?.data;
}

