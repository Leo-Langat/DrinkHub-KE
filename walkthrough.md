# Admin / Business Owner Dashboard — Walkthrough

## Summary of Accomplishments

The **Admin / Business Owner Dashboard** has been fully implemented, secured, and connected to live backend data in accordance with the multi-tenant architecture:
`SUPER_ADMIN` → `ADMIN` (Business Owner) → `MANAGER` → `WAITER` → `CUSTOMER`.

---

## 1. Backend Security & New Endpoints

### Strict Multi-Tenant Scoping
- **`GET /api/v1/tenants/current`** (`ADMIN`, `MANAGER`, `SUPER_ADMIN`):
  - Automatically derives `businessUuid` from `req.user.businessUuid`.
  - Returns the Business profile along with live operational counts (`managersCount`, `waitersCount`, `tablesCount`, `totalOrders`, `completedOrders`, `pendingOrders`, `totalRevenue`).
- **`GET /api/v1/payments`** (`ADMIN`, `MANAGER`, `SUPER_ADMIN`):
  - Strictly locked to `req.user.businessUuid` for tenant users.
  - Supports filtering by `paymentMethod` (`MPESA_STK`, `CARD`, `CASH`), `paymentStatus` (`PAID`, `PENDING`, `PROCESSING`, `FAILED`), and date range with pagination.
- **`PATCH /api/v1/tenants/:businessUuid`**:
  - Enforces that non-`SUPER_ADMIN` users can **only update their own assigned business**. Any attempt by an Admin of Business A to modify Business B returns a `403 Forbidden` error.
- **`GET /api/v1/orders`**:
  - Locked to `req.user.businessUuid` for authenticated tenant staff.
- **`GET /api/v1/reports/analytics`**:
  - Locked to `req.user.businessUuid` for authenticated tenant staff.
- **`POST /api/v1/auth/register`**:
  - Verifies that `ADMIN` can only create `MANAGER` (or `WAITER`) accounts, automatically injecting `callerBusinessUuid`.

---

## 2. Admin Dashboard Features (`apps/staff-portal/src/pages/AdminDashboard.tsx`)

The dashboard contains the 10 dedicated sections:

1. **Dashboard (`dashboard`)**:
   - **Today's Performance KPIs**: Today's Orders, Settled Revenue, Pending Orders, Average Order Value (AOV), Active Waiters, Active Managers.
   - **Weekly Revenue Chart**: Recharts area chart with daily breakdown.
   - **Top Selling Products**: Live volume and revenue rankings.
   - **Recent Orders Table**: Real-time customer order stream with status tags.
2. **Business Overview (`overview`)**:
   - Business Profile Card: Name, Business Type, Slug, physical address, city, county, operating hours, brand accent color.
   - Operational Summary Cards: Total Managers, Waiters, Tables, and Lifetime Orders.
   - Security & Scope metadata displaying enforced tenant isolation.
3. **Managers (`managers`)**:
   - Manager roster with search, account status (`ACTIVE`/`SUSPENDED`), and date added.
   - **Create Manager Modal**: Full name, email, phone, secure temporary password generator with one-click clipboard copy. Automatically creates the manager under the Admin's business with forced password reset on first login.
   - One-click account activation / suspension toggle.
4. **Orders (`orders`)**:
   - Oversight across all business orders.
   - Live search by Order # or Table number.
   - Filters for Order Status (`PENDING`, `CLAIMED`, `PREPARING`, `READY`, `DELIVERED`, `COMPLETED`, `CANCELLED`) and Payment Status (`PAID`, `PENDING`, `PROCESSING`, `FAILED`).
   - Order Details Modal showing itemized product breakdown, customer notes, and payment status.
5. **Sales & Revenue (`sales`)**:
   - Period selector (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`).
   - Bar chart for period revenue.
   - Payment method pie chart breakdown (M-Pesa STK, Card POS, Cash).
   - KPI metrics: Total Settled Revenue, Completed Orders, AOV, and M-Pesa percentage share.
6. **Payments (`payments`)**:
   - Total Settled vs Pending settlement cards.
   - Filter bar for Payment Channel and Settlement Status.
   - Financial audit table with M-Pesa Receipt references, checkout request IDs, customer phone numbers, and timestamps.
7. **Staff Performance (`staff`)**:
   - Overview of active Managers and Waiters.
   - Waiter efficiency table: Orders served, revenue collected, and average fulfillment time (in minutes).
8. **Reports (`reports`)**:
   - Modules for Sales, Order Volumes, and Menu Item performance.
   - Direct CSV export via server endpoint `GET /reports/analytics?format=CSV`.
9. **Business Settings (`settings`)**:
   - Form to update Business Name, Contact Email, Phone, Address, City, County, Opening Time, Closing Time, and Brand Theme Accent Color.
10. **Profile (`profile`)**:
    - Personal admin info and business association.
    - Change Password form calling `POST /auth/change-password`.

---

## 3. Session & Login Flow (`App.tsx` & `LoginPage.tsx`)

- **Role Selector**: 3 role tabs: **Admin (Owner)**, **Manager**, and **Waiter**.
- **Role Routing**: `ADMIN` roles are automatically directed to `<AdminDashboard />`.
- **20-Minute Session Timeout**: Integrated with `SessionTimeoutBanner` and silent background token refresh.

---

## 4. Verification Results

| Workspace | Command | Result |
|---|---|---|
| `apps/server` | `npm run type-check --workspace=apps/server` | **Exit code 0 (0 errors)** |
| `apps/staff-portal` | `npm run type-check --workspace=apps/staff-portal` | **Exit code 0 (0 errors)** |
| `apps/staff-portal` | `npm run build --workspace=apps/staff-portal` | **Exit code 0 (Production bundle built successfully)** |
