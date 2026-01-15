import { UserRole } from "@/lib/rbac/roles";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@/lib/orderStatus";
export type Review = {
  reviewerName: string;
  rating: number;
  comment: string;
  reviewerEmail: string;
};

// ---------------------- PRODUCT -----------------------

export interface ProductType {
  id: string;
  title: string;
  description: string;
  brand: string;
  sku: string;
  categories: string[];
  price: number;
  stock: number;
  minimumOrderQuantity: number;
  discount: number;
  currency: string;
  isActive: boolean;
  isFeatured: boolean;
  weight: number;
  dimensions: {
    width: number;
    height: number;
  };
  images: string[];
  thumbnail: string;
  tags: string[];
  colors: string[];
  returnPolicy: string;
  reviews: Review[];
  rating: number;
  warrantyInformation: string;

  quantity?: number;

  meta: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
}

// ---------------------- STATE -----------------------

export interface StateType {
  aweGift: {
    cart: ProductType[];
    favorite: ProductType[];
    userInfo: any;
  };
}

// ---------------------- ADDRESS / LOCATION -----------------------

export interface Address {
  id?: string;
  address: string; // Local address / meeting point
  isDefault?: boolean;
}

// ---------------------- USER -----------------------

export interface LoginSession {
  id: string;
  ip: string;
  userAgent: string;
  device: string;
  browser: string;
  timestamp: string;
  location?: string;
  revoked?: boolean;
  revokedAt?: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;

  emailVerified: boolean;
  provider?: string;

  passwordResetToken?: string;
  passwordResetExpires?: string;

  lastLogin?: string;
  loginAttempts?: number;
  lockUntil?: string;

  // 2FA fields
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;

  // Login sessions
  loginSessions: LoginSession[];

  profile: {
    firstName: string;
    lastName: string;
    phone: string;
    addresses: Address[]; // Local addresses
  };

  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };

  cart: ProductType[];
  wishlist: ProductType[];
  createdAt: string;
  updatedAt: string;
}

// Email verification record for dual verification (OTP + Token)
export interface EmailVerification {
  id: string;
  userId: string;
  email: string;
  otp: string; // Hashed OTP
  token: string;
  expiresAt: Date;
  attempts: number; // For rate limiting
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------- ORDER -----------------------

export interface OrderData {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  status: OrderStatus;

  items: OrderItem[];
  totalAmount: number;

  orderAddress: Address;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentScreenshot?: string;

  statusHistory: OrderStatusHistory[];

  createdAt: string;
  updatedAt: string;

  confirmedAt?: string;
  readyAt?: string;
  completedAt?: string;

  notes?: string;

  // Pricing breakdown
  deliveryFee?: number;
  discount?: number;
}


export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  thumbnail: string;
  sku: string;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  changedBy: string;
  changedByRole: UserRole;
  timestamp: string;
  notes?: string;
}


// ---------------------- CATEGORY -----------------------

export interface CategoryType {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isFeatured?: boolean;
  meta?: {
    createdAt: string;
    updatedAt: string;
  };
}

// ---------------------- QUOTATION PRODUCT -----------------------
export interface QuotationProductType {
  productId: string | null;     // If not found, treat as custom product
  name: string;
  quantity: number;
  unitPrice?: number;           // Optional until admin sets price
  totalPrice?: number;
  notes?: string;               // Admin notes for the product
}

// ---------------------- MESSAGE THREAD (NEGOTIATION CHAT) ---- REMOVED - Negotiation via WhatsApp only

// ---------------------- MAIN QUOTATION TYPE -----------------------
export interface QuotationType {
  id: string;
  userId: string;
  email: string;
  phone?: string | null;

  products: QuotationProductType[];

  subtotal: number;                 // products total before discounts
  discount?: number;                // admin can add discount if giving offer
  deliveryFee?: number;             // local delivery only (not shipping)
  finalAmount: number;              // subtotal - discount + delivery

  status:
   | "pending"                     // user requested, waiting for admin
   | "responded"                   // admin sent price
   | "waiting_customer"            // admin asked user more info
   | "accepted"                    // user accepted price
   | "rejected"                    // user or admin rejected
   | "expired";                    // price expired
  userNotes?: string;               // user extra info
  adminNote?: string;               // admin-only notes (private)

  deliveryAddress?: string;        // local place (Kigali, Gisozi, Remera...)

  expirationDate: string;
  validUntil: string;

  notified: boolean;                // email/notification sent?
  viewed: boolean;                  // did user open quote?

  attachments?: string[];           // user uploads: design, pictures

  createdAt: string;
  updatedAt: string;
}


// Email types and interfaces for Awegift email system

