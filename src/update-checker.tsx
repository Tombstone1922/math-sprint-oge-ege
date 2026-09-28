import { useEffect, useRef } from 'react';
import { Alert, AppState, Platform } from 'react-native';
import * as Updates from 'expo-updates';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;

/** Checks at launch and when returning to the app; never interrupts a calculation without consent. */
export function UpdateChecker() {
  const lastCheck = useRef(0);
  const checking = useRef(false);
  const downloaded = useRef(false);

  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled || !Updates.channel) return;
    let mounted = true;

    async function check() {
      if (checking.current || downloaded.current || Date.now() - lastCheck.current < CHECK_INTERVAL_MS) return;
      checking.current = true;
      lastCheck.current = Date.now();
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) return;
        const fetched = await Updates.fetchUpdateAsync();
        if (!fetched.isNew || !mounted) return;
        downloaded.current = true;
        Alert.alert('Обновление готово', 'Новая версия загружена. Перезапустить приложение сейчас?', [
          { text: 'Позже', style: 'cancel' },
          { text: 'Перезапустить', onPress: () => { Updates.reloadAsync().catch(() => {}); } },
        ]);
      } catch {
        // No connection or temporary update-service failure: keep the installed version.
      } finally {
        checking.current = false;
      }
    }

    void check();
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void check(); });
    return () => { mounted = false; subscription.remove(); };
  }, []);

  return null;
}
