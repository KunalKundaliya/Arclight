module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: { navy: "#111a3b", brand: { DEFAULT: "#4f46e5", dark: "#4338ca", soft: "#eef0ff" } },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
