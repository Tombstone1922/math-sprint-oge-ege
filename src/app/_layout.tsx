import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from '../progress';
import { UpdateChecker } from '../update-checker';
import { WorkbookPhotoRecovery } from '../workbook/ui';

export default function RootLayout() {
  return <SafeAreaProvider><ProgressProvider><StatusBar style="dark" /><UpdateChecker /><WorkbookPhotoRecovery /><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} /></ProgressProvider></SafeAreaProvider>;
}
