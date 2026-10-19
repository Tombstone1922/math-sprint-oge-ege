import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { MAX_PHOTOS, type Page, type Photo } from './model';
import { photoUri, savePhoto } from './photos';

const PICKER_KEY = 'math-sprint/workbook/picker/v1';
type Intent = { pageId: string; filename: string; asset?: ImagePicker.ImagePickerAsset; photo?: Photo };
let busy = false;
const saveIntent = (intent: Intent) => AsyncStorage.setItem(PICKER_KEY, JSON.stringify(intent));
export const pickerBusy = () => busy;
async function commit(intent: Intent, add: (id: string, photo: Photo) => Promise<boolean>) {
  if (!intent.photo) {
    if (!intent.asset) return;
    intent.photo = await savePhoto(intent.asset, intent.filename);
    await saveIntent(intent);
  }
  if (!await add(intent.pageId, intent.photo)) throw new Error('Фото подготовлено. Повтори сохранение прогресса перед закрытием приложения.');
  await AsyncStorage.removeItem(PICKER_KEY);
}
export async function takePhoto(page: Page, source: 'camera' | 'library', add: (id: string, photo: Photo) => Promise<boolean>) {
  if (busy) return;
  if (page.photos.length >= MAX_PHOTOS) throw new Error('В одной работе можно сохранить до 6 фото. Удали лишний снимок.');
  busy = true;
  try {
    if (await AsyncStorage.getItem(PICKER_KEY)) throw new Error('Есть незавершённое сохранение фото. Нажми «Восстановить сохранение фото».');
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) throw new Error('Разреши доступ к камере в настройках телефона или выбери фото из галереи.');
    const intent: Intent = { pageId: page.id, filename: `photo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 13)}.jpg` };
    // Durable destination is recorded before Android opens another activity.
    await saveIntent(intent);
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 1, exif: false };
    let result: ImagePicker.ImagePickerResult;
    try { result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options); }
    catch (error) { await AsyncStorage.removeItem(PICKER_KEY); throw error; }
    if (result.canceled || !result.assets.length) { await AsyncStorage.removeItem(PICKER_KEY); return; }
    intent.asset = result.assets[0]; await saveIntent(intent); await commit(intent, add);
  } finally { busy = false; }
}
export async function recoverPhoto(pages: Record<string, Page>, add: (id: string, photo: Photo) => Promise<boolean>): Promise<string | null> {
  if (busy) return null;
  busy = true;
  try {
    const value = await AsyncStorage.getItem(PICKER_KEY);
    if (!value) return null;
    const intent: Intent = JSON.parse(value), page = pages[intent.pageId];
    if (!page) { await AsyncStorage.removeItem(PICKER_KEY); throw new Error('Не найдена работа для восстановления фото. Выбери снимок заново.'); }
    if (page.photos.some(p => p.id === intent.filename)) { await AsyncStorage.removeItem(PICKER_KEY); return null; }
    if (!intent.photo && !intent.asset) {
      const result = Platform.OS === 'android' ? await ImagePicker.getPendingResultAsync() : null;
      if (result && 'assets' in result && !result.canceled) intent.asset = result.assets[0];
      if (!intent.asset) { await AsyncStorage.removeItem(PICKER_KEY); return null; }
      await saveIntent(intent);
    }
    if (intent.photo) {
      const uri = await photoUri(intent.photo);
      if (Platform.OS === 'web') URL.revokeObjectURL(uri);
    }
    await commit(intent, add); return page.id;
  } finally { busy = false; }
}
// The user can cancel a failed import. Never delete a possibly referenced photo here.
export const discardPendingPhoto = () => AsyncStorage.removeItem(PICKER_KEY);
