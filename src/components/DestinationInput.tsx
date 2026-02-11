import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Location } from '@/types';
import { searchStops } from '@services/api';
import { borderRadius, fontSize, shadows, spacing, type ThemeColors } from '@/utils/theme';
import { useThemeMode } from '@context/ThemeContext';
interface DestinationInputProps {
  label: string;
  value: Location | null;
  onValueChange: (location: Location) => void;
  placeholder?: string;
  searchProvider?: (query: string) => Promise<Location[]>;
}

const DestinationInput: React.FC<DestinationInputProps> = ({
  label,
  value,
  onValueChange,
  placeholder = 'Enter location',
  searchProvider
}) => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [searchText, setSearchText] = useState<string>(value?.name || '');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Search stops using backend API
  const searchLocations = async (text: string) => {
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const fn = searchProvider || searchStops;
      const results = await fn(text);
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
    }
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    searchLocations(text);
  };

  const handleSelectLocation = (location: Location) => {
    setSearchText(location.name);
    onValueChange(location);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setSearchText('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <Text>*</Text>
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          onFocus={() => searchText.length >= 3 && setShowSuggestions(true)}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text>X</Text>
          </TouchableOpacity>
        )}
      </View>

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelectLocation(item)}
              >
                <Text>PIN</Text>
                <View style={styles.suggestionInfo}>
                  <Text style={styles.suggestionName}>{item.name}</Text>
                  {item.address && (
                    <Text style={styles.suggestionAddress}>{item.address}</Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
          />
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    marginBottom: spacing.lg
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    letterSpacing: 0.3
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.gray6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    ...shadows.small
  },
  icon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: fontSize.lg,
    color: colors.textPrimary,
    paddingVertical: spacing.md
  },
  clearButton: {
    padding: spacing.xs
  },
  suggestionsContainer: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray6,
    maxHeight: 200,
    ...shadows.medium
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray6
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: spacing.md
  },
  suggestionName: {
    fontSize: fontSize.md,
    color: colors.textPrimary,
    fontWeight: '500'
  },
  suggestionAddress: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs
  }
});

export default DestinationInput;

