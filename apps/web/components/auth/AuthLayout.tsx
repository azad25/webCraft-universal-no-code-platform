'use client'

import { BrandAnimation } from './BrandAnimation'

interface AuthLayoutProps {
    children: React.ReactNode
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
    return (
        <div className="min-h-screen w-full flex">
            {/* Left Side - Form Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                    {children}
                </div>
            </div>

            {/* Right Side - Branding Area (Hidden on mobile) */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <BrandAnimation />
            </div>
        </div>
    )
}
