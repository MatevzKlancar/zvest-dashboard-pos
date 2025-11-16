# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development server (runs on port 3001 as per README)
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint
```

## Architecture Overview

This is a **B2B Shop Management Dashboard** built with Next.js 14 App Router, TypeScript, Tailwind CSS, and Supabase Auth. The application serves multiple user types with different permission levels.

### Tech Stack
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui (New York style)
- **Authentication**: Supabase Auth with JWT tokens
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **UI Components**: shadcn/ui with Lucide icons

### Project Structure

**Route Groups:**
- `(auth)`: Authentication pages (login, setup)
- `(dashboard)`: Protected dashboard pages
- `(admin)`: Admin-specific pages
- `api/`: API routes for backend integration

**Key Directories:**
- `src/lib/`: Core utilities (auth, api client, types, utils)
- `src/hooks/`: Custom hooks for data fetching and state
- `src/components/ui/`: shadcn/ui components
- `src/components/`: Application-specific components

### Authentication System

**Multi-User Architecture:**
- **Shop Owners**: Main users who manage shops, coupons, analytics
- **Admin Users**: Platform administrators with elevated permissions
- **App Users**: End customers using the mobile app

**Authentication Flow:**
1. Shop owner receives setup email with token: `/setup?token=abc123`
2. Setup page validates token and creates Supabase auth account
3. JWT tokens from Supabase are used for all API calls
4. Client-side auth state managed via custom hooks

### API Integration

**API Client:** Centralized in `src/lib/api.ts` with automatic token injection
**Base URL:** Configurable via `NEXT_PUBLIC_API_URL` environment variable
**Authentication:** Bearer tokens from Supabase for all protected endpoints

**Key API Patterns:**
- All shop-admin endpoints require authentication
- Response data often wrapped in `{ data: T }` structure
- API client handles token extraction and error formatting

### Data Types & Business Logic

**Core Entities:**
- `Shop`: Business profile with loyalty program settings
- `Coupon`: Discount codes with complex rules (percentage, fixed, free_item, points_multiplier)
- `Transaction`: POS integration with loyalty points
- `Article`: Shop inventory items
- `Analytics`: Revenue and usage metrics

**Loyalty System:** Supports both points-based and coupon-based loyalty programs

### UI/UX Patterns

**Component Library:** Uses shadcn/ui with path aliases:
```typescript
"@/components" → components
"@/lib" → lib utilities
"@/hooks" → custom hooks
```

**Form Handling:** React Hook Form + Zod validation with optimistic updates
**Loading States:** Skeleton loaders and spinners via TanStack Query
**Error Handling:** Toast notifications using Sonner

### Environment Configuration

**Required Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**Image Configuration:** Supports Supabase storage for shop/coupon images

### Development Notes

- Authentication is handled client-side (middleware.ts is minimal)
- Development server runs on port 3001 (not 3000)
- Uses strict TypeScript configuration
- Follows Next.js 14 App Router conventions
- API routes provide backend integration layer