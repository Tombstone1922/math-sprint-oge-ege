import { useEffect, useRef } from 'react';
import { Alert, AppState, Linking, Platform } from 'react-native';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const RELEASES_URL = 'https://api.github.com/repos/Tombstone1922/math-sprint-oge-ege/releases?per_page=10';
const installedBuild = Number(process.env.EXPO_PUBLIC_BUILD_RUN_NUMBER || 0);
type Release = { tag_name: string; assets: { name: string; browser_download_url: string }[] };

/** Offers a newer GitHub APK at launch or when the app returns to the foreground. */
export function UpdateChecker() {
  const lastCheck = useRef(0);
  const checking = useRef(false);
  const offered = useRef<string | null>(null);

  useEffect(() => {
    if (__DEV__ || Platform.OS !== 'android') return;
    let mounted = true;
    async function check() {
      if (checking.current || Date.now() - lastCheck.current < CHECK_INTERVAL_MS) return;
      checking.current = true;
      lastCheck.current = Date.now();
      try {
        const response = await fetch(RELEASES_URL, { headers: { Accept: 'application/vnd.github+json' } });
        if (!response.ok) return;
        const releases = await response.json() as Release[];
        const update = releases
          .map(release => ({
            version: Number(/^apk-(\d+)$/.exec(release.tag_name)?.[1] || 0),
            url: release.assets.find(asset => asset.name.endsWith('.apk'))?.browser_download_url,
          }))
          .filter(release => release.url && release.version > installedBuild)
          .sort((a, b) => b.version - a.version)[0];
        if (!update?.url || !mounted || offered.current === update.url) return;
        offered.current = update.url;
        Alert.alert('Доступно обновление', 'Новая версия готова. Скачать APK с GitHub и установить?', [
          { text: 'Позже', style: 'cancel' },
          { text: 'Скачать', onPress: () => { Linking.openURL(update.url!).catch(() => {}); } },
        ]);
      } catch {
        // No network: continue with the installed version.
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
