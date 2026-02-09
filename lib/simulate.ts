import { DEFAULTS } from './constants';

export type ContributionMode = 'recurring' | 'oneOff';
export type Frequency = 'weekly' | 'monthly';

export type SimulationParams = {
  apy: number;
  durationYears: number;
  initialPrincipal: number;
  contributionMode: ContributionMode;
  contributionAmount: number;
  frequency: Frequency;
};

export type YearPoint = {
  yearIndex: number;
  totalAddedToDate: number;
  interestEarnedToDate: number;
  totalBalanceToDate: number;
};

const toMonthlyContribution = (amount: number, frequency: Frequency) => {
  if (frequency === 'weekly') {
    return (amount * 52) / 12;
  }
  return amount;
};

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const safeNumber = (value: number, fallback = 0) => (Number.isFinite(value) ? value : fallback);

export const simulateGrowth = (params: SimulationParams = DEFAULTS): YearPoint[] => {
  const durationYears = clampNumber(Math.round(safeNumber(params.durationYears, DEFAULTS.durationYears)), 1, 50);
  const apy = clampNumber(safeNumber(params.apy, DEFAULTS.apy), 0, 25);
  const contributionAmount = clampNumber(
    safeNumber(params.contributionAmount, DEFAULTS.contributionAmount),
    0,
    1_000_000,
  );
  const initialPrincipal = clampNumber(
    safeNumber(params.initialPrincipal, DEFAULTS.initialPrincipal),
    0,
    10_000_000,
  );
  const totalMonths = durationYears * 12;
  const monthlyRate = Math.pow(1 + apy / 100, 1 / 12) - 1;
  const safeMonthlyRate = Number.isFinite(monthlyRate) ? monthlyRate : 0;

  const isRecurring = params.contributionMode === 'recurring';
  const monthlyContribution = isRecurring
    ? toMonthlyContribution(contributionAmount, params.frequency)
    : 0;
  const oneOffAmount = params.contributionMode === 'oneOff' ? contributionAmount : 0;

  let balance = initialPrincipal + oneOffAmount;
  let totalAdded = initialPrincipal + oneOffAmount;

  const data: YearPoint[] = [];

  const snapshot = (yearIndex: number) => {
    const interestEarned = balance - totalAdded;
    data.push({
      yearIndex,
      totalAddedToDate: safeNumber(totalAdded, 0),
      interestEarnedToDate: safeNumber(interestEarned, 0),
      totalBalanceToDate: safeNumber(balance, 0),
    });
  };

  snapshot(0);

  for (let month = 1; month <= totalMonths; month += 1) {
    balance *= 1 + safeMonthlyRate;
    if (isRecurring) {
      balance += monthlyContribution;
      totalAdded += monthlyContribution;
    }
    if (!Number.isFinite(balance) || !Number.isFinite(totalAdded)) {
      break;
    }

    if (month % 12 === 0) {
      snapshot(month / 12);
    }
  }

  if (data.length === 0 || data[data.length - 1]?.yearIndex !== durationYears) {
    snapshot(durationYears);
  }

  return data;
};
