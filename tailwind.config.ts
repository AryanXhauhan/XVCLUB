import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                // XVC Brand Colors
                'xvc-black': '#0B0B0B',
                'xvc-offwhite': '#F6F4F1',
                'xvc-nude': '#D8CFC4',
                'xvc-taupe': '#B9ADA2',
                'xvc-graphite': '#3A3A3A',
            },
            fontFamily: {
                'headline': ['Playfair Display', 'serif'],
                'body': ['Inter', 'sans-serif'],
            },
            spacing: {
                '18': '4.5rem',
                '88': '22rem',
                '100': '25rem',
                '128': '32rem',
            },
        },
    },
    plugins: [],
};

export default config;
