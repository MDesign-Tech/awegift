// Role-based access control types and utilities

export type UserRole = "user" | "admin";

export interface RolePermissions {
  // Dashboard access
  canViewOverview: boolean;

  // Order management
  canViewOrders: boolean;
  canCreateOrders: boolean;
  canUpdateOrders: boolean;
  canDeleteOrders: boolean;
  canChangeOrderStatus: boolean;

  // Product management
  canViewProducts: boolean;
  canCreateProducts: boolean;
  canUpdateProducts: boolean;
  canDeleteProducts: boolean;

  // User management
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canUpdateUsers: boolean;
  canDeleteUsers: boolean;
  canChangeUserRoles: boolean;

  // Quote management
  canViewQuotes: boolean;
  canManageQuotes: boolean;

  // Inventory
  canManageInventory: boolean;

  // System settings
  canViewAnalytics: boolean;
  canManageSettings: boolean;

  // Payments
  canProcessPayments: boolean;

  // Reports
  canGenerateReports: boolean;

  // Transactions
  canViewTransactions: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewOverview: true,

    canViewOrders: true,
    canCreateOrders: true,
    canUpdateOrders: true,
    canDeleteOrders: true,
    canChangeOrderStatus: true,

    canViewProducts: true,
    canCreateProducts: true,
    canUpdateProducts: true,
    canDeleteProducts: true,

    canViewUsers: true,
    canCreateUsers: true,
    canUpdateUsers: true,
    canDeleteUsers: true,
    canChangeUserRoles: true,

    canViewQuotes: true,
    canManageQuotes: true,

    canManageInventory: true,

    canViewAnalytics: true,
    canManageSettings: true,

    canProcessPayments: true,

    canGenerateReports: true,
    canViewTransactions: true,
  },

  user: {
    canViewOverview: false,

    canViewOrders: true,
    canCreateOrders: true,
    canUpdateOrders: false,
    canDeleteOrders: false,
    canChangeOrderStatus: false,

    canViewProducts: true,
    canCreateProducts: false,
    canUpdateProducts: false,
    canDeleteProducts: false,

    canViewUsers: false,
    canCreateUsers: false,
    canUpdateUsers: true, // user edits own profile
    canDeleteUsers: false,
    canChangeUserRoles: false,

    canViewQuotes: true,
    canManageQuotes: false,

    canManageInventory: false,

    canViewAnalytics: false,
    canManageSettings: false,

    canProcessPayments: false,

    canGenerateReports: false,
    canViewTransactions: false,
  },
};

// ------------------------ Utility Functions ------------------------

export function hasPermission(
  userRole: UserRole,
  permission: keyof RolePermissions
): boolean {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) return false;
  return ROLE_PERMISSIONS[userRole][permission];
}

export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: "Admin",
    user: "Customer",
  };
  return displayNames[role];
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: "bg-red-100 text-red-800",
    user: "bg-gray-100 text-gray-800",
  };
  return colors[role];
}

export function getRoleDescription(role: UserRole): string {
  const descriptions: Record<UserRole, string> = {
    admin: "Full system access and management",
    user: "Basic customer account",
  };
  return descriptions[role];
}

export function getDefaultDashboardRoute(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard";
    case "user":
    default:
      return "/account";
  }
}
