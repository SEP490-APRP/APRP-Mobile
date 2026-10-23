import { useEffect, useState } from 'react'

/** Đếm ngược theo giây cho nút "Gửi lại mã OTP". */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds)

  useEffect(() => {
    if (seconds <= 0) return
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [seconds])

  return { seconds, done: seconds <= 0, restart: () => setSeconds(initialSeconds) }
}
