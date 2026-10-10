import { supabase } from './supabase';
import type { KidBoard, OverviewResponse, SchoolChildKey, SchoolResponse } from './types';

const API_URL = (process.env.EXPO_PUBLIC_HOMEBASE_API_URL || 'https://homebasekinnect.vercel.app').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Your session has expired. Please sign in again.');

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || 'Homebase could not load right now.');
  return payload;
}

export const homebaseApi = {
  overview: () => request<OverviewResponse>('/api/mobile/overview'),
  school: () => request<SchoolResponse>('/api/mobile/school'),
  toggleChore: (choreId: string, kid: string, done: boolean) =>
    request<{ chores: KidBoard[] }>('/api/mobile/chores', {
      method: 'POST',
      body: JSON.stringify({ choreId, kid, done }),
    }),
  toggleSchoolTask: (taskId: string, childKey: SchoolChildKey, done: boolean) =>
    request<{ completedTaskIds: string[] }>('/api/mobile/school/tasks', {
      method: 'POST',
      body: JSON.stringify({ taskId, childKey, done }),
    }),
};
