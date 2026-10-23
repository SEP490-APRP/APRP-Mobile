// toast.js — skeleton toast helper
// TODO: connect to a Toast component/library (e.g., react-native-toast-message)

export function showToast(message, type = 'info') {
  // TODO: call Toast.show({ type, text1: message })
  console.log(`[Toast][${type}] ${message}`);
}

export function showSuccessToast(message) {
  showToast(message, 'success');
}

export function showErrorToast(message) {
  showToast(message, 'error');
}
