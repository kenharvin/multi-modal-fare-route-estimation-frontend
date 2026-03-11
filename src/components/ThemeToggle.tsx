import React from 'react';
import { View } from 'react-native';
import { Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeMode } from '@context/ThemeContext';
import { themeToggleStyles as styles } from '@/styles/components/themeToggle.styles';

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

export default ThemeToggle;
