import { readFileSync } from 'node:fs';

const app = JSON.parse(readFileSync(new URL('../app.json', import.meta.url), 'utf8')).expo;
const projectId = app.extra?.eas?.projectId;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

if (!uuid.test(projectId ?? '') || app.updates?.url !== `https://u.expo.dev/${projectId}`) {
  console.error('EAS project is not linked. Run npx eas-cli@latest update:configure with your Expo account, commit the generated app.json, and set EXPO_TOKEN in GitHub Actions secrets.');
  process.exit(1);
}

console.log(`EAS Update project is configured: ${projectId}`);
