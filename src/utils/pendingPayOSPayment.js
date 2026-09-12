// pendingPayOSPayment.js — skeleton
// TODO: implement logic to detect/store/retrieve pending PayOS payments

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'pending_payos_payment';

export async function savePendingPayment(payment) {
  await AsyncStorage.setItem(KEY, JSON.stringify(payment));
}

export async function loadPendingPayment() {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function clearPendingPayment() {
  await AsyncStorage.removeItem(KEY);
}
