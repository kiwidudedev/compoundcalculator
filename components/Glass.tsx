import React from 'react';
import {
  Pressable,
  PressableProps,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../lib/theme';

type GlassSurfaceProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

export const GlassCard = ({ children, style, intensity = 18 }: GlassSurfaceProps) => {
  return (
    <BlurView intensity={intensity} tint="light" style={[styles.surface, style]}>
      <View pointerEvents="none" style={styles.innerGlow} />
      {children}
    </BlurView>
  );
};

type GlassButtonProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
} & PressableProps;

export const GlassButton = ({
  children,
  style,
  contentStyle,
  intensity = 16,
  disabled,
  ...rest
}: GlassButtonProps) => {
  return (
    <Pressable disabled={disabled} {...rest}>
      {({ pressed }) => (
        <BlurView
          intensity={intensity}
          tint="light"
          style={[
            styles.button,
            pressed && styles.buttonPressed,
            disabled && styles.buttonDisabled,
            style,
          ]}
        >
          <View style={[styles.buttonContent, contentStyle]}>{children}</View>
          <View pointerEvents="none" style={styles.innerGlow} />
        </BlurView>
      )}
    </Pressable>
  );
};

type GlassIconButtonProps = {
  label: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
} & PressableProps;

export const GlassIconButton = ({
  label,
  size = 34,
  style,
  textStyle,
  ...rest
}: GlassIconButtonProps) => {
  return (
    <GlassButton
      {...rest}
      style={[styles.iconButton, { width: size, height: size, borderRadius: size / 2 }, style]}
      contentStyle={styles.iconButtonContent}
    >
      <Text style={[styles.iconLabel, textStyle]}>{label}</Text>
    </GlassButton>
  );
};

type GlassPillInputProps = {
  left: React.ReactNode;
  right?: React.ReactNode;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  intensity?: number;
  onPress?: () => void;
};

export const GlassPillInput = ({
  left,
  right,
  active,
  style,
  contentStyle,
  intensity = 16,
  onPress,
}: GlassPillInputProps) => {
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper {...(onPress ? { onPress } : {})}>
      <BlurView
        intensity={intensity}
        tint="light"
        style={[styles.pillInput, active && styles.pillInputActive, style]}
      >
        <View style={[styles.pillContent, contentStyle]}>
          <View style={styles.pillLeft}>{left}</View>
          {right ? <View style={styles.pillRight}>{right}</View> : null}
        </View>
        <View pointerEvents="none" style={styles.innerGlow} />
      </BlurView>
    </Wrapper>
  );
};

type ChipProps = {
  label: string;
  selected?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
};

export const Chip = ({ label, selected, style, textStyle, onPress }: ChipProps) => {
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <BlurView
          intensity={selected ? 18 : 12}
          tint="light"
          style={[
            styles.chip,
            selected && styles.chipSelected,
            pressed && styles.chipPressed,
            style,
          ]}
        >
          <Text style={[styles.chipText, selected && styles.chipTextSelected, textStyle]}>
            {label}
          </Text>
        </BlurView>
      )}
    </Pressable>
  );
};

const shadow = {
  shadowColor: 'rgba(90, 70, 50, 0.25)',
  shadowOpacity: 1,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 4,
};

const styles = StyleSheet.create({
  surface: {
    backgroundColor: COLORS.glass.fill,
    borderColor: COLORS.glass.stroke,
    borderWidth: 1,
    borderRadius: RADII.card,
    overflow: 'hidden',
    ...shadow,
  },
  innerGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RADII.card,
    borderWidth: 1,
    borderColor: COLORS.glass.highlight,
  },
  button: {
    backgroundColor: COLORS.glass.fill,
    borderColor: COLORS.glass.stroke,
    borderWidth: 1,
    borderRadius: RADII.pill,
    overflow: 'hidden',
    ...shadow,
  },
  buttonContent: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    borderColor: COLORS.glass.strokeStrong,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  iconButton: {
    borderRadius: RADII.round,
  },
  iconButtonContent: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLabel: {
    color: COLORS.text.primary,
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: 14,
  },
  pillInput: {
    backgroundColor: COLORS.glass.fill,
    borderColor: COLORS.glass.stroke,
    borderWidth: 1,
    borderRadius: RADII.pill,
    overflow: 'hidden',
    ...shadow,
  },
  pillInputActive: {
    borderColor: COLORS.glass.strokeStrong,
  },
  pillContent: {
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pillLeft: {
    flex: 1,
  },
  pillRight: {
    marginLeft: SPACING.s,
  },
  chip: {
    backgroundColor: COLORS.glass.fill,
    borderColor: COLORS.glass.stroke,
    borderWidth: 1,
    borderRadius: RADII.chip,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    borderColor: COLORS.glass.strokeStrong,
    backgroundColor: 'rgba(240, 180, 98, 0.2)',
  },
  chipPressed: {
    borderColor: COLORS.glass.strokeStrong,
  },
  chipText: {
    color: COLORS.text.muted,
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: 12,
  },
  chipTextSelected: {
    color: COLORS.text.primary,
  },
});
