import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// TODO: implement CartItem component
export default function CartItem({ item, onRemove, onUpdateQuantity }) {
  return (
    <View style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
      <Text>{item?.name ?? 'CartItem'} — TODO</Text>
    </View>
  );
}
