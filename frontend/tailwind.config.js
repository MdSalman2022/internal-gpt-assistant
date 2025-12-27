const themes = {
	emerald: {
		'--background': 'var(--primary-h), var(--primary-tint-bg-s), 99%',
		'--foreground': 'var(--primary-h), 20%, 12%',
		'--primary-foreground': 'var(--primary-h), 20%, 98%',
		'--card': 'var(--primary-h), var(--primary-tint-card-s), 100%',
		'--card-foreground': 'var(--primary-h), 20%, 12%',
		'--secondary': 'var(--primary-h), var(--primary-tint-secondary-s), 96%',
		'--secondary-foreground': 'var(--primary-h), 20%, 15%',
		'--muted': 'var(--primary-h), var(--primary-tint-secondary-s), 96%',
		'--muted-foreground': 'var(--primary-h), 12%, 42%',
		'--border': 'var(--primary-h), var(--primary-tint-card-s), 88%',
		'--input': 'var(--primary-h), var(--primary-tint-card-s), 88%',
		'--ring': 'var(--primary-h), var(--primary-tint-accent-s), 50%',
		'--radius': '0.75rem',
	},
	blue: {
		'--background': 'var(--primary-h), var(--primary-tint-bg-s), 98%',
		'--foreground': 'var(--primary-h), 25%, 10%',
		'--primary-foreground': 'var(--primary-h), 20%, 98%',
		'--card': 'var(--primary-h), var(--primary-tint-card-s), 97%',
		'--card-foreground': 'var(--primary-h), 25%, 10%',
		'--secondary': 'var(--primary-h), var(--primary-tint-secondary-s), 93%',
		'--secondary-foreground': 'var(--primary-h), 25%, 15%',
		'--muted': 'var(--primary-h), var(--primary-tint-secondary-s), 93%',
		'--muted-foreground': 'var(--primary-h), 15%, 40%',
		'--border': 'var(--primary-h), var(--primary-tint-card-s), 85%',
		'--input': 'var(--primary-h), var(--primary-tint-card-s), 85%',
		'--ring': 'var(--primary-h), var(--primary-tint-accent-s), 50%',
		'--radius': '0.75rem',
	},
	tinted: {
		'--background': 'var(--primary-h), var(--primary-tint-bg-s), 10%',
		'--foreground': 'var(--primary-h), 25%, 98%',
		'--primary-foreground': 'var(--primary-h), 65%, 15%',
		'--card': 'var(--primary-h), var(--primary-tint-card-s), 8%',
		'--card-foreground': 'var(--primary-h), 25%, 98%',
		'--secondary': 'var(--primary-h), var(--primary-tint-secondary-s), 14%',
		'--secondary-foreground': 'var(--primary-h), 25%, 98%',
		'--muted': 'var(--primary-h), var(--primary-tint-secondary-s), 14%',
		'--muted-foreground': 'var(--primary-h), 30%, 65%',
		'--border': 'var(--primary-h), var(--primary-tint-card-s), 18%',
		'--input': 'var(--primary-h), var(--primary-tint-card-s), 18%',
		'--ring': 'var(--primary-h), var(--primary-tint-accent-s), 55%',
		'--radius': '0.75rem',
	},
	night: {
		'--background': 'var(--primary-h), var(--primary-tint-bg-s), 4%',
		'--foreground': 'var(--primary-h), 20%, 98%',
		'--primary-foreground': 'var(--primary-h), 65%, 12%',
		'--card': 'var(--primary-h), var(--primary-tint-card-s), 3.5%',
		'--card-foreground': 'var(--primary-h), 20%, 98%',
		'--secondary': 'var(--primary-h), var(--primary-tint-secondary-s), 8%',
		'--secondary-foreground': 'var(--primary-h), 20%, 98%',
		'--muted': 'var(--primary-h), var(--primary-tint-secondary-s), 8%',
		'--muted-foreground': 'var(--primary-h), 25%, 65%',
		'--border': 'var(--primary-h), var(--primary-tint-card-s), 12%',
		'--input': 'var(--primary-h), var(--primary-tint-card-s), 12%',
		'--ring': 'var(--primary-h), var(--primary-tint-accent-s), 50%',
		'--radius': '0.75rem',
	}
};

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: ['class'],
	theme: {
		extend: {
			colors: {
				primary: {
					DEFAULT: 'hsl(var(--current-primary))',
					foreground: 'hsl(var(--primary-foreground))',
					'50': 'hsl(var(--primary-50))',
					'100': 'hsl(var(--primary-100))',
					'200': 'hsl(var(--primary-200))',
					'300': 'hsl(var(--primary-300))',
					'400': 'hsl(var(--primary-400))',
					'500': 'hsl(var(--primary-500))',
					'600': 'hsl(var(--primary-600))',
					'700': 'hsl(var(--primary-700))',
					'800': 'hsl(var(--primary-800))',
					'900': 'hsl(var(--primary-900))',
				},
				accent: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				// Semantic status colors using atmospheric HSL (Strictly No hex)
				success: {
					DEFAULT: 'hsl(142, 70%, 45%)',
					foreground: 'hsl(142, 70%, 98%)'
				},
				warning: {
					DEFAULT: 'hsl(38, 92%, 50%)',
					foreground: 'hsl(38, 92%, 10%)'
				},
				destructive: {
					DEFAULT: 'hsl(0, 84%, 60%)',
					foreground: 'hsl(0, 84%, 98%)'
				},
				info: {
					DEFAULT: 'hsl(221, 83%, 53%)',
					foreground: 'hsl(221, 83%, 98%)'
				},

				// --- SEMANTIC TOKENS ---
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--background))',
					foreground: 'hsl(var(--foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			},
			animation: {
				'fade-in': 'fadeIn 0.3s ease-out forwards',
				'slide-up': 'slideUp 0.4s ease-out forwards',
				'slide-in-right': 'slideInRight 0.3s ease-out forwards',
				'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
				typing: 'typing 1s ease-in-out infinite'
			},
			keyframes: {
				fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
				slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
				slideInRight: { '0%': { opacity: '0', transform: 'translateX(10px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
				pulseDot: { '0%, 100%': { opacity: '0.4' }, '50%': { opacity: '1' } },
				typing: { '0%, 100%': { opacity: '0.2' }, '20%': { opacity: '1' } }
			},
			boxShadow: {
				glow: '0 0 20px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.3)',
				'glow-lg': '0 0 40px hsla(var(--primary-h), var(--primary-s), var(--primary-l), 0.4)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require("tailwindcss-animate"),
		function ({ addBase }) {
			addBase({ ':root': themes.emerald });
			Object.entries(themes).forEach(([name, variables]) => {
				addBase({ [`[data-theme="${name}"]`]: variables });
			});
		}
	],
}



