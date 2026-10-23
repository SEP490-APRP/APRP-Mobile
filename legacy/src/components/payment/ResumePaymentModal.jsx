import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

// TODO: implement ResumePaymentModal component
export default function ResumePaymentModal({ visible, payment, onResume, onCancel }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ padding: 24, backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
          <Text>ResumePaymentModal — TODO</Text>
        </View>
      </View>
    </Modal>
  );
}
