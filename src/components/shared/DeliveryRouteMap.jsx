import React from 'react';
import { View, Text } from 'react-native';

// TODO: Real-time delivery route map (VietMap) — used in shipper delivery screen & buyer order tracking
export default function DeliveryRouteMap({ shipperLocation, destinationLocation }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9' }}>
      <Text>Delivery Route Map — TODO</Text>
    </View>
  );
}
