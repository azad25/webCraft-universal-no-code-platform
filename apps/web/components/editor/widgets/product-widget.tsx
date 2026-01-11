'use client'

import { useState, useEffect } from 'react'
import { m } from 'framer-motion'
import { ShoppingCart, Heart, Star, Plus, Minus, Eye, Share2, Database, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { fetchDataSourceData } from '@/lib/data-source-api'

interface ProductWidgetProps {
  // Data source integration
  dataSourceId?: string
  dataEndpointId?: string
  dataSourceType?: 'api' | 'scraper'
  autoRefresh?: boolean
  refreshInterval?: number
  
  // Product data
  name?: string
  price?: number
  originalPrice?: number
  image?: string
  images?: string[]
  rating?: number
  reviews?: number
  badge?: string
  inStock?: boolean
  stockCount?: number
  description?: string
  shortDescription?: string
  category?: string
  sku?: string
  tags?: string[]
  variants?: Array<{
    name: string
    options: string[]
    selected?: string
  }>
  
  // Display options
  layout?: 'card' | 'horizontal' | 'minimal' | 'detailed'
  showAddToCart?: boolean
  showWishlist?: boolean
  showRating?: boolean
  showQuickView?: boolean
  showShare?: boolean
  showVariants?: boolean
  currency?: string
  isEditing?: boolean
  onChange?: (props: any) => void
}

export function ProductWidget({
  // Data source props
  dataSourceId,
  dataEndpointId,
  dataSourceType,
  autoRefresh = false,
  refreshInterval = 60,
  
  // Product props with defaults
  name = 'Premium Product',
  price = 99.99,
  originalPrice,
  image = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
  images = [],
  rating = 4.5,
  reviews = 128,
  badge = 'New',
  inStock = true,
  stockCount = 15,
  description = 'This is a premium product with excellent quality and features. Perfect for your needs.',
  shortDescription = 'Premium quality product',
  category = 'Electronics',
  sku = 'PRD-001',
  tags = ['premium', 'bestseller'],
  variants = [
    { name: 'Size', options: ['S', 'M', 'L', 'XL'], selected: 'M' },
    { name: 'Color', options: ['Black', 'White', 'Blue'], selected: 'Black' }
  ],
  layout = 'card',
  showAddToCart = true,
  showWishlist = true,
  showRating = true,
  showQuickView = true,
  showShare = false,
  showVariants = true,
  currency = '$',
  isEditing = false,
  onChange
}: ProductWidgetProps) {
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>(
    variants.reduce((acc, variant) => ({
      ...acc,
      [variant.name]: variant.selected || variant.options[0]
    }), {})
  )

  // Data source state
  const [productData, setProductData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  // Use data source data if available, otherwise use props
  const activeProduct = productData || {
    name, price, originalPrice, image, images, rating, reviews, badge,
    inStock, stockCount, description, shortDescription, category, sku, tags, variants
  }

  // Fetch data from data source
  const fetchProductData = async () => {
    if (!dataSourceId || !dataEndpointId) return

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchDataSourceData(dataSourceId, dataEndpointId, {}, true)
      
      // Transform API response to product format
      let transformedData = response.data
      if (Array.isArray(transformedData)) {
        transformedData = transformedData[0] // Take first product if array
      }
      
      if (transformedData && typeof transformedData === 'object') {
        // Map common API fields to product fields
        const mappedProduct = {
          name: transformedData.name || transformedData.title || transformedData.product_name,
          price: parseFloat(transformedData.price || transformedData.cost || 0),
          originalPrice: transformedData.original_price ? parseFloat(transformedData.original_price) : undefined,
          image: transformedData.image || transformedData.image_url || transformedData.thumbnail,
          images: transformedData.images || [],
          rating: parseFloat(transformedData.rating || transformedData.stars || 0),
          reviews: parseInt(transformedData.reviews || transformedData.review_count || 0),
          badge: transformedData.badge || transformedData.label,
          inStock: transformedData.in_stock !== false && transformedData.stock_status !== 'out_of_stock',
          stockCount: parseInt(transformedData.stock_count || transformedData.quantity || 0),
          description: transformedData.description || transformedData.details,
          shortDescription: transformedData.short_description || transformedData.summary,
          category: transformedData.category || transformedData.type,
          sku: transformedData.sku || transformedData.product_id,
          tags: transformedData.tags || [],
          variants: transformedData.variants || []
        }
        
        setProductData(mappedProduct)
        setLastRefresh(new Date())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product data')
      console.error('Failed to fetch product data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (dataSourceId && dataEndpointId && !isEditing) {
      fetchProductData()
    }
  }, [dataSourceId, dataEndpointId, isEditing])

  // Auto refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0 && dataSourceId && !isEditing) {
      const interval = setInterval(fetchProductData, refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, dataSourceId, isEditing])

  const handleRefresh = () => {
    if (dataSourceId && dataEndpointId) {
      fetchProductData()
    }
  }

  const discount = activeProduct.originalPrice ? Math.round((1 - activeProduct.price / activeProduct.originalPrice) * 100) : 0
  const allImages = [activeProduct.image, ...activeProduct.images].filter(Boolean)

  const handleInputChange = (field: string, value: any) => {
    if (isEditing && onChange) {
      onChange({ [field]: value })
    }
  }

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

  const renderVariants = () => {
    if (!showVariants || !variants.length) return null

    return (
      <div className="space-y-3">
        {variants.map((variant) => (
          <div key={variant.name}>
            <Label className="text-sm font-medium">{variant.name}</Label>
            <div className="flex gap-2 mt-1">
              {variant.options.map((option) => (
                <Button
                  key={option}
                  variant={selectedVariants[variant.name] === option ? "default" : "outline"}
                  size="sm"
                  onClick={() => !isEditing && setSelectedVariants(prev => ({
                    ...prev,
                    [variant.name]: option
                  }))}
                  disabled={isEditing}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Loading state
  if (isLoading && !productData && !isEditing) {
    return (
      <div className="w-full bg-white rounded-xl border overflow-hidden">
        <div className="aspect-square bg-gray-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
        <div className="p-4">
          <div className="h-4 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !isEditing) {
    return (
      <div className="w-full bg-white rounded-xl border overflow-hidden">
        <div className="aspect-square bg-red-50 flex flex-col items-center justify-center p-4">
          <Database className="w-8 h-8 text-red-500 mb-2" />
          <p className="text-sm text-red-600 text-center mb-2">Failed to load product</p>
          <p className="text-xs text-gray-500 text-center mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="p-6 bg-white rounded-lg border space-y-4">
        <h3 className="font-semibold text-lg">Edit Product</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Product Name</Label>
            <Input
              value={activeProduct.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Product name"
            />
          </div>
          
          <div>
            <Label>Category</Label>
            <Input
              value={activeProduct.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              placeholder="Category"
            />
          </div>
          
          <div>
            <Label>Price ({currency})</Label>
            <Input
              type="number"
              value={activeProduct.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value))}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <Label>Original Price ({currency})</Label>
            <Input
              type="number"
              value={activeProduct.originalPrice || ''}
              onChange={(e) => handleInputChange('originalPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <Label>Stock Count</Label>
            <Input
              type="number"
              value={activeProduct.stockCount}
              onChange={(e) => handleInputChange('stockCount', parseInt(e.target.value))}
              placeholder="0"
            />
          </div>
          
          <div>
            <Label>Rating (1-5)</Label>
            <Input
              type="number"
              min="1"
              max="5"
              step="0.1"
              value={activeProduct.rating}
              onChange={(e) => handleInputChange('rating', parseFloat(e.target.value))}
            />
          </div>
        </div>
        
        <div>
          <Label>Image URL</Label>
          <Input
            value={activeProduct.image}
            onChange={(e) => handleInputChange('image', e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </div>
        
        <div>
          <Label>Short Description</Label>
          <Input
            value={activeProduct.shortDescription}
            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
            placeholder="Brief product description"
          />
        </div>
        
        <div>
          <Label>Description</Label>
          <Textarea
            value={activeProduct.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Detailed product description"
            rows={3}
          />
        </div>
        
        <div>
          <Label>Layout</Label>
          <Select value={layout} onValueChange={(value) => handleInputChange('layout', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="horizontal">Horizontal</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    )
  }

  if (layout === 'horizontal') {
    return (
      <div className="flex gap-6 p-4 bg-white rounded-lg border">
        <div className="w-48 h-48 flex-shrink-0 overflow-hidden rounded-lg">
          <img src={allImages[selectedImage]} alt={activeProduct.name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <Badge variant="secondary" className="mb-2">{activeProduct.category}</Badge>
              <h3 className="text-xl font-semibold">{activeProduct.name}</h3>
              <p className="text-gray-600 text-sm">{activeProduct.shortDescription}</p>
            </div>
            {showWishlist && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsWishlisted(!isWishlisted)}
                className="text-gray-400 hover:text-red-500"
              >
                <Heart className={cn("w-5 h-5", isWishlisted && "fill-current text-red-500")} />
              </Button>
            )}
          </div>
          
          {showRating && renderStars()}
          
          <p className="text-gray-600 mt-2 mb-4">{activeProduct.description}</p>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl font-bold">{currency}{activeProduct.price.toFixed(2)}</span>
            {activeProduct.originalPrice && (
              <>
                <span className="text-lg text-gray-400 line-through">{currency}{activeProduct.originalPrice.toFixed(2)}</span>
                <Badge variant="destructive">-{discount}%</Badge>
              </>
            )}
          </div>
          
          {renderVariants()}
          
          {showAddToCart && (
            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center border rounded-lg">
                <button
                  className="p-2 hover:bg-gray-100"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="px-4 font-medium">{quantity}</span>
                <button
                  className="p-2 hover:bg-gray-100"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <Button className="flex-1" disabled={!activeProduct.inStock}>
                <ShoppingCart className="w-4 h-4 mr-2" />
                {activeProduct.inStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (layout === 'minimal') {
    return (
      <div className="flex items-center gap-4 p-3 bg-white rounded-lg border">
        <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded">
          <img src={allImages[selectedImage]} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{name}</h4>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{currency}{price.toFixed(2)}</span>
            {originalPrice && (
              <span className="text-sm text-gray-400 line-through">{currency}{originalPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
        {showAddToCart && (
          <Button size="sm" disabled={!inStock}>
            <Plus className="w-4 h-4" />
          </Button>
        )}
      </div>
    )
  }

  if (layout === 'detailed') {
    return (
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="grid md:grid-cols-2 gap-6 p-6">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg">
              <img src={allImages[selectedImage]} alt={name} className="w-full h-full object-cover" />
            </div>
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "w-16 h-16 flex-shrink-0 overflow-hidden rounded border-2",
                      selectedImage === index ? "border-primary" : "border-gray-200"
                    )}
                  >
                    <img src={img} alt={`${name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4">
            <div>
              <Badge variant="secondary">{category}</Badge>
              {badge && <Badge className="ml-2">{badge}</Badge>}
            </div>
            
            <h1 className="text-2xl font-bold">{name}</h1>
            <p className="text-gray-600">{shortDescription}</p>
            
            {showRating && renderStars()}
            
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold">{currency}{price.toFixed(2)}</span>
              {originalPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">{currency}{originalPrice.toFixed(2)}</span>
                  <Badge variant="destructive">-{discount}%</Badge>
                </>
              )}
            </div>
            
            <p className="text-gray-700">{description}</p>
            
            {renderVariants()}
            
            <div className="flex items-center gap-2 text-sm">
              <span className={cn("font-medium", inStock ? "text-green-600" : "text-red-600")}>
                {inStock ? `In Stock (${stockCount} available)` : 'Out of Stock'}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-600">SKU: {sku}</span>
            </div>
            
            {showAddToCart && (
              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-lg">
                  <button
                    className="p-3 hover:bg-gray-100"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-medium">{quantity}</span>
                  <button
                    className="p-3 hover:bg-gray-100"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <Button className="flex-1" size="lg" disabled={!inStock}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
              </div>
            )}
            
            <div className="flex gap-2">
              {showWishlist && (
                <Button
                  variant="outline"
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  className={cn(isWishlisted && "text-red-500 border-red-500")}
                >
                  <Heart className={cn("w-4 h-4 mr-2", isWishlisted && "fill-current")} />
                  {isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}
                </Button>
              )}
              {showQuickView && (
                <Button variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Quick View
                </Button>
              )}
              {showShare && (
                <Button variant="outline">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default card layout
  return (
    <m.div
      className="w-full bg-white rounded-xl border overflow-hidden"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <img src={allImages[selectedImage]} alt={name} className="w-full h-full object-cover" />
        
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
            onClick={() => setIsWishlisted(!isWishlisted)}
          >
            <Heart className={cn("w-5 h-5", isWishlisted && "fill-current")} />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <Badge variant="secondary" className="text-xs mb-1">{category}</Badge>
            <h3 className="font-semibold text-lg truncate">{name}</h3>
            <p className="text-sm text-gray-600 truncate">{shortDescription}</p>
          </div>
        </div>
        
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
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 font-medium">{quantity}</span>
              <button
                className="p-2 hover:bg-gray-100"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <Button className="flex-1" disabled={!inStock}>
              <ShoppingCart className="w-4 h-4 mr-2" />
              {inStock ? 'Add' : 'Out of Stock'}
            </Button>
          </div>
        )}
      </div>
    </m.div>
  )
}