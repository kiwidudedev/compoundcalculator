import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../lib/constants';

type GlassProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

export const Glass = ({ children, style, intensity = 35 }: GlassProps) => {
  return (
    <BlurView intensity={intensity} tint="dark" style={[styles.glass, style]}>
      {children}
    </BlurView>
  );
};

const styles = StyleSheet.create({
  glass: {
    backgroundColor: COLORS.glassFill,
    borderColor: COLORS.glassBorder,
    borderWidth: 1,
    borderRadius: 28,
    overflow: 'hidden',
  },
});
