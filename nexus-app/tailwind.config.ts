import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#050b1a",
          900: "#081226",
          800: "#0d1b34",
          700: "#122444",
          600: "#183055",
        },
        royal: {
          400: "#4d8dff",
          500: "#2f6bff",
          600: "#1f52e0",
          700: "#1a44bd",
        },
        gold: {
          300: "#ffdd8a",
          400: "#f5c451",
          500: "#e5aa26",
          600: "#c98d14",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px rgba(4, 10, 26, 0.35)",
        glow: "0 0 24px rgba(47, 107, 255, 0.35)",
        gold: "0 0 24px rgba(229, 170, 38, 0.30)",
      },
      backgroundImage: {
        "nexus-radial":
          "radial-gradient(1200px 600px at 15% -10%, rgba(47,107,255,0.18), transparent 60%), radial-gradient(1000px 500px at 100% 0%, rgba(229,170,38,0.10), transparent 55%)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "slide-in-right": {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s ease-out both",
        "slide-in-right": "slide-in-right 0.28s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
