import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import { MAX_PHOTO_BYTES, validFilename, type Photo } from './model';

// Web previews keep blobs in IndexedDB, never transient blob: URLs in saved metadata.
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('math-sprint-workbook', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('photos');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Не удалось открыть хранилище фотографий.'));
  });
}
async function blobOperation(filename: string, mode: 'readonly' | 'readwrite', value?: Blob | null): Promise<Blob | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('photos', mode), store = tx.objectStore('photos');
      const request = value === null ? store.delete(filename) : value ? store.put(value, filename) : store.get(filename);
      tx.oncomplete = () => resolve(value === undefined ? request.result : undefined);
      tx.onerror = tx.onabort = () => reject(new Error('Не удалось сохранить фото. Проверь свободное место.'));
    });
  } finally { db.close(); }
}
export async function photoUri(photo: Photo): Promise<string> {
  const blob = await blobOperation(photo.filename, 'readonly');
  if (!blob) throw new Error('Фото не найдено. Прикрепи его снова.');
  return URL.createObjectURL(blob);
}
export async function savePhoto(asset: ImagePickerAsset, filename: string): Promise<Photo> {
  if (!validFilename(filename)) throw new Error('Некорректное фото.');
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 2400) context.resize(asset.width >= asset.height ? { width: 2400 } : { height: 2400 });
  const image = await context.renderAsync();
  try {
    const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.88 }), blob = await (await fetch(result.uri)).blob();
    if (!blob.size || blob.size > MAX_PHOTO_BYTES) throw new Error('Фото слишком большое. Выбери один лист до 4 МБ.');
    await blobOperation(filename, 'readwrite', blob);
    return { id: filename, filename, width: result.width, height: result.height, bytes: blob.size };
  } finally { image.release(); context.release(); }
}
export async function deletePhoto(photo: Photo): Promise<void> { await blobOperation(photo.filename, 'readwrite', null); }
