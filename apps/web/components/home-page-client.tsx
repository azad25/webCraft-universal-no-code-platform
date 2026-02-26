'use client'

import { HeroSection } from '@/components/landing/hero-section'
import { FeaturesSection } from '@/components/landing/features-section'
import { TemplatesSection } from '@/components/landing/templates-section'
import { PricingSection } from '@/components/landing/pricing-section'
import { TestimonialsSection } from '@/components/landing/testimonials-section'
import { CTASection } from '@/components/landing/cta-section'
import { TrustedBySection } from '@/components/landing/trusted-by-section'
import { WorkflowSection } from '@/components/landing/workflow-section'
import { FaqSection } from '@/components/landing/faq-section'
import { ProductShowcase } from '@/components/landing/product-showcase'
import { ParallaxFeatures } from '@/components/landing/parallax-features'
import { LayeredBlueprint } from '@/components/landing/layered-blueprint'
import { GlobalConnectivity } from '@/components/landing/global-connectivity'
import { DynamicBento } from '@/components/landing/dynamic-bento'
import { CodeStreamVelocity } from '@/components/landing/code-stream-velocity'
import { ModularAssembly } from '@/components/landing/modular-assembly'
import { SecurityVault } from '@/components/landing/security-vault'
import { DeveloperHeartbeat } from '@/components/landing/developer-heartbeat'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export function HomePageClient() {
  // Always render the landing page - the header will handle authentication state
  return (
    <div className="min-h-screen">
      <Header />

      {/* Hero Section with Modern Glassmorphism */}
      <HeroSection />

      <TrustedBySection />

      {/* Features Section with 3D Cards */}
      <FeaturesSection />

      {/* Parallax Product Showcase */}
      <ProductShowcase />

      <ParallaxFeatures />
      <LayeredBlueprint />
      <GlobalConnectivity />
      <CodeStreamVelocity />

      <WorkflowSection />

      <SecurityVault />

      {/* Templates Showcase */}
      <TemplatesSection />

      <DeveloperHeartbeat />

      <ModularAssembly />

      {/* Pricing with Gradient Cards */}
      <PricingSection />

      {/* Social Proof */}
      <TestimonialsSection />

      <FaqSection />

      <DynamicBento />

      {/* Final CTA */}
      <CTASection />

      <Footer />
    </div>
  )
}