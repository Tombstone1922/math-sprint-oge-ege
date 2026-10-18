import React, { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { normalizeServiceUrl } from '../assistant-contract';
import { askAssistant } from '../assistant-client';
import { loadAssistantConnection, saveAssistantConnection } from '../assistant-storage';
import { colors } from '../theme';

export default function AssistantSettings() {
  const [url, setUrl] = useState(''), [token, setToken] = useState(''), [busy, setBusy] = useState(true);
  const [message, setMessage] = useState(''), [error, setError] = useState(''), [connected, setConnected] = useState(false);
  const mounted = useRef(true), pending = useRef<AbortController | null>(null), locked = useRef(false);
  useEffect(() => {
    mounted.current = true;
    loadAssistantConnection().then(c => { if (mounted.current && c) { setUrl(c.url); setConnected(true); } }).catch(() => { if (mounted.current) setError('Не удалось прочитать подключение. Можно настроить его заново.'); }).finally(() => { if (mounted.current) setBusy(false); });
    return () => { mounted.current = false; pending.current?.abort(); };
  }, []);
  async function connect() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError(''); setMessage('');
    try {
      const normalized = normalizeServiceUrl(url, __DEV__), code = token.trim();
      if (!/^[A-Za-z0-9_-]{32,128}$/.test(code)) throw new Error('Вставь полный код доступа, который выдал преподаватель. Ключ нейросети сюда вводить не нужно.');
      const connection = { url: normalized, token: code }, controller = new AbortController(); pending.current = controller;
      await askAssistant(connection, undefined, controller.signal);
      if (!mounted.current) return;
      await saveAssistantConnection(connection);
      if (mounted.current) { setConnected(true); setToken(''); setMessage('Помощник подключён. Вернись к задаче и задай вопрос.'); }
    } catch (e) { if (mounted.current) setError(e instanceof Error ? e.message : 'Не удалось подключиться.'); }
    finally { locked.current = false; pending.current = null; if (mounted.current) setBusy(false); }
  }
  async function disconnect() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await saveAssistantConnection(null); if (mounted.current) { setConnected(false); setToken(''); setMessage('Подключение удалено с этого устройства.'); } }
    catch { if (mounted.current) setError('Не удалось удалить подключение. Попробуй ещё раз.'); }
    finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  return <Screen>
    <Back /><Pill>ДЛЯ ПРЕПОДАВАТЕЛЯ</Pill>
    <Text style={[type.title, { marginTop: 20 }]}>Подключить помощника</Text>
    <Text style={[type.body, { marginTop: 10 }]}>После запуска сервиса преподаватель выдаёт адрес и личный код доступа. Данные для подключения вводятся один раз.</Text>
    <View style={styles.card}>
      <Text style={styles.status}>{connected ? 'Подключение сохранено ✓' : 'Помощник пока не подключён'}</Text>
      <Text style={styles.label}>Адрес сервиса преподавателя</Text>
      <TextInput accessibilityLabel="Адрес сервиса преподавателя" value={url} onChangeText={setUrl} placeholder="https://math.example.ru" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" maxLength={300} editable={!busy} style={styles.input} />
      <Text style={styles.label}>Код доступа ученика</Text>
      <TextInput accessibilityLabel="Код доступа ученика" value={token} onChangeText={setToken} placeholder={connected ? 'Новый код для замены подключения' : 'Вставь код от преподавателя'} placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} secureTextEntry maxLength={128} editable={!busy} style={styles.input} />
      <Text style={styles.note}>Это код нашего сервиса. Ключ OpenAI хранится только на сервере преподавателя.</Text>
      <Button title={busy ? 'Проверяем подключение…' : 'Проверить и сохранить'} disabled={busy || !url.trim() || !token.trim()} onPress={connect} />
      {connected && <Button title="Удалить подключение" secondary disabled={busy} onPress={disconnect} />}
      {message ? <Text accessibilityLiveRegion="polite" style={styles.status}>{message}</Text> : null}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </View>
    <Text style={styles.note}>Счёт, тренировки и проверенные решения работают без подключения. При вопросе нейросети передаются только текущая задача, твой ответ и текст вопроса.</Text>
    {Platform.OS === 'web' && <Text style={styles.note}>В веб-просмотре подключение действует до перезагрузки страницы. На Android код хранится в защищённом хранилище устройства.</Text>}
  </Screen>;
}
const styles = StyleSheet.create({ card: { marginTop: 22, padding: 20, borderRadius: 23, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, status: { color: colors.green, fontSize: 15, lineHeight: 23, fontWeight: '700', marginTop: 6 }, label: { color: colors.navy, fontSize: 14, fontWeight: '700', marginTop: 22 }, input: { minHeight: 54, padding: 13, borderRadius: 14, color: colors.ink, fontSize: 15, borderWidth: 1, borderColor: colors.border, marginTop: 9, backgroundColor: colors.background }, note: { color: colors.muted, fontSize: 13, lineHeight: 21, marginTop: 16 }, error: { color: colors.red, fontSize: 14, lineHeight: 22, marginTop: 15 } });
