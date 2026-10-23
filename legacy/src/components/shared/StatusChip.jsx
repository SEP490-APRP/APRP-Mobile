import React from 'react';
import { View, Text } from 'react-native';

// TODO: implement StatusChip component
export default function StatusChip({ status, color }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: color ?? '#eee' }}>
      <Text style={{ fontSize: 12, fontWeight: '600' }}>{status}</Text>
    </View>
  );
}
