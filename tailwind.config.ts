import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#166534",
        secondary: "#007A43",
        accent: "#007A43",
        background: "#F5F5F5",
        text: "#333333",
        border: "#E0E0E0",
      },
    },
  },
  plugins: [],
} satisfies Config;
