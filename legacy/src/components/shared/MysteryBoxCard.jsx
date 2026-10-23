import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// TODO: implement MysteryBoxCard component
export default function MysteryBoxCard({ box, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ margin: 8, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
      <Text>MysteryBoxCard — TODO</Text>
    </TouchableOpacity>
  );
}
