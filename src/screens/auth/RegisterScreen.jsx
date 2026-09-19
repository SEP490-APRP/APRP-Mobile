import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { useState } from "react";
import { COLORS } from "../../constants/colors";

export default function RegisterScreen({ navigation }) {
  const [role, setRole] = useState("BUYER"); // BUYER, SHOP, SHIPPER
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    password: "",
    confirmPassword: "",
    shopName: "", // for SHOP
    vehicleNumber: "", // for SHIPPER
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = () => {
    console.log("Register as", role, formData);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* Logo Placeholder */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>Giải Cứu Nông Sản</Text>
        <Text style={styles.subLogoText}>Cùng chung tay vì nông sản Việt</Text>
      </View>

      <Text style={styles.title}>Đăng ký tài khoản</Text>
      
      {/* Role Selection */}
      <View style={styles.roleContainer}>
        {["BUYER", "SHOP", "SHIPPER"].map((r) => (
          <TouchableOpacity 
            key={r} 
            style={[styles.roleButton, role === r && styles.roleButtonActive]}
            onPress={() => setRole(r)}
          >
            <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
              {r === "BUYER" ? "Người mua" : r === "SHOP" ? "Chủ shop" : "Shipper"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Họ và tên" placeholderTextColor={COLORS.textSecondary} value={formData.fullName} onChangeText={(t) => handleChange("fullName", t)} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={COLORS.textSecondary} keyboardType="email-address" autoCapitalize="none" value={formData.email} onChangeText={(t) => handleChange("email", t)} />
      <TextInput style={styles.input} placeholder="Số điện thoại" placeholderTextColor={COLORS.textSecondary} keyboardType="phone-pad" value={formData.phoneNumber} onChangeText={(t) => handleChange("phoneNumber", t)} />
      <TextInput style={styles.input} placeholder="Địa chỉ" placeholderTextColor={COLORS.textSecondary} value={formData.address} onChangeText={(t) => handleChange("address", t)} />
      
      {role === "SHOP" && (
        <TextInput style={styles.input} placeholder="Tên cửa hàng (Shop Name)" placeholderTextColor={COLORS.textSecondary} value={formData.shopName} onChangeText={(t) => handleChange("shopName", t)} />
      )}
      
      {role === "SHIPPER" && (
        <TextInput style={styles.input} placeholder="Biển số xe" placeholderTextColor={COLORS.textSecondary} value={formData.vehicleNumber} onChangeText={(t) => handleChange("vehicleNumber", t)} />
      )}

      <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor={COLORS.textSecondary} secureTextEntry value={formData.password} onChangeText={(t) => handleChange("password", t)} />
      <TextInput style={styles.input} placeholder="Xác nhận mật khẩu" placeholderTextColor={COLORS.textSecondary} secureTextEntry value={formData.confirmPassword} onChangeText={(t) => handleChange("confirmPassword", t)} />
      
      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
        <Text style={styles.primaryButtonText}>Đăng ký</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate("Login")}>
        <Text style={styles.linkText}>Đã có tài khoản? Đăng nhập ngay</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({ 
  container: { 
    flexGrow: 1, 
    padding: 24, 
    backgroundColor: COLORS.background,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center"
  },
  logoContainer: { alignItems: "center", marginBottom: 30, marginTop: 20 },
  logoText: { fontSize: 32, fontWeight: "bold", color: COLORS.primary },
  subLogoText: { fontSize: 14, color: COLORS.primaryDark, marginTop: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: COLORS.text, textAlign: 'center' },
  roleContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  roleButton: { 
    flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, 
    alignItems: "center", marginHorizontal: 4, borderRadius: 8, backgroundColor: COLORS.surface 
  },
  roleButtonActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  roleText: { color: COLORS.text, fontWeight: "500" },
  roleTextActive: { color: COLORS.white, fontWeight: "bold" },
  input: { 
    borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16, 
    borderRadius: 8, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 16 
  },
  primaryButton: { 
    backgroundColor: COLORS.primary, padding: 16, borderRadius: 8, alignItems: "center", marginTop: 8 
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  linkContainer: { marginTop: 20, alignItems: "center", marginBottom: 40 },
  linkText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: "600" }
});

