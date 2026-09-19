import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { COLORS } from "../../constants/colors";

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Giải Cứu Nông Sản</Text>
          <Text style={styles.subLogoText}>Cùng chung tay vì nông sản Việt</Text>
        </View>

        <Text style={styles.title}>Quên mật khẩu</Text>
        
        {step === 1 && (
          <>
            <TextInput style={styles.input} placeholderTextColor={COLORS.textSecondary} placeholder="Nhập email của bạn" keyboardType="email-address" autoCapitalize="none" />
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(2)}>
              <Text style={styles.primaryButtonText}>Gửi OTP</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <TextInput style={styles.input} placeholderTextColor={COLORS.textSecondary} placeholder="Nhập mã OTP" keyboardType="numeric" />
            <TouchableOpacity style={styles.primaryButton} onPress={() => setStep(3)}>
              <Text style={styles.primaryButtonText}>Xác nhận OTP</Text>
            </TouchableOpacity>
          </>
        )}

        {step === 3 && (
          <>
            <TextInput style={styles.input} placeholderTextColor={COLORS.textSecondary} placeholder="Mật khẩu mới" secureTextEntry />
            <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate("Login")}>
              <Text style={styles.primaryButtonText}>Đổi mật khẩu</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.linkContainer} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.linkText}>Quay lại Đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ 
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { 
    flex: 1, 
    padding: 24, 
    justifyContent: "center",
    width: "100%",
    maxWidth: 400,
    alignSelf: "center"
  },
  logoContainer: { alignItems: "center", marginBottom: 40 },
  logoText: { fontSize: 32, fontWeight: "bold", color: COLORS.primary },
  subLogoText: { fontSize: 14, color: COLORS.primaryDark, marginTop: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: COLORS.text, textAlign: 'center' },
  input: { 
    borderWidth: 1, borderColor: COLORS.border, padding: 16, marginBottom: 16, 
    borderRadius: 8, backgroundColor: COLORS.surface, color: COLORS.text, fontSize: 16 
  },
  primaryButton: { 
    backgroundColor: COLORS.primary, padding: 16, borderRadius: 8, alignItems: "center", marginTop: 8 
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  linkContainer: { marginTop: 24, alignItems: "center" },
  linkText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: "600" }
});
