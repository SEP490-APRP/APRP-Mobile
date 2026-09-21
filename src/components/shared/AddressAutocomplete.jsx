import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

export default function AddressAutocomplete({ placeholder = "Search address...", onPlaceSelected }) {
  // TODO: Replace with your actual Google Maps API Key
  const GOOGLE_MAPS_API_KEY = "PLACEHOLDER_API_KEY";

  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        fetchDetails={true}
        onPress={(data, details = null) => {
          // 'details' is provided when fetchDetails = true
          if (onPlaceSelected && details) {
            onPlaceSelected({
              address: data.description,
              geometry: details.geometry.location, // { lat: number, lng: number }
            });
          }
        }}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'vi',
          components: 'country:vn',
        }}
        styles={{
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          predefinedPlacesDescription: {
            color: '#1faadb',
          },
          listView: styles.listView,
        }}
        enablePoweredByContainer={false}
        textInputProps={{
          placeholderTextColor: '#A0AEC0',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 999, // Ensure autocomplete drops down over other elements
  },
  textInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
  },
  textInput: {
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1A202C',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  listView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'absolute',
    top: '100%',
    width: '100%',
    zIndex: 1000,
  },
});
