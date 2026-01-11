'use client'

import { useState } from 'react'
import { m } from 'framer-motion'
import { 
  CreditCard, 
  Lock, 
  Truck, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  Building,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface CheckoutItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
}

interface CheckoutWidgetProps {
  items?: CheckoutItem[]
  layout?: 'single-page' | 'multi-step' | 'sidebar'
  showOrderSummary?: boolean
  showShippingOptions?: boolean
  showPaymentMethods?: boolean
  showGuestCheckout?: boolean
  currency?: string
  shippingCost?: number
  taxRate?: number
  isEditing?: boolean
  onChange?: (props: any) => void
}

export function CheckoutWidget({
  items = [
    {
      id: '1',
      name: 'Premium Headphones',
      price: 199.99,
      quantity: 1,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=80&h=80&fit=crop'
    },
    {
      id: '2',
      name: 'Wireless Mouse',
      price: 49.99,
      quantity: 2,
      image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=80&h=80&fit=crop'
    }
  ],
  layout = 'single-page',
  showOrderSummary = true,
  showShippingOptions = true,
  showPaymentMethods = true,
  showGuestCheckout = true,
  currency = '$',
  shippingCost = 9.99,
  taxRate = 0.08,
  isEditing = false,
  onChange
}: CheckoutWidgetProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGuest, setIsGuest] = useState(false)
  const [shippingMethod, setShippingMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  })

  const handleInputChange = (field: string, value: any) => {
    if (isEditing && onChange) {
      onChange({ [field]: value })
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shipping = shippingMethod === 'express' ? shippingCost * 2 : shippingCost
  const tax = subtotal * taxRate
  const total = subtotal + shipping + tax

  const steps = [
    { id: 1, name: 'Information', icon: User },
    { id: 2, name: 'Shipping', icon: Truck },
    { id: 3, name: 'Payment', icon: CreditCard }
  ]

  if (isEditing) {
    return (
      <div className="p-6 bg-white rounded-lg border space-y-4">
        <h3 className="font-semibold text-lg">Edit Checkout</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Layout</Label>
            <Select value={layout} onValueChange={(value) => handleInputChange('layout', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single-page">Single Page</SelectItem>
                <SelectItem value="multi-step">Multi-Step</SelectItem>
                <SelectItem value="sidebar">Sidebar</SelectItem>
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
        </div>
        
        <div className="space-y-2">
          <Label>Features</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              variant={showOrderSummary ? "default" : "outline"}
              size="sm"
              onClick={() => handleInputChange('showOrderSummary', !showOrderSummary)}
            >
              Order Summary
            </Button>
            <Button
              variant={showShippingOptions ? "default" : "outline"}
              size="sm"
              onClick={() => handleInputChange('showShippingOptions', !showShippingOptions)}
            >
              Shipping Options
            </Button>
            <Button
              variant={showPaymentMethods ? "default" : "outline"}
              size="sm"
              onClick={() => handleInputChange('showPaymentMethods', !showPaymentMethods)}
            >
              Payment Methods
            </Button>
            <Button
              variant={showGuestCheckout ? "default" : "outline"}
              size="sm"
              onClick={() => handleInputChange('showGuestCheckout', !showGuestCheckout)}
            >
              Guest Checkout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const renderOrderSummary = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={item.image} 
                  alt={item.name} 
                  className="w-12 h-12 rounded object-cover"
                />
                {item.quantity > 1 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                    {item.quantity}
                  </Badge>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{item.name}</p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <span className="font-medium">{currency}{(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        
        <Separator />
        
        {/* Totals */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{currency}{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Shipping</span>
            <span>{currency}{shipping.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Tax</span>
            <span>{currency}{tax.toFixed(2)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>{currency}{total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderInformationStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Contact Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGuestCheckout && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="guest" 
              checked={isGuest}
              onCheckedChange={(checked: boolean) => setIsGuest(checked)}
            />
            <Label htmlFor="guest">Checkout as guest</Label>
          </div>
        )}
        
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="john@example.com"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              placeholder="John"
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              placeholder="Doe"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="123 Main St"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              placeholder="New York"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Select value={formData.state} onValueChange={(value) => handleInputChange('state', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NY">New York</SelectItem>
                <SelectItem value="CA">California</SelectItem>
                <SelectItem value="TX">Texas</SelectItem>
                <SelectItem value="FL">Florida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="zipCode">ZIP Code</Label>
            <Input
              id="zipCode"
              value={formData.zipCode}
              onChange={(e) => handleInputChange('zipCode', e.target.value)}
              placeholder="10001"
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="(555) 123-4567"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderShippingStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          Shipping Method
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showShippingOptions ? (
          <RadioGroup value={shippingMethod} onValueChange={setShippingMethod}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="standard" id="standard" />
                <div className="flex-1">
                  <Label htmlFor="standard" className="font-medium">Standard Shipping</Label>
                  <p className="text-sm text-gray-500">5-7 business days</p>
                </div>
                <span className="font-medium">{currency}{shippingCost.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="express" id="express" />
                <div className="flex-1">
                  <Label htmlFor="express" className="font-medium">Express Shipping</Label>
                  <p className="text-sm text-gray-500">2-3 business days</p>
                </div>
                <span className="font-medium">{currency}{(shippingCost * 2).toFixed(2)}</span>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="overnight" id="overnight" />
                <div className="flex-1">
                  <Label htmlFor="overnight" className="font-medium">Overnight Shipping</Label>
                  <p className="text-sm text-gray-500">Next business day</p>
                </div>
                <span className="font-medium">{currency}{(shippingCost * 3).toFixed(2)}</span>
              </div>
            </div>
          </RadioGroup>
        ) : (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Standard Shipping</p>
                <p className="text-sm text-gray-500">5-7 business days</p>
              </div>
              <span className="font-medium">{currency}{shippingCost.toFixed(2)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const renderPaymentStep = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {showPaymentMethods && (
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="card" id="card" />
                <Label htmlFor="card" className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Credit/Debit Card
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paypal" id="paypal" />
                <Label htmlFor="paypal" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  PayPal
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="apple" id="apple" />
                <Label htmlFor="apple" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Apple Pay
                </Label>
              </div>
            </div>
          </RadioGroup>
        )}
        
        {paymentMethod === 'card' && (
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={formData.cardNumber}
                onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                placeholder="1234 5678 9012 3456"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  value={formData.expiryDate}
                  onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                  placeholder="MM/YY"
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  placeholder="123"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="cardName">Name on Card</Label>
              <Input
                id="cardName"
                value={formData.cardName}
                onChange={(e) => handleInputChange('cardName', e.target.value)}
                placeholder="John Doe"
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-4">
          <Shield className="w-4 h-4" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </CardContent>
    </Card>
  )

  if (layout === 'multi-step') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isActive = currentStep === step.id
            const isCompleted = currentStep > step.id
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  isActive ? "border-primary bg-primary text-white" :
                  isCompleted ? "border-green-500 bg-green-500 text-white" :
                  "border-gray-300 text-gray-400"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "ml-2 font-medium",
                  isActive ? "text-primary" :
                  isCompleted ? "text-green-600" :
                  "text-gray-400"
                )}>
                  {step.name}
                </span>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-16 h-0.5 mx-4",
                    isCompleted ? "bg-green-500" : "bg-gray-300"
                  )} />
                )}
              </div>
            )
          })}
        </div>

        <div className={cn("grid gap-6", showOrderSummary && "lg:grid-cols-3")}>
          <div className={cn(showOrderSummary && "lg:col-span-2")}>
            {currentStep === 1 && renderInformationStep()}
            {currentStep === 2 && renderShippingStep()}
            {currentStep === 3 && renderPaymentStep()}
            
            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              {currentStep < 3 ? (
                <Button onClick={() => setCurrentStep(currentStep + 1)}>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button>
                  <Lock className="w-4 h-4 mr-2" />
                  Complete Order
                </Button>
              )}
            </div>
          </div>
          
          {showOrderSummary && (
            <div className="lg:sticky lg:top-6 lg:self-start">
              {renderOrderSummary()}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Single page and sidebar layouts
  const isSidebar = layout === 'sidebar'
  
  return (
    <div className={cn(
      "max-w-6xl mx-auto p-6",
      isSidebar && "grid lg:grid-cols-3 gap-8"
    )}>
      <div className={cn(
        "space-y-6",
        isSidebar ? "lg:col-span-2" : showOrderSummary && "grid lg:grid-cols-3 lg:gap-8 lg:space-y-0"
      )}>
        <div className={cn(!isSidebar && showOrderSummary && "lg:col-span-2 space-y-6")}>
          {renderInformationStep()}
          {renderShippingStep()}
          {renderPaymentStep()}
          
          <Button className="w-full" size="lg">
            <Lock className="w-4 h-4 mr-2" />
            Complete Order • {currency}{total.toFixed(2)}
          </Button>
        </div>
        
        {!isSidebar && showOrderSummary && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            {renderOrderSummary()}
          </div>
        )}
      </div>
      
      {isSidebar && showOrderSummary && (
        <div className="lg:sticky lg:top-6 lg:self-start">
          {renderOrderSummary()}
        </div>
      )}
    </div>
  )
}