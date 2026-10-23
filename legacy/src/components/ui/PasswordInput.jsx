import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';

// TODO: implement PasswordInput component (with show/hide toggle)
export default function PasswordInput({ value, onChangeText, placeholder = 'Mật khẩu', style }) {
  const [show, setShow] = useState(false);
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12 }, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={!show}
        style={{ flex: 1, paddingVertical: 12 }}
      />
      <TouchableOpacity onPress={() => setShow(!show)}>
        <Text style={{ color: '#888' }}>{show ? 'Ẩn' : 'Hiện'}</Text>
      </TouchableOpacity>
    </View>
  );
}
