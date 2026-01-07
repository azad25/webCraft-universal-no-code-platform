'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Check, X, Minus } from 'lucide-react'

interface ComparisonFeature {
  name: string
  values: (boolean | string)[]
}

interface ComparisonWidgetProps {
  title?: string
  columns?: string[]
  features?: ComparisonFeature[]
  highlightColumn?: number
  isEditing?: boolean
  isPreview?: boolean
  onChange?: (props: any) => void
}

export function ComparisonWidget({
  title = 'Compare Plans',
  columns = ['Basic', 'Pro', 'Enterprise'],
  features = [
    { name: 'Users', values: ['1', '10', 'Unlimited'] },
    { name: 'Storage', values: ['5GB', '50GB', 'Unlimited'] },
    { name: 'Custom Domain', values: [false, true, true] },
    { name: 'SSL Certificate', values: [true, true, true] },
    { name: 'Analytics', values: [false, true, true] },
    { name: 'API Access', values: [false, false, true] },
    { name: 'Priority Support', values: [false, false, true] },
    { name: 'White Label', values: [false, false, true] }
  ],
  highlightColumn = 1,
  isEditing,
  isPreview,
  onChange
}: ComparisonWidgetProps) {
  const renderValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/30 mx-auto" />
      )
    }
    return <span className="font-medium">{value}</span>
  }

  return (
    <section className="w-full py-16 px-6">
      <div className="max-w-5xl mx-auto">
        {title && (
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold text-center mb-12"
          >
            {title}
          </motion.h2>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="overflow-x-auto"
        >
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr>
                <th className="p-4 text-left font-medium text-muted-foreground">Features</th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className={cn(
                      "p-4 text-center font-semibold",
                      index === highlightColumn && "bg-primary text-primary-foreground rounded-t-xl"
                    )}
                  >
                    {column}
                    {index === highlightColumn && (
                      <span className="block text-xs font-normal opacity-80 mt-1">
                        Most Popular
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {features.map((feature, featureIndex) => (
                <tr
                  key={featureIndex}
                  className={cn(
                    "border-t",
                    featureIndex % 2 === 0 && "bg-muted/30"
                  )}
                >
                  <td className="p-4 font-medium">{feature.name}</td>
                  {feature.values.map((value, valueIndex) => (
                    <td
                      key={valueIndex}
                      className={cn(
                        "p-4 text-center",
                        valueIndex === highlightColumn && "bg-primary/5"
                      )}
                    >
                      {renderValue(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  )
}
