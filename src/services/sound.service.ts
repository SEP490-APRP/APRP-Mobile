import { Vibration } from 'react-native'

class SoundService {
  /**
   * Báo hiệu tin nhắn mới bằng rung haptic phản hồi tức thì
   */
  playMessageChime(): void {
    try {
      // Mẫu rung nhịp đôi báo hiệu tin nhắn đến (tương thích 100% Expo Go iOS & Android)
      Vibration.vibrate([0, 100, 60, 140])
    } catch {
      try {
        Vibration.vibrate(100)
      } catch {}
    }
  }
}

export const soundService = new SoundService()
