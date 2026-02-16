import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Route, TransportType } from '@/types';
import { getTransportStyle } from '@/utils/transportUtils';
import { formatArrivalTimeRange, formatCurrency, formatTimeRange } from '@/utils/helpers';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';

interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  rank?: number;
  onSelect?: (route: Route) => void;
}

type StepRow = {
  key: string;
  type: 'start' | 'segment' | 'end';
  icon: string;
  color: string;
  title: string;
  subtitle?: string;
  metaRight?: string;
};

const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, rank, onSelect }) => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const titleCaseWord = useCallback((w: string) => {
    if (!w) return w;
    if (w.length <= 4 && w.toUpperCase() === w) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }, []);

  const cleanRouteName = useCallback((raw: string | undefined | null): string | null => {
    const name = String(raw || '').trim();
    if (!name) return null;

    const hiddenPrefixes = ['LTFRB', 'ROUTE', 'TRIP', 'SHAPE', 'GTFS'];
    const hiddenRe = new RegExp(`^(${hiddenPrefixes.join('|')})[_:-]?[A-Z0-9]+$`, 'i');
    if (hiddenRe.test(name)) return null;
    if (/^route[_:-]?\d+$/i.test(name)) return null;

    if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(name)) {
      const words = name.split('_').filter(Boolean);
      const human = words.map(titleCaseWord).join(' ').replace(/\s+/g, ' ').trim();
      return human || null;
    }

    return name;
  }, [titleCaseWord]);

  const cleanServiceLabel = useCallback((seg: any): string => {
    const transportType: TransportType = seg?.transportType;
    const mode = String(seg?.mode || '').toLowerCase();

    if (transportType === TransportType.TRAIN) {
      if (mode.includes('mrt')) return 'MRT';
      if (mode.includes('lrt')) return 'LRT';
      if (mode.includes('pnr')) return 'PNR';
      return 'Train';
    }

    const transportStyle = getTransportStyle(transportType);
    return transportStyle.label || 'Transit';
  }, []);

  const stepRows: StepRow[] = useMemo(() => {
    if (!isSelected) return [];
    const segments = route.segments || [];
    if (segments.length === 0) return [];

    const rows: StepRow[] = [];

    rows.push({
      key: 'start',
      type: 'start',
      icon: '●',
      color: colors.primary,
      title: segments[0]?.origin?.name || 'Your location'
    });

    let lastNonWalkKey: string | null = null;
    let sawWalkSinceLastNonWalk = false;
    let pendingTransferAt: string | null = null;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const transportStyle = getTransportStyle(seg.transportType);
      const isWalk = seg.transportType === TransportType.WALK;
      const routeName = (seg.routeName || '').trim();
      const nonWalkKey = isWalk ? null : `${seg.transportType}:${routeName}`;

      if (isWalk && lastNonWalkKey) {
        sawWalkSinceLastNonWalk = true;
      }

      if (!isWalk && lastNonWalkKey && nonWalkKey && (nonWalkKey !== lastNonWalkKey || sawWalkSinceLastNonWalk)) {
        pendingTransferAt = segments[i - 1]?.destination?.name || 'transfer point';
      }

      const time = Number(seg.estimatedTime) || 0;
      const fare = Number(seg.fare) || 0;
      const distKm = Number(seg.distance) || 0;

      const metaParts: string[] = [];
      if (time > 0) metaParts.push(formatTimeRange(time));
      if (!isWalk && fare > 0) metaParts.push(`₱${fare.toFixed(0)}`);
      const metaRight = metaParts.join(' • ');

      if (isWalk) {
        const destName = seg.destination?.name || 'next stop';
        const subtitleParts: string[] = [];
        if (distKm > 0) subtitleParts.push(`${distKm.toFixed(distKm < 1 ? 2 : 1)} km`);

        rows.push({
          key: seg.id || `seg-${i}`,
          type: 'segment',
          icon: transportStyle.icon,
          color: transportStyle.color,
          title: `Walk to ${destName}`,
          subtitle: subtitleParts.length ? subtitleParts.join('\n') : undefined,
          metaRight
        });

        continue;
      }

      const serviceLabel = cleanServiceLabel(seg);
      const routeLabel = cleanRouteName(routeName);
      const subtitleParts: string[] = [];
      if (pendingTransferAt) subtitleParts.push(`Transfer at ${pendingTransferAt}`);
      if (routeLabel) subtitleParts.push(routeLabel);
      if (seg.origin?.name && seg.destination?.name) subtitleParts.push(`${seg.origin.name} → ${seg.destination.name}`);
      if (distKm > 0) subtitleParts.push(`Distance: ${distKm.toFixed(distKm < 1 ? 2 : 1)} km`);

      rows.push({
        key: seg.id || `seg-${i}`,
        type: 'segment',
        icon: transportStyle.icon,
        color: transportStyle.color,
        title: `Take ${serviceLabel}`,
        subtitle: subtitleParts.length ? subtitleParts.join('\n') : undefined,
        metaRight
      });

      lastNonWalkKey = nonWalkKey;
      sawWalkSinceLastNonWalk = false;
      pendingTransferAt = null;
    }

    const endName = segments[segments.length - 1]?.destination?.name;
    if (endName) {
      rows.push({
        key: 'end',
        type: 'end',
        icon: '●',
        color: colors.error,
        title: endName
      });
    }

    return rows;
  }, [cleanRouteName, cleanServiceLabel, colors.error, colors.primary, isSelected, route.segments]);

  const content = (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {rank && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}

      {route.fuzzyScore !== undefined && (
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreIcon}>*</Text>
          <Text style={styles.scoreText}>{(route.fuzzyScore * 100).toFixed(0)}</Text>
        </View>
      )}

      {isSelected && (
        <View style={styles.transportIcons}>
          {(route.segments || []).map((segment, index) => {
            const transportStyle = getTransportStyle(segment.transportType);
            return (
              <View key={index} style={styles.iconContainer}>
                <View style={[styles.transportBadge, { backgroundColor: transportStyle.color }]}>
                  <Text style={styles.transportIcon}>{transportStyle.icon}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.infoGrid}>
        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>Fare</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {formatCurrency(route.totalFare)}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={[styles.infoValue, styles.infoValueWrap]} numberOfLines={2}>
            {formatTimeRange(route.totalTime)}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>Transfers</Text>
          <Text style={[styles.infoValue, styles.infoValueWrap]} numberOfLines={2}>
            {route.totalTransfers === 0
              ? 'None'
              : `${route.totalTransfers} transfer${route.totalTransfers === 1 ? '' : 's'}`}
          </Text>
        </View>

        <View style={styles.infoCell}>
          <Text style={styles.infoLabel}>Arrive (ETA)</Text>
          <Text style={[styles.infoValue, styles.infoValueWrap]} numberOfLines={2}>
            {formatArrivalTimeRange(route.totalTime)}
          </Text>
        </View>
      </View>

      {!isSelected && <Text style={styles.tapHintText}>Tap to show modes & steps</Text>}

      {isSelected && (
        <View style={styles.segmentsSection}>
          <Text style={styles.stepsTitle}>Steps</Text>
          <View style={styles.stepsList}>
            <View pointerEvents="none" style={styles.stepsRail} />
            {stepRows.map((row) => (
              <View key={row.key} style={styles.stepRow}>
                <View style={styles.stepLeft}>
                  <View style={[styles.stepDot, { borderColor: row.color }]}>
                    <View style={[styles.stepDotInner, { backgroundColor: row.color }]}>
                      <Text style={styles.stepDotIcon}>{row.icon}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.stepMain}>
                  <View style={styles.stepTopRow}>
                    <Text style={styles.stepTitle} numberOfLines={4}>
                      {row.title}
                    </Text>
                    {!!row.metaRight && (
                      <Text style={styles.stepMeta} numberOfLines={1}>
                        {row.metaRight}
                      </Text>
                    )}
                  </View>
                  {!!row.subtitle && (
                    <Text style={styles.stepSubtitle} numberOfLines={6}>
                      {row.subtitle}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  if (onSelect) {
    return (
      <TouchableOpacity onPress={() => onSelect(route)} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.gray6,
    ...shadows.small
  },
  containerSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    ...shadows.medium
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    zIndex: 1
  },
  rankText: {
    color: colors.textWhite,
    fontSize: fontSize.sm,
    fontWeight: '700'
  },
  scoreBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 1
  },
  scoreIcon: {
    color: colors.textWhite,
    fontSize: fontSize.sm,
    fontWeight: '700'
  },
  scoreText: {
    color: colors.textWhite,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginLeft: spacing.xs
  },
  transportIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  iconContainer: {
    marginHorizontal: spacing.xs,
    marginVertical: spacing.xs
  },
  transportBadge: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center'
  },
  transportIcon: {
    fontSize: 18,
    color: colors.textWhite
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: colors.gray7,
    borderRadius: borderRadius.xl,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray6
  },
  infoCell: {
    width: '50%',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs
  },
  infoLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2
  },
  infoValue: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2
  },
  infoValueWrap: {
    lineHeight: 18,
    flexShrink: 1
  },
  tapHintText: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.md,
    fontSize: fontSize.sm
  },
  segmentsSection: {
    marginTop: spacing.lg
  },
  stepsTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  stepsList: {
    position: 'relative'
  },
  stepsRail: {
    position: 'absolute',
    left: 13,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: colors.gray6
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.md
  },
  stepLeft: {
    width: 34,
    alignItems: 'center'
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepDotInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepDotIcon: {
    color: colors.textWhite,
    fontSize: 11,
    fontWeight: '700'
  },
  stepMain: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray6,
    borderRadius: borderRadius.xl,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    ...shadows.small
  },
  stepTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  stepTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1
  },
  stepMeta: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: '700'
  },
  stepSubtitle: {
    fontSize: fontSize.sm,
    color: colors.gray2,
    marginTop: spacing.sm,
    lineHeight: 16
  }
});

export default React.memo(RouteCard, (prev, next) => (
  prev.route === next.route &&
  prev.isSelected === next.isSelected &&
  prev.rank === next.rank &&
  prev.onSelect === next.onSelect
));