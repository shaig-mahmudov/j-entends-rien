import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#050508",
        panel: "#101018",
        line: "#27273a",
        cyanGlow: "#22d3ee",
        violetGlow: "#8b5cf6",
        roseGlow: "#fb7185",
        amberGlow: "#f59e0b"
      },
      boxShadow: {
        glow: "0 0 28px rgba(34, 211, 238, 0.22)",
        violet: "0 0 34px rgba(139, 92, 246, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;
