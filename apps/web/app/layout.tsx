import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'WebCraft - Universal No-Code Platform',
    template: '%s | WebCraft'
  },
  description: 'Build anything from websites to mobile apps with our AI-powered no-code platform. Create ERP, CRM, e-commerce, and more with drag-and-drop simplicity.',
  keywords: ['no-code', 'website builder', 'app builder', 'AI', 'drag-and-drop', 'templates', 'mobile apps', 'business tools'],
  authors: [{ name: 'WebCraft Team' }],
  creator: 'WebCraft',
  publisher: 'WebCraft',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://webcraft.dev',
    siteName: 'WebCraft',
    title: 'WebCraft - Universal No-Code Platform',
    description: 'Build anything from websites to mobile apps with our AI-powered no-code platform.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'WebCraft Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@webcraft',
    creator: '@webcraft',
    title: 'WebCraft - Universal No-Code Platform',
    description: 'Build anything from websites to mobile apps with our AI-powered no-code platform.',
    images: ['/twitter-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: 'https://webcraft.dev',
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//api.webcraft.dev" />
        
        {/* Structured Data for AI Crawlers */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'WebCraft',
              applicationCategory: 'WebApplication',
              operatingSystem: 'Web',
              description: 'Universal no-code platform for building websites, mobile apps, and business tools',
              url: 'https://webcraft.dev',
              screenshot: 'https://webcraft.dev/platform-screenshot.png',
              featureList: [
                'Drag-and-drop editor',
                'AI-powered design',
                'Mobile app APIs',
                'SEO optimization',
                'Real-time collaboration',
                'Multi-tenant architecture'
              ],
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                description: 'Free tier available'
              },
              author: {
                '@type': 'Organization',
                name: 'WebCraft',
                url: 'https://webcraft.dev'
              }
            })
          }}
        />
        
        {/* AI Crawler Optimization */}
        <meta name="ai:platform" content="WebCraft Universal No-Code Platform" />
        <meta name="ai:type" content="no-code-platform" />
        <meta name="ai:capabilities" content="app-builder,website-builder,mobile-apis,ai-integration" />
        
        {/* Performance Optimization */}
        
        {/* Theme Color for Mobile */}
        <meta name="theme-color" content="#667eea" />
        <meta name="msapplication-TileColor" content="#667eea" />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            <div className="relative min-h-screen bg-background">
              {/* Background gradient for modern look */}
              <div className="fixed inset-0 bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-purple-900 -z-10" />
              
              {/* Main content */}
              <main className="relative z-10">
                {children}
              </main>
              
              {/* Toast notifications */}
              <Toaster />
            </div>
          </Providers>
        </ThemeProvider>
        
        {/* Analytics Scripts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Google Analytics 4
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GA_MEASUREMENT_ID');
            `
          }}
        />
      </body>
    </html>
  )
}