import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native';

// TODO: implement BankSelectField component
export default function BankSelectField({ value, onChange, banks = [] }) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity onPress={() => setOpen(true)} style={{ padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8 }}>
        <Text>{value?.name ?? 'Chọn ngân hàng'}</Text>
      </TouchableOpacity>
      {/* TODO: bank picker modal */}
    </View>
  );
}
