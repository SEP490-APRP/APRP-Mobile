import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList } from 'react-native';

// TODO: implement NotificationModal component
export default function NotificationModal({ visible, notifications = [], onClose, onMarkRead }) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <View style={{ maxHeight: '70%', backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 24 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 12 }}>Thông báo</Text>
          <FlatList
            data={notifications}
            keyExtractor={(item, i) => String(item?.id ?? i)}
            renderItem={({ item }) => (
              <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderColor: '#f0f0f0' }}>
                <Text>{item?.title ?? 'Notification'}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={{ color: '#aaa', textAlign: 'center' }}>Không có thông báo</Text>}
          />
          <TouchableOpacity onPress={onClose} style={{ marginTop: 16, alignItems: 'center' }}>
            <Text style={{ color: '#4CAF50', fontWeight: '600' }}>Đóng</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
