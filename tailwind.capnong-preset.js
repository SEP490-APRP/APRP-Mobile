/**
 * Design tokens CapNong, chép từ APRP-FE/tailwind.capnong-preset.js (đổi sang CommonJS
 * để tailwind.config.js của NativeWind nạp được). Sửa màu ở đây thì sửa cả bản web.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f1f8ec',
          100: '#e3f1da',
          200: '#cfe6c4',
          300: '#a4e876',
          500: '#5e9440',
          600: '#4a7c2f', // chữ trên nền trắng: 4.98:1 (đạt AA)
          700: '#326318', // màu thương hiệu chính, chữ trắng: 7.16:1 (đạt AAA)
          800: '#254b12',
          900: '#1a3a0c',
        },
        soil: {
          50: '#fdf5eb',
          100: '#eedec8',
          600: '#8a4e1d',
          700: '#6f3e16',
        },
        sun: {
          100: '#fff7cc',
          300: '#ffea79', // chữ vàng trên leaf-700: 5.9:1
          500: '#ffba41',
        },
        ink: {
          DEFAULT: '#1c2216',
          muted: '#5f6b57', // 5.63:1 trên nền trắng: dùng cho mô tả, meta
          subtle: '#6b7563', // 4.83:1: mức nhạt nhất được phép cho chữ
        },
        paper: {
          DEFAULT: '#f8faf6',
          warm: '#f8f6f0',
        },
        line: {
          DEFAULT: '#e5e2da',
          strong: '#d6d3c9',
        },
        sale: {
          DEFAULT: '#d32f2f', // chữ trắng: 4.98:1
          soft: '#fdecea',
        },
      },
      fontSize: {
        // Cỡ chữ nhỏ nhất cho nội dung cần đọc. Không dùng 8 đến 11px nữa.
        caption: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.01em' }],
      },
      borderRadius: {
        card: '1rem',
        panel: '1.5rem',
      },
    },
  },
  plugins: [],
};
