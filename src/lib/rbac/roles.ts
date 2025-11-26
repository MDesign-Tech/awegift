// Role-based access control types and utilities

export type UserRole =
  | "user"
  | "admin"
  | "deliveryman"
  | "packer"
  | "accountant";

export interface RolePermissions {
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
  canChangeUserRoles: boolean; // can change roles, not dashboard access

  // Specific actions
  canManageInventory: boolean;
  canViewAnalytics: boolean;
  canManageSettings: boolean;
  canProcessPayments: boolean;
  canManageShipping: boolean;
  canViewFinancials: boolean;
  canManageAccounts: boolean;
  canGenerateReports: boolean;
  canViewTransactions: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
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
    canManageInventory: true,
    canViewAnalytics: true,
    canManageSettings: true,
    canProcessPayments: true,
    canManageShipping: true,
    canViewFinancials: true,
    canManageAccounts: true,
    canGenerateReports: true,
    canViewTransactions: true,
  },
  deliveryman: {
    canViewOrders: true,
    canCreateOrders: false,
    canUpdateOrders: true,
    canDeleteOrders: false,
    canChangeOrderStatus: true,
    canViewProducts: true,
    canCreateProducts: false,
    canUpdateProducts: false,
    canDeleteProducts: false,
    canViewUsers: false,
    canCreateUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    canChangeUserRoles: false,
    canManageInventory: false,
    canViewAnalytics: false,
    canManageSettings: false,
    canProcessPayments: false,
    canManageShipping: true,
    canViewFinancials: false,
    canManageAccounts: false,
    canGenerateReports: false,
    canViewTransactions: false,
  },
  packer: {
    canViewOrders: true,
    canCreateOrders: false,
    canUpdateOrders: true,
    canDeleteOrders: false,
    canChangeOrderStatus: true,
    canViewProducts: true,
    canCreateProducts: false,
    canUpdateProducts: false,
    canDeleteProducts: false,
    canViewUsers: false,
    canCreateUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    canChangeUserRoles: false,
    canManageInventory: true,
    canViewAnalytics: false,
    canManageSettings: false,
    canProcessPayments: false,
    canManageShipping: false,
    canViewFinancials: false,
    canManageAccounts: false,
    canGenerateReports: false,
    canViewTransactions: false,
  },
  user: {
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
    canUpdateUsers: true, // Can update own profile
    canDeleteUsers: false,
    canChangeUserRoles: false,
    canManageInventory: false,
    canViewAnalytics: false,
    canManageSettings: false,
    canProcessPayments: false,
    canManageShipping: false,
    canViewFinancials: false,
    canManageAccounts: false,
    canGenerateReports: false,
    canViewTransactions: false,
  },
  accountant: {
    canViewOrders: true,
    canCreateOrders: false,
    canUpdateOrders: false,
    canDeleteOrders: false,
    canChangeOrderStatus: false,
    canViewProducts: true,
    canCreateProducts: false,
    canUpdateProducts: false,
    canDeleteProducts: false,
    canViewUsers: true,
    canCreateUsers: false,
    canUpdateUsers: false,
    canDeleteUsers: false,
    canChangeUserRoles: false,
    canManageInventory: false,
    canViewAnalytics: true,
    canManageSettings: false,
    canProcessPayments: true,
    canManageShipping: false,
    canViewFinancials: true,
    canManageAccounts: true,
    canGenerateReports: true,
    canViewTransactions: true,
  },
};


// Utility functions

// Check if a role has a specific permission
export function hasPermission(
  userRole: UserRole,
  permission: keyof RolePermissions
): boolean {
  if (!userRole || !ROLE_PERMISSIONS[userRole]) return false;
  return ROLE_PERMISSIONS[userRole][permission];
}

// Get a friendly display name for a role
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: "Administrator",
    deliveryman: "Delivery Person",
    packer: "Packer",
    user: "Customer",
    accountant: "Accountant",
  };

  return displayNames[role];
}

// Get a badge color for a role (for UI)
export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    admin: "bg-red-100 text-red-800",
    deliveryman: "bg-blue-100 text-blue-800",
    packer: "bg-green-100 text-green-800",
    user: "bg-gray-100 text-gray-800",
    accountant: "bg-purple-100 text-purple-800",
  };

  return colors[role];
}

// Get default route for a role (redirect after login)
export function getDefaultDashboardRoute(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/dashboard/admin";
    case "deliveryman":
      return "/dashboard/delivery";
    case "packer":
      return "/dashboard/packer";
    case "accountant":
      return "/dashboard/accountant";
    case "user":
    default:
      return "/account"; // users go to /account
  }
}
