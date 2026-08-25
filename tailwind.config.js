/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#EDEDED",
        ink: "#2D2D2D",
        taupe: "#A89F94",
        outline: "#C4C7C7",
        surface: "#F9F9F9",
        "surface-low": "#F4F3F3",
      },
      fontFamily: {
        serif: ['"EB Garamond"', "Georgia", "serif"],
        sans: ['Inter', "system-ui", "sans-serif"],
        mono: ['"Space Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        card: "0 4px 20px rgba(0, 0, 0, 0.04)",
        "card-hover": "0 8px 30px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        card: "0.5rem",
      },
      spacing: {
        canvas: "40px",
      },
    },
  },
  plugins: [],
};
