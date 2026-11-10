/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#194a2b", // Verde Esmeralda Botânico Profundo e Sofisticado
          foreground: "#ffffff",
          hover: "#123720",
          light: "#e8f2eb",
          dark: "#0b2214",
        },
        rose: {
          aura: "#e8809c",
          soft: "#faeef1",
          gold: "#f5d0c5",
        },
        secondary: {
          DEFAULT: "hsl(345, 38%, 95%)",
          foreground: "#194a2b",
          dark: "hsl(156, 25%, 16%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84.2%, 60.2%)",
          foreground: "hsl(0, 0%, 98%)",
        },
        muted: {
          DEFAULT: "hsl(150, 15%, 95%)",
          foreground: "hsl(150, 12%, 42%)",
          dark: "hsl(156, 20%, 15%)",
        },
        accent: {
          DEFAULT: "#d4a359", // Warm Champagne Gold
          foreground: "#ffffff",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 15px rgba(95, 111, 58, 0.4)" },
          "50%": { opacity: "0.8", boxShadow: "0 0 5px rgba(95, 111, 58, 0.2)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
}
