'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface LogoCloudWidgetProps {
  title?: string
  logos?: { name: string; src?: string }[]
  grayscale?: boolean
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function LogoCloudWidget({
  title = 'Trusted by leading companies',
  logos = [
    { name: 'Company 1' },
    { name: 'Company 2' },
    { name: 'Company 3' },
    { name: 'Company 4' },
    { name: 'Company 5' },
    { name: 'Company 6' }
  ],
  grayscale = true,
  isEditing,
  isPreview,
  onChange
}: LogoCloudWidgetProps) {
  return (
    <section className="w-full py-12 px-6 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        {title && (
          <p className="text-center text-sm text-muted-foreground mb-8">
            {title}
          </p>
        )}
        
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {logos.map((logo, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "h-8 flex items-center",
                grayscale && "opacity-50 hover:opacity-100 transition-opacity"
              )}
            >
              {logo.src ? (
                <img
                  src={logo.src}
                  alt={logo.name}
                  className={cn("h-full w-auto", grayscale && "grayscale hover:grayscale-0 transition-all")}
                />
              ) : (
                <div className="px-4 py-2 bg-muted rounded font-semibold text-muted-foreground">
                  {logo.name}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
