/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#E8E7E3",
        canvasAlt: "#EDEDED",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(17, 17, 17, 0.08)",
      },
    },
  },
  plugins: [],
};
