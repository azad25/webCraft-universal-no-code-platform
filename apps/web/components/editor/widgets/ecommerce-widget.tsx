'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { ShoppingCart, Heart, Star, Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface ProductProps {
  name?: string
  price?: number
  originalPrice?: number
  image?: string
  rating?: number
  reviews?: number
  badge?: string
  inStock?: boolean
  description?: string
}

interface EcommerceWidgetProps extends ProductProps {
  layout?: 'card' | 'horizontal' | 'minimal'
  showAddToCart?: boolean
  showWishlist?: boolean
  showRating?: boolean
  currency?: string
  isEditing?: boolean
  onChange?: (props: any) => void
}

export function EcommerceWidget({
  name = 'Product Name',
  price = 99.99,
  originalPrice,
  image = 'https://via.placeholder.com/300x300',
  rating = 4.5,
  reviews = 128,
  badge,
  inStock = true,
  description = 'Product description goes here. Add details about your product.',
  layout = 'card',
  showAddToCart = true,
  showWishlist = true,
  showRating = true,
  currency = '$',
  isEditing = false,
  onChange
}: EcommerceWidgetProps) {
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)

  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0

  const renderStars = () => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "w-4 h-4",
              star <= Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
        <span className="text-sm text-gray-500 ml-1">({reviews})</span>
      </div>
    )
  }

  if (layout === 'horizontal') {
    return (
      <div className="flex gap-6 p-4 bg-white rounded-lg border">
        <div className="w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold mb-2">{name}</h3>
          {showRating && renderStars()}
          <p className="text-gray-600 mt-2 mb-4">{description}</p>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold">{currency}{price.toFixed(2)}</span>
            {originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">{currency}{originalPrice.toFixed(2)}</span>
                <Badge variant="destructive">-{discount}%</Badge>
              </>
            )}
          </div>
          {showAddToCart && (
            <Button disabled={!inStock || isEditing}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {inStock ? 'Add to Cart' : 'Out of Stock'}
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (layout === 'minimal') {
    return (
      <div className="flex items-center gap-4 p-3 bg-white rounded-lg border">
        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
          <img src={image} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{name}</h4>
          <span className="text-lg font-bold">{currency}{price.toFixed(2)}</span>
        </div>
        {showAddToCart && (
          <Button size="sm" disabled={!inStock || isEditing}>
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }

  // Default card layout
  return (
    <m.div
      className="w-full bg-white rounded-xl border overflow-hidden"
      whileHover={{ y: isEditing ? 0 : -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover" />
        
        {badge && (
          <Badge className="absolute top-3 left-3">{badge}</Badge>
        )}
        
        {discount > 0 && (
          <Badge variant="destructive" className="absolute top-3 right-3">
            -{discount}%
          </Badge>
        )}
        
        {showWishlist && (
          <button
            className={cn(
              "absolute bottom-3 right-3 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center transition-colors",
              isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-500"
            )}
            onClick={() => !isEditing && setIsWishlisted(!isWishlisted)}
          >
            <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-1 truncate">{name}</h3>
        
        {showRating && <div className="mb-2">{renderStars()}</div>}
        
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl font-bold">{currency}{price.toFixed(2)}</span>
          {originalPrice && (
            <span className="text-sm text-gray-400 line-through">
              {currency}{originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {showAddToCart && (
          <div className="flex items-center gap-2">
            <div className="flex items-center border rounded-lg">
              <button
                className="p-2 hover:bg-gray-100"
                onClick={() => !isEditing && setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-medium">{quantity}</span>
              <button
                className="p-2 hover:bg-gray-100"
                onClick={() => !isEditing && setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button className="flex-1" disabled={!inStock || isEditing}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {inStock ? 'Add' : 'Out of Stock'}
            </Button>
          </div>
        )}
      </div>
    </m.div>
  )
}
