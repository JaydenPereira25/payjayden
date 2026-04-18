import { createFileRoute } from '@tanstack/react-router'
import { getStore } from '@netlify/blobs'
import { getUser } from '@netlify/identity'

export interface CustomerProfile {
  name: string
  phone: string
  address: string
}

async function getProfilesStore() {
  return getStore({ name: 'payjayden-profiles', consistency: 'strong' })
}

export const Route = createFileRoute('/api/profile')({
  server: {
    handlers: {
      GET: async () => {
        const user = await getUser()
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const store = await getProfilesStore()
        const profile = (await store.get(user.id, { type: 'json' })) as CustomerProfile | null
        return Response.json(profile ?? null)
      },
      PUT: async ({ request }) => {
        const user = await getUser()
        if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })
        const body = await request.json() as Partial<CustomerProfile>
        const store = await getProfilesStore()
        const existing = ((await store.get(user.id, { type: 'json' })) as CustomerProfile | null) ?? { name: '', phone: '', address: '' }
        const updated: CustomerProfile = {
          name: body.name ?? existing.name,
          phone: body.phone ?? existing.phone,
          address: body.address ?? existing.address,
        }
        await store.setJSON(user.id, updated)
        return Response.json(updated)
      },
    },
  },
})
