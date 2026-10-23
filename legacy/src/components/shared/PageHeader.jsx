import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

// TODO: implement PageHeader component
export default function PageHeader({ title, onBack, rightAction }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
      {onBack && <TouchableOpacity onPress={onBack}><Text>←</Text></TouchableOpacity>}
      <Text style={{ flex: 1, textAlign: 'center', fontWeight: '600', fontSize: 16 }}>{title}</Text>
      {rightAction ?? <View style={{ width: 24 }} />}
    </View>
  );
}
