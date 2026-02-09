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
import { colors } from '../src/theme/colors';
import { RADII, SPACING } from '../lib/theme';

type BottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  maxHeight?: number;
};

export const BottomSheet = ({ visible, onClose, children, style, maxHeight }: BottomSheetProps) => {
  const [rendered, setRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(70)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const sheetMaxHeight = maxHeight ?? height * 0.92;
  const sheetMinHeight = Math.min(sheetMaxHeight, Math.round(height * 0.7));

  useEffect(() => {
    if (visible) {
      setRendered(true);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 280,
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
          toValue: 70,
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
      <View style={styles.backdrop} pointerEvents="box-none">
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
            { opacity, transform: [{ translateY }], paddingBottom: SPACING.l + insets.bottom },
          ]}
        >
          <View
            style={[
              styles.sheet,
              { maxHeight: sheetMaxHeight, minHeight: sheetMinHeight, width: '100%' },
              style,
            ]}
          >
            {children}
          </View>
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
    backgroundColor: 'rgba(60, 50, 42, 0.45)',
    zIndex: 1,
  },
  sheetWrapper: {
    paddingHorizontal: SPACING.xl,
    zIndex: 2,
  },
  sheet: {
    padding: SPACING.xl,
    borderRadius: RADII.card,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
});
