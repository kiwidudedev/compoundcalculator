import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT_FAMILY } from '../lib/constants';

type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'DEL';

const keys: KeypadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'DEL'];

type KeypadProps = {
  onKeyPress: (key: KeypadKey) => void;
  keyHeight?: number;
  gap?: number;
  marginTop?: number;
  fontSize?: number;
};

export const Keypad = ({ onKeyPress, keyHeight = 64, gap = 12, marginTop = 10, fontSize = 22 }: KeypadProps) => {
  return (
    <View style={[styles.grid, { marginTop }]}>
      {keys.map((key) => (
        <Pressable
          key={key}
          style={[styles.key, { height: keyHeight, marginBottom: gap }]}
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
  },
});
