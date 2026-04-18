# PayJayden — Local Delivery Service

A full-stack e-commerce delivery website where customers can browse products, add items to a cart, and place delivery or pickup orders. Built with TanStack Start and deployed on Netlify.

## Features

### Customer-Facing
- **Product catalog** — Browse available items with prices and images
- **Shopping cart** — Add/remove items, adjust quantities, persistent via localStorage
- **Checkout form** — Collect name, email, phone, address, delivery preference, T&C agreement, payment method, and a freehand signature
- **Delivery options** — Pickup at Woodcliff Park ($5) or home delivery in Woodcliff ($10)
- **Payment methods** — Cash (USD), Apple Cash, Venmo (@Jaydenp25), Zelle® (813-797-0007)
- **Venmo/Zelle popups** — Branded modals with payment info and total; customer confirms payment
- **Order confirmation** — Clear messaging that payment is under review

### Admin Panel (`/admin`, password: `jaydendelivers2503`)
- **Orders tab** — View all customer orders server-wide (persisted via Netlify Blobs), including customer details, items ordered, total owed, delivery type/address, and signature
- **Products tab** — Add, edit, or remove products; set name, description, price, image URL, and availability

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | TanStack Start |
| Frontend | React 19, TanStack Router v1 |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 |
| Storage | Netlify Blobs |
| Language | TypeScript 5.7 |
| Deployment | Netlify |

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Netlify Blobs requires a deployed site or the Netlify CLI for local emulation. Run with `netlify dev` for full functionality including order persistence.

## Environment

No environment variables are required. The app uses Netlify Blobs automatically in the Netlify environment.
