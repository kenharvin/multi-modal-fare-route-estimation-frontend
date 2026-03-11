import { StyleSheet } from 'react-native';
import { spacing } from '@/utils/theme';

export const themeToggleStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
});
