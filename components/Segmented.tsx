import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { COLORS, RADII, SPACING, TYPOGRAPHY } from '../lib/theme';

type SegmentedOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  onPressStart?: () => void;
  containerStyle?: ViewStyle;
  optionStyle?: ViewStyle;
  labelStyle?: TextStyle;
};

export const Segmented = <T extends string>({
  options,
  value,
  onChange,
  onPressStart,
  containerStyle,
  optionStyle,
  labelStyle,
}: SegmentedProps<T>) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[styles.option, optionStyle, active && styles.optionActive]}
            onPress={() => {
              onPressStart?.();
              onChange(option.value);
            }}
          >
            <Text style={[styles.label, labelStyle, active && styles.labelActive]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.s,
    borderRadius: RADII.pill,
    backgroundColor: COLORS.glass.fill,
    borderWidth: 1,
    borderColor: COLORS.glass.stroke,
  },
  option: {
    flex: 1,
    paddingVertical: SPACING.s,
    alignItems: 'center',
    borderRadius: RADII.pill,
  },
  optionActive: {
    backgroundColor: 'rgba(159, 182, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(159, 182, 255, 0.35)',
  },
  label: {
    color: COLORS.text.muted,
    fontSize: 14,
    fontFamily: TYPOGRAPHY.families.semibold,
  },
  labelActive: {
    color: COLORS.text.primary,
  },
});
