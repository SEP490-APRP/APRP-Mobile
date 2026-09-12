import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// TODO: implement OrderCard component
export default function OrderCard({ order, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ margin: 8, padding: 12, backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#eee' }}>
      <Text>OrderCard — TODO</Text>
    </TouchableOpacity>
  );
}
