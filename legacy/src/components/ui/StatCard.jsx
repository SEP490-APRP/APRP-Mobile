import React from 'react';
import { View, Text } from 'react-native';

// TODO: implement StatCard component
export default function StatCard({ label, value, color = '#4CAF50' }) {
  return (
    <View style={{ padding: 16, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#eee', alignItems: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color }}>{value}</Text>
      <Text style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{label}</Text>
    </View>
  );
}
