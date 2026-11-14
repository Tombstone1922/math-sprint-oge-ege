import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from '../progress';
import { UpdateChecker } from '../update-checker';
import { WorkbookPhotoRecovery } from '../workbook/ui';
import { NavigationFrame } from '../app-navigation';
import { InformaticsProvider } from '../informatics/provider';
import { ScienceProvider } from '../science/provider';
import { MotionProvider, useReducedMotion } from '../motion';
import { colors } from '../theme';

const tabs = ['index', 'topics', 'exam-hub', 'workbook', 'progress'] as const;

function AppStack() {
  const reduced = useReducedMotion();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: reduced ? 'none' : 'fade' }}>
    {tabs.map(name => <Stack.Screen name={name} key={name} options={{ animation: 'none' }} />)}
  </Stack>;
}

export default function RootLayout() {
  return <SafeAreaProvider><MotionProvider><ProgressProvider><ScienceProvider><InformaticsProvider>
    <StatusBar style="dark" />
    <UpdateChecker />
    <WorkbookPhotoRecovery />
    <NavigationFrame><AppStack /></NavigationFrame>
  </InformaticsProvider></ScienceProvider></ProgressProvider></MotionProvider></SafeAreaProvider>;
}
