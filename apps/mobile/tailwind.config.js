module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#2547E8",
        secondary: "#10B981",
        tertiary: "#0EA5E9",
        error: "#F43F5E",
        ink: "#0F172A",
        muted: "#64748B",
        faint: "#94A3B8",
        canvas: "#F8FAFC",
        night: "#0B1120",
        nightcard: "#151E32",
        hero1: "#1D3BBF",
        emeraldTint: "#ECFDF5",
        emeraldBorder: "#A7F3D0",
        emeraldText: "#059669",
        skyTint: "#F0F9FF",
        skyBorder: "#BAE6FD",
        skyText: "#0284C7",
        roseTint: "#FFF1F2",
        roseBorder: "#FECDD3",
        roseText: "#E11D48",
      },
      fontFamily: { sans: ["Inter"] },
      spacing: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px" },
      borderRadius: { DEFAULT: "8px", md: "8px" }
    }
  },
  plugins: []
};
