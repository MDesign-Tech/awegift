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
- **Payment Options**: PawaPay MTN MoMo and Airtel Money deposits
- **Order Tracking**: Real-time order status updates
- **Receipts**: Download order receipts and invoices

### PawaPay Mobile Money

Checkout initiates Merchant API v2 deposits directly for MTN MoMo
(`MTN_MOMO_RWA`) or Airtel Money (`AIRTEL_RWA`). Provider availability is read
from PawaPay's active configuration; the server verifies the order total,
owner, RWF amount, and active provider, and validates the Rwanda mobile number
through PawaPay's `/v2/predict-provider` endpoint before creating a pending
Firestore payment. Only a verified `COMPLETED` deposit marks the order paid.
Payment records are stored in `pawapayPayments`.

Configure these server-only variables in `.env.local` and the Hostinger Node.js
application environment. Do not use any `NEXT_PUBLIC_` prefix for PawaPay
variables and never expose or commit the API token:

```env
PAWAPAY_ENV=sandbox
PAWAPAY_BASE_URL=https://api.sandbox.pawapay.io
PAWAPAY_API_TOKEN=
PAWAPAY_CALLBACK_URL=https://aweegift.com/api/payments/pawapay/callback
PAWAPAY_RECONCILIATION_SECRET=
```

- `PAWAPAY_ENV`: `sandbox` by default; set to `production` only after PawaPay
  production onboarding.
- `PAWAPAY_BASE_URL`: must match the selected environment:
  `https://api.sandbox.pawapay.io` or `https://api.pawapay.io`.
- `PAWAPAY_API_TOKEN`: server-side bearer token from the corresponding
  dashboard. Sandbox and production tokens are distinct.
- `PAWAPAY_CALLBACK_URL`: public HTTPS callback URL entered in the PawaPay
  dashboard. The application does not send this in the deposit payload.
- `PAWAPAY_RECONCILIATION_SECRET`: a long random secret used by the scheduled
  reconciliation endpoint; keep it private.

Generate tokens in the matching PawaPay dashboard:

- Sandbox: https://dashboard.sandbox.pawapay.io/
- Production: https://dashboard.pawapay.io/

In the PawaPay dashboard, set the callback URL to
`https://aweegift.com/api/payments/pawapay/callback` and enable **signed
callbacks**. The callback verifies RFC 9421 signatures against PawaPay's
`/v2/public-key/http` endpoint, then independently checks transaction status
with PawaPay before updating Firestore. This endpoint also continues to handle
existing hosted-checkout and refund callbacks. The customer return/result page
is not a payment confirmation signal.

### Postman checks

Use the local or deployed application as `baseUrl`, and authenticate in the
browser first so Postman can send the same NextAuth session cookie. Create an
unpaid order through the normal checkout flow and save its ID as `orderId`.

1. `GET {{baseUrl}}/api/payments/pawapay/providers`
2. `POST {{baseUrl}}/api/payments/pawapay/initiate` with JSON:
   `{"orderId":"{{orderId}}","provider":"MTN_MOMO_RWA","phoneNumber":"0781234567"}`
   (use `AIRTEL_RWA` to test Airtel). Save `depositId` from the response.
3. `GET {{baseUrl}}/api/payments/pawapay/status/{{depositId}}` to verify the
   server-reconciled status. Do not modify Firestore or treat a browser response
   as proof of payment.
4. Repeat the identical initiation request to test idempotency; it should
   return the same pending deposit ID rather than create another one.
5. To test callbacks, use the PawaPay sandbox dashboard and its configured
   signed callback delivery. An unsigned Postman callback is intentionally
   rejected. Repeated/delayed callbacks are safe to redeliver; status polling
   and reconciliation recover if the callback is delayed or a request times
   out.

For sandbox success/failure scenarios, use the Rwanda MSISDNs currently listed
in PawaPay's [sandbox test-number documentation](https://docs.pawapay.io/v2/docs/test_numbers.md)
with both provider IDs. Test a successful MTN deposit, successful Airtel
deposit, provider-declined payment, a cancellation outcome using the relevant
documented failure MSISDN, duplicate initiation, delayed and repeated callback
delivery, and a client-side timeout followed by status polling. PawaPay sandbox
does not display the live PIN authorization prompt; a real customer cancellation
of that prompt can only be exercised with a controlled live transaction after
production approval.

### Pending-payment reconciliation

The customer result page polls the authenticated status route while a payment
is pending. Configure a Hostinger scheduled task to POST
`/api/payments/pawapay/reconcile` every few minutes with
`Authorization: Bearer <PAWAPAY_RECONCILIATION_SECRET>`. The endpoint checks a
bounded batch of pending deposits against PawaPay and never relies on callback
or browser status alone.

### Hostinger deployment

Use a Node.js 20.9+ application. Set all variables above in Hostinger's
application environment, use the production callback URL and production PawaPay
token only after onboarding, deploy the Next.js application, then configure
the callback URL and signed callbacks in the production dashboard. Set the
scheduled reconciliation task after deployment and verify its endpoint with
the secret kept out of logs and source control. No Firestore collection
migration is required; server code creates documents in `pawapayPayments`.

Run the mocked integration checks with `npm test` and verify types with
`npm run type-check`.

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
- **PawaPay** - Hosted mobile-money checkout
- **Cloudinary** - Image hosting and optimization
- **NextAuth.js** - Authentication provider

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Next Sitemap** - SEO sitemap generation

## 🚀 Getting Started

### Prerequisites
- Node.js 20.9+
- npm or yarn
- Firebase project
- PawaPay account (for payments)

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

   # PawaPay Configuration (server-side only)
   PAWAPAY_ENV=sandbox
   PAWAPAY_API_TOKEN=your_pawapay_api_token

   # Cloudinary Configuration
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret

   # Site Configuration
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000

   # Firebase Admin Configuration (required by categories/products API routes)
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
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

### Hostinger
Configure the same Firebase Admin credentials used by Vercel in Hostinger's
environment variables. Set `NEXT_PUBLIC_API_BASE_URL` to the Hostinger site's
canonical HTTPS origin (for example, `https://your-domain.com`), not the Vercel
URL. This setting is used by server-rendered pages to call this deployment's API.

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