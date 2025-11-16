# B2B Shop Management Dashboard

A modern, responsive B2B shop management dashboard built with Next.js 14, TypeScript, Tailwind CSS, and Supabase Auth. This dashboard allows shop owners to manage their loyalty program, coupons, and view analytics.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth with secure JWT tokens
- **Shop Management**: Complete shop profile management
- **Coupon System**: Full CRUD operations for coupons and discounts
- **Analytics Dashboard**: Revenue charts, transaction analytics, customer insights
- **Responsive Design**: Mobile-first approach with beautiful UI
- **Real-time Updates**: Optimistic updates with React Query
- **Professional UI**: Built with shadcn/ui components

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Authentication**: Supabase Auth
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Charts**: Recharts
- **Notifications**: Sonner

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Backend API running (see API requirements below)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd zvest-dashboard-pos
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Update `.env.local` with your configuration:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # API Configuration
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

4. **Configure Supabase**

   - Create a new Supabase project
   - Set up authentication (enable email/password)
   - Copy your project URL and anon key to `.env.local`

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/                 # Authentication pages
│   │   ├── login/              # Login page
│   │   └── setup/              # Shop setup page
│   ├── (dashboard)/            # Dashboard pages
│   │   ├── dashboard/          # Main dashboard
│   │   ├── shop/               # Shop profile management
│   │   ├── coupons/            # Coupon management
│   │   ├── analytics/          # Analytics & reports
│   │   └── transactions/       # Transaction history
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (redirects)
│   └── providers.tsx           # React Query provider
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── auth/                   # Authentication components
│   ├── layout/                 # Layout components
│   └── dashboard/              # Dashboard-specific components
├── lib/
│   ├── api.ts                  # API client
│   ├── auth.ts                 # Authentication utilities
│   ├── types.ts                # TypeScript types
│   └── utils.ts                # Utility functions
└── hooks/
    ├── useAuth.ts              # Authentication hook
    ├── useShop.ts              # Shop management hooks
    └── useCoupons.ts           # Coupon management hooks
```

## 🔐 Authentication Flow

### Shop Owner Setup

1. Shop owner receives email with setup link: `/setup?token=abc123`
2. Setup page validates token and shows shop details
3. Shop owner creates password and completes profile
4. Redirects to dashboard after successful setup

### Login Flow

1. Login page with email/password
2. Supabase Auth handles authentication
3. JWT token stored for API calls
4. Redirect to dashboard after login

## 📊 Dashboard Features

### Main Dashboard

- Key metrics (revenue, transactions, customers, coupons)
- Recent transactions table
- Quick actions for common tasks
- Welcome message with shop info

### Shop Profile Management

- Update shop details (name, description, address, contact info)
- Configure loyalty program type (points vs coupons)
- Save/reset functionality with optimistic updates

### Coupon Management

- Create, edit, delete coupons
- Multiple coupon types (percentage, fixed, free item, points multiplier)
- Search and filter functionality
- Usage statistics and management

### Analytics (Coming Soon)

- Revenue charts and trends
- Transaction volume analytics
- Customer insights
- Export functionality

### Transactions (Coming Soon)

- Transaction history with pagination
- Filter by date range, status
- Search by invoice ID
- Transaction details

## 🔌 API Integration

The frontend expects a backend API with the following endpoints:

### Public Endpoints

- `GET /api/admin/invitation/{token}` - Get invitation details
- `POST /api/admin/complete-shop-setup` - Complete shop setup

### Authenticated Endpoints (require Bearer token)

- `GET /api/shop-admin/shop` - Get shop details
- `PUT /api/shop-admin/shop` - Update shop details
- `GET /api/shop-admin/analytics` - Get shop analytics
- `GET /api/shop-admin/transactions` - Get transactions
- `GET /api/shop-admin/coupons` - Get coupons
- `POST /api/shop-admin/coupons` - Create coupon
- `PUT /api/shop-admin/coupons/{id}` - Update coupon
- `DELETE /api/shop-admin/coupons/{id}` - Delete coupon

All authenticated endpoints require `Authorization: Bearer <supabase_jwt_token>` header.

## 🎨 UI/UX Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Loading States**: Skeleton loaders and spinners
- **Error Handling**: Toast notifications and error boundaries
- **Form Validation**: Real-time validation with clear error messages
- **Optimistic Updates**: Immediate UI feedback
- **Professional Design**: Modern, clean interface

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Manual Deployment

```bash
npm run build
npm run start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:

- Create an issue in the GitHub repository
- Check the documentation in `/docs` folder
- Review the API integration guide

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
