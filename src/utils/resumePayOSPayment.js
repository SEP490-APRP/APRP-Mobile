// resumePayOSPayment.js — skeleton
// TODO: implement logic to resume an interrupted PayOS payment session

import { loadPendingPayment, clearPendingPayment } from './pendingPayOSPayment';

export async function tryResumePayOSPayment(navigation) {
  const pending = await loadPendingPayment();
  if (!pending) return false;
  // TODO: navigate to PayOSWebViewScreen with pending payment data
  // navigation.navigate('PayOSWebView', { payment: pending });
  return true;
}
