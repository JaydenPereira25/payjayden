import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout/cancel')({
  beforeLoad: () => { throw redirect({ to: '/' }) },
  component: () => null,
})
