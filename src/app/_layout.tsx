import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from '../progress';

export default function RootLayout() {
  return <SafeAreaProvider><ProgressProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} /></ProgressProvider></SafeAreaProvider>;
}
