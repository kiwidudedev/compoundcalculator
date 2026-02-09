import React from 'react';
import { Pressable, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { COLORS, FONT_FAMILY } from '../lib/constants';

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
    padding: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  option: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 14,
  },
  optionActive: {
    backgroundColor: 'rgba(173, 198, 254, 0.2)',
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  labelActive: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
  },
});
