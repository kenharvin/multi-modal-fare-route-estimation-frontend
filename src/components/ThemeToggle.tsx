import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeMode } from '@context/ThemeContext';
import { spacing } from '@/utils/theme';

const ThemeToggle: React.FC = () => {
  const { isDark, toggleMode, colors } = useThemeMode();

  return (
    <View style={styles.wrap}>
      <MaterialCommunityIcons
        name={isDark ? 'weather-night' : 'white-balance-sunny'}
        size={18}
        color={colors.textWhite}
        style={styles.icon}
      />
      <Switch value={isDark} onValueChange={toggleMode} color={colors.textWhite} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
});

export default ThemeToggle;
