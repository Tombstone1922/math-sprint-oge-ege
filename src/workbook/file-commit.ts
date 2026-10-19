// SDK 57 copy/move are asynchronous. Validate the complete copy before publishing it.
type PhotoFile<T> = { exists: boolean; size: number; delete: () => void; copy: (destination: T) => Promise<void>; move: (destination: T, options?: { overwrite: boolean }) => Promise<void> };
export async function commitPhotoFile<T extends PhotoFile<T>>(source: T, staging: T, destination: T): Promise<number> {
  if (staging.exists) staging.delete();
  await source.copy(staging);
  if (!staging.exists || staging.size !== source.size) throw new Error('Не удалось полностью записать фото. Проверь свободное место.');
  await staging.move(destination, { overwrite: true });
  if (!destination.exists || destination.size !== source.size) throw new Error('Не удалось сохранить фото. Проверь свободное место.');
  return destination.size;
}
