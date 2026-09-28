import React, { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, type } from '../components';
import { lesson } from '../content';
import { colors } from '../theme';

export default function Lesson() {
  const [index, setIndex] = useState(0);
  const item = lesson[index];
  return <Screen>
    <Back label="К модулям" />
    <View style={styles.row}><Text style={type.eyebrow}>УРОК · БЫСТРЫЙ СЧЁТ</Text><Text style={styles.count}>{index + 1} / {lesson.length}</Text></View>
    <ProgressBar current={index + 1} total={lesson.length} />
    <View style={{ marginTop: 30 }}><Pill>{item.label}</Pill></View>
    <Text style={[type.title, { marginTop: 17 }]}>{item.title}</Text>
    <Text style={[type.body, { marginTop: 13 }]}>{item.description}</Text>
    <View style={styles.card}>
      <Text style={styles.cardLabel}>ПОПРОБУЙ ТАК</Text>
      <Text style={styles.expression}>{item.example}</Text>
      <Text style={styles.steps}>{item.steps}</Text>
      <View style={styles.answer}><Text style={styles.answerText}>= {item.answer}</Text></View>
    </View>
    <View style={styles.note}><Text style={styles.noteIcon}>✦</Text><Text style={styles.noteText}>Не гонись за скоростью. Сначала найди удобный путь к ответу.</Text></View>
    <View style={{ flex: 1, minHeight: 25 }} />
    <Button title={index === lesson.length - 1 ? 'Перейти к карточкам  →' : 'Следующий приём  →'} onPress={() => index === lesson.length - 1 ? router.push('/guided') : setIndex(index + 1)} />
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13, alignItems: 'center' }, count: { fontWeight: '800', color: colors.muted }, card: { backgroundColor: colors.white, borderRadius: 28, padding: 26, marginTop: 28, alignItems: 'center', borderWidth: 1, borderColor: colors.border }, cardLabel: { color: colors.muted, fontSize: 11, letterSpacing: 1.5, fontWeight: '800' }, expression: { fontSize: 43, fontWeight: '800', color: colors.ink, marginTop: 26 }, steps: { color: colors.muted, fontSize: 18, marginTop: 16 }, answer: { backgroundColor: colors.mint, borderRadius: 16, paddingVertical: 11, paddingHorizontal: 23, marginTop: 24 }, answerText: { fontSize: 27, fontWeight: '800', color: colors.green }, note: { flexDirection: 'row', gap: 12, alignItems: 'center', marginTop: 22 }, noteIcon: { fontSize: 25, color: colors.blue }, noteText: { flex: 1, fontSize: 14, lineHeight: 21, color: colors.muted } });
