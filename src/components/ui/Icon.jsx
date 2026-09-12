import React from 'react';
import { Text } from 'react-native';

// TODO: implement Icon component (wraps vector icons or emoji fallback)
export default function Icon({ name, size = 20, color = '#333' }) {
  // Replace with actual icon library (e.g., @expo/vector-icons)
  return <Text style={{ fontSize: size, color }}>{name}</Text>;
}
