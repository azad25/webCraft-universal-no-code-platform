'use client'

import { useState } from 'react'
import { m, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Plus, Minus, Trash2, X, ShoppingBag, CreditCard, Truck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface CartItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  quantity: number
  variant?: string
  inStock: boolean
}

interface CartWidgetProps {
  items?: CartItem[]
  layout?: 'sidebar' | 'page' | 'mini' | 'dropdown'
  showShipping?: boolean
  showTax?: boolean
  showCoupons?: boolean
  showRecommendations?: boolean
  currency?: string
  shippingCost?: number
  taxRate?: number
  freeShippingThreshold?: number
  isEditing?: boolean
  onChange?: (props: any) => void
}

export function CartWidget({
  items = [
    {
      id: '1',
      name: 'Premium Headphones',
      price: 199.99,
      originalPrice: 249.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
      quantity: 1,
      variant: 'Black',
      inStock: true
    },
    {
      id: '2',
      name: 'Wireless Mouse',
      price: 49.99,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop',
      quantity: 2,
      inStock: true
    }
  ],
  layout = 'sidebar',
  showShipping = true,
  showTax = true,
  showCoupons = true,
  showRecommendations = false,
  currency = '$',
  shippingCost = 9.99,
  taxRate = 0.08,
  freeShippingThreshold = 100,
  isEditing = false,
  onChange
}: CartWidgetProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>(items)
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [isOpen, setIsOpen] = useState(layout !== 'dropdown')

  const handleInputChange = (field: string, value: any) => {
    if (isEditing && onChange) {
      onChange({ [field]: value })
    }
  }

  const updateQuantity = (id: string, newQuantity: number) => {
    if (isEditing) return
    
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== id))
    } else {
      setCartItems(prev => prev.map(item => 
        item.id === id ? { ...item, quantity: newQuantity } : item
      ))
    }
  }

  const removeItem = (id: string) => {
    if (isEditing) return
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  const applyCoupon = () => {
    if (isEditing) return
    
    // Mock coupon validation
    const validCoupons = {
      'SAVE10': 10,
      'WELCOME20': 20,
      'FREESHIP': 0
    }
    
    if (validCoupons[couponCode as keyof typeof validCoupons]) {
      setAppliedCoupon({
        code: couponCode,
        discount: validCoupons[couponCode as keyof typeof validCoupons]
      })
      setCouponCode('')
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const couponDiscount = appliedCoupon ? (subtotal * appliedCoupon.discount / 100) : 0
  const shipping = showShipping && subtotal < freeShippingThreshold ? shippingCost : 0
  const tax = showTax ? (subtotal - couponDiscount) * taxRate : 0
  const total = subtotal - couponDiscount + shipping + tax

  if (isEditing) {
    return (
      <div className="p-6 bg-white rounded-lg border space-y-4">
        <h3 className="font-semibold text-lg">Edit Shopping Cart</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Layout</Label>
            <Select value={layout} onValueChange={(value) => handleInputChange('layout', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sidebar">Sidebar</SelectItem>
                <SelectItem value="page">Full Page</SelectItem>
                <SelectItem value="mini">Mini Cart</SelectItem>
                <SelectItem value="dropdown">Dropdown</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Currency</Label>
            <Select value={currency} onValueChange={(value) => handleInputChange('currency', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="$">USD ($)</SelectItem>
                <SelectItem value="€">EUR (€)</SelectItem>
                <SelectItem value="£">GBP (£)</SelectItem>
                <SelectItem value="¥">JPY (¥)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Shipping Cost</Label>
            <Input
              type="number"
              value={shippingCost}
              onChange={(e) => handleInputChange('shippingCost', parseFloat(e.target.value))}
              placeholder="0.00"
            />
          </div>
          
          <div>
            <Label>Tax Rate (%)</Label>
            <Input
              type="number"
              value={taxRate * 100}
              onChange={(e) => handleInputChange('taxRate', parseFloat(e.target.value) / 100)}
              placeholder="8"
            />
          </div>
          
          <div>
            <Label>Free Shipping Threshold</Label>
            <Input
              type="number"
              value={freeShippingThreshold}
              onChange={(e) => handleInputChange('freeShippingThreshold', parseFloat(e.target.value))}
              placeholder="100"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Features</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showShipping ? "default" : "outline"}
              size="sm"
              onClick={() => handleInputChange('showShipping', !showShipping)}
            >
              Show Shipping
            </Button>
            <Button
              variant={showTax ? "default" : "outline"}
              size="sm"
              onClick={() => handleInputChange('showTax', !showTax)}
            >
              Show Tax
            </Button>
            <Button
              variant={showCoupons ? "default" : "outline"}
              size="sm"
              onClick={() => handleInputChange('showCoupons', !showCoupons)}
            >
              Show Coupons
            </Button>
            <Button
              variant={showRecommendations ? "default" : "outline"}
              size="sm"
              onClick={() => handleInputChange('showRecommendations', !showRecommendations)}
            >
              Show Recommendations
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (layout === 'mini') {
    return (
      <div className="bg-white rounded-lg border p-4 max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">Cart ({cartItems.length})</span>
          </div>
          <Badge variant="secondary">{currency}{total.toFixed(2)}</Badge>
        </div>
        
        <div className="space-y-2 mb-4">
          {cartItems.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <img src={item.image} alt={item.name} className="w-10 h-10 rounded object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.quantity} × {currency}{item.price}</p>
              </div>
            </div>
          ))}
          {cartItems.length > 3 && (
            <p className="text-xs text-gray-500 text-center">+{cartItems.length - 3} more items</p>
          )}
        </div>
        
        <Button className="w-full" size="sm">
          <ShoppingCart className="w-4 h-4 mr-2" />
          View Cart
        </Button>
      </div>
    )
  }

  if (layout === 'dropdown') {
    return (
      <div className="relative">
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className="relative"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart ({cartItems.length})
          {cartItems.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
              {cartItems.length}
            </Badge>
          )}
        </Button>
        
        <AnimatePresence>
          {isOpen && (
            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg border shadow-lg z-50"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Shopping Cart</h3>
                  <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {cartItems.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Your cart is empty</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{item.name}</p>
                            <p className="text-xs text-gray-500">{currency}{item.price}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm w-8 text-center">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <Separator className="mb-4" />
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>{currency}{subtotal.toFixed(2)}</span>
                      </div>
                      {shipping > 0 && (
                        <div className="flex justify-between text-sm">
                          <span>Shipping</span>
                          <span>{currency}{shipping.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>{currency}{total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button className="w-full">
                      Checkout
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </>
                )}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Sidebar and Page layouts
  const isFullPage = layout === 'page'
  
  return (
    <div className={cn(
      "bg-white rounded-lg border",
      isFullPage ? "p-8 max-w-4xl mx-auto" : "p-6 max-w-md"
    )}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn("font-bold", isFullPage ? "text-2xl" : "text-xl")}>
          Shopping Cart ({cartItems.length})
        </h2>
        {!isFullPage && (
          <Button variant="ghost" size="sm">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">Your cart is empty</h3>
          <p className="text-sm mb-4">Add some products to get started</p>
          <Button>
            Continue Shopping
          </Button>
        </div>
      ) : (
        <div className={cn("space-y-6", isFullPage && "grid lg:grid-cols-3 lg:gap-8 lg:space-y-0")}>
          {/* Cart Items */}
          <div className={cn(isFullPage && "lg:col-span-2")}>
            <div className="space-y-4">
              {cartItems.map((item) => (
                <m.div
                  key={item.id}
                  layout
                  className="flex gap-4 p-4 border rounded-lg"
                >
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className={cn(
                      "rounded object-cover",
                      isFullPage ? "w-24 h-24" : "w-16 h-16"
                    )}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{item.name}</h4>
                    {item.variant && (
                      <p className="text-sm text-gray-500">{item.variant}</p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-semibold">{currency}{item.price.toFixed(2)}</span>
                      {item.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">
                          {currency}{item.originalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="text-gray-400 hover:text-red-500 h-6 w-6 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex items-center border rounded">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="px-3 text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </m.div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            {/* Coupon Code */}
            {showCoupons && (
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3">Promo Code</h4>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <Button onClick={applyCoupon} disabled={!couponCode}>
                    Apply
                  </Button>
                </div>
                {appliedCoupon && (
                  <div className="mt-2 flex items-center justify-between text-sm text-green-600">
                    <span>Code: {appliedCoupon.code}</span>
                    <span>-{appliedCoupon.discount}%</span>
                  </div>
                )}
              </div>
            )}

            {/* Order Summary */}
            <div className="p-4 border rounded-lg space-y-3">
              <h4 className="font-medium">Order Summary</h4>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{currency}{subtotal.toFixed(2)}</span>
                </div>
                
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.discount}%)</span>
                    <span>-{currency}{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                
                {showShipping && (
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>
                      {shipping === 0 ? (
                        <span className="text-green-600">Free</span>
                      ) : (
                        `${currency}${shipping.toFixed(2)}`
                      )}
                    </span>
                  </div>
                )}
                
                {showTax && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{currency}{tax.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>{currency}{total.toFixed(2)}</span>
              </div>
              
              {showShipping && subtotal < freeShippingThreshold && (
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Truck className="w-3 h-3" />
                  Add {currency}{(freeShippingThreshold - subtotal).toFixed(2)} more for free shipping
                </div>
              )}
            </div>

            {/* Checkout Button */}
            <Button className="w-full" size="lg">
              <CreditCard className="w-4 h-4 mr-2" />
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}