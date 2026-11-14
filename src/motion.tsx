import React, { createContext, useContext, useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Modal, Platform, type ModalProps, type ViewProps } from 'react-native';

const ReducedMotion = createContext(true);
const preference = '(prefers-reduced-motion: reduce)';
const native = Platform.OS !== 'web';
const easing = Easing.out(Easing.cubic);

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [reduced, setReduced] = useState(() => Platform.OS === 'web' && typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(preference).matches : true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
      const query = window.matchMedia(preference);
      const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    }

    let listening = true;
    let receivedChange = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', value => {
      receivedChange = true;
      setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (listening && !receivedChange) setReduced(value);
    }).catch(() => {});
    return () => {
      listening = false;
      subscription.remove();
    };
  }, []);

  return <ReducedMotion.Provider value={reduced}>{children}</ReducedMotion.Provider>;
}

export function useReducedMotion() {
  return useContext(ReducedMotion);
}

export function MotionIn({ style, ...props }: ViewProps) {
  const reduced = useReducedMotion();
  const [entrance] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) {
      entrance.setValue(1);
      return;
    }
    const animation = Animated.timing(entrance, { toValue: 1, duration: 180, easing, useNativeDriver: native, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [entrance, reduced]);
  return <Animated.View {...props} style={[style, reduced ? null : {
    opacity: entrance.interpolate({ inputRange: [0, 1], outputRange: [.78, 1] }),
    transform: [{ translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }],
  }]} />;
}

export function useAnimatedProgress(fraction: number, initialFraction = fraction) {
  const reduced = useReducedMotion();
  const [fill] = useState(() => new Animated.Value(reduced ? fraction : initialFraction));
  useEffect(() => {
    if (reduced) {
      fill.setValue(fraction);
      return;
    }
    const animation = Animated.timing(fill, { toValue: fraction, duration: 220, easing, useNativeDriver: native, isInteraction: false });
    animation.start();
    return () => animation.stop();
  }, [fill, fraction, reduced]);
  return reduced ? fraction : fill;
}

export function StudyModal({ animationType = 'fade', ...props }: ModalProps) {
  const reduced = useReducedMotion();
  return <Modal {...props} animationType={reduced ? 'none' : animationType} />;
}