export type EmailType =
  // Customer order lifecycle
  | "ORDER_CREATED" // when user places order
  | "ORDER_CONFIRMED" // when admin confirms order
  | "ORDER_PAID" // payment confirmed 
  | "ORDER_READY" // when admin marks order ready
  | "ORDER_COMPLETED" // when user confirms receipt or admin marks completed
  | "ORDER_CANCELLED" // when order is cancelled
  | "ORDER_FAILED" // payment failed
  | "ORDER_REFUNDED" // when refund is processed

  // Quotation flow
  | "QUOTATION_RECEIVED" // when admin receives a quotation request
  | "QUOTATION_SENT" // when admin sends a quotation response
  | "QUOTATION_ACCEPTED" // when user accepts the quotation
  | "QUOTATION_REJECTED" // when user or admin rejects the quotation

  // Account & security
  | "WELCOME" // upon account creation
  | "EMAIL_VERIFICATION" // upon signup
  | "PASSWORD_RESET" // for forgotten passwords
  | "SECURITY_ALERT" // notify user of security issues when new device/login detected

  // product updates
  | "NEW_PRODUCT_LAUNCH" // new product available to customers

  // Admin alerts
  | "ADMIN_NEW_USER" // notify admin of new user registrations
  | "ADMIN_NEW_ORDER" // notify admin of new order
  | "ADMIN_NEW_QUOTATION" // notify admin of new quotation request

export interface EmailPayload {
  type: EmailType;
  to: string;
  name?: string;
  order?: OrderEmailData;
  quotation?: QuotationEmailData;
  productLaunchInfo?: ProductLounchEmailData;
  orderStatus?: string;
  verificationUrl?: string;
  resetUrl?: string;
  otp?: string;
}

export interface EmailData {
  type: EmailType;
  to: string;
  name?: string;
  order?: OrderEmailData;
  quotation?: QuotationEmailData;
  productLaunchInfo?: ProductLounchEmailData;
  orderStatus?: string;
}


export interface OrderEmailData {
  orderId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  subtotal: number;
  deliveryFee: number;
  currency: string;
  deliveryAddress?: string;
  estimatedDelivery?: string;
}

export interface QuotationEmailData {
  quotationId: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  subtotal: number;
  currency: string;
  validityPeriod?: string;
  contactInfo?: string;
}

export interface ProductLounchEmailData {
  productName: string;
  description: string;
  price: number;
  currency: string;
  image: string;
  detailsUrl: string;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}


export type NotificationScope = 'personal' | 'admin';

export type NotificationType =
  // Customer order lifecycle
  | "ORDER_CREATED" // when user places order
  | "ORDER_CONFIRMED" // when admin confirms order
  | "ORDER_PAID" // payment confirmed 
  | "ORDER_READY" // when admin marks order ready
  | "ORDER_COMPLETED" // when user confirms receipt or admin marks completed
  | "ORDER_CANCELLED" // when order is cancelled
  | "ORDER_FAILED" // payment failed
  | "ORDER_REFUNDED" // when refund is processed

  // Quotation flow
  | "QUOTATION_RECEIVED" // when admin receives a quotation request
  | "QUOTATION_SENT" // when admin sends a quotation response
  | "QUOTATION_ACCEPTED" // when user accepts the quotation
  | "QUOTATION_REJECTED" // when user or admin rejects the quotation

  // Account & security
  | "EMAIL_VERIFICATION" // upon signup
  | "PASSWORD_RESET" // for forgotten passwords
  | "ACCOUNT_UPDATED" // profile changes
  | "SECURITY_ALERT" // notify user of security issues when new device/login detected

  // product updates
  | "NEW_PRODUCT_LAUNCH" // new product available to customers

  // Admin alerts
  | "ADMIN_NEW_USER" // notify admin of new user registrations
  | "ADMIN_NEW_ORDER" // notify admin of new order
  | "ADMIN_PAYMENT_FAILED" // notify admin of payment issues
  | "ADMIN_LOW_STOCK" // notify admin of low stock products
  | "ADMIN_NEW_QUOTATION" // notify admin of new quotation request
  | "ADMIN_ORDER_CANCELLED"; // notify admin of cancelled orders

export interface NotificationData {
  id?: string;
  recipientId: string;
  recipientRole: UserRole;
  scope: NotificationScope;
  type: NotificationType;
  title: string;
  message: string;
  url: string;
  isRead: boolean;
  createdAt: string;
  data?: any;
}


export interface CreateNotificationPayload {
  recipientId: string;
  recipientRole: UserRole;
  scope: NotificationScope;
  type: NotificationType;
  title: string;
  message: string;
  url: string;
  data?: any;
}


export interface NotificationResponse {
  success: boolean;
  notificationId?: string;
  emailResult?: {
    success: boolean;
    messageId?: string;
    error?: string;
  };
  error?: string;
}

export interface ServiceType {
  id: string;
  title: string;
  description: string;
  image: string;
  icon?: string;
}

