import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: "#f5efe3",
        sandstone: "#d9c7aa",
        ink: "#1d1b18",
        merlot: "#6a2f2f",
        forest: "#41503c",
        dusk: "#151618",
        slatewarm: "#242726",
        goldleaf: "#ac8a4a"
      },
      boxShadow: {
        panel: "0 18px 45px rgba(21, 22, 24, 0.12)"
      },
      fontFamily: {
        sans: ["var(--font-public-sans)", "sans-serif"],
        serif: ["var(--font-literata)", "serif"]
      },
      backgroundImage: {
        halo:
          "radial-gradient(circle at top left, rgba(172,138,74,0.22), transparent 34%), radial-gradient(circle at bottom right, rgba(106,47,47,0.12), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
