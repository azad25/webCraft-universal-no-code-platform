import { Metadata } from 'next'
import { HomePageClient } from '@/components/home-page-client'

export const metadata: Metadata = {
  title: 'WebCraft - Build Anything with No-Code',
  description: 'Create websites, mobile apps, CRM, ERP, e-commerce stores, and more with our AI-powered drag-and-drop platform. No coding required.',
  openGraph: {
    title: 'WebCraft - Build Anything with No-Code',
    description: 'Create websites, mobile apps, CRM, ERP, e-commerce stores, and more with our AI-powered drag-and-drop platform.',
    images: ['/og-home.png'],
  },
}

export default function HomePage() {
  return <HomePageClient />
}