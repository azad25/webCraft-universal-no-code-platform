'use client'

import dynamicImport from 'next/dynamic'

const NewAppForm = dynamicImport(() => import('./new-app-form'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-[400px]">Loading...</div>
})

// dynamic export is not supported in 'use client' components in some versions, but let's try keeping it or removing it if it conflicts.
// It is usually ignored or causes a warning in Client Components, but 'force-dynamic' is a Route Segment Config which belongs to Server Components.
// However, since we are moving to client component to just render the dynamic part, maybe we don't need 'force-dynamic' anymore if ssr: false works.
// But let's keep it commented out to be safe or remove it.
// Next.js might complain if I export `dynamic` from a client component.
// I will REMOVE it since we are relying on ssr: false.

export default function NewAppPage() {
  return <NewAppForm />
}
