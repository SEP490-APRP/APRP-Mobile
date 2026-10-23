import React from 'react';
import { View } from 'react-native';

// TODO: implement ScreenFooter component
export default function ScreenFooter({ children }) {
  return (
    <View style={{ padding: 16 }}>
      {children}
    </View>
  );
}
