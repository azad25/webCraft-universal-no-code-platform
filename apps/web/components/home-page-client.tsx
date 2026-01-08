'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { TemplatesSection } from '@/components/landing/templates-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CTASection } from '@/components/landing/cta-section'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export function HomePageClient() {
  const { isAuthenticated, isInitialized } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Only redirect after auth is initialized to avoid flashing
    if (isInitialized && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isInitialized, router])

  // Show loading or nothing while checking auth status
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // If authenticated, don't render the landing page (redirect is happening)
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Render the landing page for non-authenticated users
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