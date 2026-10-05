import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "../../constants/colors";

export default function HomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Nông Sản Xấu Mã</Text>
        <Text style={styles.subtitle}>Mobile Application</Text>
        <Text style={styles.hint}>Team Development 🚀</Text>
        
        <TouchableOpacity 
          style={styles.btn} 
          onPress={() => navigation.navigate('ShipperProfile')}
        >
          <Text style={styles.btnText}>Test: Đến màn Thiết Lập Hồ Sơ Shipper</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { fontSize: 24, fontWeight: "700", color: COLORS.primary },
  subtitle: { fontSize: 16, color: COLORS.text },
  hint: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  btn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
});
