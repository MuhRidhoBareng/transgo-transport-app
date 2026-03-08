/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],
    theme: {
        extend: {
            colors: {
                dark: {
                    primary: '#0F1117',
                    secondary: '#1A1D2E',
                    card: '#1E2235',
                    border: '#2A2E45',
                },
                accent: {
                    purple: '#7C3AED',
                    blue: '#3B82F6',
                    green: '#10B981',
                    red: '#EF4444',
                    amber: '#F59E0B',
                },
                txt: {
                    primary: '#FFFFFF',
                    secondary: '#8B8FA3',
                    muted: '#5B5F73',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #7C3AED, #3B82F6)',
                'gradient-success': 'linear-gradient(135deg, #10B981, #059669)',
                'gradient-danger': 'linear-gradient(135deg, #EF4444, #DC2626)',
                'gradient-kurir': 'linear-gradient(135deg, #F59E0B, #D97706)',
            },
            boxShadow: {
                'glow-purple': '0 0 20px rgba(124, 58, 237, 0.3)',
                'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
                'glow-green': '0 0 20px rgba(16, 185, 129, 0.3)',
            },
            animation: {
                'pulse-slow': 'pulse 3s ease-in-out infinite',
                'slide-up': 'slideUp 0.3s ease-out',
                'slide-down': 'slideDown 0.3s ease-out',
                'fade-in': 'fadeIn 0.3s ease-out',
                'bounce-in': 'bounceIn 0.5s ease-out',
                'shimmer': 'shimmer 1.5s linear infinite',
            },
            keyframes: {
                slideUp: {
                    '0%': { transform: 'translateY(100%)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                bounceIn: {
                    '0%': { transform: 'scale(0.3)', opacity: '0' },
                    '50%': { transform: 'scale(1.05)' },
                    '70%': { transform: 'scale(0.9)' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
        },
    },
    plugins: [],
}
