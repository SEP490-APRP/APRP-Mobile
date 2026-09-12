import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

// TODO: implement ChatBotFAB (Floating Action Button)
export default function ChatBotFAB({ onPress }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ position: 'absolute', bottom: 80, right: 20, width: 52, height: 52, borderRadius: 26, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontSize: 22 }}>🤖</Text>
    </TouchableOpacity>
  );
}
