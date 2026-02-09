import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  PanResponder,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { YearPoint } from '../lib/simulate';
import { COLORS, SPACING, TYPOGRAPHY } from '../lib/theme';
import { formatCurrency } from '../lib/format';

type ChartProps = {
  data: YearPoint[];
  selectedYear: number | null;
  onSelectYear: (yearIndex: number) => void;
  height?: number;
  endLabel?: string;
};

const tooltipWidth = 180;
const tooltipHeight = 70;

const formatShortCurrency = (value: number) => {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${Math.round(value)}`;
};

export const Chart = ({
  data,
  selectedYear,
  onSelectYear,
  height = 240,
  endLabel = '30Y',
}: ChartProps) => {
  const [width, setWidth] = useState(0);
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipX = useRef(new Animated.Value(0)).current;
  const tooltipY = useRef(new Animated.Value(0)).current;
  const fadeOutTimeout = useRef<NodeJS.Timeout | null>(null);
  const safeData = useMemo(
    () =>
      data.map((point) => ({
        ...point,
        totalAddedToDate: Number.isFinite(point.totalAddedToDate) ? point.totalAddedToDate : 0,
        interestEarnedToDate: Number.isFinite(point.interestEarnedToDate)
          ? point.interestEarnedToDate
          : 0,
        totalBalanceToDate: Number.isFinite(point.totalBalanceToDate) ? point.totalBalanceToDate : 0,
      })),
    [data],
  );
  const safeSelectedYear =
    selectedYear !== null && selectedYear >= 0 && selectedYear < safeData.length
      ? selectedYear
      : null;

  const layoutHandler = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const maxValue = useMemo(() => {
    return Math.max(...safeData.map((point) => point.totalBalanceToDate), 1);
  }, [safeData]);

  const chart = useMemo(() => {
    const labelWidth = 52;
    const chartPadding = 6;
    const topPadding = 18;
    const bottomPadding = 10;
    const plotWidth = Math.max(width - labelWidth - chartPadding * 2, 0);
    const count = safeData.length;
    const minBarWidth = 4;
    const maxSpacing = 10;
    let spacing = maxSpacing;
    if (count > 1) {
      const maxSpacingToFit = Math.floor((plotWidth - minBarWidth * count) / (count - 1));
      spacing = Math.max(2, Math.min(maxSpacing, maxSpacingToFit));
    }
    const rawBarWidth = count > 1 ? (plotWidth - spacing * (count - 1)) / count : plotWidth;
    const barWidth = Math.max(minBarWidth, rawBarWidth);

    return {
      labelWidth,
      chartPadding,
      topPadding,
      bottomPadding,
      plotWidth,
      barWidth,
      spacing,
      svgHeight: height + topPadding + bottomPadding,
      plotLeft: labelWidth + chartPadding,
      plotTop: topPadding,
    };
  }, [height, safeData.length, width]);

  const updateIndexFromX = (x: number) => {
    if (safeData.length === 0 || chart.plotWidth <= 0) {
      return;
    }
    const clamped = Math.max(0, Math.min(chart.plotWidth, x));
    const rawIndex = Math.round((clamped / chart.plotWidth) * (safeData.length - 1));
    const idx = Math.max(0, Math.min(safeData.length - 1, rawIndex));
    onSelectYear(idx);
  };

  const showTooltip = () => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current);
    }
    Animated.timing(tooltipOpacity, {
      toValue: 1,
      duration: 140,
      useNativeDriver: true,
    }).start();
  };

  const hideTooltip = () => {
    if (fadeOutTimeout.current) {
      clearTimeout(fadeOutTimeout.current);
    }
    fadeOutTimeout.current = setTimeout(() => {
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }, 180);
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (event) => {
          showTooltip();
          updateIndexFromX(event.nativeEvent.locationX - chart.plotLeft);
        },
        onPanResponderMove: (event) => {
          showTooltip();
          updateIndexFromX(event.nativeEvent.locationX - chart.plotLeft);
        },
        onPanResponderRelease: () => {
          hideTooltip();
        },
        onPanResponderTerminate: () => {
          hideTooltip();
        },
      }),
    [chart.plotLeft, chart.plotWidth, safeData.length],
  );

  useEffect(() => {
    if (safeSelectedYear === null || width === 0 || safeData.length === 0) {
      return;
    }

    const point = safeData[safeSelectedYear];
    const totalHeight = Math.min(
      height,
      Math.max(0, (point.totalBalanceToDate / maxValue) * height),
    );
    const x =
      chart.plotLeft + safeSelectedYear * (chart.barWidth + chart.spacing) + chart.barWidth / 2;
    const y = chart.plotTop + (height - totalHeight);

    let targetX = x + chart.barWidth / 2 + 10;
    const minX = chart.plotLeft;
    const maxX = width - chart.chartPadding - tooltipWidth;
    if (targetX + tooltipWidth > width - chart.chartPadding) {
      targetX = x - tooltipWidth - 10;
    }
    targetX = Math.max(minX, Math.min(maxX, targetX));

    let targetY = y - tooltipHeight - 10;
    const minY = chart.plotTop;
    const maxY = chart.plotTop + height - tooltipHeight;
    if (targetY < minY) {
      targetY = y + 10;
    }
    targetY = Math.max(minY, Math.min(maxY, targetY));

    Animated.parallel([
      Animated.timing(tooltipX, {
        toValue: targetX,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(tooltipY, {
        toValue: targetY,
        duration: 160,
        useNativeDriver: true,
      }),
    ]).start();
  }, [chart, height, maxValue, safeData, safeSelectedYear, tooltipX, tooltipY, width]);

  const selectedPoint = safeSelectedYear !== null ? safeData[safeSelectedYear] : null;

  return (
    <View style={styles.container} onLayout={layoutHandler}>
      {width > 0 && (
        <View>
          <Svg width={width} height={chart.svgHeight}>
            {[0, 1, 2, 3, 4].map((index) => {
              const y = chart.topPadding + height - (height * index) / 4;
              const value = (maxValue * index) / 4;
              return (
                <React.Fragment key={`grid-${index}`}>
                  <Line
                    x1={chart.plotLeft}
                    x2={width - chart.chartPadding}
                    y1={y}
                    y2={y}
                    stroke={COLORS.chart.grid}
                    strokeWidth={1}
                    strokeDasharray="6 6"
                  />
                  <SvgText
                    x={chart.labelWidth - 6}
                    y={y + 4}
                    fill={COLORS.text.muted}
                    fontSize={11}
                    fontFamily={TYPOGRAPHY.families.semibold}
                    textAnchor="end"
                  >
                    {formatShortCurrency(value)}
                  </SvgText>
                </React.Fragment>
              );
            })}

            {safeSelectedYear !== null && (
              <Line
                x1={
                  chart.plotLeft +
                  safeSelectedYear * (chart.barWidth + chart.spacing) +
                  chart.barWidth / 2
                }
                x2={
                  chart.plotLeft +
                  safeSelectedYear * (chart.barWidth + chart.spacing) +
                  chart.barWidth / 2
                }
                y1={chart.plotTop}
                y2={chart.plotTop + height}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={1}
              />
            )}

            {safeData.map((point, index) => {
              const totalHeight = Math.min(
                height,
                Math.max(0, (point.totalBalanceToDate / maxValue) * height),
              );
              const addedHeight = Math.min(
                height,
                Math.max(0, (point.totalAddedToDate / maxValue) * height),
              );
              const earnedHeight = Math.max(0, totalHeight - addedHeight);
              const isSelected = safeSelectedYear === index;
              const barWidth = isSelected ? chart.barWidth + 6 : chart.barWidth;
              const x =
                chart.plotLeft +
                index * (chart.barWidth + chart.spacing) -
                (isSelected ? 3 : 0);
              const y = chart.plotTop + (height - totalHeight);
              const radius = 6;

              return (
                <React.Fragment key={`bar-${point.yearIndex}`}>
                  <Rect
                    x={x}
                    y={y + earnedHeight}
                    width={barWidth}
                    height={addedHeight}
                    rx={radius}
                    ry={radius}
                    fill={COLORS.chart.contribution}
                    fillOpacity={isSelected ? 1 : 0.9}
                  />
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={earnedHeight}
                    rx={radius}
                    ry={radius}
                    fill={COLORS.chart.interest}
                    fillOpacity={isSelected ? 1 : 0.7}
                  />
                </React.Fragment>
              );
            })}
          </Svg>

          <View
            style={[
              styles.gestureLayer,
              {
                left: chart.plotLeft,
                top: chart.plotTop,
                height,
                width: chart.plotWidth,
              },
            ]}
            {...panResponder.panHandlers}
          />

          {selectedPoint && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.tooltip,
                {
                  opacity: tooltipOpacity,
                  transform: [{ translateX: tooltipX }, { translateY: tooltipY }],
                },
              ]}
            >
              <Text style={styles.tooltipYear}>Year {selectedPoint.yearIndex}</Text>
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>Contrib</Text>
                <Text style={styles.tooltipValue}>
                  {formatCurrency(selectedPoint.totalAddedToDate)}
                </Text>
              </View>
              <View style={styles.tooltipRow}>
                <Text style={styles.tooltipLabel}>Earned</Text>
                <Text style={styles.tooltipValue}>
                  {formatCurrency(selectedPoint.interestEarnedToDate)}
                </Text>
              </View>
            </Animated.View>
          )}
        </View>
      )}
      <View style={styles.bottomLabels}>
        <Text style={styles.bottomLabel}>1Y</Text>
        <Text style={styles.bottomLabelCenter}>Future Projection</Text>
        <Text style={styles.bottomLabel}>{endLabel}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  gestureLayer: {
    position: 'absolute',
  },
  tooltip: {
    position: 'absolute',
    width: tooltipWidth,
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    backgroundColor: 'rgba(8, 12, 22, 0.86)',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: COLORS.accent.glow,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  tooltipYear: {
    color: COLORS.text.muted,
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: 12,
    marginBottom: 6,
  },
  tooltipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tooltipLabel: {
    color: COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: 15,
  },
  tooltipValue: {
    color: COLORS.text.primary,
    fontFamily: TYPOGRAPHY.families.bold,
    fontSize: 15,
  },
  bottomLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.s,
    paddingHorizontal: SPACING.s,
  },
  bottomLabel: {
    color: COLORS.text.muted,
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: 12,
  },
  bottomLabelCenter: {
    color: COLORS.text.secondary,
    fontFamily: TYPOGRAPHY.families.semibold,
    fontSize: 12,
  },
});
