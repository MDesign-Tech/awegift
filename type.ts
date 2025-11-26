import { UserRole } from "@/lib/rbac/roles";
import { OrderStatus, PaymentStatus, PaymentMethod } from "@/lib/orderStatus";

export type Review = {
  reviewerName: string;
  rating: number;
  comment: string;
  reviewerEmail: string;
};

export interface ProductType {
  id: string;
  title: string;
  description: string;
  brand: string;
  sku: string,
  category: string;
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
  warrantyInformation: string;
  shippingInformation: string;
  quantity?: number;
  meta: {
    createdAt: string;
    updatedAt: string;
    barcode: string;
    qrCode: string;
  };
}

export interface StateType {
  shopy: {
    cart: ProductType[];
    favorite: ProductType[];
    userInfo: any;
  };
}

export interface Address {
  id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault?: boolean;
}

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
    addresses: Address[];
  };
  preferences: {
    newsletter: boolean;
    notifications: boolean;
  };
  cart: ProductType[];
  wishlist: ProductType[];
}

export interface OrderData {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  trackingNumber?: string;
  assignedDeliveryman?: string;
  assignedPacker?: string;
  statusHistory: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  packedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
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