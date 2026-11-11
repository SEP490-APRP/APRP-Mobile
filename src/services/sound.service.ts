import { createAudioPlayer, setAudioModeAsync } from 'expo-audio'
import { Vibration } from 'react-native'

class SoundService {
  private player: ReturnType<typeof createAudioPlayer> | null = null
  private initialized = false

  private async getPlayer() {
    if (!this.player && !this.initialized) {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
        })
        // chime.wav đã có sẵn trong assets/sounds
        this.player = createAudioPlayer(require('../../assets/sounds/chime.wav'))
      } catch {
        // Fallback an toàn nếu môi trường không khởi tạo được audio
      } finally {
        this.initialized = true
      }
    }
    return this.player
  }

  /**
   * Báo hiệu tin nhắn mới bằng âm thanh chime và rung phản hồi haptic
   */
  async playMessageChime(): Promise<void> {
    // 1. Rung phản hồi haptic tức thì
    try {
      Vibration.vibrate([0, 100, 60, 140])
    } catch {
      try {
        Vibration.vibrate(100)
      } catch {}
    }

    // 2. Phát âm thanh chuông chime
    try {
      const p = await this.getPlayer()
      if (p) {
        await p.seekTo(0)
        p.play()
      }
    } catch {
      // Bỏ qua lỗi audio nếu thiết bị đang bận hoặc hạn chế quyền
    }
  }
}

export const soundService = new SoundService()
