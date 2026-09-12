import React from 'react';
import { SafeAreaView, View } from 'react-native';

// TODO: implement ScreenWrapper component
export default function ScreenWrapper({ children, style }) {
  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: '#fff' }, style]}>
      <View style={{ flex: 1 }}>
        {children}
      </View>
    </SafeAreaView>
  );
}
