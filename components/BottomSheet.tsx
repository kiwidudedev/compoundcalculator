import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { COLORS } from '../lib/constants';
import { Glass } from './Glass';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  maxHeight?: number;
};

export const BottomSheet = ({ visible, onClose, children, style, maxHeight }: BottomSheetProps) => {
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetMaxHeight = maxHeight ?? height * 0.88;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 60,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          setRendered(false);
        }
      });
    }
  }, [visible, opacity, translateY]);

  if (!rendered) {
    return null;
  }

  return (
    <Modal transparent visible={rendered} animationType="none">
      <View style={styles.backdrop}>
        <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable
          style={styles.overlay}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <Animated.View
          style={[
            styles.sheetWrapper,
            { opacity, transform: [{ translateY }], paddingBottom: 16 + insets.bottom },
          ]}
        >
          <Glass style={[styles.sheet, { maxHeight: sheetMaxHeight }, style]} intensity={40}>
            {children}
          </Glass>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 20, 33, 0.6)',
  },
  sheetWrapper: {
    paddingHorizontal: 18,
  },
  sheet: {
    padding: 20,
    borderRadius: 30,
    borderColor: 'rgba(173, 198, 254, 0.18)',
    backgroundColor: COLORS.glassFill,
    overflow: 'hidden',
  },
});
