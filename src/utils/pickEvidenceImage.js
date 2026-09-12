// pickEvidenceImage.js — skeleton
// TODO: implement image picker for delivery evidence / dispute uploads

import * as ImagePicker from 'expo-image-picker';

export async function pickEvidenceImage() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
  });
  if (result.canceled) return null;
  return result.assets[0];
}

export async function takeEvidencePhoto() {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
  });
  if (result.canceled) return null;
  return result.assets[0];
}
