import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Location } from '@/types';
import { searchStops } from '@services/api';
import { useThemeMode } from '@context/ThemeContext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createDestinationInputStyles } from '@/styles/components/destinationInput.styles';
interface DestinationInputProps {
  label: string;
  value: Location | null;
  onValueChange: (location: Location | null) => void;
  placeholder?: string;
  searchProvider?: (query: string) => Promise<Location[]>;
  onPinPress?: () => void;
  pinColor?: string;
}

const DestinationInput: React.FC<DestinationInputProps> = ({
  label,
  value,
  onValueChange,
  placeholder = 'Enter location',
  searchProvider,
  onPinPress,
  pinColor
}) => {
  const { colors } = useThemeMode();
  const styles = useMemo(() => createDestinationInputStyles(colors), [colors]);

  const [searchText, setSearchText] = useState<string>(value?.name || '');
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  useEffect(() => {
    const next = value?.name || '';
    setSearchText((prev) => (prev === next ? prev : next));
  }, [value?.name]);

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
    if (text.trim().length === 0) {
      onValueChange(null);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
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
    onValueChange(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons
          name="map-marker"
          size={18}
          color={pinColor || colors.textSecondary}
          style={styles.leadingPin}
        />
        <TextInput
          style={styles.input}
          value={searchText}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          onFocus={() => searchText.length >= 3 && setShowSuggestions(true)}
        />
        {typeof onPinPress === 'function' && (
          <TouchableOpacity onPress={onPinPress} style={styles.pinButton}>
            <MaterialCommunityIcons
              name="crosshairs-gps"
              size={20}
              color={pinColor || colors.primary}
            />
          </TouchableOpacity>
        )}
        {searchText.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>X</Text>
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
                <Text style={styles.suggestionPinText}>PIN</Text>
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

export default DestinationInput;

