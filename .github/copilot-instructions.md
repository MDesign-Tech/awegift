# AweGift Copilot Instructions

## Project Overview

**AweGift** is a modern full-stack eCommerce platform built with **Next.js 15**, **TypeScript**, **Firebase**, **NextAuth.js**, and **Redux**. It includes a comprehensive admin dashboard, role-based access control (RBAC), and multi-currency/multi-language support.

## Architecture

### Core Stack

- **Framework**: Next.js 15 (App Router with server/client components)
- **Auth**: NextAuth.js v5 with Firebase adapter (Google, GitHub, Email/Password)
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage + Cloudinary (for product images)
- **State Management**: Redux Toolkit + Redux Persist (client-side cart/favorites)
- **Payments**: Stripe
- **Styling**: Tailwind CSS v4 + Framer Motion animations

### Key Directories

- **`src/app`** - Next.js App Router routes (public/user/admin layouts)
- **`src/components`** - Reusable React components (layout, products, cart, etc.)
- **`src/lib`** - Utilities: auth context, Firebase config, RBAC, email, currency conversion
- **`src/redux`** - Redux store (cart, favorites, user info)
- **`src/hooks`** - Custom hooks (useCurrentUser, useUserSync, useProductSearch, etc.)
- **`src/api`** - API routes (organized by feature: auth, products, orders, checkout)

## Data Flow & State Management

### User Session Flow

1. NextAuth.js manages authentication (session stored server-side)
2. **UserSyncProvider** → `useUserSync` hook syncs NextAuth session to Redux store
3. **useCurrentUser()** hook retrieves user from Redux (role, id, isAdmin)
4. User data also synced to Firestore via API routes

**Critical Pattern**: Always check Redux for user data in client components:

```typescript
const { user, isAdmin } = useCurrentUser();
```

### Cart & Favorites

- Stored in **Redux** (client-side only) with `redux-persist`
- Not persisted to Firestore immediately; sent only at checkout
- **Reducer patterns**: `addToCart`, `removeFromCart`, `increaseQuantity`, `decreaseQuantity`

### Product Data Flow

- Products queried from **Firestore** via API routes
- Images hosted on **Cloudinary** (remote pattern configured in next.config.mjs)
- **Search/Filter**: `useProductSearch` hook + server-side API filtering

## Authentication & Authorization (RBAC)

### User Roles

- **`user`** - Customer (default)
- **`admin`** - Full system access

**Key Files**:

- [src/lib/rbac/roles.ts](src/lib/rbac/roles.ts) - Role definitions & permissions
- [src/auth.config.ts](src/auth.config.ts) - NextAuth callbacks (JWT, session)

### Implementation Pattern

1. Roles stored in NextAuth JWT/Session
2. Passed to Firestore user documents
3. Check with `isAdmin` flag from `useCurrentUser()`
4. Use `ProtectedRoute` component for admin pages

## API Routes & Data Access

### API Organization

- **`/api/auth`** - Authentication endpoints (NextAuth managed)
- **`/api/products`** - Product CRUD operations
- **`/api/orders`** - Order management
- **`/api/checkout`** - Stripe payment processing
- **`/api/user`** - User profile & preferences
- **`/api/categories`** - Category management
- **`/api/admin`** - Admin-only operations

### Fetching Pattern

Use **`apiFetch`** utility from [src/lib/fetcher.ts](src/lib/fetcher.ts):

```typescript
import { apiFetch } from "@/lib/fetcher";
const data = await apiFetch("/api/products");
```

✅ Auto-includes credentials (cookies for session auth)
✅ Handles 401 redirects to signin

## Component Conventions

### Client vs Server Components

- **Default**: Server Components (`src/app`) for SEO/performance
- **Client**: Prefix with `"use client"` when using hooks, context, interactivity
- **Pattern**: Client components usually in `src/components`, Server pages in `src/app`

### Provider Structure

[src/components/Providers.tsx](src/components/Providers.tsx) wraps app with:

