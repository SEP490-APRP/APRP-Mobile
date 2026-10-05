import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, ScrollView, 
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Image,
  ActivityIndicator
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AddressAutocomplete from '../../../components/shared/AddressAutocomplete';
import { userService } from '../../../services/user.service';

export default function ProfileScreen({ navigation }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [operatingArea, setOperatingArea] = useState(null);
  const [avatarUri, setAvatarUri] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Cần cấp quyền truy cập thư viện ảnh để đổi avatar!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!name || !phone || !vehicle || !licensePlate || !operatingArea) {
      alert('Vui lòng điền đầy đủ thông tin!');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        fullName: name,
        phoneNumber: phone,
        address: operatingArea.address,
        vehicleNumber: licensePlate,
        license: vehicle,
      };

      const userId = 1;
      
      const response = await userService.updateProfile(userId, payload);
      console.log("Update Success:", response);
      alert('Cập nhật hồ sơ Shipper thành công!');
    } catch (error) {
      console.error("Update failed:", error?.response?.data || error);
      alert('Cập nhật thất bại. Vui lòng kiểm tra lại!');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Hồ Sơ Shipper</Text>
          <Text style={styles.headerSubtitle}>Cập nhật thông tin giao hàng của bạn</Text>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarIcon}>📸</Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Text style={styles.cameraBadgeIcon}>+</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Nhấn để thay đổi ảnh</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <TextInput 
              style={styles.input} 
              placeholder="VD: Nguyễn Văn A" 
              placeholderTextColor="#A0AEC0"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput 
              style={styles.input} 
              placeholder="VD: 0987654321" 
              placeholderTextColor="#A0AEC0"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Loại xe</Text>
              <TextInput 
                style={styles.input} 
                placeholder="VD: Xe máy (Honda)" 
                placeholderTextColor="#A0AEC0"
                value={vehicle}
                onChangeText={setVehicle}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Biển số xe</Text>
              <TextInput 
                style={styles.input} 
                placeholder="VD: 59X1-123.45" 
                placeholderTextColor="#A0AEC0"
                value={licensePlate}
                onChangeText={setLicensePlate}
              />
            </View>
          </View>

          <View style={[styles.formGroup, { zIndex: 999 }]}>
            <Text style={styles.label}>Khu vực tiếp nhận đơn</Text>
            <View style={{ height: 250 }}> 
              <AddressAutocomplete 
                placeholder="Tìm kiếm khu vực..." 
                onPlaceSelected={(place) => {
                  setOperatingArea(place);
                }}
              />
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitBtnText}>Cập Nhật Hồ Sơ</Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  container: { flex: 1 },
  header: {
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1A202C', marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: '#718096', fontWeight: '400' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#48BB78' },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
    borderColor: '#CBD5E0', borderStyle: 'dashed',
  },
  avatarIcon: { fontSize: 32 },
  cameraBadge: {
    position: 'absolute', bottom: 0, right: 0, width: 28, height: 28,
    borderRadius: 14, backgroundColor: '#48BB78', alignItems: 'center',
    justifyContent: 'center', borderWidth: 2, borderColor: '#FFFFFF',
  },
  cameraBadgeIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginTop: -2 },
  avatarHint: { marginTop: 12, fontSize: 12, color: '#A0AEC0', fontWeight: '500' },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 8, letterSpacing: 0.3 },
  input: {
    height: 52, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF', paddingHorizontal: 16, fontSize: 16,
    color: '#1A202C', shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 2, elevation: 2,
  },
  footer: {
    paddingHorizontal: 24, paddingVertical: 16, backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#EDF2F7',
  },
  submitBtn: {
    height: 56, backgroundColor: '#48BB78', borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', shadowColor: '#48BB78', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
});
