import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat, type ImageRef } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';
import { MAX_PHOTO_BYTES, validFilename, type Photo } from './model';
import { commitPhotoFile } from './file-commit';

const directory = () => new Directory(Paths.document, 'workbook-photos');
export const photoUri = async (photo: Photo): Promise<string> => {
  if (!validFilename(photo.filename)) throw new Error('Некорректное имя фотографии.');
  const file = new File(directory(), photo.filename);
  if (!file.exists) throw new Error('Фото не найдено на устройстве. Прикрепи его снова.');
  return file.uri;
};
export async function savePhoto(asset: ImagePickerAsset, filename: string): Promise<Photo> {
  if (!validFilename(filename)) throw new Error('Не удалось подготовить фото.');
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > 2400) context.resize(asset.width >= asset.height ? { width: 2400 } : { height: 2400 });
  let image: ImageRef | undefined, cached: File | undefined, staging: File | undefined;
  try {
    image = await context.renderAsync();
    const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.88 });
    cached = new File(result.uri);
    if (!cached.size || cached.size > MAX_PHOTO_BYTES) throw new Error('Фото слишком большое. Сними один лист ближе или выбери изображение до 4 МБ.');
    const folder = directory(); folder.create({ idempotent: true, intermediates: true });
    const destination = new File(folder, filename);
    // Never expose an interrupted copy under the final photo name.
    staging = new File(folder, `${filename}.tmp`);
    const bytes = await commitPhotoFile(cached, staging, destination);
    return { id: filename, filename, width: result.width, height: result.height, bytes };
  } finally {
    try { if (cached?.exists) cached.delete(); if (staging?.exists && staging.name.endsWith('.tmp')) staging.delete(); } catch { /* A cached file must not turn a durable save into a failure. */ }
    image?.release(); context.release();
  }
}
export async function deletePhoto(photo: Photo): Promise<void> {
  if (!validFilename(photo.filename)) return;
  const file = new File(directory(), photo.filename); if (file.exists) file.delete();
}
