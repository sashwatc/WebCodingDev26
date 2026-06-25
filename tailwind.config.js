/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  safelist: [
    "bg-amber-100", "text-amber-800", "border-amber-200",
    "bg-emerald-100", "text-emerald-800", "border-emerald-200",
    "bg-blue-100", "text-blue-800", "border-blue-200",
    "bg-blue-50", "text-blue-700",
    "bg-green-100", "text-green-800", "border-green-200",
    "bg-gray-100", "text-gray-800", "border-gray-200",
    "bg-red-100", "text-red-800", "border-red-200",
    "bg-orange-100", "text-orange-800", "border-orange-200",
    "bg-purple-100", "text-purple-800", "border-purple-200",
    "bg-slate-100", "text-slate-700", "border-slate-200",
    "bg-slate-50", "text-slate-600", "border-slate-300",
    "bg-teal-50", "text-teal-600", "bg-blue-50", "text-blue-600",
    "bg-indigo-50", "text-indigo-600", "bg-amber-50", "text-amber-600",
    "bg-purple-50", "text-purple-600", "bg-emerald-50", "text-emerald-600",
    "bg-red-50", "text-red-600",
  ],
  theme: {
  	extend: {
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		boxShadow: {
  			"button-inset": "inset 0 1px 3px rgba(0, 0, 0, 0.1)",
  			"button-inset-dark": "inset 0 1px 3px rgba(0, 0, 0, 0.3)",
  			"button": "0 2px 4px rgba(0, 0, 0, 0.1)",
  			"archive-sm": "0 1px 2px hsl(220 40% 12% / 0.05), 0 0 0 1px hsl(var(--border))",
  			"archive-md": "0 4px 16px hsl(220 40% 12% / 0.07), 0 0 0 1px hsl(var(--border))",
  			"archive-lift": "0 8px 24px hsl(220 40% 12% / 0.1), 0 0 0 1px hsl(var(--border))"
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			canvas: 'hsl(var(--canvas))',
  			surface: {
  				DEFAULT: 'hsl(var(--surface))',
  				elevated: 'hsl(var(--surface-elevated))',
  			},
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			overlay: 'hsl(var(--overlay))',
  			status: {
  				lost: 'hsl(var(--status-lost))',
  				'lost-foreground': 'hsl(var(--status-lost-foreground))',
  				found: 'hsl(var(--status-found))',
  				'found-foreground': 'hsl(var(--status-found-foreground))',
  				warning: 'hsl(var(--status-warning))',
  				'warning-foreground': 'hsl(var(--status-warning-foreground))',
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
