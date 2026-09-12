import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';

// TODO: implement CustomAlert component
export default function CustomAlert({ visible, title, message, buttons = [], onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ width: '80%', backgroundColor: '#fff', borderRadius: 12, padding: 24 }}>
          {title ? <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8 }}>{title}</Text> : null}
          {message ? <Text style={{ color: '#555', marginBottom: 16 }}>{message}</Text> : null}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
            {buttons.map((btn, i) => (
              <TouchableOpacity key={i} onPress={btn.onPress} style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
                <Text style={{ color: btn.style === 'destructive' ? '#e53935' : '#4CAF50', fontWeight: '600' }}>{btn.text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
