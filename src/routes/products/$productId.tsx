import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/products/$productId')({
  beforeLoad: () => { throw redirect({ to: '/' }) },
  component: () => null,
})
