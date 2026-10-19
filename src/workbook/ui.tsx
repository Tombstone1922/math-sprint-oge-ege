import React, { useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Button, Pill, Screen, type } from '../components';
import { useProgress } from '../progress';
import { colors } from '../theme';
import { MAX_PHOTOS, pageId, type Page, type Photo } from './model';
import { deletePhoto, photoUri } from './photos';
import { discardPendingPhoto, recoverPhoto, takePhoto } from './picker';

export const formatWorkDate = (at: number) => new Date(at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export function WorkbookLink({ source, session, taskId }: { source: Page['source']; session: string; taskId: string }) {
  const { progress, workbook } = useProgress(), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const id = pageId(source, session, taskId), page = progress.workbook.pages[id];
  const open = async () => {
    setBusy(true); setError('');
    if (!page && !await workbook({ type: 'ensure', source, session, taskId })) { setError('Не удалось сохранить работу. Повтори сохранение прогресса.'); setBusy(false); return; }
    setBusy(false); router.push({ pathname: '/workbook', params: { id } });
  };
  return <View style={[ws.card, { backgroundColor: colors.bluePale }]}>
    <Pill>РАБОЧАЯ ТЕТРАДЬ</Pill><Text style={[ws.heading, { marginTop: 12 }]}>Сохрани своё решение</Text><Text style={ws.body}>{page ? `Фото: ${page.photos.length}/6 · ${page.reviewedAt ? 'проверка отмечена' : 'ожидает проверки'}. Работа останется после завершения подборки.` : 'Прикрепи фото листа, запиши ошибку и комментарий после проверки преподавателем.'}</Text>
    <Button secondary disabled={busy} title={busy ? 'Сохраняем…' : page ? 'Фото и заметки к работе  →' : 'Открыть тетрадь и добавить фото  →'} onPress={() => { void open(); }} />
    {error ? <Text accessibilityLiveRegion="polite" style={ws.error}>{error}</Text> : null}
  </View>;
}
export function WorkbookSummary() {
  const { progress } = useProgress(), pages = Object.values(progress.workbook.pages), waiting = pages.filter(p => !p.reviewedAt).length;
  return <View style={ws.card}><Pill tone="mint">МОИ РЕШЕНИЯ</Pill><Text style={[ws.heading, { marginTop: 12 }]}>Рабочая тетрадь</Text><Text style={ws.body}>{pages.length ? `Сохранено работ: ${pages.length} · ожидают проверки: ${waiting}.` : 'Фотографии, черновики и замечания к заданиям №20–25 — в одном месте.'}</Text><Button secondary title="Открыть рабочую тетрадь  →" onPress={() => router.push('/workbook')} /></View>;
}
function PhotoPreview({ photo, index, remove, disabled }: { photo: Photo; index: number; remove: () => void; disabled: boolean }) {
  const [uri, setUri] = useState(''), [error, setError] = useState(''), [open, setOpen] = useState(false), [zoom, setZoom] = useState(1), [confirm, setConfirm] = useState(false);
  const { width } = useWindowDimensions();
  useEffect(() => {
    let active = true, loaded = '';
    photoUri(photo).then(value => { loaded = value; if (active) setUri(value); else if (Platform.OS === 'web') URL.revokeObjectURL(value); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Не удалось открыть фото.'); });
    return () => { active = false; if (loaded && Platform.OS === 'web') URL.revokeObjectURL(loaded); };
  }, [photo]);
  return <View style={ws.photoCard}>
    <Text style={ws.heading}>Лист {index + 1}</Text>
    {uri && !error ? <Pressable accessibilityRole="button" accessibilityLabel={`Увеличить фото ${index + 1}`} onPress={() => { setZoom(1); setOpen(true); }} style={{ marginTop: 12 }}><Image source={{ uri }} accessibilityLabel={`Решение, лист ${index + 1}`} resizeMode="contain" onError={() => setError('Фото недоступно. Прикрепи снимок снова.')} style={{ width: '100%', height: 220, backgroundColor: '#F0F2F4', borderRadius: 12 }} /><Text style={ws.link}>Нажми, чтобы увеличить ↗</Text></Pressable> : error ? <Text style={ws.error}>{error}</Text> : <ActivityIndicator color={colors.blue} style={{ margin: 20 }} />}
    <Text style={ws.small}>{photo.width} × {photo.height} · {(photo.bytes / 1024 / 1024).toFixed(1)} МБ</Text>
    {confirm ? <><Text style={ws.body}>Убрать этот лист из работы? Исходное фото в галерее останется.</Text><Button disabled={disabled} secondary title={`Подтвердить удаление листа ${index + 1}`} onPress={remove} /><Button disabled={disabled} secondary title="Оставить фото" onPress={() => setConfirm(false)} /></> : <Pressable disabled={disabled} accessibilityRole="button" onPress={() => setConfirm(true)} style={{ paddingVertical: 14 }}><Text style={ws.link}>Удалить лист {index + 1}</Text></Pressable>}
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen modal scroll={false}><Text style={type.section}>Лист {index + 1}</Text><View style={ws.wrap}>{[1, 2, 3].map(scale => <Pressable accessibilityRole="button" accessibilityLabel={`Масштаб фото ${scale}×`} key={scale} onPress={() => setZoom(scale)} style={[ws.chip, zoom === scale && ws.selected]}><Text style={ws.chipText}>{scale}×</Text></Pressable>)}</View><Text style={ws.small}>Увеличь и прокручивай лист в обе стороны.</Text><ScrollView style={{ flex: 1 }}><ScrollView horizontal contentContainerStyle={{ alignItems: 'flex-start' }}><Image source={{ uri }} resizeMode="contain" accessibilityLabel={`Увеличенный лист ${index + 1}`} style={{ width: Math.max(1, width - 44) * zoom, height: Math.max(1, width - 44) * zoom * photo.height / photo.width }} /></ScrollView></ScrollView><Button title="Закрыть фото" onPress={() => setOpen(false)} /></Screen></Modal>
  </View>;
}
export function WorkbookPhotos({ page }: { page: Page }) {
  const { progress, workbook } = useProgress(), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const add = async (source: 'camera' | 'library') => {
    setBusy(true); setError('');
    try { await takePhoto(page, source, (id, photo) => workbook({ type: 'photo', id, photo })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось добавить фото. Попробуй ещё раз.'); }
    finally { setBusy(false); }
  };
  const remove = async (photo: Photo) => {
    setBusy(true); setError('');
    try { if (await workbook({ type: 'remove-photo', id: page.id, photoId: photo.id })) await deletePhoto(photo); else setError('Повтори сохранение прогресса. Снимок пока остаётся на устройстве.'); }
    catch { setError('Лист убран из работы; удалить его файл пока не удалось.'); }
    finally { setBusy(false); }
  };
  const recover = async () => {
    setBusy(true); setError('');
    try { await recoverPhoto(progress.workbook.pages, (id, photo) => workbook({ type: 'photo', id, photo })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Не удалось восстановить фото.'); }
    finally { setBusy(false); }
  };
  return <View style={ws.card}><Text style={ws.heading}>Фото твоего решения</Text><Text style={ws.body}>До 6 листов на работу. Снимай прямо, при хорошем свете, чтобы были видны все преобразования.</Text>{page.photos.map((photo, i) => <PhotoPreview key={photo.id} photo={photo} index={i} disabled={busy} remove={() => { void remove(photo); }} />)}
    <Button disabled={busy || page.photos.length >= MAX_PHOTOS} title={busy ? 'Сохраняем фото…' : 'Сфотографировать решение'} onPress={() => { void add('camera'); }} /><Button secondary disabled={busy || page.photos.length >= MAX_PHOTOS} title="Выбрать фото из галереи" onPress={() => { void add('library'); }} />
    {error ? <><Text accessibilityLiveRegion="polite" style={ws.error}>{error}</Text><Button secondary disabled={busy} title="Восстановить сохранение фото" onPress={() => { void recover(); }} /><Button secondary disabled={busy} title="Отменить незавершённый импорт" onPress={() => { void discardPendingPhoto().then(() => setError('')); }} /></> : null}<Text style={ws.small}>Фото хранятся на этом устройстве и не отправляются на сервер. Обновление приложения сохраняет тетрадь; удаление приложения удаляет её.</Text>
  </View>;
}
export function WorkbookPhotoRecovery() {
  const { progress, workbook } = useProgress(), [error, setError] = useState(''), [retry, setRetry] = useState(0), [recovered, setRecovered] = useState('');
  const latest = useRef({ pages: progress.workbook.pages, workbook });
  useEffect(() => { latest.current = { pages: progress.workbook.pages, workbook }; }, [progress.workbook.pages, workbook]);
  useEffect(() => {
    let active = true;
    const { pages, workbook: commit } = latest.current;
    recoverPhoto(pages, (id, photo) => commit({ type: 'photo', id, photo })).then(id => { if (active && id) { setRecovered(id); setError(''); } }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Не удалось восстановить фото.'); });
    return () => { active = false; };
  }, [retry]);
  if (!error && !recovered) return null;
  return <View accessibilityLiveRegion="polite" style={{ paddingHorizontal: 22, paddingTop: 10, backgroundColor: colors.amber }}><Text style={ws.small}>{error || 'Фото решения восстановлено после возвращения в приложение.'}</Text>{error ? <View style={ws.wrap}><Pressable accessibilityRole="button" style={ws.chip} onPress={() => setRetry(n => n + 1)}><Text style={ws.chipText}>Повторить</Text></Pressable><Pressable accessibilityRole="button" style={ws.chip} onPress={() => { void discardPendingPhoto().then(() => { setError(''); }); }}><Text style={ws.chipText}>Отменить импорт</Text></Pressable></View> : <View style={ws.wrap}><Pressable accessibilityRole="button" style={ws.chip} onPress={() => { router.push({ pathname: '/workbook', params: { id: recovered } }); setRecovered(''); }}><Text style={ws.chipText}>Открыть работу</Text></Pressable><Pressable accessibilityRole="button" style={ws.chip} onPress={() => setRecovered('')}><Text style={ws.chipText}>Понятно</Text></Pressable></View>}</View>;
}
export const ws = StyleSheet.create({
  card: { padding: 18, backgroundColor: colors.white, borderRadius: 23, borderWidth: 1, borderColor: colors.border, marginTop: 16 },
  photoCard: { padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 16, marginTop: 14 },
  heading: { color: colors.ink, fontSize: 19, lineHeight: 26, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  link: { color: colors.blue, fontSize: 14, fontWeight: '700', lineHeight: 21, marginTop: 8 },
  error: { color: colors.red, fontSize: 14, lineHeight: 21, marginTop: 12 },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, fontSize: 16, lineHeight: 24, marginTop: 12, minHeight: 110 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  chip: { borderWidth: 1, borderColor: colors.border, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 12, backgroundColor: colors.white, minHeight: 44, maxWidth: '100%' },
  selected: { backgroundColor: colors.bluePale, borderColor: colors.blue },
  chipText: { color: colors.navy, fontSize: 13, lineHeight: 20, fontWeight: '700', flexShrink: 1 },
});
