import { Metadata } from 'next'
import { LiveEditor } from '@/components/editor/live-editor'
import { EditorProvider } from '@/contexts/editor-context'

interface EditorPageProps {
  params: {
    appId: string
  }
}

export const metadata: Metadata = {
  title: 'Live Editor - WebCraft',
  description: 'Build and customize your app with our intuitive drag-and-drop editor',
}

export default function EditorPage({ params }: EditorPageProps) {
  return (
    <EditorProvider appId={params.appId}>
      <div className="h-screen overflow-hidden">
        <LiveEditor appId={params.appId} />
      </div>
    </EditorProvider>
  )
}