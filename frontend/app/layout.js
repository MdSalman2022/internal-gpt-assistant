import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'InsightAI - Internal Knowledge Assistant',
  description: 'AI-powered knowledge assistant for finding answers from internal documents. Transform static data into Active Intelligence.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'InsightAI - Transform Data into Active Intelligence',
    description: 'Enterprise AI document intelligence platform. Deploy AI that actually understands your data.',
    url: 'https://corporate-gpt-client.vercel.app',
    siteName: 'InsightAI',
    images: [
      {
        url: '/cover.jpg',
        width: 1200,
        height: 630,
        alt: 'InsightAI - AI Document Intelligence Platform',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'InsightAI - Transform Data into Active Intelligence',
    description: 'Enterprise AI document intelligence platform. Deploy AI that actually understands your data.',
    images: ['/cover.jpg'],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className={`${inter.className} min-h-screen`}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
