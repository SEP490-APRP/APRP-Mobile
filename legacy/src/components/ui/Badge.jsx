import React from 'react';
import { View, Text } from 'react-native';

// TODO: implement Badge component
export default function Badge({ count, color = '#e53935' }) {
  if (!count) return null;
  return (
    <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: color, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}
