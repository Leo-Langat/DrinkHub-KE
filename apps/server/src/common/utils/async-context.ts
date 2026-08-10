import { AsyncLocalStorage } from 'async_hooks';

export interface TenantContextStore {
  tenantId?: string;
  userId?: string;
  userRole?: string;
}

export const tenantAsyncContext = new AsyncLocalStorage<TenantContextStore>();

export const getTenantIdFromContext = (): string | undefined => {
  const store = tenantAsyncContext.getStore();
  return store?.tenantId;
};
