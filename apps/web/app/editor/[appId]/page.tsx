import { Metadata } from 'next'
import { LiveEditor } from '@/components/editor/live-editor'

interface EditorPageProps {
  params: Promise<{
    appId: string
  }>
}

export const metadata: Metadata = {
  title: 'Live Editor - WebCraft',
  description: 'Build and customize your app with our intuitive drag-and-drop editor',
}

export default async function EditorPage({ params }: EditorPageProps) {
  const { appId } = await params

  return (
    <div className="h-screen overflow-hidden">
      <LiveEditor appId={appId} />
    </div>
  )
}