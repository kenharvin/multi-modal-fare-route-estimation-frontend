import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Location } from '@/types';
import { searchStops } from '@services/api';
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
          placeholderTextColor="#bdc3c7"
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 16
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    paddingHorizontal: 12,
    paddingVertical: 4
  },
  icon: {
    marginRight: 8
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2c3e50',
    paddingVertical: 12
  },
  clearButton: {
    padding: 4
  },
  suggestionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#ecf0f1',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 12
  },
  suggestionName: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '500'
  },
  suggestionAddress: {
    fontSize: 12,
    color: '#7f8c8d',
    marginTop: 2
  }
});

export default DestinationInput;

