import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f14",
        panel: "#121820",
        muted: "#8a97a8",
        accent: "#2dd4bf",
        ember: "#fb7185"
      },
      boxShadow: {
        glow: "0 0 32px rgba(45, 212, 191, 0.22)"
      }
    }
  },
  plugins: []
};

export default config;
