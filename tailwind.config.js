/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Core dark navy palette from designs
        background: "#0A0F1E",
        surface: "#111827",
        card: "#151E2F",
        cardAlt: "#1C2742",
        border: "#1F2D45",
        // Brand colors
        primary: "#7C6FEB",
        primaryLight: "#A78BFA",
        accent: "#4ADE80",
        accentBlue: "#38BDF8",
        // Text colors
        dark: "#F0F4FF",
        muted: "#6B7A99",
        subtle: "#8899AA",
        // Status
        danger: "#F87171",
        warning: "#FBBF24",
        success: "#34D399",
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
}
