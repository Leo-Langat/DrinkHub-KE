export enum BusinessType {
  RESTAURANT = 'RESTAURANT',
  CLUB = 'CLUB',
  BAR = 'BAR',
  LOUNGE = 'LOUNGE',
  CAFE = 'CAFE',
  FAST_FOOD = 'FAST_FOOD',
  HOTEL = 'HOTEL',
  FOOD_COURT = 'FOOD_COURT',
  OTHER = 'OTHER',
}

export enum BusinessStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WAITER = 'WAITER',
  CUSTOMER = 'CUSTOMER',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  CLAIMED = 'CLAIMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  MPESA_STK = 'MPESA_STK',
  CASH = 'CASH',
  CARD = 'CARD',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
}

export enum OfferType {
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
  FIXED_AMOUNT_DISCOUNT = 'FIXED_AMOUNT_DISCOUNT',
  BUY_ONE_GET_ONE = 'BUY_ONE_GET_ONE',
}

export enum NotificationType {
  NEW_ORDER = 'NEW_ORDER',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  ORDER_CLAIMED = 'ORDER_CLAIMED',
  ORDER_READY = 'ORDER_READY',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  OFFER_PUBLISHED = 'OFFER_PUBLISHED',
  WAITER_CALL = 'WAITER_CALL',
  SYSTEM_ALERT = 'SYSTEM_ALERT',
}

export enum Permission {
  // Platform Management (SUPER_ADMIN)
  MANAGE_PLATFORM = 'MANAGE_PLATFORM',
  MANAGE_BUSINESSES = 'MANAGE_BUSINESSES',
  VIEW_ALL_BUSINESSES = 'VIEW_ALL_BUSINESSES',
  CREATE_ADMIN = 'CREATE_ADMIN',
  MANAGE_ADMINS = 'MANAGE_ADMINS',
  VIEW_PLATFORM_REPORTS = 'VIEW_PLATFORM_REPORTS',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  MANAGE_PLATFORM_SETTINGS = 'MANAGE_PLATFORM_SETTINGS',

  // Business Administration (ADMIN)
  VIEW_BUSINESS = 'VIEW_BUSINESS',
  MANAGE_BUSINESS_SETTINGS = 'MANAGE_BUSINESS_SETTINGS',
  CREATE_MANAGER = 'CREATE_MANAGER',
  MANAGE_MANAGERS = 'MANAGE_MANAGERS',
  VIEW_ALL_BUSINESS_ORDERS = 'VIEW_ALL_BUSINESS_ORDERS',
  VIEW_BUSINESS_REPORTS = 'VIEW_BUSINESS_REPORTS',
  VIEW_FINANCIAL_REPORTS = 'VIEW_FINANCIAL_REPORTS',
  VIEW_STAFF_PERFORMANCE = 'VIEW_STAFF_PERFORMANCE',
  VIEW_BUSINESS_PAYMENTS = 'VIEW_BUSINESS_PAYMENTS',

  // Operational Management (MANAGER)
  CREATE_WAITER = 'CREATE_WAITER',
  MANAGE_WAITERS = 'MANAGE_WAITERS',
  MANAGE_MENU = 'MANAGE_MENU',
  MANAGE_CATEGORIES = 'MANAGE_CATEGORIES',
  MANAGE_PRODUCTS = 'MANAGE_PRODUCTS',
  MANAGE_TABLES = 'MANAGE_TABLES',
  MANAGE_QR_CODES = 'MANAGE_QR_CODES',
  MANAGE_ORDERS = 'MANAGE_ORDERS',
  VIEW_OPERATIONAL_REPORTS = 'VIEW_OPERATIONAL_REPORTS',

  // Floor Operations (WAITER)
  VIEW_AVAILABLE_ORDERS = 'VIEW_AVAILABLE_ORDERS',
  CLAIM_ORDERS = 'CLAIM_ORDERS',
  VIEW_ASSIGNED_ORDERS = 'VIEW_ASSIGNED_ORDERS',
  UPDATE_ASSIGNED_ORDER_STATUS = 'UPDATE_ASSIGNED_ORDER_STATUS',
  PROCESS_ALLOWED_PAYMENTS = 'PROCESS_ALLOWED_PAYMENTS',
  RESPOND_TO_CUSTOMER_REQUESTS = 'RESPOND_TO_CUSTOMER_REQUESTS',
  CREATE_DIRECT_ORDERS = 'CREATE_DIRECT_ORDERS',

