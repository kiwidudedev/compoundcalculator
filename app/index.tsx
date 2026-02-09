import React, { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BottomSheet } from '../components/BottomSheet';
import { Chart } from '../components/Chart';
import { Glass } from '../components/Glass';
import { Keypad } from '../components/Keypad';
import { Segmented } from '../components/Segmented';
import { COLORS, DEFAULTS, FONT_FAMILY } from '../lib/constants';
import { formatCurrency, formatCurrencyInput, formatPercent, parseCurrencyInput } from '../lib/format';
import { Frequency, SimulationParams, simulateGrowth } from '../lib/simulate';

type ActiveField = 'initial' | 'apy' | 'years' | 'amount';

type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'DEL';

const frequencyLabel: Record<Frequency, string> = {
  weekly: 'Week',
  monthly: 'Month',
};

const clampApy = (value: number) => Math.min(25, Math.max(0, value));
const clampYears = (value: number) => Math.min(50, Math.max(1, value));
const clampContributionAmount = (value: number) => Math.min(1_000_000, Math.max(0, value));
const clampInitialAmount = (value: number) => Math.min(10_000_000, Math.max(0, value));

const normalizeApyInput = (value: string) => {
  const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return '';
  }
  const [intPart, ...rest] = cleaned.split('.');
  const decPart = rest.join('').slice(0, 2);
  return rest.length > 0 ? `${intPart}.${decPart}` : intPart;
};

const normalizeYearsInput = (value: string) => {
  return value.replace(/[^0-9]/g, '').slice(0, 2);
};

const normalizeAmountInput = (value: string) => {
  const cleaned = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
  if (!cleaned) {
    return '';
  }
  const [intPart, ...rest] = cleaned.split('.');
  const decPart = rest.join('').slice(0, 2);
  return rest.length > 0 ? `${intPart}.${decPart}` : intPart;
};

