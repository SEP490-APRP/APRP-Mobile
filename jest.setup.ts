/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

// SecureStore giả lập bằng Map trong bộ nhớ.
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>()
  return {
    __store: store,
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  }
})

jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-uuid' }))

// Mock expo-audio
jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    seekTo: jest.fn(async () => {}),
  })),
  setAudioModeAsync: jest.fn(async () => {}),
  useAudioRecorder: jest.fn(() => ({
    currentTime: 0,
    isRecording: false,
    uri: null,
    prepareToRecordAsync: jest.fn(async () => {}),
    record: jest.fn(),
    stop: jest.fn(async () => {}),
  })),
  requestRecordingPermissionsAsync: jest.fn(async () => ({ granted: true })),
  RecordingPresets: {
    HIGH_QUALITY: {},
    LOW_QUALITY: {},
  },
}))

