import { createFileRoute } from '@tanstack/react-router'
import { getStore } from '@netlify/blobs'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  image: string
  available: boolean
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 'p1',
    name: 'Chips & Snacks Bundle',
    description: 'A variety pack of your favorite chips and snacks. Perfect for movie nights or hangouts.',
    price: 8.0,
    image: '/placeholder.png',
    available: true,
  },
  {
    id: 'p2',
    name: 'Energy Drink',
    description: 'Cold energy drink delivered right to your door. Stay refreshed and energized.',
    price: 4.0,
    image: '/placeholder.png',
    available: true,
  },
  {
    id: 'p3',
    name: 'Candy Pack',
    description: 'Assorted candy mix with a variety of sweets. Great for sharing!',
    price: 5.0,
    image: '/placeholder.png',
    available: true,
  },
  {
    id: 'p4',
    name: 'Ramen Noodles (3-Pack)',
    description: 'Three packs of instant ramen noodles. Quick, easy, and delicious.',
    price: 6.0,
    image: '/placeholder.png',
    available: true,
  },
  {
    id: 'p5',
    name: 'Juice Box (4-Pack)',
    description: 'Four juice boxes in assorted flavors. Refreshing and great for all ages.',
    price: 7.0,
    image: '/placeholder.png',
    available: true,
  },
]

async function getProductsStore() {
  return getStore({ name: 'payjayden-products', consistency: 'strong' })
}

export const Route = createFileRoute('/api/products')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const store = await getProductsStore()
          const data = await store.get('products', { type: 'json' })
          const products = (data as Product[] | null) ?? DEFAULT_PRODUCTS
          return Response.json(products)
        } catch {
          return Response.json(DEFAULT_PRODUCTS)
        }
      },
      POST: async ({ request }) => {
        const body = await request.json() as { product: Product; adminKey: string }
        if (body.adminKey !== 'jaydendelivers2503') {
          return Response.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const store = await getProductsStore()
        const existing = ((await store.get('products', { type: 'json' })) as Product[] | null) ?? DEFAULT_PRODUCTS
        const newProduct: Product = {
          ...body.product,
          id: `p${Date.now()}`,
          available: true,
        }
        const updated = [...existing, newProduct]
        await store.setJSON('products', updated)
        return Response.json(newProduct, { status: 201 })
      },
    },
  },
})
