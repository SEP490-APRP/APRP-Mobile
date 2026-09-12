// alert.js — skeleton alert utilities
// TODO: implement showAlert, showConfirm, showError, showSuccess wrappers

import { Alert } from 'react-native';

export function showAlert(title, message, buttons) {
  Alert.alert(title, message, buttons);
}

export function showConfirm(title, message, onConfirm, onCancel) {
  Alert.alert(title, message, [
    { text: 'Hủy', style: 'cancel', onPress: onCancel },
    { text: 'Xác nhận', onPress: onConfirm },
  ]);
}

export function showError(message) {
  Alert.alert('Lỗi', message, [{ text: 'OK' }]);
}

export function showSuccess(message) {
  Alert.alert('Thành công', message, [{ text: 'OK' }]);
}
