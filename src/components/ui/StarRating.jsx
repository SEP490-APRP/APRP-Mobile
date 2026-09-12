import React from 'react';
import { View, Text } from 'react-native';

// TODO: implement StarRating component
export default function StarRating({ rating = 0, maxStars = 5, size = 16 }) {
  return (
    <View style={{ flexDirection: 'row' }}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Text key={i} style={{ fontSize: size, color: i < rating ? '#FFC107' : '#E0E0E0' }}>★</Text>
      ))}
    </View>
  );
}
