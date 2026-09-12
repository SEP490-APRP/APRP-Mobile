import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

// TODO: implement Button component (primary, secondary, danger variants)
export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style }) {
  const bg = variant === 'primary' ? '#4CAF50' : variant === 'danger' ? '#e53935' : '#eeeeee';
  const color = variant === 'secondary' ? '#333' : '#fff';
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[{ paddingVertical: 14, borderRadius: 10, alignItems: 'center', backgroundColor: bg, opacity: (disabled || loading) ? 0.6 : 1 }, style]}
    >
      {loading ? <ActivityIndicator color={color} /> : <Text style={{ color, fontWeight: '600', fontSize: 15 }}>{title}</Text>}
    </TouchableOpacity>
  );
}
