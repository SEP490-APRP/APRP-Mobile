import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView } from 'react-native';

// TODO: implement OrderDetailSheet (bottom sheet showing order details)
export default function OrderDetailSheet({ visible, order, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ maxHeight: '80%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 }}>
          <Text>OrderDetailSheet — TODO</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: 'red', marginTop: 12 }}>Đóng</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