const parseApyInput = (raw: string, fallback: number) => {
  if (!raw.trim()) {
    return fallback;
  }
  const parsed = Number.parseFloat(raw.replace(/,/g, '.'));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clampApy(parsed);
};

  const parseYearsInput = (raw: string, fallback: number) => {
  if (!raw.trim()) {
    return fallback;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return clampYears(parsed);
};

const normalizeDraftToParams = (
  draft: SimulationParams,
  committed: SimulationParams,
  draftApyText: string,
  draftYearsText: string,
  draftInitialText: string,
  draftAmountText: string,
): SimulationParams => {
  let clamped = false;
  const nextApy = clampApy(parseApyInput(draftApyText, committed.apy));
  const nextYears = clampYears(parseYearsInput(draftYearsText, committed.durationYears));
  const parsedInitial = parseCurrencyInput(draftInitialText);
  const safeInitial = Number.isFinite(parsedInitial) ? parsedInitial : committed.initialPrincipal;
  const nextInitial = clampInitialAmount(safeInitial);
  const parsedAmount = parseCurrencyInput(draftAmountText);
  const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : committed.contributionAmount;
  const nextAmount = clampContributionAmount(safeAmount);

  if (nextApy !== parseApyInput(draftApyText, committed.apy)) clamped = true;
  if (nextYears !== parseYearsInput(draftYearsText, committed.durationYears)) clamped = true;
  if (nextInitial !== safeInitial) clamped = true;
  if (nextAmount !== safeAmount) clamped = true;

  if (__DEV__ && clamped) {
    console.warn('Simulation params were clamped for safety.');
  }

  return {
    ...draft,
    apy: nextApy,
    durationYears: nextYears,
    initialPrincipal: nextInitial,
    contributionAmount: nextAmount,
  };
};

export default function Home() {
  const [committedParams, setCommittedParams] = useState<SimulationParams>(DEFAULTS);
  const [draftParams, setDraftParams] = useState<SimulationParams>(DEFAULTS);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [draftApyText, setDraftApyText] = useState(DEFAULTS.apy.toFixed(2));
  const [draftYearsText, setDraftYearsText] = useState(String(DEFAULTS.durationYears));
  const [draftInitialText, setDraftInitialText] = useState(
    String(DEFAULTS.initialPrincipal),
  );
  const [draftAmountText, setDraftAmountText] = useState(String(DEFAULTS.contributionAmount));
  const [activeField, setActiveField] = useState<ActiveField>('amount');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const topPadding = 40;
  const availableH = height - topPadding - insets.bottom;
  const scale = availableH < 720 ? 0.88 : availableH < 780 ? 0.92 : 1;
  const metrics = useMemo(
    () => ({
      scale,
      pad: Math.round(18 * scale),
      gap: Math.round(12 * scale),
      sectionGap: Math.round(14 * scale),
      chipH: Math.round(34 * scale),
      keyH: Math.round(62 * scale),
      keyGap: Math.round(12 * scale),
      footerPad: Math.round(14 * scale),
    }),
    [scale],
  );
  const fontAdjust = scale <= 0.88 ? -2 : scale < 1 ? -1 : 0;

  const data = useMemo(() => simulateGrowth(committedParams), [committedParams]);
  const finalPoint = data[data.length - 1];
  useEffect(() => {
    if (selectedYear !== null && data.length > 0 && selectedYear > data.length - 1) {
      setSelectedYear(data.length - 1);
    }
  }, [data.length, selectedYear]);

  const openModal = () => {
    setDraftParams(committedParams);
    setDraftApyText(committedParams.apy.toFixed(2));
    setDraftYearsText(String(committedParams.durationYears));
    setDraftInitialText(String(committedParams.initialPrincipal));
    setDraftAmountText(String(committedParams.contributionAmount));
    setActiveField('amount');
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const commitSimulation = () => {
    const nextParams = normalizeDraftToParams(
      draftParams,
      committedParams,
      draftApyText,
      draftYearsText,
      draftInitialText,
      draftAmountText,
    );
    setCommittedParams(nextParams);
    setModalVisible(false);
  };

  const summaryLine =
    committedParams.contributionMode === 'recurring'
      ? `${formatCurrency(committedParams.contributionAmount)} Every ${
          frequencyLabel[committedParams.frequency]
        }`
      : `${formatCurrency(committedParams.contributionAmount)} One-Off`;

  const handleKeypadPress = (key: KeypadKey) => {
    if (activeField === 'years' && key === '.') {
      return;
    }

    const updateValue = (value: string, normalize: (input: string) => string) => {
      if (key === 'DEL') {
        return value.slice(0, -1);
      }
      if (key === '.') {
        if (value.includes('.')) {
          return value;
        }
        return normalize(`${value}${key}`);
      }
      return normalize(`${value}${key}`);
    };

    if (activeField === 'apy') {
      setDraftApyText((prev) => updateValue(prev, normalizeApyInput));
      return;
    }

    if (activeField === 'initial') {
      setDraftInitialText((prev) => updateValue(prev, normalizeAmountInput));
      return;
    }

    if (activeField === 'years') {
      setDraftYearsText((prev) => updateValue(prev, normalizeYearsInput));
      return;
    }

    setDraftAmountText((prev) => updateValue(prev, normalizeAmountInput));
  };

  const sheetMaxHeight = Math.min(height * 0.88, 760);
  const simulatePadY = Math.max(12, Math.round(14 * scale));
  const footerHeight = simulatePadY * 2 + 20;
  const contentPaddingBottom = footerHeight + insets.bottom + 12;

  return (
    <LinearGradient
      colors={[COLORS.backgroundTop, COLORS.backgroundBottom]}
      style={styles.background}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.apyPill} onPress={openModal}>
          <Text style={styles.apyText}>{formatPercent(committedParams.apy, 2)} APY</Text>
        </Pressable>

        <Text style={styles.balance}>{formatCurrency(finalPoint.totalBalanceToDate)}</Text>
        <Text style={styles.subtitle}>
          {formatCurrency(finalPoint.interestEarnedToDate)} Earned in {committedParams.durationYears}{' '}
          Years
        </Text>

        <Glass style={styles.chartCard}>
          <Chart data={data} selectedYear={selectedYear} onSelectYear={setSelectedYear} />
        </Glass>

        <Glass style={styles.bottomSummary}>
          <View>
            <Text style={styles.summaryPrimary}>{summaryLine}</Text>
            <Text style={styles.summarySecondary}>For {committedParams.durationYears} Years</Text>
          </View>
          <Pressable style={styles.editButton} onPress={openModal}>
            <Text style={styles.editText}>Edit Simulation</Text>
          </Pressable>
        </Glass>
      </SafeAreaView>

      <BottomSheet
        visible={modalVisible}
        onClose={closeModal}
        maxHeight={sheetMaxHeight}
        style={{ padding: metrics.pad }}
      >
        <View style={[styles.sheetBody, { maxHeight: sheetMaxHeight }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.sheetContent,
              { paddingBottom: contentPaddingBottom },
            ]}
          >
            <View style={[styles.sheetHeader, { marginBottom: metrics.gap }]}>
              <Text style={[styles.sheetTitle, { fontSize: 18 + fontAdjust }]}>Add Money</Text>
              <Pressable onPress={closeModal}>
                <View
                  style={[
                    styles.sheetClose,
                    { width: Math.round(30 * scale), height: Math.round(30 * scale) },
                  ]}
                >
                  <Text style={[styles.closeText, { fontSize: 14 + fontAdjust }]}>X</Text>
                </View>
              </Pressable>
            </View>

            <Text
              style={[
                styles.sectionLabel,
                {
                  marginTop: Math.max(4, Math.round(metrics.gap * 0.5)),
                  marginBottom: Math.max(4, Math.round(metrics.gap * 0.5)),
                },
              ]}
            >
              INTEREST RATE
            </Text>
            <Pressable
              style={[
                styles.rateRow,
                { paddingHorizontal: Math.round(14 * scale), paddingVertical: Math.round(10 * scale) },
                activeField === 'apy' && styles.activeField,
              ]}
              onPress={() => setActiveField('apy')}
            >
              <Text style={[styles.rateInputText, { fontSize: 22 + fontAdjust }]}>
                {draftApyText || '0'}
              </Text>
              <Text style={[styles.rateSuffix, { fontSize: 14 + fontAdjust }]}>% APY</Text>
            </Pressable>
            <View style={[styles.rateChips, { marginTop: metrics.gap, marginBottom: metrics.gap }]}>
              {[4, 6, 8, 10].map((preset) => (
                <Pressable
                  key={preset}
                  style={[
                    styles.rateChip,
                    {
                      height: metrics.chipH,
                      paddingHorizontal: Math.round(12 * scale),
                      marginRight: metrics.gap,
                    },
                  ]}
                  onPress={() => {
                    setActiveField('apy');
                    setDraftApyText(preset.toFixed(2));
                    setDraftParams((prev) => ({ ...prev, apy: preset }));
                  }}
                >
                  <Text style={[styles.rateChipText, { fontSize: 13 + fontAdjust }]}>{preset}%</Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={[
                styles.sectionLabel,
                {
                  marginTop: metrics.sectionGap,
                  marginBottom: Math.max(4, Math.round(metrics.gap * 0.5)),
                },
              ]}
            >
              YEARS
            </Text>
            <Pressable
              style={[
                styles.rateRow,
                { paddingHorizontal: Math.round(14 * scale), paddingVertical: Math.round(10 * scale) },
                activeField === 'years' && styles.activeField,
              ]}
              onPress={() => setActiveField('years')}
            >
              <Text style={[styles.rateInputText, { fontSize: 22 + fontAdjust }]}>
                {draftYearsText || '0'}
              </Text>
              <Text style={[styles.rateSuffix, { fontSize: 14 + fontAdjust }]}>Years</Text>
            </Pressable>
            <View style={[styles.rateChips, { marginTop: metrics.gap, marginBottom: metrics.gap }]}>
              {[5, 10, 20, 30, 40].map((preset) => (
                <Pressable
                  key={preset}
                  style={[
                    styles.rateChip,
                    {
                      height: metrics.chipH,
                      paddingHorizontal: Math.round(12 * scale),
                      marginRight: metrics.gap,
                    },
                  ]}
                  onPress={() => {
                    setActiveField('years');
                    setDraftYearsText(String(preset));
                    setDraftParams((prev) => ({ ...prev, durationYears: preset }));
                  }}
                >
                  <Text style={[styles.rateChipText, { fontSize: 13 + fontAdjust }]}>{preset}</Text>
                </Pressable>
              ))}
            </View>

            <Text
              style={[
                styles.sectionLabel,
                {
                  marginTop: metrics.sectionGap,
                  marginBottom: Math.max(4, Math.round(metrics.gap * 0.5)),
                },
              ]}
            >
              INITIAL
            </Text>
            <Pressable
              style={[
                styles.amountDisplayWrap,
                activeField === 'initial' && styles.activeField,
              ]}
              onPress={() => setActiveField('initial')}
            >
              <Text style={[styles.amountDisplay, { fontSize: Math.max(30, 34 + fontAdjust) }]}>
                {formatCurrencyInput(draftInitialText)}
              </Text>
            </Pressable>
            <View style={[styles.rateChips, { marginTop: metrics.gap, marginBottom: metrics.gap }]}>
              {[0, 1000, 5000, 10000, 25000].map((preset) => (
                <Pressable
                  key={preset}
                  style={[
                    styles.rateChip,
                    {
                      height: metrics.chipH,
                      paddingHorizontal: Math.round(12 * scale),
                      marginRight: metrics.gap,
                    },
                  ]}
                  onPress={() => {
                    setActiveField('initial');
                    setDraftInitialText(String(preset));
                    setDraftParams((prev) => ({ ...prev, initialPrincipal: preset }));
                  }}
                >
                  <Text style={[styles.rateChipText, { fontSize: 13 + fontAdjust }]}>
                    ${preset >= 1000 ? `${preset / 1000}k` : preset}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={[
                styles.amountDisplayWrap,
                { marginTop: metrics.sectionGap },
                activeField === 'amount' && styles.activeField,
              ]}
              onPress={() => setActiveField('amount')}
            >
              <Text style={[styles.amountDisplay, { fontSize: Math.max(32, 36 + fontAdjust) }]}>
                {formatCurrencyInput(draftAmountText)}
              </Text>
            </Pressable>

            <Segmented
              options={[
                { label: 'One-Off', value: 'oneOff' },
                { label: 'Recurring', value: 'recurring' },
              ]}
              value={draftParams.contributionMode}
              onChange={(value) =>
                setDraftParams((prev) => ({ ...prev, contributionMode: value }))
              }
              containerStyle={{
                marginTop: metrics.sectionGap,
                padding: Math.round(6 * scale),
                borderRadius: Math.round(18 * scale),
              }}
              optionStyle={{
                paddingVertical: Math.round(10 * scale),
                borderRadius: Math.round(14 * scale),
              }}
              labelStyle={{ fontSize: 14 + fontAdjust }}
            />

            {draftParams.contributionMode === 'recurring' && (
              <View style={[styles.frequencyRow, { marginTop: metrics.gap }]}>
                {(['weekly', 'monthly'] as Frequency[]).map((freq) => {
                  const active = draftParams.frequency === freq;
                  return (
                    <Pressable
                      key={freq}
                      style={[
                        styles.frequencyButton,
                        {
                          paddingVertical: Math.round(10 * scale),
                          borderRadius: Math.round(16 * scale),
                          marginHorizontal: Math.round(4 * scale),
                          minHeight: metrics.chipH,
                        },
                        active && styles.frequencyButtonActive,
                      ]}
                      onPress={() =>
                        setDraftParams((prev) => ({ ...prev, frequency: freq }))
                      }
                    >
                      <Text style={[styles.frequencyText, { fontSize: 14 + fontAdjust }]}>
                        {freq === 'weekly' ? 'Weekly' : 'Monthly'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <Keypad
              onKeyPress={handleKeypadPress}
              keyHeight={metrics.keyH}
              gap={metrics.keyGap}
              marginTop={metrics.gap}
              fontSize={Math.max(20, 22 + fontAdjust)}
            />
          </ScrollView>

          <View
            style={[
              styles.sheetFooter,
              { paddingTop: metrics.footerPad, paddingBottom: insets.bottom + 12 },
            ]}
          >
            <Pressable
              style={[
                styles.simulateButton,
                { paddingVertical: simulatePadY, borderRadius: Math.round(18 * scale) },
              ]}
              onPress={commitSimulation}
            >
              <Text style={[styles.simulateText, { fontSize: 16 + fontAdjust }]}>Simulate</Text>
            </Pressable>
          </View>
        </View>
      </BottomSheet>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  apyPill: {
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(173, 198, 254, 0.16)',
    marginBottom: 14,
  },
  apyText: {
    color: COLORS.accent,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    letterSpacing: 0.6,
  },
  balance: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 44,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  chartCard: {
    padding: 16,
    borderRadius: 32,
    marginBottom: 18,
  },
  bottomSummary: {
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryPrimary: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
  },
  summarySecondary: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
    marginTop: 2,
  },
  editButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(173, 198, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(173, 198, 254, 0.2)',
  },
  editText: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  sheetBody: {
    width: '100%',
  },
  sheetContent: {
    paddingBottom: 0,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 18,
  },
  sheetClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(18, 20, 33, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(173, 198, 254, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
  },
  sectionLabel: {
    color: 'rgba(173, 198, 254, 0.6)',
    fontFamily: FONT_FAMILY,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  rateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(173, 198, 254, 0.22)',
    backgroundColor: 'rgba(18, 20, 33, 0.7)',
  },
  rateInputText: {
    flex: 1,
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 22,
  },
  rateSuffix: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    marginLeft: 8,
  },
  rateChips: {
    flexDirection: 'row',
  },
  rateChip: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(173, 198, 254, 0.18)',
    backgroundColor: 'rgba(18, 20, 33, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  rateChipText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },
  amountDisplayWrap: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  amountDisplay: {
    color: COLORS.textPrimary,
    fontFamily: FONT_FAMILY,
    fontSize: 36,
    textAlign: 'center',
  },
  activeField: {
    borderColor: 'rgba(173, 198, 254, 0.6)',
  },
  frequencyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  frequencyButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(173, 198, 254, 0.18)',
    backgroundColor: 'rgba(18, 20, 33, 0.6)',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    backgroundColor: 'rgba(173, 198, 254, 0.2)',
  },
  frequencyText: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY,
  },
  sheetFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(173, 198, 254, 0.1)',
  },
  simulateButton: {
    backgroundColor: COLORS.accent,
    borderRadius: 18,
    alignItems: 'center',
  },
  simulateText: {
    color: COLORS.backgroundTop,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
  },
});
