/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  // App chưa có giao diện tối. 'class' tránh lỗi "Cannot manually set color scheme" của NativeWind trên web.
  darkMode: 'class',
  presets: [require('nativewind/preset'), require('./tailwind.capnong-preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}
