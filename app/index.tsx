import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomSheet } from '../components/BottomSheet';
import { Keypad } from '../components/Keypad';
import { Segmented } from '../components/Segmented';
import { DEFAULTS } from '../lib/constants';
import { formatCurrency, formatCurrencyInput, formatPercent, parseCurrencyInput } from '../lib/format';
import { Frequency, SimulationParams, simulateGrowth } from '../lib/simulate';
import { MetricTile } from '../src/components/MetricTile';
import { ProjectionChart } from '../src/components/ProjectionChart';
import { SurfaceCard } from '../src/components/SurfaceCard';
import { colors } from '../src/theme/colors';
import { typography } from '../src/theme/typography';

type ActiveField = 'initial' | 'apy' | 'years' | 'amount';

type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '.' | 'DEL';

const frequencyLabel: Record<Frequency, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
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
  const [modalVisible, setModalVisible] = useState(false);
  const [draftApyText, setDraftApyText] = useState(DEFAULTS.apy.toFixed(2));
  const [draftYearsText, setDraftYearsText] = useState(String(DEFAULTS.durationYears));
  const [draftInitialText, setDraftInitialText] = useState(String(DEFAULTS.initialPrincipal));
  const [draftAmountText, setDraftAmountText] = useState(String(DEFAULTS.contributionAmount));
  const [activeField, setActiveField] = useState<ActiveField>('amount');
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const keypadHeight = Math.max(44, Math.min(56, Math.round(height * 0.07)));
  const sheetScrollRef = useRef<ScrollView>(null);

  const data = useMemo(() => simulateGrowth(committedParams), [committedParams]);
  const chartData = useMemo(
    () => data.slice(1).map((point) => ({ x: point.yearIndex, y: point.totalBalanceToDate })),
    [data],
  );
  const finalPoint = data[data.length - 1];
  const totalContributed = finalPoint?.totalAddedToDate ?? 0;
  const totalEarned = finalPoint?.interestEarnedToDate ?? 0;

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

  const handleSelectField = (field: ActiveField) => {
    setActiveField(field);
  };

  const contributionLabel =
    committedParams.contributionMode === 'recurring'
      ? `${frequencyLabel[committedParams.frequency]} contributions`
      : 'One-off contribution';

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <SafeAreaView style={styles.safe}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <SurfaceCard style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <Text style={styles.heroLabel}>Projected Balance</Text>
              <View style={styles.heroChip}>
                <Text style={styles.heroChipText}>{committedParams.durationYears}Y</Text>
              </View>
            </View>
            <Text style={styles.heroValue}>{formatCurrency(finalPoint.totalBalanceToDate)}</Text>
            <Text style={styles.heroSub}>in {committedParams.durationYears} years</Text>
          </SurfaceCard>

          <SurfaceCard style={styles.chartCard}>
            <Text style={styles.chartTitle}>Projection</Text>
            <ProjectionChart data={chartData} />
          </SurfaceCard>

          <View style={styles.tileRow}>
            <MetricTile
              label={contributionLabel}
              value={formatCurrency(committedParams.contributionAmount)}
              tint={colors.butterYellow}
            />
            <View style={styles.tileSpacer} />
            <MetricTile
              label="Total contributed"
              value={formatCurrency(totalContributed)}
              tint={colors.powderBlue}
            />
          </View>

          <View style={styles.tileRow}>
            <MetricTile
              label="Total interest"
              value={formatCurrency(totalEarned)}
              tint={colors.lavender}
            />
            <View style={styles.tileSpacer} />
            <MetricTile
              label="APY"
              value={formatPercent(committedParams.apy, 2)}
              tint={colors.softPeach}
            />
          </View>

          <View style={styles.actionRow}>
            <Pressable
              onPress={openModal}
              style={[styles.actionTile, styles.actionTileMain]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.actionTitle}>Edit Simulation</Text>
              <Text style={styles.actionSub}>Update inputs and recalculate</Text>
            </Pressable>
            <Pressable
              onPress={openModal}
              style={[styles.actionTile, styles.actionTileSmall]}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Text style={styles.actionPlus}>+</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>

      <BottomSheet visible={modalVisible} onClose={closeModal}>
        <View style={styles.sheetWrapper}>
          <ScrollView
            ref={sheetScrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Edit Simulation</Text>
              <Pressable onPress={closeModal} style={styles.sheetClose}>
                <Text style={styles.sheetCloseText}>X</Text>
              </Pressable>
            </View>

            <Text style={styles.sheetLabel}>APY</Text>
            <Pressable
              style={[styles.sheetInput, activeField === 'apy' && styles.sheetInputActive]}
              onPress={() => handleSelectField('apy')}
            >
              <Text style={styles.sheetInputValue}>{draftApyText || '0'}</Text>
            </Pressable>

            <Text style={styles.sheetLabel}>Years</Text>
            <Pressable
              style={[styles.sheetInput, activeField === 'years' && styles.sheetInputActive]}
              onPress={() => handleSelectField('years')}
            >
              <Text style={styles.sheetInputValue}>{draftYearsText || '0'}</Text>
            </Pressable>

            <Text style={styles.sheetLabel}>Initial</Text>
            <Pressable
              style={[styles.sheetInput, activeField === 'initial' && styles.sheetInputActive]}
              onPress={() => handleSelectField('initial')}
            >
              <Text style={styles.sheetInputValue}>{formatCurrencyInput(draftInitialText)}</Text>
            </Pressable>

            <Text style={styles.sheetLabel}>Contribution</Text>
            <Pressable
              style={[styles.sheetInput, activeField === 'amount' && styles.sheetInputActive]}
              onPress={() => handleSelectField('amount')}
            >
              <Text style={styles.sheetInputValue}>{formatCurrencyInput(draftAmountText)}</Text>
            </Pressable>

            <Segmented
              options={[
                { label: 'One-Off', value: 'oneOff' },
                { label: 'Recurring', value: 'recurring' },
              ]}
              value={draftParams.contributionMode}
              onChange={(value) => setDraftParams((prev) => ({ ...prev, contributionMode: value }))}
            />

            {draftParams.contributionMode === 'recurring' && (
              <Segmented
                options={[
                  { label: 'Weekly', value: 'weekly' },
                  { label: 'Monthly', value: 'monthly' },
                ]}
                value={draftParams.frequency}
                onChange={(value) => setDraftParams((prev) => ({ ...prev, frequency: value }))}
              />
            )}

            <View style={styles.fieldSwitcher}>
              <Pressable
                style={[styles.fieldChip, activeField === 'apy' && styles.fieldChipActive]}
                onPress={() => handleSelectField('apy')}
              >
                <Text style={[styles.fieldChipText, activeField === 'apy' && styles.fieldChipTextActive]}>
                  APY
                </Text>
              </Pressable>
              <Pressable
                style={[styles.fieldChip, activeField === 'years' && styles.fieldChipActive]}
                onPress={() => handleSelectField('years')}
              >
                <Text style={[styles.fieldChipText, activeField === 'years' && styles.fieldChipTextActive]}>
                  Years
                </Text>
              </Pressable>
              <Pressable
                style={[styles.fieldChip, activeField === 'initial' && styles.fieldChipActive]}
                onPress={() => handleSelectField('initial')}
              >
                <Text style={[styles.fieldChipText, activeField === 'initial' && styles.fieldChipTextActive]}>
                  Initial
                </Text>
              </Pressable>
              <Pressable
                style={[styles.fieldChip, activeField === 'amount' && styles.fieldChipActive]}
                onPress={() => handleSelectField('amount')}
              >
                <Text style={[styles.fieldChipText, activeField === 'amount' && styles.fieldChipTextActive]}>
                  Amount
                </Text>
              </Pressable>
            </View>

            <View style={styles.activeFieldBox}>
              <Text style={styles.activeFieldLabel}>
                Editing {activeField === 'apy' ? 'APY' : activeField === 'years' ? 'Years' : activeField === 'initial' ? 'Initial' : 'Contribution'}
              </Text>
              <Text style={styles.activeFieldValue}>
                {activeField === 'apy'
                  ? `${draftApyText || '0'}%`
                  : activeField === 'years'
                  ? `${draftYearsText || '0'} years`
                  : activeField === 'initial'
                  ? formatCurrencyInput(draftInitialText)
                  : formatCurrencyInput(draftAmountText)}
              </Text>
            </View>
            <Keypad
              onKeyPress={handleKeypadPress}
              keyHeight={keypadHeight}
              gap={10}
              marginTop={12}
              fontSize={18}
            />
            <Pressable style={styles.sheetCta} onPress={commitSimulation}>
              <Text style={styles.sheetCtaText}>Simulate</Text>
            </Pressable>
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  screenTitle: {
    color: colors.textPrimary,
    fontFamily: typography.families.semibold,
    fontSize: 16,
    marginBottom: 12,
  },
  heroCard: {
    backgroundColor: colors.surface,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroLabel: {
    color: colors.textSecondary,
    fontFamily: typography.families.medium,
    fontSize: 13,
  },
  heroChip: {
    backgroundColor: '#EDE2D6',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroChipText: {
    color: colors.textSecondary,
    fontFamily: typography.families.semibold,
    fontSize: 12,
  },
  heroValue: {
    color: colors.textPrimary,
    fontFamily: typography.families.bold,
    fontSize: 42,
    marginTop: 10,
  },
  heroSub: {
    color: colors.textSecondary,
    fontFamily: typography.families.medium,
    fontSize: 13,
    marginTop: 8,
  },
  chartCard: {
    marginTop: 18,
  },
  chartTitle: {
    color: colors.textSecondary,
    fontFamily: typography.families.medium,
    fontSize: 13,
    marginBottom: 6,
  },
  tileRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  tileSpacer: {
    width: 12,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 18,
    alignItems: 'stretch',
  },
  actionTile: {
    borderRadius: 22,
    padding: 16,
    backgroundColor: colors.surface,
    shadowColor: colors.shadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  actionTileMain: {
    flex: 1,
  },
  actionTileSmall: {
    width: 60,
    marginLeft: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    color: colors.textPrimary,
    fontFamily: typography.families.semibold,
    fontSize: 14,
  },
  actionSub: {
    color: colors.textSecondary,
    fontFamily: typography.families.medium,
    fontSize: 12,
    marginTop: 6,
  },
  actionPlus: {
    color: colors.textPrimary,
    fontFamily: typography.families.bold,
    fontSize: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetWrapper: {
    flex: 1,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingBottom: 28,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontFamily: typography.families.semibold,
    fontSize: 16,
  },
  sheetClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFE5DA',
  },
  sheetCloseText: {
    color: colors.textSecondary,
    fontFamily: typography.families.semibold,
  },
  sheetLabel: {
    color: colors.textSecondary,
    fontFamily: typography.families.medium,
    fontSize: 12,
    marginTop: 10,
  },
  sheetInput: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sheetInputActive: {
    borderColor: colors.softPeach,
    backgroundColor: '#F8F0E4',
  },
  fieldSwitcher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  fieldChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  fieldChipActive: {
    borderColor: colors.softPeach,
    backgroundColor: '#F8F0E4',
  },
  fieldChipText: {
    color: colors.textSecondary,
    fontFamily: typography.families.semibold,
    fontSize: 12,
  },
  fieldChipTextActive: {
    color: colors.textPrimary,
  },
  activeFieldBox: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#F8F0E4',
    borderWidth: 1,
    borderColor: colors.softPeach,
  },
  activeFieldLabel: {
    color: colors.textSecondary,
    fontFamily: typography.families.medium,
    fontSize: 12,
  },
  activeFieldValue: {
    color: colors.textPrimary,
    fontFamily: typography.families.semibold,
    fontSize: 16,
    marginTop: 6,
  },
  sheetInputValue: {
    color: colors.textPrimary,
    fontFamily: typography.families.semibold,
    fontSize: 16,
  },
  sheetCta: {
    backgroundColor: colors.softPeach,
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  sheetCtaText: {
    color: colors.textPrimary,
    fontFamily: typography.families.bold,
    fontSize: 14,
  },
});
