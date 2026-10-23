import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';

// TODO: Onboarding / first-use tutorial walkthrough
export default function OnboardingTour({ visible, onDone }) {
  return (
    <Modal visible={visible} transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Onboarding Tour — TODO</Text>
        <TouchableOpacity onPress={onDone} style={{ marginTop: 16 }}>
          <Text style={{ color: '#fff' }}>Bắt đầu</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}
