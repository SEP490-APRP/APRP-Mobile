import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { useState } from "react";
import { COLORS } from "../../constants/colors";
import { authService } from "../../services/auth.service";

export default function OtpVerificationScreen({ route, navigation }) {
  const { email } = route.params || {};
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!email) {
    navigation.replace("Register");
    return null;
  }

  const handleVerify = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    
    if (otp.length !== 6) {
      setErrorMsg("Mã OTP phải gồm 6 chữ số");
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp(email, otp);
      setSuccessMsg("Xác thực thành công! Đang chuyển hướng...");
      setTimeout(() => navigation.replace("Login"), 2000);
    } catch (err) {
      console.error("OTP Verification failed:", err);
      setErrorMsg(err.response?.data?.message || "Mã OTP không hợp lệ hoặc đã hết hạn.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    try {
      await authService.sendOtp(email);
      setSuccessMsg("Đã gửi lại mã OTP. Vui lòng kiểm tra email.");
    } catch (err) {
      console.error("Resend OTP failed:", err);
      setErrorMsg(err.response?.data?.message || "Không thể gửi lại mã OTP.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Giải Cứu Nông Sản</Text>
        </View>

        <Text style={styles.title}>Xác thực tài khoản</Text>
        <Text style={styles.subtitle}>Mã OTP đã được gửi đến email {email}</Text>
        
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
        {successMsg ? <Text style={styles.successText}>{successMsg}</Text> : null}

        <TextInput 
          style={styles.input} 
          placeholder="Nhập 6 chữ số OTP" 
          value={otp}
          onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          placeholderTextColor={COLORS.textSecondary}
        />
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleVerify} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Xác nhận</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={handleResendOtp}>
            <Text style={styles.linkText}>Chưa nhận được mã? Gửi lại</Text>
          </TouchableOpacity>
        </View>
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: COLORS.text, textAlign: "center" },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, textAlign: "center" },
  errorText: { color: COLORS.error, marginBottom: 16, textAlign: "center" },
  successText: { color: COLORS.success, marginBottom: 16, textAlign: "center" },
  input: { 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    padding: 16, 
    marginBottom: 16, 
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 2
  },
  primaryButton: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 8, 
    alignItems: "center",
    marginTop: 8
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  linksContainer: { 
    alignItems: "center", 
    marginTop: 24 
  },
  linkText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: "600" }
});
