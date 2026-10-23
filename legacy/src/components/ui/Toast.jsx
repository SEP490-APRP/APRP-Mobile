import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

// TODO: implement Toast component
let toastRef = null;

export function showToast(message, type = 'info') {
  toastRef && toastRef(message, type);
}

export default function Toast() {
  // Placeholder — implement a proper toast manager
  return null;
}
