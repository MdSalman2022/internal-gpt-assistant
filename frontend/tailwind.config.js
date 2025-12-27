/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
	],
	darkMode: ['class', "class"],
	theme: {
		extend: {
			colors: {
				primary: {
					'50': '#ECFDF5',
					'100': '#D1FAE5',
					'200': '#A7F3D0',
					'300': '#6EE7B7',
					'400': '#34D399',
					'500': '#10B981',
					'600': '#059669',
					'700': '#047857',
					'800': '#065F46',
					'900': '#064E3B',
					DEFAULT: '#10B981',
					foreground: '#F8FAFC'
				},
				slate: {
					'50': '#f8fafc',
					'100': '#f1f5f9',
					'200': '#e2e8f0',
					'300': '#cbd5e1',
					'400': '#94a3b8',
					'500': '#64748b',
					'600': '#475569',
					'700': '#334155',
					'800': '#1e293b',
					'900': '#0f172a',
					'950': '#020617',
					'850': '#1A2332',
				},
				accent: {
					DEFAULT: '#F1F5F9', // Mapping to light secondary
					light: '#FBBF24',
					dark: '#D97706',
					foreground: '#0F172A'
				},
				success: '#22C55E',
				warning: '#F59E0B',
				error: '#EF4444',
				info: '#3B82F6',

				// --- SEMANTIC TOKENS (Static Hex for now) ---
				background: '#0B1120',  // Default dark theme
				foreground: '#F8FAFC',
				card: {
					DEFAULT: '#0F172A',
					foreground: '#F8FAFC'
				},
				popover: {
					DEFAULT: '#0B1120',
					foreground: '#F8FAFC'
				},
				secondary: {
					DEFAULT: '#1E293B',
					foreground: '#F8FAFC'
				},
				muted: {
					DEFAULT: '#1E293B',
					foreground: '#94A3B8'
				},
				destructive: {
					DEFAULT: '#7F1D1D',
					foreground: '#F8FAFC'
				},
				border: '#1E293B',
				input: '#1E293B',
				ring: '#CBD5E1',
				chart: {
					'1': '#3B82F6',
					'2': '#10B981',
					'3': '#F59E0B',
					'4': '#A855F7',
					'5': '#F43F5E'
				},
				// Legacy mapping for compatibility
				dark: {
					bg: '#0B1120',
					card: '#0F172A',
					border: '#1E293B',
					text: '#F8FAFC',
					muted: '#94A3B8'
				}
			},
			fontFamily: {
				sans: [
					'Inter',
					'system-ui',
					'sans-serif'
				]
			},
			animation: {
				'fade-in': 'fadeIn 0.3s ease-out forwards',
				'slide-up': 'slideUp 0.4s ease-out forwards',
				'slide-in-right': 'slideInRight 0.3s ease-out forwards',
				'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
				typing: 'typing 1s ease-in-out infinite'
			},
			keyframes: {
				fadeIn: {
					'0%': {
						opacity: '0'
					},
					'100%': {
						opacity: '1'
					}
				},
				slideUp: {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				slideInRight: {
					'0%': {
						opacity: '0',
						transform: 'translateX(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				pulseDot: {
					'0%, 100%': {
						opacity: '0.4'
					},
					'50%': {
						opacity: '1'
					}
				},
				typing: {
					'0%': {
						opacity: '0.2'
					},
					'20%': {
						opacity: '1'
					},
					'100%': {
						opacity: '0.2'
					}
				}
			},
			boxShadow: {
				glow: '0 0 20px rgba(16, 185, 129, 0.3)',
				'glow-lg': '0 0 40px rgba(16, 185, 129, 0.4)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [require('@tailwindcss/typography'), require("tailwindcss-animate")],
}
