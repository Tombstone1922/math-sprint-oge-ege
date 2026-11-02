import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from '../progress';
import { UpdateChecker } from '../update-checker';
import { WorkbookPhotoRecovery } from '../workbook/ui';
import { NavigationFrame } from '../app-navigation';
import { ScienceProvider } from '../science/provider';

export default function RootLayout() {
  return <SafeAreaProvider><ProgressProvider><ScienceProvider><StatusBar style="dark" /><UpdateChecker /><WorkbookPhotoRecovery /><NavigationFrame><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>{['index', 'topics', 'exam-hub', 'workbook', 'progress'].map(name => <Stack.Screen name={name} key={name} options={{ animation: 'none' }} />)}</Stack></NavigationFrame></ScienceProvider></ProgressProvider></SafeAreaProvider>;
}
