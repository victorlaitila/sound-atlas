import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        atlas: {
          ink: "#101820",
          ocean: "#153b44",
          mist: "#dbe7e4",
          gold: "#f3c75f",
          coral: "#df6d5d",
          pine: "#1f6f64",
        },
      },
      boxShadow: {
        "soft-xl": "0 28px 80px rgba(16, 24, 32, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
