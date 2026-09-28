import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from '../progress';
import { UpdateChecker } from '../update-checker';

export default function RootLayout() {
  return <SafeAreaProvider><ProgressProvider><StatusBar style="dark" /><UpdateChecker /><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} /></ProgressProvider></SafeAreaProvider>;
}
