import { Metadata } from 'next'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { TemplatesSection } from '@/components/landing/templates-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CTASection } from '@/components/landing/cta-section'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

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
  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section with Modern Glassmorphism */}
      <HeroSection />
      
      {/* Features Section with 3D Cards */}
      <FeaturesSection />
      
      {/* Templates Showcase */}
      <TemplatesSection />
      
      {/* Pricing with Gradient Cards */}
      <PricingSection />
      
      {/* Social Proof */}
      <TestimonialsSection />
      
      {/* Final CTA */}
      <CTASection />
      
      <Footer />
    </div>
  )
}