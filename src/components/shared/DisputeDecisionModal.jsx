import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

// TODO: Buyer dispute/QC decision modal — accept or reject delivery
export default function DisputeDecisionModal({ visible, order, onAccept, onReject, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 24 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Dispute Decision — TODO</Text>
          <TouchableOpacity onPress={onClose}><Text style={{ color: 'red', marginTop: 12 }}>Đóng</Text></TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
