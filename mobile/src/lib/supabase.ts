import 'react-native-url-polyfill/auto';

import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const configuredUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const configuredKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);

const webStorage = {
  getItem: async (key: string) => globalThis.localStorage?.getItem(key) ?? null,
  setItem: async (key: string, value: string) => globalThis.localStorage?.setItem(key, value),
  removeItem: async (key: string) => globalThis.localStorage?.removeItem(key),
};

// Supabase persists the full session as JSON. Some iOS releases reject secure
// values around 2 KB, so split the encrypted session into conservative chunks.
const SECURE_CHUNK_SIZE = 1800;
const metaKey = (key: string) => `${key}.__chunks`;
const chunkKey = (key: string, index: number) => `${key}.__chunk.${index}`;

const nativeStorage = {
  async getItem(key: string) {
    const storedCount = await SecureStore.getItemAsync(metaKey(key));
    const count = Number(storedCount);
    if (!Number.isInteger(count) || count < 1) return SecureStore.getItemAsync(key);

    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => SecureStore.getItemAsync(chunkKey(key, index)))
    );
    return chunks.some((chunk) => chunk === null) ? null : chunks.join('');
  },
  async setItem(key: string, value: string) {
    const previousCount = Number(await SecureStore.getItemAsync(metaKey(key))) || 0;
    const chunks = value.match(new RegExp(`.{1,${SECURE_CHUNK_SIZE}}`, 'gs')) || [''];
    await Promise.all(chunks.map((chunk, index) => SecureStore.setItemAsync(chunkKey(key, index), chunk)));
    await SecureStore.setItemAsync(metaKey(key), String(chunks.length));
    await SecureStore.deleteItemAsync(key);
    await Promise.all(
      Array.from(
        { length: Math.max(0, previousCount - chunks.length) },
        (_, offset) => SecureStore.deleteItemAsync(chunkKey(key, chunks.length + offset))
      )
    );
  },
  async removeItem(key: string) {
    const count = Number(await SecureStore.getItemAsync(metaKey(key))) || 0;
    await Promise.all([
      SecureStore.deleteItemAsync(key),
      SecureStore.deleteItemAsync(metaKey(key)),
      ...Array.from({ length: count }, (_, index) => SecureStore.deleteItemAsync(chunkKey(key, index))),
    ]);
  },
};

export const supabase = createClient(
  configuredUrl || 'https://example.supabase.co',
  configuredKey || 'not-configured',
  {
    auth: {
      storage: Platform.OS === 'web' ? webStorage : nativeStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);
