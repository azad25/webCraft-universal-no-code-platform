import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'App Preview - WebCraft',
  description: 'Live preview of your WebCraft application',
  robots: 'noindex, nofollow', // Prevent search engines from indexing preview pages
}

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-100">
      {children}
    </div>
  )
}