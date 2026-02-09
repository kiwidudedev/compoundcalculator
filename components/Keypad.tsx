import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'DEL';

const keys: KeypadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];

type KeypadProps = {
  onKeyPress: (key: KeypadKey) => void;
  keyHeight?: number;
  gap?: number;
  marginTop?: number;
  fontSize?: number;
};

export const Keypad = ({
  onKeyPress,
  keyHeight = 64,
  gap = 12,
  marginTop = 10,
  fontSize = 20,
}: KeypadProps) => {
  return (
    <View style={[styles.grid, { marginTop, columnGap: gap, rowGap: gap }]}> 
      {keys.map((key) => (
        <Pressable
          key={key}
          style={[styles.key, { height: keyHeight }]}
          onPress={() => onKeyPress(key)}
        >
          <Text style={[styles.keyText, { fontSize }]}>{key}</Text>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  key: {
    width: '31%',
    borderRadius: 18,
    backgroundColor: '#F7F0E7',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  keyText: {
    color: colors.textPrimary,
    fontFamily: typography.families.semibold,
  },
});
