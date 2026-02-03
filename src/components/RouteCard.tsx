import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Route, TransportType } from '@/types';
import { getTransportStyle } from '@/utils/transportUtils';

interface RouteCardProps {
  route: Route;
  isSelected: boolean;
  rank?: number;
  onSelect?: () => void;
}

const RouteCard: React.FC<RouteCardProps> = ({ route, isSelected, rank, onSelect }) => {
  const formatEta = (minutesFromNow: number) => {
    const mins = Number(minutesFromNow) || 0;
    const arrive = new Date(Date.now() + Math.max(0, mins) * 60 * 1000);
    const hh = arrive.getHours().toString().padStart(2, '0');
    const mm = arrive.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const titleCaseWord = (w: string) => {
    if (!w) return w;
    // Keep short acronyms (e.g., MRT, LRT, PNR, EDSA)
    if (w.length <= 4 && w.toUpperCase() === w) return w;
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  };

  const cleanRouteName = (raw: string | undefined | null): string | null => {
    const name = String(raw || '').trim();
    if (!name) return null;

    // Hide backend/internal identifiers
    const hiddenPrefixes = ['LTFRB', 'ROUTE', 'TRIP', 'SHAPE', 'GTFS'];
    const hiddenRe = new RegExp(`^(${hiddenPrefixes.join('|')})[_:-]?[A-Z0-9]+$`, 'i');
    if (hiddenRe.test(name)) return null;

    // If it looks like an internal numeric route code
    if (/^route[_:-]?\d+$/i.test(name)) return null;

    // Humanize ALL_CAPS_WITH_UNDERSCORES (e.g., EDSA_CAROUSEL -> EDSA Carousel)
    if (/^[A-Z0-9]+(?:_[A-Z0-9]+)+$/.test(name)) {
      const words = name.split('_').filter(Boolean);
      const human = words.map(titleCaseWord).join(' ').replace(/\s+/g, ' ').trim();
      return human || null;
    }

    return name;
  };

  const cleanServiceLabel = (seg: any): string => {
    const t: TransportType = seg?.transportType;
    const mode = String(seg?.mode || '').toLowerCase();
    if (t === TransportType.TRAIN) {
      if (mode.includes('mrt')) return 'MRT';
      if (mode.includes('lrt')) return 'LRT';
      if (mode.includes('pnr')) return 'PNR';
      return 'Train';
    }
    const transportStyle = getTransportStyle(t);
    return transportStyle.label || 'Transit';
  };

  const stepRows = (() => {
    const s = route.segments || [];
    if (s.length === 0) return [] as { key: string; type: 'start' | 'segment'; icon: string; color: string; title: string; subtitle?: string; metaRight?: string }[];

    const rows: { key: string; type: 'start' | 'segment'; icon: string; color: string; title: string; subtitle?: string; metaRight?: string }[] = [];

    // Start row
    const startName = s[0]?.origin?.name || 'Your location';
    rows.push({
      key: 'start',
      type: 'start',
      icon: '●',
      color: '#1a73e8',
      title: startName
    });

    let lastNonWalkKey: string | null = null;
    let sawWalkSinceLastNonWalk = false;
    let pendingTransferAt: string | null = null;

    for (let i = 0; i < s.length; i++) {
      const seg = s[i];
      const transportStyle = getTransportStyle(seg.transportType);
      const isWalk = seg.transportType === TransportType.WALK;
      const routeName = (seg.routeName || '').trim();
      const nonWalkKey = isWalk ? null : `${seg.transportType}:${routeName}`;

      if (isWalk) {
        if (lastNonWalkKey) sawWalkSinceLastNonWalk = true;
      }

      if (!isWalk && lastNonWalkKey && nonWalkKey && (nonWalkKey !== lastNonWalkKey || sawWalkSinceLastNonWalk)) {
        const transferAt = s[i - 1]?.destination?.name || 'transfer point';
        pendingTransferAt = transferAt;
      }

      const time = Number(seg.estimatedTime) || 0;
      const fare = Number(seg.fare) || 0;
      const distKm = Number(seg.distance) || 0;

      const metaParts: string[] = [];
      if (time > 0) metaParts.push(`${time} min`);
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
      } else {
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
    }

    // End row
    const endName = s[s.length - 1]?.destination?.name;
    if (endName) {
      rows.push({
        key: 'end',
        type: 'start',
        icon: '●',
        color: '#d93025',
        title: endName
      });
    }

    return rows;
  })();

  const content = (
    <View style={[styles.container, isSelected && styles.containerSelected]}>
      {rank && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>#{rank}</Text>
        </View>
      )}
      
      {route.fuzzyScore !== undefined && (
        <View style={styles.scoreBadge}>
          <Text>*</Text>
          <Text style={styles.scoreText}>{(route.fuzzyScore * 100).toFixed(0)}</Text>
        </View>
      )}

      {isSelected && (
        <View style={styles.transportIcons}>
          {route.segments.map((segment, index) => {
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

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text>$</Text>
          <Text style={styles.infoLabel}>Fare</Text>
          <Text style={styles.infoValue}>₱{route.totalFare.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text>T</Text>
          <Text style={styles.infoLabel}>Time</Text>
          <Text style={styles.infoValue}>{route.totalTime} min</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text>↔</Text>
          <Text style={styles.infoLabel}>Transfers</Text>
          <Text style={styles.infoValue}>
            {route.totalTransfers === 0
              ? 'None'
              : `${route.totalTransfers} transfer${route.totalTransfers === 1 ? '' : 's'}`}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.infoItem}>
          <Text>ETA</Text>
          <Text style={styles.infoLabel}>Arrive</Text>
          <Text style={styles.infoValue}>{formatEta(route.totalTime)}</Text>
        </View>
      </View>

      {!isSelected && (
        <Text style={styles.tapHintText}>Tap to show modes & steps</Text>
      )}

      {isSelected && (
        <View style={styles.segmentsSection}>
          <Text style={styles.stepsTitle}>Steps</Text>
          <View style={styles.stepsList}>
            <View pointerEvents="none" style={styles.stepsRail} />
            {stepRows.map((row) => {
              return (
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
              );
            })}
          </View>
        </View>
      )}
    </View>
  );

  if (onSelect) {
    return (
      <TouchableOpacity onPress={onSelect} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ecf0f1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  containerSelected: {
    borderColor: '#3498db',
    backgroundColor: '#e3f2fd'
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  scoreBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  scoreText: {
    color: '#856404',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4
  },
  transportIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    marginTop: 14,
    flexWrap: 'wrap'
  },
  tapHintText: {
    marginTop: 10,
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    fontWeight: '600'
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4
  },
  transportBadge: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50
  },
  transportIcon: {
    fontSize: 24
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  infoItem: {
    flex: 1,
    alignItems: 'center'
  },
  infoLabel: {
    fontSize: 10,
    color: '#7f8c8d',
    marginTop: 4
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: 2
  },
  divider: {
    width: 1,
    backgroundColor: '#ecf0f1',
    marginHorizontal: 4
  },
  segmentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    paddingTop: 14
  },
  stepsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 10
  },
  stepsList: {
    marginBottom: 8,
    position: 'relative'
  },
  stepsRail: {
    position: 'absolute',
    left: 24,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#1a73e8',
    opacity: 0.35
  },
  stepRow: {
    flexDirection: 'row',
    paddingVertical: 12
  },
  stepLeft: {
    width: 50,
    alignItems: 'center'
  },
  stepDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepDotInner: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepDotIcon: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700'
  },
  stepMain: {
    flex: 1,
    paddingRight: 4
  },
  stepTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10
  },
  stepTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    color: '#2c3e50'
  },
  stepMeta: {
    fontSize: 13,
    color: '#34495e',
    fontWeight: '600'
  },
  stepSubtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 18,
    color: '#7f8c8d'
  },
  stepText: {
    fontSize: 11,
    color: '#34495e',
    marginBottom: 4
  },
  stepsDivider: {
    height: 1,
    backgroundColor: '#ecf0f1',
    marginTop: 8,
    marginBottom: 12
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    paddingLeft: 8
  },
  segmentColorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 2
  },
  segmentBadge: {
    borderRadius: 16,
    padding: 6,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
    minHeight: 32
  },
  segmentIcon: {
    fontSize: 18
  },
  segmentContent: {
    flex: 1
  },
  segmentTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2
  },
  segmentText: {
    fontSize: 11,
    color: '#7f8c8d',
    flexShrink: 1
  }
});

export default RouteCard;

