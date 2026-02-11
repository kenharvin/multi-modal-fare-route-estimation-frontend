import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { useThemeMode } from '@context/ThemeContext';
import { fontSize, spacing, type ThemeColors } from '@/utils/theme';

const LOGO = require('../assets/images/628106684_902319769440556_4828750431026813083_n-removebg-preview.png');

type Props = {
  message?: string;
};

const LogoLoadingScreen: React.FC<Props> = ({ message }) => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const [dots, setDots] = useState<string>('');

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true
        })
      ])
    );

    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [floatAnim, pulseAnim]);

  useEffect(() => {
    const t = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 450);
    return () => clearInterval(t);
  }, []);

  const translateY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [6, -10]
  });

  const scale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.98, 1.03]
  });

  const rotation = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['-1.5deg', '1.5deg', '-1.5deg']
  });

  const label = message ?? 'Planning your route';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logoWrap, { transform: [{ translateY }, { scale }, { rotate: rotation }] }]}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      <Text style={styles.title}>NaviGO</Text>
      <Text style={styles.subtitle}>{label}{dots}</Text>
    </View>
  );
};

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg
    },
    logoWrap: {
      width: 220,
      height: 220,
      marginBottom: spacing.md
    },
    logo: {
      width: '100%',
      height: '100%'
    },
    title: {
      color: colors.textWhite,
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: 0.5
    },
    subtitle: {
      marginTop: spacing.sm,
      color: colors.textWhite,
      fontSize: fontSize.lg,
      opacity: 0.92
    }
  });

export default LogoLoadingScreen;
