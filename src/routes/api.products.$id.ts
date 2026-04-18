import { createFileRoute } from '@tanstack/react-router'
import { getStore } from '@netlify/blobs'
import type { Product } from './api.products'

const DEFAULT_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Chips & Snacks Bundle', description: 'A variety pack of your favorite chips and snacks.', price: 8.0, image: '/placeholder.png', available: true },
  { id: 'p2', name: 'Energy Drink', description: 'Cold energy drink delivered right to your door.', price: 4.0, image: '/placeholder.png', available: true },
  { id: 'p3', name: 'Candy Pack', description: 'Assorted candy mix with a variety of sweets.', price: 5.0, image: '/placeholder.png', available: true },
  { id: 'p4', name: 'Ramen Noodles (3-Pack)', description: 'Three packs of instant ramen noodles.', price: 6.0, image: '/placeholder.png', available: true },
  { id: 'p5', name: 'Juice Box (4-Pack)', description: 'Four juice boxes in assorted flavors.', price: 7.0, image: '/placeholder.png', available: true },
]

async function getProductsStore() {
  return getStore({ name: 'payjayden-products', consistency: 'strong' })
}

export const Route = createFileRoute('/api/products/$id')({
  server: {
    handlers: {
      PUT: async ({ request, params }) => {
        const body = await request.json() as { product: Partial<Product>; adminKey: string }
        if (body.adminKey !== 'jaydendelivers2503') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const store = await getProductsStore()
        const existing = ((await store.get('products', { type: 'json' })) as Product[] | null) ?? DEFAULT_PRODUCTS
        const updated = existing.map(p => p.id === params.id ? { ...p, ...body.product, id: params.id } : p)
        await store.setJSON('products', updated)
        return Response.json(updated.find(p => p.id === params.id))
      },
      DELETE: async ({ request, params }) => {
        const body = await request.json() as { adminKey: string }
        if (body.adminKey !== 'jaydendelivers2503') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const store = await getProductsStore()
        const existing = ((await store.get('products', { type: 'json' })) as Product[] | null) ?? DEFAULT_PRODUCTS
        const updated = existing.filter(p => p.id !== params.id)
        await store.setJSON('products', updated)
        return new Response(null, { status: 204 })
      },
    },
  },
})
