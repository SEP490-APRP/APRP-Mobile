import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from "react-native";
import { COLORS } from "../../constants/colors";
import { API_BASE_URL } from "../../config/env";
import { authService } from "../../services/auth.service";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async () => {
    setErrorMsg("");
    if (!email || !password) {
      setErrorMsg("Vui lòng nhập đầy đủ email và mật khẩu");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res?.result?.token) {
        // NOTE: Should save token to AsyncStorage or SecureStore
        // await AsyncStorage.setItem('token', res.result.token);
        // Navigate to Home or Main App
        navigation.navigate("Home");
      }
    } catch (err) {
      console.error("Login failed:", err);
      setErrorMsg(err.response?.data?.message || "Đăng nhập thất bại. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    Linking.openURL(`${API_BASE_URL}/oauth2/authorization/google`);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.content}>
        {/* Logo Placeholder */}
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Giải Cứu Nông Sản</Text>
          <Text style={styles.subLogoText}>Cùng chung tay vì nông sản Việt</Text>
        </View>

        <Text style={styles.title}>Đăng nhập</Text>
        
        {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={COLORS.textSecondary}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Mật khẩu" 
          value={password}
          onChangeText={setPassword}
          secureTextEntry 
          placeholderTextColor={COLORS.textSecondary}
        />
        
        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.primaryButtonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>Hoặc</Text>
          <View style={styles.divider} />
        </View>

        <TouchableOpacity style={styles.outlineButton} onPress={handleGoogleLogin}>
          <Text style={styles.outlineButtonText}>Đăng nhập bằng Google</Text>
        </TouchableOpacity>
        
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.linkText}>Tạo tài khoản mới</Text>
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
  subLogoText: { fontSize: 14, color: COLORS.primaryDark, marginTop: 4 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 24, color: COLORS.text },
  errorText: { color: COLORS.error, marginBottom: 16, textAlign: "center" },
  input: { 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    padding: 16, 
    marginBottom: 16, 
    borderRadius: 8,
    backgroundColor: COLORS.surface,
    color: COLORS.text,
    fontSize: 16
  },
  primaryButton: { 
    backgroundColor: COLORS.primary, 
    padding: 16, 
    borderRadius: 8, 
    alignItems: "center",
    marginTop: 8
  },
  primaryButtonText: { color: COLORS.white, fontSize: 16, fontWeight: "bold" },
  outlineButton: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  outlineButtonText: { color: COLORS.primary, fontSize: 16, fontWeight: "bold" },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.textSecondary,
  },
  linksContainer: { 
    alignItems: "center", 
    marginTop: 24 
  },
  linkText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: "600" }
});

