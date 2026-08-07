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
          DEFAULT: "hsl(86, 28%, 38%)", // Olive green HSL(86, 28%, 38%)
          foreground: "hsl(0, 0%, 100%)",
          hover: "hsl(86, 28%, 30%)",
          light: "hsl(86, 28%, 92%)",
          dark: "hsl(86, 28%, 25%)",
        },
        secondary: {
          DEFAULT: "hsl(40, 20%, 94%)",
          foreground: "hsl(86, 28%, 20%)",
          dark: "hsl(220, 14%, 18%)",
        },
        destructive: {
          DEFAULT: "hsl(0, 84.2%, 60.2%)",
          foreground: "hsl(0, 0%, 98%)",
        },
        muted: {
          DEFAULT: "hsl(86, 10%, 94%)",
          foreground: "hsl(86, 10%, 40%)",
          dark: "hsl(220, 10%, 20%)",
        },
        accent: {
          DEFAULT: "hsl(42, 60%, 55%)", // Warm Gold
          foreground: "hsl(0, 0%, 100%)",
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
