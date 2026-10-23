import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";

// TODO: implement SplashScreen
export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2000);
    return () => clearTimeout(timer);
  }, [navigation]);

  return <View style={styles.container}><Text>SplashScreen</Text></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: "center", justifyContent: "center" } });
