import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { COLORS } from "../../constants/colors";

export default function LoginScreen({ navigation }) {
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
        
        <TextInput 
          style={styles.input} 
          placeholder="Email" 
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderTextColor={COLORS.textSecondary}
        />
        <TextInput 
          style={styles.input} 
          placeholder="Mật khẩu" 
          secureTextEntry 
          placeholderTextColor={COLORS.textSecondary}
        />
        
        <TouchableOpacity style={styles.primaryButton} onPress={() => {}}>
          <Text style={styles.primaryButtonText}>Đăng nhập</Text>
        </TouchableOpacity>
        
        <View style={styles.linksContainer}>
          <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.linkText}>Quên mật khẩu?</Text>
          </TouchableOpacity>
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
  linksContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginTop: 24 
  },
  linkText: { color: COLORS.primaryDark, fontSize: 14, fontWeight: "600" }
});