  // Customer Actions (CUSTOMER)
  VIEW_BUSINESS_MENU = 'VIEW_BUSINESS_MENU',
  PLACE_ORDER = 'PLACE_ORDER',
  VIEW_OWN_ORDER = 'VIEW_OWN_ORDER',
  TRACK_OWN_ORDER = 'TRACK_OWN_ORDER',
  CALL_WAITER = 'CALL_WAITER',
  REQUEST_ASSISTANCE = 'REQUEST_ASSISTANCE',
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    Permission.MANAGE_PLATFORM,
    Permission.MANAGE_BUSINESSES,
    Permission.VIEW_ALL_BUSINESSES,
    Permission.CREATE_ADMIN,
    Permission.MANAGE_ADMINS,
    Permission.VIEW_PLATFORM_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_PLATFORM_SETTINGS,
    Permission.VIEW_BUSINESS,
    Permission.VIEW_ALL_BUSINESS_ORDERS,
    Permission.VIEW_BUSINESS_REPORTS,
    Permission.VIEW_FINANCIAL_REPORTS,
  ],
  [UserRole.ADMIN]: [
    Permission.VIEW_BUSINESS,
    Permission.MANAGE_BUSINESS_SETTINGS,
    Permission.CREATE_MANAGER,
    Permission.MANAGE_MANAGERS,
    Permission.VIEW_ALL_BUSINESS_ORDERS,
    Permission.VIEW_BUSINESS_REPORTS,
    Permission.VIEW_FINANCIAL_REPORTS,
    Permission.VIEW_STAFF_PERFORMANCE,
    Permission.VIEW_BUSINESS_PAYMENTS,
    Permission.CREATE_WAITER,
    Permission.MANAGE_WAITERS,
    Permission.MANAGE_MENU,
    Permission.MANAGE_CATEGORIES,
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_TABLES,
    Permission.MANAGE_QR_CODES,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_OPERATIONAL_REPORTS,
    Permission.VIEW_AUDIT_LOGS,
  ],
  [UserRole.MANAGER]: [
    Permission.VIEW_BUSINESS,
    Permission.CREATE_WAITER,
    Permission.MANAGE_WAITERS,
    Permission.MANAGE_MENU,
    Permission.MANAGE_CATEGORIES,
    Permission.MANAGE_PRODUCTS,
    Permission.MANAGE_TABLES,
    Permission.MANAGE_QR_CODES,
    Permission.VIEW_ALL_BUSINESS_ORDERS,
    Permission.MANAGE_ORDERS,
    Permission.VIEW_OPERATIONAL_REPORTS,
    Permission.PROCESS_ALLOWED_PAYMENTS,
    Permission.RESPOND_TO_CUSTOMER_REQUESTS,
  ],
  [UserRole.WAITER]: [
    Permission.VIEW_AVAILABLE_ORDERS,
    Permission.CLAIM_ORDERS,
    Permission.VIEW_ASSIGNED_ORDERS,
    Permission.UPDATE_ASSIGNED_ORDER_STATUS,
    Permission.PROCESS_ALLOWED_PAYMENTS,
    Permission.RESPOND_TO_CUSTOMER_REQUESTS,
    Permission.CREATE_DIRECT_ORDERS,
  ],
  [UserRole.CUSTOMER]: [
    Permission.VIEW_BUSINESS_MENU,
    Permission.PLACE_ORDER,
    Permission.VIEW_OWN_ORDER,
    Permission.TRACK_OWN_ORDER,
    Permission.CALL_WAITER,
    Permission.REQUEST_ASSISTANCE,
  ],
};

export const isValidRole = (role: unknown): role is UserRole => {
  if (typeof role !== 'string') return false;
  const normalized = role.trim().toUpperCase();
  return (
    normalized === UserRole.SUPER_ADMIN ||
    normalized === 'PLATFORM_ADMIN' ||
    normalized === UserRole.ADMIN ||
    normalized === 'CLUB_ADMIN' ||
    normalized === 'TENANT_ADMIN' ||
    normalized === UserRole.MANAGER ||
    normalized === UserRole.WAITER ||
    normalized === UserRole.CUSTOMER
  );
};

export const normalizeRole = (role: string): UserRole => {
  if (!role || typeof role !== 'string') {
    throw new Error(`Invalid role: Expected a valid role string, but received '${role}'`);
  }
  const normalized = role.trim().toUpperCase();
  if (normalized === UserRole.SUPER_ADMIN || normalized === 'PLATFORM_ADMIN') return UserRole.SUPER_ADMIN;
  if (normalized === UserRole.ADMIN || normalized === 'CLUB_ADMIN' || normalized === 'TENANT_ADMIN') return UserRole.ADMIN;
  if (normalized === UserRole.MANAGER) return UserRole.MANAGER;
  if (normalized === UserRole.WAITER) return UserRole.WAITER;
  if (normalized === UserRole.CUSTOMER) return UserRole.CUSTOMER;

  throw new Error(
    `Invalid role '${role}'. Valid roles are: ${UserRole.SUPER_ADMIN}, ${UserRole.ADMIN}, ${UserRole.MANAGER}, ${UserRole.WAITER}, ${UserRole.CUSTOMER}`
  );
};

export const hasPermission = (role: string | UserRole, permission: Permission): boolean => {
  try {
    const normRole = normalizeRole(role as string);
    const permissions = ROLE_PERMISSIONS[normRole] || [];
    return permissions.includes(permission);
  } catch {
    return false;
  }
};

