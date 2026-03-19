import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { borderRadius, colors, spacing } from '../../constants';
import { formatCurrency, type SpendingTimeframe } from '../../utils';
import { Button, Card, Typography } from '../common';

interface SpendingByPersonItem {
  id: string;
  name: string;
  amount: number;
}

interface SpendingByPersonChartProps {
  items: ReadonlyArray<SpendingByPersonItem>;
  currency: string;
  timeframe: SpendingTimeframe;
  onTimeframeChange: (timeframe: SpendingTimeframe) => void;
}

export const SpendingByPersonChart = ({
  items,
  currency,
  timeframe,
  onTimeframeChange,
}: SpendingByPersonChartProps): React.JSX.Element => {
  const totalSpent = useMemo(
    () => items.reduce((sum, entry) => sum + entry.amount, 0),
    [items],
  );
  const maxAmount = useMemo(() => Math.max(...items.map((entry) => entry.amount), 0), [items]);
  const topSpender = items[0] ?? null;

  return (
    <Card>
      <View style={styles.headerRow}>
        <Typography variant="h4">Budget Usage</Typography>
        <Typography variant="caption">
          Total used: {formatCurrency(totalSpent, currency)}
        </Typography>
      </View>

      <View style={styles.timeframeRow}>
        <Button
          onPress={() => onTimeframeChange('month')}
          style={styles.timeframeButton}
          title="This Month"
          variant={timeframe === 'month' ? 'primary' : 'secondary'}
        />
        <Button
          onPress={() => onTimeframeChange('all')}
          style={styles.timeframeButton}
          title="All Time"
          variant={timeframe === 'all' ? 'primary' : 'secondary'}
        />
      </View>

      {items.length === 0 ? (
        <Typography variant="bodySmall">No usage data for this timeframe yet.</Typography>
      ) : (
        <>
          <Typography style={styles.topSpenderText} variant="bodySmall">
            Top usage: {topSpender?.name ?? '-'} ({formatCurrency(topSpender?.amount ?? 0, currency)})
          </Typography>
          <View style={styles.bars}>
            {items.map((item) => {
              const relativeWidth = maxAmount > 0
                ? (item.amount / maxAmount) * 100
                : 0;
              const widthPercent = item.amount > 0
                ? Math.max(relativeWidth, 6)
                : 0;

              return (
                <View key={item.id} style={styles.barBlock}>
                  <View style={styles.barMetaRow}>
                    <Typography numberOfLines={1} style={styles.personName} variant="bodySmall">
                      {item.name}
                    </Typography>
                    <Typography variant="caption">{formatCurrency(item.amount, currency)}</Typography>
                  </View>
                  <View style={styles.track}>
                    <LinearGradient
                      colors={[colors.buttonGlassPrimaryStart, colors.buttonGlassPrimaryEnd]}
                      end={{ x: 1, y: 0 }}
                      start={{ x: 0, y: 0 }}
                      style={[styles.fill, { width: `${widthPercent}%` }]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  timeframeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  timeframeButton: {
    flex: 1,
  },
  topSpenderText: {
    marginBottom: spacing.sm,
  },
  bars: {
    gap: spacing.sm,
  },
  barBlock: {
    gap: spacing.xs,
  },
  barMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  personName: {
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  track: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    height: 12,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: borderRadius.full,
    height: '100%',
    minWidth: 2,
  },
});

export default SpendingByPersonChart;
