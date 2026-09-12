import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// TODO: implement Toggle (switch) component
export default function Toggle({ value, onValueChange }) {
  const translateX = useSharedValue(value ? 22 : 2);

  const handlePress = () => {
    const next = !value;
    translateX.value = withTiming(next ? 22 : 2, { duration: 180 });
    onValueChange && onValueChange(next);
  };

  const thumbStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <TouchableOpacity onPress={handlePress} style={{ width: 48, height: 26, borderRadius: 13, backgroundColor: value ? '#4CAF50' : '#ccc', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff', elevation: 2 }, thumbStyle]} />
    </TouchableOpacity>
  );
}
