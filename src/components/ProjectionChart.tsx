import React, { useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { colors } from '../theme/colors';

type ChartPoint = {
  x: number;
  y: number;
};

type ProjectionChartProps = {
  data: ChartPoint[];
};

type Point = { x: number; y: number };

const toSmoothPath = (points: Point[]) => {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  const d: string[] = [`M ${points[0].x} ${points[0].y}`];
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(' ');
};

export const ProjectionChart = ({ data }: ProjectionChartProps) => {
  const [width, setWidth] = useState(0);
  const height = 180;
  const padding = { top: 12, right: 12, bottom: 16, left: 12 };

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const { points, areaPath, linePath, lastPoint, gridLines } = useMemo(() => {
    if (data.length === 0 || width === 0) {
      return {
        points: [] as Point[],
        areaPath: '',
        linePath: '',
        lastPoint: null as Point | null,
        gridLines: [] as number[],
      };
    }

    const plotWidth = width - padding.left - padding.right;
    const plotHeight = height - padding.top - padding.bottom;
    const xs = data.map((point) => point.x);
    const ys = data.map((point) => point.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const xRange = maxX - minX || 1;
    const yRange = maxY - minY || 1;

    const mapped: Point[] = data.map((point) => {
      const x = padding.left + ((point.x - minX) / xRange) * plotWidth;
      const y = padding.top + plotHeight - ((point.y - minY) / yRange) * plotHeight;
      return { x, y };
    });

    const smoothLine = toSmoothPath(mapped);
    const areaBottom = padding.top + plotHeight;
    const areaPathValue = `${smoothLine} L ${mapped[mapped.length - 1].x} ${areaBottom} L ${mapped[0].x} ${areaBottom} Z`;

    const grid = [0, 1, 2].map((index) => {
      return padding.top + (plotHeight * index) / 2;
    });

    return {
      points: mapped,
      areaPath: areaPathValue,
      linePath: smoothLine,
      lastPoint: mapped[mapped.length - 1],
      gridLines: grid,
    };
  }, [data, height, padding.bottom, padding.left, padding.right, padding.top, width]);

  if (data.length === 0) {
    return <View style={[styles.container, { height }]} />;
  }

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {width > 0 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={colors.chartFillStart} stopOpacity={1} />
              <Stop offset="100%" stopColor={colors.chartFillEnd} stopOpacity={1} />
            </LinearGradient>
          </Defs>

          {gridLines.map((y) => (
            <Line
              key={`grid-${y}`}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke={colors.chartGrid}
              strokeWidth={1}
              strokeDasharray="6 6"
            />
          ))}

          {areaPath ? <Path d={areaPath} fill="url(#areaGradient)" /> : null}
          {linePath ? <Path d={linePath} stroke={colors.chartLine} strokeWidth={1.6} fill="none" /> : null}

          {lastPoint ? (
            <Circle cx={lastPoint.x} cy={lastPoint.y} r={5} fill={colors.softPeach} />
          ) : null}
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 180,
  },
});
