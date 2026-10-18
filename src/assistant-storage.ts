import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { normalizeServiceUrl, type AssistantConnection } from './assistant-contract';

const KEY = 'math-sprint-assistant-v1';
let webConnection: AssistantConnection | null = null;
export async function loadAssistantConnection(): Promise<AssistantConnection | null> {
  if (Platform.OS === 'web') return webConnection;
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return null;
  const value = JSON.parse(raw) as AssistantConnection;
  return { url: normalizeServiceUrl(value.url, __DEV__), token: value.token };
}
export async function saveAssistantConnection(value: AssistantConnection | null) {
  if (Platform.OS === 'web') { webConnection = value; return; }
  if (value) await SecureStore.setItemAsync(KEY, JSON.stringify(value));
  else await SecureStore.deleteItemAsync(KEY);
}
