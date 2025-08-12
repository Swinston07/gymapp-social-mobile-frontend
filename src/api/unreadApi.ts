// src/api/unreadApi.ts
import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UnreadSummary = {
  buddies: number;
  invites: number;
  sessions: number;
  reviews: number;
  messages: number;
};

export async function getAuthToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem('token');
  } catch {
    return null;
  }
}

async function authFetch(path: string, init?: RequestInit) {
  const token = await getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  return res;
}

export async function getUnreadSummary(userId: number): Promise<UnreadSummary> {
  const res = await authFetch(`/users/${userId}/unread-summary`);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.log('getUnreadSummary failed:', res.status, txt);
    throw new Error('summary failed');
  }
  return res.json();
}

export async function markSectionSeen(
  userId: number,
  section: 'buddies' | 'invites' | 'sessions' | 'reviews' | 'messages'
) {
  const res = await authFetch(`/users/${userId}/sections/${section}/seen`, { method: 'POST' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.log('markSectionSeen failed:', section, res.status, txt);
  }
}

export async function markMessagesRead(userId: number, otherUserId: number) {
  const res = await authFetch(`/users/${userId}/messages/read/${otherUserId}`, { method: 'POST' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.log('markMessagesRead failed:', otherUserId, res.status, txt);
  }
}

/**
 * Optional: per-partner unread counts for tiny dots on each "Chat" button.
 * Returns a map: { [partnerId]: unreadCount }
 */
// src/api/unreadApi.ts
export async function getUnreadByPartner(userId: number): Promise<Record<number, number>> {
  const res = await authFetch(`/users/${userId}/messages/unread-by-partner`);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    console.log('getUnreadByPartner failed:', res.status, txt);
    throw new Error('unread-by-partner failed');
  }

  type RawRow = {
    partner_id?: number | string;
    partnerId?: number | string;
    sender_id?: number | string;
    senderId?: number | string;
    unread?: number | string;
    count?: number | string;
    total?: number | string;
  };

  const arr = (await res.json()) as RawRow[];
  const map: Record<number, number> = {};

  for (const row of arr) {
    const pid = row.partner_id ?? row.partnerId ?? row.sender_id ?? row.senderId;
    const cnt = row.unread ?? row.count ?? row.total ?? 0;
    if (pid != null) map[Number(pid)] = Number(cnt) || 0;
  }
  return map;
}
