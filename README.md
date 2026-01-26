# 🎁 AweGift - Premium Gifts E-commerce Platform

A modern, full-featured e-commerce platform built with Next.js 15 and Firebase, specializing in personalized gifts, luxury presents, and custom items.

## ✨ Features

### 🛍️ Shopping Experience
- **Product Catalog**: Browse gifts by categories (personalized, luxury, birthday, anniversary, etc.)
- **Advanced Search & Filters**: Find gifts by price, brand, category, and more
- **Product Details**: High-quality images, descriptions, reviews, and specifications
- **Shopping Cart**: Add, remove, and manage cart items
- **Wishlist**: Save favorite items for later

### 👤 User Management
- **Authentication**: Secure login/signup with NextAuth.js
- **User Profiles**: Manage addresses, payment methods, and preferences
- **Order History**: Track past orders and reorder easily
- **Account Settings**: Update profile, change password, enable 2FA

### 🛒 Checkout & Payments
- **Secure Checkout**: Multi-step checkout process
- **Payment Options**: Stripe integration, mobile money (MTN/Airtel), bank transfers
- **Order Tracking**: Real-time order status updates
- **Receipts**: Download order receipts and invoices

### 📊 Admin Dashboard
- **Product Management**: Add, edit, delete products and categories
- **Order Management**: Process orders, update status, handle returns
- **User Management**: View and manage customer accounts
- **Analytics**: Sales reports, customer insights, performance metrics
- **Quote System**: Handle custom quote requests

### 🔍 SEO & Performance
- **Server-Side Rendering**: Optimized for search engines
- **Meta Tags**: Complete Open Graph and Twitter Card support
- **Sitemap**: Automatic sitemap generation
- **Robots.txt**: Proper search engine crawling rules
- **Image Optimization**: Next.js Image component for fast loading

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **React Icons** - Beautiful icon library

### Backend & Database
- **Firebase** - Backend-as-a-Service
  - Firestore (Database)
  - Firebase Auth (Authentication)
  - Firebase Hosting (Deployment)
  - Cloud Storage (File uploads)

### Payments & Integrations
- **Stripe** - Credit card payments
- **Cloudinary** - Image hosting and optimization
- **NextAuth.js** - Authentication provider

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Next Sitemap** - SEO sitemap generation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Firebase project
- Stripe account (for payments)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd awegift
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create `.env.local` file with:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

   # NextAuth Configuration
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000

   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   STRIPE_SECRET_KEY=your_stripe_secret_key

   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Site Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Firebase Setup**
   - Create a Firebase project
   - Enable Firestore, Authentication, and Storage
   - Configure authentication providers (Google, email/password)
   - Set up Firestore security rules

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Build for production**
   ```bash
   npm run build
   npm start
   ```

## 📁 Project Structure

```
awegift/
├── public/                 # Static assets
│   ├── images/            # Product images
│   └── favicon.ico
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (public)/      # Public pages
│   │   ├── (user)/        # User pages
│   │   ├── api/           # API routes
│   │   └── layout.tsx     # Root layout
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── pages/        # Page-specific components
│   │   └── auth/         # Authentication components
│   ├── lib/              # Utility libraries
│   │   ├── seo.ts        # SEO metadata generator
│   │   └── firebase.ts   # Firebase configuration
│   └── types/            # TypeScript type definitions
├── package.json
├── next.config.mjs
├── tailwind.config.js
└── README.md
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run sitemap` - Generate sitemap

## 🌐 Deployment

### Firebase Hosting
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init`
4. Deploy: `firebase deploy`

### Vercel (Recommended)
1. Connect GitHub repository to Vercel
2. Add environment variables
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m 'Add some feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@awegift.com or join our Discord community.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Firebase for the robust backend services
- Tailwind CSS for the utility-first approach
- All contributors and open-source projects used

---

Made with ❤️ for gift lovers worldwide