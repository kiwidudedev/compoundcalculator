import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

type MetricTileProps = {
  label: string;
  value: string;
  tint?: string;
  style?: StyleProp<ViewStyle>;
};

export const MetricTile = ({ label, value, tint, style }: MetricTileProps) => {
  return (
    <View style={[styles.tile, tint ? { backgroundColor: tint } : null, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  label: {
    color: colors.textSecondary,
    fontFamily: typography.families.medium,
    fontSize: typography.sizes.caption,
    marginBottom: 10,
  },
  value: {
    color: colors.textPrimary,
    fontFamily: typography.families.semibold,
    fontSize: 20,
  },
});