1. `SessionProvider` (NextAuth)
2. `NetworkProvider` (offline detection)
3. `StateProvider` (Redux)
4. `AuthProvider` (custom auth context)
5. `UserSyncProvider` (syncs session → Redux)
6. `CurrencyProvider` (multi-currency conversion)
7. `NotificationProvider` (toast messages)
8. `Toaster` (react-hot-toast)

## Type System

### Core Types (Defined in [type.ts](type.ts))

- **ProductType** - Product with images, pricing, stock, reviews
- **UserData** - User profile, addresses, cart, wishlist
- **OrderType** - Order details with status tracking
- **Address** - User shipping/billing address
- **Review** - Product reviews with rating

### NextAuth Type Extensions

[src/types/next-auth.d.ts](src/types/next-auth.d.ts) extends Session & JWT with `role` and `id` fields.

## Development Workflows

### Setup & Running

```bash
npm install
npm run dev           # Run dev server (Turbopack disabled)
npm run build         # Production build
npm run type-check    # TypeScript validation
npm run lint          # ESLint check
```

### Environment Variables

Required (see `.env.example`):

- Firebase config (`NEXT_PUBLIC_FIREBASE_*`)
- NextAuth secret (`AUTH_SECRET`, `AUTH_PROVIDER_*`)
- Stripe keys (`STRIPE_*`)
- Cloudinary config
- Email service credentials

### Database Queries

- **Firestore** via Firebase Admin SDK (server-side)
- **Collections**: `users`, `products`, `orders`, `categories`, `quotes`
- **Patterns**: Use Firebase SDK directly in API routes; never expose admin keys

## Key Patterns & Best Practices

### Error Handling

- **API Routes**: Return `{ error: true, message: '...' }`
- **Client**: Use `apiFetch` which auto-handles 401s
- **Toast Notifications**: Use react-hot-toast for user feedback

### Loading States

- Components have skeleton loaders (ProductSkeleton, OrderSummarySkeleton, etc.)
- Use `useInfiniteScroll` for product pagination
- Status indicators: loading, error, success states

### Styling

- **Tailwind v4** with `clsx` + `tw-merge` via `cn()` utility
- **Animations**: Framer Motion for UI transitions
- **Responsive**: Mobile-first design (sm:, md:, lg: breakpoints)

### Naming Conventions

- Components: PascalCase (e.g., `ProductCard.tsx`)
- Utilities: camelCase (e.g., `apiFetch`, `cn()`)
- Hooks: `use*` prefix (e.g., `useCurrentUser`)
- API routes: kebab-case or descriptive (e.g., `/api/products/search`)

## Common Patterns to Follow

1. **Fetching with credentials** → Always use `apiFetch()` not bare `fetch()`
2. **User checks** → Use `useCurrentUser()` or server-side `getServerSession()`
3. **Protected routes** → Wrap with `ProtectedRoute` component
4. **Redux updates** → Dispatch actions from components; use selectors with `useSelector`
5. **Form validation** → Implement on submit; show errors in toast or inline
6. **Image optimization** → Use `next/image` with Cloudinary remote patterns

## Deployment

- **Hosted on Cloudflare Pages** (configured in next.config.mjs)
- **Build command**: `npm run build`
- **Postbuild**: `next-sitemap` generates sitemap.xml
- **Compatibility date**: 2024-08-20

## Testing & Type Safety

- TypeScript strict mode enabled
- **Build errors ignored** (see next.config.mjs) - fix these when possible
- ESLint configured for Next.js best practices
- Test with `npm run type-check` before committing

## When Working on Features

### Adding a New API Endpoint

1. Create file in `src/app/api/[feature]/route.ts`
2. Use Firebase Admin SDK for Firestore queries
3. Return JSON response with proper HTTP status codes
4. Protect with role checks using `getServerSession()`

### Adding a New Component

1. Use `"use client"` only if needed (hooks/interactivity)
2. Type props with TypeScript interfaces
3. Import types from `type.ts` (ProductType, UserData, etc.)
4. Use `cn()` for Tailwind + dynamic classes

### Adding a New Page

1. Create in `src/app/(user|public)/[route]/page.tsx`
2. Use Server Components by default
3. Fetch data server-side when possible
4. Wrap interactive parts with client components

---

**Last Updated**: January 2026 | **Framework Version**: Next.js 15
