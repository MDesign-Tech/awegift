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
  availabilityStatus: string;
  discountPercentage: number;
  weight: number;
  dimensions: {
    width: number;
    height: number;
    depth: number;
  };
  images: string[];
  thumbnail: string;
  tags: string[];
  returnPolicy: string;
  reviews: Review[];
  rating: number;
  warrantyInformation: string;

  // Removed shippingInformation
  // Local trading doesn't use shipping

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

export interface UserData {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  provider?: string;

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

  // Removed shippingAddress → renamed to local trade location
  orderAddress: Address;

  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentScreenshot?: string; // Screenshot of payment for MTN/Airtel verification

  statusHistory: OrderStatusHistory[];

  createdAt: string;
  updatedAt: string;

  // Local trading workflow
  confirmedAt?: string; // When seller confirmed the order
  readyAt?: string; // When order is ready for delivery
  completedAt?: string; // When buyer receives goods

  notes?: string;
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
  meta?: {
    createdAt: string;
    updatedAt: string;
  };
}

// ---------------------- NOTIFICATION -----------------------

export interface NotificationType {
  id: string;
  userId?: string;
  title: string;
  message: string;

  // Local trading notification types
  type:
    | "order"
    | "payment"
    | "quote"
    | "system"
    | "promotion";

  read: boolean;
  createdAt: Date;
  updatedAt?: Date;
  readAt?: Date | null;
}

// ---------------------- QUOTE -----------------------

export interface QuoteType {
  id: string;
  userId: string;

  products: {
    name: string;
    quantity: number;
  }[];

  message: string;

  status: "pending" | "rejected" | "responded";

  adminResponse: string | null;

  notified: boolean;

  email: string | null;
  phone?: string;

  createdAt: Date;
  updatedAt: Date;
}

