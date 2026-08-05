# SCP Application — Full Documentation

**Last Updated:** 2026-08-03  
**Project:** Supply Chain Portal (SCP)  
**Stack:** NestJS microservices · TypeORM · PostgreSQL · React · TypeScript · MUI · React Router v6 · TanStack Query v5 · Zustand · i18next · Claude Agent SDK (Agents module)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [User Roles & Access Control](#2-user-roles--access-control)
3. [Full Data Model](#3-full-data-model)
4. [Feature Flows](#4-feature-flows)
   - 4.1 Authentication & 2FA
   - 4.2 Vendor Onboarding
   - 4.3 Article Management (PMI side)
   - 4.4 Article Management (Vendor side)
   - 4.5 Packaging Workflow
   - 4.6 Pricing Management
   - 4.7 Order Management
   - 4.8 Complaint Management
   - 4.9 Analytics & Reporting
5. [Frontend Route Reference](#5-frontend-route-reference)
6. [API Endpoint Reference](#6-api-endpoint-reference)
7. [Status Lifecycle Reference](#7-status-lifecycle-reference)
8. [Agentic AI RFQ Module (SCP-App-Agents)](#8-agentic-ai-rfq-module-scp-app-agents)
   - 8.1 Purpose & Status
   - 8.2 Architecture
   - 8.3 Model Tiering
   - 8.4 Guardrails: Approval, Spend Caps, Audit
   - 8.5 The Six Agents
   - 8.6 MCP Servers
   - 8.7 Knowledge Layer (Semantic Search)
   - 8.8 Data Model
   - 8.9 Environment Variables Reference

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Frontend (HashRouter)                    │
│   SCP-App-Frontend · MUI · TanStack Query · Zustand auth store  │
└──────────────────────────┬──────────────────────────────────────┘
                           │  HTTP / REST
┌──────────────────────────▼──────────────────────────────────────┐
│                    API Gateway (NestJS)                           │
│             SCP-App-API-Gateway · port 3000                      │
│   Routes all requests to microservices via TCP transport         │
└────────────────┬──────────────────────┬─────────────────────────┘
                 │  TCP                 │  TCP
┌────────────────▼──────┐   ┌──────────▼─────────────────────────┐
│  User Module (NestJS) │   │  Order Module (NestJS)              │
│  SCP-App-User-Module  │   │  SCP-App-Order-Module               │
│  TypeORM · PostgreSQL │   │  TypeORM · PostgreSQL               │
│                       │   │                                      │
│  Domains:             │   │  Domains:                            │
│  - Auth & users       │   │  - Orders (general/transport/       │
│  - Vendors            │   │    direct shipment)                  │
│  - Articles & PM      │   │  - Order delivery changes            │
│  - Packaging          │   │  - Shipping method history           │
│  - Pricing            │   │  - Complaints                        │
│  - Roles & perms      │   │                                      │
│  - Notifications      │   │                                      │
│  - Master data        │   │                                      │
└───────────────────────┘   └──────────────────────────────────────┘

                     ┌───────────────────────────────────┐
                     │   Agents Module (NestJS)            │
                     │   SCP-App-Agents · port 3004        │
                     │   TCP microservice, reached only     │
                     │   through the API Gateway — same    │
                     │   pattern as User/Order Module       │
                     │   TypeORM · PostgreSQL (own table:  │
                     │   agent_audit_logs)                  │
                     │                                       │
                     │   Claude Agent SDK-based agent layer │
                     │   for the Agentic AI RFQ Module.     │
                     │   Calls back into User-Module (3001) │
                     │   and Order-Module (3003) over TCP,  │
                     │   and into RFQ/Article/Supplier/      │
                     │   Pricing/Complaint/Order MCP HTTP   │
                     │   servers expected to live inside     │
                     │   those two services (ports 3005/    │
                     │   3006) — see §8 for full detail.    │
                     │   STATUS: in progress, not yet fully │
                     │   wired to a live RFQ module.        │
                     └───────────────────────────────────┘
```

### Key Technical Decisions

| Concern | Choice | Notes |
|---|---|---|
| Routing | HashRouter | URL path follows `#`; `useLocation().pathname` returns post-hash path |
| Auth state | Zustand (`auth-storage` in localStorage) | `hasCompleted2FA`, `token`, `user`, `isAuthenticated` |
| Layout pattern | React Router v6 layout route | Single `<ProtectedRoute><MainLayout/></ProtectedRoute>` parent; `<Outlet/>` renders children — prevents remount on navigation |
| Data fetching | TanStack Query v5 | All API calls use `useQuery` / `useMutation` |
| Inter-service comms | NestJS TCP transport | Gateway emits message patterns; services listen with `@MessagePattern` |
| DB | PostgreSQL | TypeORM v0.3, `varchar` status fields (not enum constraints), JSONB for change-request diffs |

---

## 2. User Roles & Access Control

### User Types

| `userType` enum | Description |
|---|---|
| `BUSINESS` (PMI) | Internal purchase manager users — full admin access to all PMI features |
| `VENDOR` (Supplier) | External supplier users — restricted to vendor-facing features |

### Role Derivation (Frontend)

`ProtectedRoute` derives the role from `user.userType` or `user.role`:
- Contains `"vendor"` or `"supplier"` → `"vendor"`
- Otherwise → `"business"`

Vendors with `erp_vendor_id` or `isVendor: true` are directed to `/vendor-two-factor` instead of `/two-factor`.

### Route Access Rules

**Vendor-only routes** (business users get "Permission Denied"):

| Path Prefix | Feature |
|---|---|
| `/vendor-article-management` | Vendor article list |
| `/vendor-onboarding` | Onboarding wizard |
| `/analytics/supplier-overview-vendor` | Vendor analytics |
| `/supplier-order-management` | Vendor order management |
| `/supplier-general-order-management` | General orders (vendor) |
| `/supplier-transport-order-management` | Transport orders (vendor) |
| `/supplier-direct-shipment-order-management` | Direct shipment (vendor) |
| `/supplier-released-orders` | Released orders (vendor) |
| `/supplier-order-management-change-requests` | Order change requests (vendor) |
| `/supplier-shipping-method-history` | Shipping history (vendor) |
| `/supplier-truck-providers` | Truck providers |
| `/supplier-complaint` | Complaints (vendor) |
| `/supplier-pricing-management` | Pricing (vendor) |
| `/supplier-pricing-management-dashboard` | Pricing dashboard (vendor) |
| `/supplier-pricing-requests-view` | Pricing requests (vendor) |
| `/supplier-annual-price-data` | Annual price data (vendor) |
| `/supplier-annual-pricing-change-pending-requests` | Annual price pending (vendor) |
| `/supplier-annual-pricing-view` | Annual pricing view (vendor) |
| `/packing-info/:id` | Submit/edit packing info |
| `/edit-packing-info/:id` | Edit packing info |

**Business-only routes** (vendor users get "Permission Denied"):

| Path Prefix | Feature |
|---|---|
| `/article-management` | PM article management |
| `/article-management-details/:id` | PM article detail view |
| `/order-management` | Order management (PMI) |
| `/general-order-management` | General orders (PMI) |
| `/transport-order-management` | Transport orders (PMI) |
| `/direct-shipment-order-management` | Direct shipment (PMI) |
| `/complaint-management` | Complaints (PMI) |
| `/pricing-management` | Pricing (PMI) |
| `/all-pricing-change-requests` | All pricing change requests |
| `/pm-annual-price-data` | Annual price data (PMI) |
| `/annual-pricing-change-pending-requests` | Annual price pending (PMI) |
| `/pm-order-management-change-requests` | Order change requests (PMI) |
| `/roles-management` | Role management |
| `/master-data-management` | Master data |
| `/category-management` | Category management |
| `/system-preferences` | System preferences |
| `/notification-preferences` | Notification preferences |
| `/notification-template` | Email templates |
| `/contact-change-requests` | Contact change requests |
| `/all-contact-change-history` | Contact change history |
| `/analytics/overview` | PMI analytics |
| `/analytics/supplier-overview` | Supplier overview (PMI) |
| `/supplier-pricing-notification-view` | Pricing notifications (PMI) |

**Shared/override routes** (both roles):

| Path | Notes |
|---|---|
| `/article-management/supplier-packing-change-requests` | `vendorAllowedOverrides` — vendors explicitly allowed |
| `/dashboard` | Both roles |
| `/profile` | Both roles |

### Vendor Resource Ownership Checks

For certain detail pages, `ProtectedRoute` calls the API to verify the vendor owns the resource:

| Route Pattern | Ownership Endpoint |
|---|---|
| `/article-management-details/:id` | `GET /user/pm-article-full-view/:id` |
| `/(packing-info\|edit-packing-info)/:id` | `GET /user/supplier-article-with-relations/:id` |
| `/(supplier-general-order-management\|supplier-transport-order-management\|supplier-direct-shipment-order-management)/details/:id` | `GET /order/order-view/:id` |
| `/supplier-order-management/transport/details/:id` | `GET /order/order-view/:id` |
| `/supplier-released-orders/details/:id` | `GET /order/order-view/:id` |
| `/supplier-complaint/(case-details\|upload-proofs\|archived-complaints)/:id` | `GET /order/complaints/:id` |

Ownership is matched by `vendor.id === user.id` OR `vendor.erp_vendor_id === user.erp_vendor_id`.

---

## 3. Full Data Model

### 3.1 Users & Authentication

#### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | auto-generated |
| `first_name` | varchar | NOT NULL |
| `last_name` | varchar | nullable |
| `email` | varchar UNIQUE | NOT NULL |
| `password` | varchar | bcrypt hashed |
| `userType` | enum UserType | NOT NULL |
| `isActive` | boolean | default: true |
| `twoFACode` | varchar | nullable, 6-digit OTP |
| `twoFACodeExpiry` | timestamp | nullable |
| `hashedRefreshToken` | varchar | nullable |
| `refreshTokenExpiresAt` | timestamp | nullable |
| `createdAt` | timestamptz | auto |
| `updatedAt` | timestamptz | auto |

Relations: ManyToMany → `roles` (join: `user_roles`)

#### `vendors`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | auto-generated |
| `erp_vendor_id` | varchar | ERP system reference |
| `first_name` | varchar | nullable |
| `last_name` | varchar | nullable |
| `email` | varchar | login email |
| `password` | varchar | bcrypt hashed |
| `userType` | enum UserType | default: VENDOR |
| `onboarding_progress` | int | 0-100 percentage |
| `invite_status` | enum InvitationStatus | nullable |
| `first_signin_done` | boolean | default: false |
| `twoFACode` | varchar | nullable |
| `twoFACodeExpiry` | timestamp | nullable |
| `hashedRefreshToken` | varchar | nullable |
| `refreshTokenExpiresAt` | timestamp | nullable |
| `release_date` | timestamptz | nullable |
| `release_status` | enum ReleaseStatus | default: PENDING |
| `diamant_number` | varchar | nullable |
| `mpm_number` | varchar | nullable |
| `internal_pm_number` | varchar | nullable |
| `first_reminder_in_days` | int | default: 7 |
| `second_reminder_in_days` | int | default: 14 |
| `delivery_confirm_reminder_updated_by` | int | nullable |
| `is_delivery_reminder_period` | boolean | default: false |
| `is_strategic_approved` | boolean | default: false |
| `createdAt` | timestamptz | auto |
| `updatedAt` | timestamptz | auto |

Relations: ManyToMany → `roles` (join: `vendor_roles`), OneToOne → `company_profile`, OneToMany → `vendor_contact_details`, OneToMany → `location_master`, OneToOne → `payment_detail`, OneToMany → `certifications`

#### `roles`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `role_name` | varchar | |
| `description` | varchar | |
| `userType` | enum UserType | scopes role to PMI or vendor |
| `createdAt` / `updatedAt` | timestamptz | |

Relations: ManyToMany → `permissions` (join: `role_permissions`), ManyToMany → `pmi_contacts` (join: `pmi_contact_roles`)

#### `permissions`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `permission_name` | varchar UNIQUE | |
| `description` | varchar | |
| `userType` | enum UserType | |
| `createdAt` / `updatedAt` | timestamptz | |

---

### 3.2 Vendor Profile & Company

#### `company_profile`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `company_name` | varchar | NOT NULL |
| `address` / `address2` | varchar | nullable |
| `postal_code` | varchar | nullable |
| `city` | varchar | nullable |
| `state_province` | varchar | nullable |
| `country` | varchar | nullable |
| `file_path` | varchar | logo/doc upload path |
| `createdAt` / `updatedAt` | timestamptz | |

Relations: OneToOne → `vendors`

#### `vendor_contact_details`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `contact_type` | varchar | nullable |
| `title` | varchar | nullable |
| `first_name` / `last_name` | varchar | nullable |
| `email` | varchar | nullable |
| `office_number` / `mobile_number` | varchar | nullable |
| `gender` | varchar | nullable |
| `contact_label` | varchar | nullable |
| `address` / `address2` | varchar | nullable |
| `city` / `postal_code` / `state_province` / `country` | varchar | nullable |
| `erp_contact_number` | varchar | nullable |
| `is_primary_contact` | boolean | default: false |
| `createdAt` / `updatedAt` | timestamptz | |

Relations: ManyToOne → `vendors` (onDelete: CASCADE)

#### `contact_change_requests`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `contact_id` | int | |
| `vendor_id` | int | |
| `pm_user_id` | int | |
| `original_data` | jsonb | snapshot before change |
| `changed_data` | jsonb | proposed change |
| `updated_by` | int | nullable |
| `updated_user_type` | varchar | nullable |
| `approved_rejected_by` | int | nullable |
| `approved_rejected_user_type` | varchar | nullable |
| `approve_reject_status` | varchar | default: `'pending'` |
| `reject_comments` | text | nullable |
| `contact_label` | varchar | nullable |
| `action_type` | varchar | default: `'update'`; also `'delete'` |
| `deletion_requested` | boolean | default: false |
| `created_at` | timestamp | default: CURRENT_TIMESTAMP |

#### `contact_details_change_history`
Audit trail for contact changes (column_name, old_value, new_value, changed_date, changed_by, user_type, vendor_id).

#### `vendor_profile_change_history`
Audit trail for vendor profile changes (column_name, old_value, new_value, changed_date, changed_by, user_type).

#### `vendor_erp_connections`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `vendor_id` | int | |
| `erp_system` | enum ErpSystem | |
| `erp_vendor_id` | varchar | |
| `label` | varchar | nullable |
| `is_primary` | boolean | default: false |
| `is_active` | boolean | default: true |

Unique constraint: `(vendor_id, erp_system)`.

#### `vendor_release_history`
Records when a vendor was released (released_by, vendor_id, released_date).

---

### 3.3 Location & Payment

#### `location_master`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `address_line1` | varchar | NOT NULL |
| `address_line2` | varchar | nullable |
| `company_name` | varchar | nullable |
| `zip` / `city` / `country` | varchar | NOT NULL |
| `location_type` | enum LocationType | |

Relations: ManyToOne → `vendors` (onDelete: CASCADE)

#### `payment_detail`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `bank_name` | varchar | nullable |
| `iban_code` | varchar | nullable |
| `swift_bic_code` | varchar | nullable |
| `ac_holder_name` | varchar | nullable |
| `country` | varchar | nullable |
| `payment_terms` | varchar | nullable |
| `incoterms` | varchar | nullable |
| `vat_number` | varchar | nullable |
| `status` | enum PaymentStatus | default: PENDING |

Relations: OneToOne → `vendors` (onDelete: CASCADE)

---

### 3.4 Articles & Products

#### `article_pm`
The master article record managed by PMI (purchase managers).

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `article_number_pm` | varchar UNIQUE | ERP/PM article number |
| `article_name` | varchar | nullable |
| `article_description_pm` | varchar | nullable |
| `agent_code` | varchar | nullable |
| `article_type` | varchar | nullable |
| `article_group` | varchar | nullable |
| `base_unit_of_measure` | varchar(10) | nullable |
| `gross_weight` | decimal(10,3) | nullable |
| `net_weight` | decimal(10,3) | nullable |
| `weight_unit` | varchar(5) | nullable |
| `ean_upc` | varchar | nullable (barcode) |
| `country_of_origin` | varchar(3) | nullable (ISO code) |
| `customs_tariff_number` | varchar | nullable |
| `is_active` | boolean | default: true |
| `article_status` | varchar | nullable |
| `erp_source` | varchar | nullable |
| `erp_reference_id` | varchar | nullable |
| `last_synced_at` | timestamptz | nullable (ERP sync) |
| `created_by` / `updated_by` | int | nullable (user IDs) |
| `deleted_at` | timestamptz | nullable (soft delete) |
| `created_date` / `updated_date` | timestamptz | auto |

Relations: ManyToOne → `product_category`, ManyToOne → `product_sub_category`

#### `article_supplier`
Links an `article_pm` to a specific vendor — the supplier-side article record.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `article_number_pm` | varchar | FK reference |
| `article_number_supplier` | varchar | vendor's own article number |
| `article_description_supplier` | varchar | vendor's description |
| `minimum_order_quantity` | varchar | nullable |
| `batch_size` | int | nullable |
| `lead_time_calculation` | varchar | nullable |
| `packaging_status` | varchar | **nullable** — packaging lifecycle state |
| `packaging_requested_by` | int | user ID who requested packaging |
| `packaging_requested_date` | timestamptz | nullable |
| `pricing_status` | varchar | nullable |
| `is_price_change_allowed` | boolean | default: false |
| `development_id` | varchar | nullable |
| `comment` | varchar | nullable |
| `conversation_id` | bigint | nullable (chat thread) |
| `created_date` / `updated_date` | timestamptz | auto |

Relations: ManyToOne → `article_pm`, ManyToOne → `vendors`, OneToMany → `article_packaging`, OneToMany → `packaging_material`

**`packaging_status` lifecycle:** `null` (not requested) → `'pending'` (PMI requested, vendor not yet submitted) → `'pending_review'` (vendor submitted, awaiting PMI approval) → `'approved'` (approved). Rejected: reverts to `'pending'` (new) or `'approved'` (update).

#### `article`
Legacy/flat article table (not the canonical source — prefer `article_pm` + `article_supplier`).

#### `article_packaging`
Packaging spec for one packaging level of an article.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `packaging_type` | varchar | e.g., "Karton", "Palette" |
| `amount_of_karton` | varchar | |
| `amount_of_single_piece` | varchar | |
| `gross_weight_kg` | varchar | |
| `tare_in_kg` | varchar | |
| `net_weight_kg` | varchar | |
| `tare_in_kg_prelevel` | varchar | |
| `length` / `width` / `height` | varchar | dimensions |
| `is_main_packaging` | boolean | default: false |

Relations: ManyToOne → `article_supplier` (onDelete: CASCADE)

#### `article_packaging_temp`
Staging table for packaging submissions awaiting PMI review (before becoming canonical `article_packaging` records).

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `original_data` | jsonb | snapshot of existing packaging |
| `changed_data` | jsonb | proposed new packaging |
| `article_supplier_id` | int | nullable |
| `materials` | jsonb | packaging materials list |
| `status` | varchar | default: `'pending'` |
| `reject_reason` | varchar | nullable |
| `vendor_id` | int | NOT NULL |
| `approved_by_pmi_user_id` | int | nullable |
| `created_or_updated_by` | int | nullable |
| `user_type` | varchar | nullable |
| `created_at` | timestamp | |

Also includes all individual packaging fields (amount_of_karton, gross_weight_kg, etc.) for direct column access.

#### `packaging_material`
Materials associated with an article's packaging.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `description` | varchar | material name |
| `weight_in_gr` | varchar | nullable |

Relations: ManyToOne → `article_supplier` (onDelete: CASCADE)

#### `packaging_change_requests`
Records vendor-submitted packaging change requests for PMI approval.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `vendor_id` | int | NOT NULL |
| `pm_user_id` | int | nullable (assigned reviewer) |
| `original_data` | jsonb | existing packaging state |
| `changed_data` | jsonb | proposed changes |
| `updated_by` / `updated_user_type` | int / varchar | last editor |
| `approved_rejected_by` / `approved_rejected_user_type` | int / varchar | decision maker |
| `approve_reject_status` | varchar | default: `'pending'` |
| `reject_comments` | text | nullable |
| `article_number_supplier` | varchar | nullable |
| `created_at` | timestamp | |

Relations: ManyToOne → `article_supplier`

---

### 3.5 Product Categories

#### `product_category`
`id`, `category_name` (UNIQUE), `isActive`

#### `product_sub_category`
`id`, `sub_category_name`, `isActive`, `created_date`  
Unique: `(sub_category_name, category_id)`  
Relations: ManyToOne → `product_category` (onDelete: CASCADE)

#### `product_category_role_mapping`
Maps a category to a role and user for access scoping.  
Relations: ManyToOne → `product_category`, ManyToOne → `roles`, ManyToOne → `users`

---

### 3.6 Certifications

#### `certifications`
| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `certificate_name` | varchar | |
| `description` | varchar | nullable |
| `file_path` | varchar | uploaded file |
| `issued_by` | varchar | |
| `issue_date` / `expiry_date` | date | nullable |
| `status` | varchar | default: `'Pending QA Review'` |
| `active` | boolean | default: true |

Relations: ManyToOne → `vendors` (onDelete: CASCADE)

#### `certificate_types`
Lookup table: `id`, `certificate_type`, `isActive`

#### `certificate_articles_mapping`
Links certifications to specific articles.  
Relations: ManyToOne → `certifications`, ManyToOne → `vendors`, ManyToMany → `article_supplier` (join: `certificate_article_supplier_join`)

---

### 3.7 Pricing Management

#### `pricing_master`
Current approved price record for an article-supplier pair.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `development_id` | varchar | nullable |
| `price` | decimal(15,2) | NOT NULL |
| `graduated_price_qty` | decimal(15,2) | nullable |
| `batch_size` | int | |
| `start_date` / `end_date` | date | nullable |
| `pricing_change_requested_by` | int | nullable |
| `pricing_change_requested_date` | timestamptz | nullable |
| `status` | varchar | default: `'pending'` |
| `reject_reason` | varchar | nullable |
| `created_by` | int | NOT NULL |
| `approved_by_pmi_user_id` | int | nullable |
| `feedback_deadline` | varchar | nullable |

Relations: ManyToOne → `article_supplier`

#### `pricing_change_requests`
Full audit of a pricing change request with rich metadata.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `article_supplier_id` | int | NOT NULL |
| `vendor_article_price_data_record_id` | int | nullable |
| `original_data` / `changed_data` | jsonb | |
| `vendor_name` / `vendor_erp_number` | varchar | denormalized for display |
| `article_number_supplier` / `article_number_pm` | varchar | denormalized |
| `article_description_supplier` / `article_description_pm` | varchar | denormalized |
| `feedback_deadline` | varchar | nullable |
| `comment` / `comments` | varchar | nullable |
| `start_date` / `end_date` | date | nullable |
| `batch_size` | int | nullable |
| `approve_reject_status` | enum | default: PENDING |
| `reject_reason` | varchar | nullable |
| `created_by` / `updated_by` | int | |
| `approved_by_pmi_user_id` / `approved_by_vendor_user_id` | int | nullable |
| `rejected_by_pmi_user_id` / `rejected_by_vendor_user_id` | int | nullable |
| `action` | enum | CREATE or UPDATE |
| `cr_type` | enum | MASTER_PRICE_CHANGE / NEW_PRICE_REQUEST / FUTURE_PRICE_CHANGE / ANNUAL_PRICE_CHANGE |
| `is_proposed_price` | boolean | |
| `is_master_price_change` / `is_new_price_request` / `is_future_price_change` | boolean | |
| `current_active_prices` | jsonb | snapshot |

#### `vendor_article_price_data`
Future and annual price records for an article-supplier pair.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `price` | decimal(10,2) | |
| `start_date` / `end_date` | date | |
| `price_type` | enum | FUTURE_PRICE or ANNUAL_PRICE |
| `annual_future_price_change_approve_reject_status` | varchar | default: `'pending'` |
| `comment` | varchar | nullable |
| `conversation_id` | bigint | nullable |

Relations: ManyToOne → `vendors`, ManyToOne → `article_pm`, ManyToOne → `article_supplier`

#### `annual_article_price_change_requests`
Dedicated table for annual price change requests (similar structure to `pricing_change_requests` but scoped to annual changes).

#### `pricing_change_history`
Audit trail: `pricing_master_id`, `column_name`, `old_value`, `new_value`, `changed_date`, `changed_by`, `user_type`, `vendor_id`, `comments`, `approve_reject_status`, `pricing_change_request_id`.

---

### 3.8 Tasks / Notifications

#### `tasks`
In-app notification/task system linking actions to users.

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `title` | varchar | notification heading |
| `description` | varchar | nullable |
| `status` | enum TaskStatus | default: PENDING |
| `user_id` | int | recipient |
| `user_type` | varchar | `'business'` or `'vendor'` |
| `task_type` | varchar | categorizes the task |
| `relation_data_type` | varchar | entity type the task links to |
| `relation_data_id` | int | entity ID |
| `action_url` | varchar | nullable, deep-link |
| `created_date` | timestamp | |
| `due_date` | timestamp | nullable |
| `date_opened` | timestamp | nullable |
| `mark_as_read` | boolean | default: false |
| `task_name` | varchar | nullable |
| `supplier_article_id` | int | nullable |
| `pmi_user_role` / `supplier_user_role` | varchar | nullable |
| `pricing_change_request_id` | int | nullable |
| `order_delivery_changes_id` | int | nullable |
| `article_packaging_change_request_id` | int | nullable |
| `complaint_id` | int | nullable |
| `comment` | varchar | nullable |

---

### 3.9 Internal Contacts (PMI)

#### `pmi_contacts`
`id`, `first_name`, `last_name`, `email` (UNIQUE), `createdAt`, `created_by`  
Relations: ManyToMany → `roles` (join: `pmi_contact_roles`)

#### `departments`
`id`, `department_name`

#### `pmi_contacts_vendor_mapping`
Maps PMI contacts to vendors by department.  
Relations: ManyToOne → `vendors` (CASCADE), ManyToOne → `departments` (CASCADE), ManyToMany → `pmi_contacts` (join: `pmi_contacts_mapping_contacts`)

---

### 3.10 Orders (Order Module)

#### `order_master`
Main order record (~63 columns). Key fields:

| Column | Notes |
|---|---|
| `id` | PK |
| `order_number` | unique business identifier |
| `order_type` | general / transport / direct_shipment |
| `order_status` | lifecycle status |
| `vendor_id` | FK to vendor |
| `article_supplier_id` | FK to article_supplier |
| `quantity_ordered` | |
| `quantity_delivered` | |
| `delivery_date` | |
| `requested_delivery_date` | |
| `shipping_method` | |
| `incoterms` | |
| `currency` | |
| `price` | unit price at time of order |
| `total_value` | |
| `tolerance_min` / `tolerance_max` | delivery tolerance percentages |
| `completion_status` | calculated from tolerance |
| `created_by` | PMI user who created |
| `released_by` / `released_at` | |
| `created_at` / `updated_at` | |

#### `order_articles`
Line items for an order. Relations: ManyToOne → `order_master`.

#### `order_delivery_changes`
Tracks changes to delivery dates/quantities per order. Used for order change requests.

#### `order_shipping_method_history`
Audit trail of shipping method changes per order.

#### `complaint_cases`
| Column | Notes |
|---|---|
| `id` | PK |
| `order_id` | FK to order_master |
| `vendor_id` | |
| `complaint_number` | unique business ID |
| `complaint_type` | category |
| `complaint_status` | lifecycle |
| `description` | |
| `created_by` | |
| `created_at` / `updated_at` | |

#### `complaint_documents`
File attachments for a complaint. Relations: ManyToOne → `complaint_cases`.

#### `complaint_history`
Audit trail of status changes per complaint.

---

### 3.11 Master Data & Settings

#### `article_type_master`
Lookup: `value`, `label`, `description`, `sort_order`, `is_active`

#### `erp_source_master`
Lookup for ERP source systems: `value`, `label`, `description`, `sort_order`, `is_active`

#### `uoms`
Unit of measure: `uom_code` (UNIQUE), `uom_name`, `uom_alias`, `isActive`

#### `currencies`
`currency_code` (UNIQUE), `currency_value`, `isActive`

#### `email_template`
Email notification templates: `notification_code` (UNIQUE), `notification_title` (UNIQUE), `subject`, `message_body`

#### `global_system_preferences`
Singleton system config: timezone, date format, language, from/reply/support/admin emails, email signature, last ERP sync timestamp.

#### `tolerance_settings`
Order completion thresholds by supplier: min/max percentages for completed, partial, not-completed statuses. Also tracks batch_number and expiration_date_of_batch_number per supplier.

#### `truck_provider`
`truck_provider_name` (UNIQUE), `truck_number`

---

### 3.12 Analytics

#### `supplier_evaluation`
German-language KPI scores imported from ERP. One record per supplier per month per year. ~30 score columns (all decimal(18,10)):

Key columns: `lieferant_nummer` (supplier ERP number), `lieferant` (name), `month`, `year`, `liefertreue1/2/3` (delivery reliability), `mengentreue` (quantity compliance), `first_time_match_rate`, `reklamationsverhalten_qs/qk` (complaint behavior), `lieferantenscore` (overall score), `score_performance`, `score_quality`, `score_pricing_finance`, `score_innovation`, `score_service`.

---

## 4. Feature Flows

### 4.1 Authentication & 2FA

```
PMI user:
  POST /user/auth/login  →  returns JWT tokens
  POST /user/auth/send-2fa  →  sends OTP to email
  POST /user/auth/verify-2fa  →  verifies OTP, sets hasCompleted2FA
  Navigate to /dashboard

Vendor:
  POST /user/auth/vendor-login  →  returns JWT tokens
  POST /user/auth/vendor-send-2fa  →  sends OTP
  POST /user/auth/vendor-verify-2fa  →  verifies OTP
  Navigate to /dashboard
```

- Refresh token: `POST /user/auth/refresh`
- Password reset: `POST /user/auth/forgot-password` → email link → `POST /user/auth/reset-password`
- Vendor password reset: same pattern with `/vendor-` prefix

Auth state stored in Zustand (`auth-storage` localStorage key). `hasCompleted2FA` checked on every protected route — incomplete 2FA redirects to `/two-factor` or `/vendor-two-factor`.

---

### 4.2 Vendor Onboarding

**Initiated by PMI:**
1. PMI user invites a vendor: `POST /user/vendor/invite` — creates `vendors` record with `invite_status: INVITED`, sends invitation email
2. Vendor receives email with temporary credentials
3. Vendor logs in for the first time (`first_signin_done` becomes `true`)
4. Vendor completes onboarding wizard at `/vendor-onboarding` (multi-step form)

**Onboarding steps** (tracked via `onboarding_progress` 0–100):
1. Company profile (`company_profile` table)
2. Contact details (`vendor_contact_details` table)
3. Locations (`location_master` table)
4. Payment details (`payment_detail` table)
5. Certifications (`certifications` table)

**Release by PMI:**
- PMI reviews completed vendor profile
- PMI approves: `PATCH /user/vendor/release/:id` → sets `release_status: RELEASED`, records in `vendor_release_history`
- `is_strategic_approved` can be set independently

**PMI side views:**
- `/master-data-management` — lists all vendors with status
- `/vendor-onboarding/:id` — view onboarding progress (PMI can view vendor's form)

---

### 4.3 Article Management (PMI Side)

**Page:** `/article-management`

**Article creation flow:**
1. PMI creates article: `POST /user/article` — creates `article_pm` record
2. PMI assigns article to supplier: creates `article_supplier` record linking `article_pm` + `vendor`
3. Article appears in vendor's list with `packaging_status: null`

**Article list features:**
- Filter by category, supplier, status, ERP source
- Activate/deactivate (`is_active` toggle)
- Soft delete (`deleted_at` timestamp)
- View full article details at `/article-management-details/:id`

**Request Packaging Information button:**
- Enabled only when `packaging_status` is null / empty / "not requested"
- Clicking: `POST /user/article/request-packaging` → sets `packaging_status: 'pending'`, sets `packaging_requested_by`, `packaging_requested_date`, creates task notification for vendor
- Button is **disabled** (with tooltip) if `packaging_status` is any non-empty value (pending, pending_review, approved) — prevents duplicate requests

**Packing Change Requests tab** (`/article-management/packing-change-requests`):
- Lists all `packaging_change_requests` records
- PMI can approve/reject vendor packaging submissions
- Approve: runs `approvePackagingRequest` → copies `changed_data` into `article_packaging` table, sets `packaging_status: 'approved'`
- Reject: sets `packaging_status` back to `'pending'` (new article) or `'approved'` (update to existing)

---

### 4.4 Article Management (Vendor Side)

**Page:** `/vendor-article-management`

**Article list features:**
- Shows only `article_supplier` records linked to the logged-in vendor
- Columns: PM article number, supplier article number, description, category, batch size, packaging status
- `packaging_status` displayed as MUI Chip:
  - `null` / empty → grey "N/A"
  - `'pending'` → orange "Pending"
  - `'pending_review'` → orange "Under Review"
  - `'approved'` → green "Approved"
  - `'rejected'` → red "Rejected"

**Add/Edit Packing Info button:**
- Disabled (with tooltip) when `packaging_status === 'pending_review'` — a request is already awaiting approval
- If `packaging_status` has a value (not "not requested"/"N/A"): navigates to `/edit-packing-info/:id`
- Otherwise: navigates to `/packing-info/:id`

**View button:**
- Navigates to `/article-management-details/:id` using React Router `navigate()` (no page reload)
- Ownership check in `ProtectedRoute` verifies vendor owns the article

---

### 4.5 Packaging Workflow

```
PMI requests packaging
  └─ article_supplier.packaging_status → 'pending'
     └─ task notification created for vendor

Vendor submits packing info (/packing-info/:id)
  └─ POST /user/article/create-packaging
     └─ article_packaging_temp record created
     └─ packaging_change_requests record created
     └─ article_supplier.packaging_status → 'pending_review'
     └─ task notification created for PMI

PMI reviews (/article-management/packing-change-requests)
  └─ Approve:
     └─ POST /user/article/approve-packaging/:id
        └─ changed_data copied to article_packaging (canonical)
        └─ article_supplier.packaging_status → 'approved'
        └─ task notification to vendor

  └─ Reject:
     └─ POST /user/article/approve-packaging/:id (with reject flag)
        └─ packaging_change_requests.approve_reject_status → 'rejected'
        └─ article_supplier.packaging_status:
           - New article (original had 0 packagings): → 'pending'
           - Update to existing article: → 'approved'
        └─ task notification to vendor

Vendor edits existing packaging (/edit-packing-info/:id)
  └─ POST /user/article/update-packaging
     └─ packaging_change_requests record created (original_data + changed_data)
     └─ article_supplier.packaging_status → 'pending_review'
     └─ Same PMI review flow above
```

**Supplier Packing Change Requests** (`/article-management/supplier-packing-change-requests`):
- Both roles can access (vendorAllowedOverrides)
- Vendor sees their own pending/past requests
- PMI sees all requests

---

### 4.6 Pricing Management

#### PMI Side (`/pricing-management`)
- Lists all `pricing_master` records across all suppliers
- Create new price: `POST /user/pricing/create` → `pricing_master` with `status: 'pending'`
- Edit price: creates `pricing_change_requests` record
- View all change requests: `/all-pricing-change-requests`
- Annual price data: `/pm-annual-price-data` → `vendor_article_price_data` (price_type: ANNUAL_PRICE)
- Future prices: `vendor_article_price_data` (price_type: FUTURE_PRICE)
- Annual change requests: `/annual-pricing-change-pending-requests`

#### Vendor Side (`/supplier-pricing-management`)
- View own prices at `/supplier-pricing-management-dashboard`
- Submit price change request: creates `pricing_change_requests`
- View pending requests: `/supplier-pricing-requests-view`
- Annual pricing: `/supplier-annual-price-data` → `/supplier-annual-pricing-view`
- Pending annual changes: `/supplier-annual-pricing-change-pending-requests`

#### Price Change Request Lifecycle
```
Created (PENDING) → PMI Reviews → APPROVED (pricing_master updated)
                               → REJECTED (pricing_master unchanged)
```

Types of price requests (`cr_type`):
- `MASTER_PRICE_CHANGE` — change to the current master price
- `NEW_PRICE_REQUEST` — create a new pricing record
- `FUTURE_PRICE_CHANGE` — set a future effective price (→ `vendor_article_price_data`)
- `ANNUAL_PRICE_CHANGE` — annual renegotiation (→ `annual_article_price_change_requests`)

---

### 4.7 Order Management

#### Order Types
| Type | PMI Route | Vendor Route |
|---|---|---|
| General | `/general-order-management` | `/supplier-general-order-management` |
| Transport | `/transport-order-management` | `/supplier-transport-order-management` |
| Direct Shipment | `/direct-shipment-order-management` | `/supplier-direct-shipment-order-management` |

#### Order Lifecycle
```
PMI creates order (order_master, order_articles)
  └─ order_status: OPEN / PENDING

PMI releases order
  └─ order_status: RELEASED
  └─ Vendor can now see it in /supplier-released-orders

Vendor confirms delivery details
  └─ Delivery changes tracked in order_delivery_changes
  └─ Shipping method in order_shipping_method_history

Order completed
  └─ order_status: COMPLETED
  └─ completion_status calculated from tolerance_settings:
     - COMPLETED (within max tolerance)
     - PARTIAL (partial delivery)
     - NOT_COMPLETED (below min threshold)
```

#### Order Change Requests
- PMI: `/pm-order-management-change-requests`
- Vendor: `/supplier-order-management-change-requests`
- Changes to delivery dates/quantities go through `order_delivery_changes`

#### Shipping Method History
- Tracked in `order_shipping_method_history`
- Vendor view: `/supplier-shipping-method-history`
- Vendor truck providers: `/supplier-truck-providers` (managed in `truck_provider` table)

---

### 4.8 Complaint Management

#### PMI Side (`/complaint-management`)
- Lists all `complaint_cases`
- Can create, view, and resolve complaints

#### Vendor Side (`/supplier-complaint`)
Sub-routes:
- `/supplier-complaint/case-details/:id` — view complaint details
- `/supplier-complaint/upload-proofs/:id` — upload evidence (`complaint_documents`)
- `/supplier-complaint/archived-complaints/:id` — view resolved complaints

#### Complaint Lifecycle
```
Complaint created (complaint_cases)
  └─ complaint_status: OPEN

Vendor uploads proofs (complaint_documents)
  └─ complaint_status: UNDER_REVIEW

Resolution
  └─ complaint_status: RESOLVED / CLOSED
  └─ History tracked in complaint_history
```

---

### 4.9 Analytics & Reporting

#### PMI Analytics
- `/analytics/overview` — business KPIs (order volumes, delivery rates)
- `/analytics/supplier-overview` — per-supplier performance view
- Data sourced from `supplier_evaluation` table (imported from ERP, German-language KPI columns)

#### Vendor Analytics
- `/analytics/supplier-overview-vendor` — vendor sees own KPIs
- Same `supplier_evaluation` data filtered by `lieferant_nummer` (vendor's `erp_vendor_id`)

---

## 5. Frontend Route Reference

### Public Routes (no auth required)

| Path | Component | Notes |
|---|---|---|
| `/login` | LoginPage | PMI login |
| `/vendor-login` | VendorLoginPage | Vendor login |
| `/two-factor` | TwoFactorPage | PMI 2FA OTP |
| `/vendor-two-factor` | VendorTwoFactorPage | Vendor 2FA OTP |
| `/forgot-password` | ForgotPasswordPage | PMI reset |
| `/vendor-forgot-password` | VendorForgotPasswordPage | Vendor reset |
| `/reset-password` | ResetPasswordPage | PMI new password |
| `/vendor-reset-password` | VendorResetPasswordPage | Vendor new password |

### Protected Without Layout

| Path | Component |
|---|---|
| `/system-preferences-change-history` | SystemPreferencesChangeHistory |
| `/vendor-profile-change-history/:vendorId` | VendorProfileChangeHistory |
| `/vendor-contact-change-history/:vendorId` | VendorContactChangeHistory |
| `/vendor-contact-change-request/:vendorId` | VendorContactChangeRequest |
| `/pmi-internalcontacts-change-history` | PmiInternalContactsChangeHistory |
| `/pmi-mapcontacts-change-history/:vendor_id` | PmiMapContactsChangeHistory |

### Protected + MainLayout Routes

#### Shared (both roles)

| Path | Component |
|---|---|
| `/dashboard` | DashboardPage |
| `/profile` | ProfilePage |
| `/article-management/supplier-packing-change-requests` | SupplierPackingChangeRequests |

#### PMI (Business) Only

| Path | Component |
|---|---|
| `/article-management` | ArticleManagement |
| `/article-management-details/:id` | ArticleManagementDetails |
| `/article-management/packing-change-requests` | PackingChangeRequests |
| `/order-management` | OrderManagement |
| `/general-order-management` | GeneralOrderManagement |
| `/general-order-management/details/:id` | GeneralOrderDetails |
| `/transport-order-management` | TransportOrderManagement |
| `/transport-order-management/details/:id` | TransportOrderDetails |
| `/direct-shipment-order-management` | DirectShipmentOrderManagement |
| `/direct-shipment-order-management/details/:id` | DirectShipmentDetails |
| `/pm-order-management-change-requests` | PmOrderChangeRequests |
| `/complaint-management` | ComplaintManagement |
| `/pricing-management` | PricingManagement |
| `/all-pricing-change-requests` | AllPricingChangeRequests |
| `/pm-annual-price-data` | PmAnnualPriceData |
| `/annual-pricing-change-pending-requests` | AnnualPricingChangePendingRequests |
| `/supplier-pricing-notification-view` | SupplierPricingNotificationView |
| `/roles-management` | RolesManagement |
| `/master-data-management` | MasterDataManagement |
| `/category-management` | CategoryManagement |
| `/system-preferences` | SystemPreferences |
| `/notification-preferences` | NotificationPreferences |
| `/notification-template` | NotificationTemplate |
| `/contact-change-requests` | ContactChangeRequests |
| `/all-contact-change-history` | AllContactChangeHistory |
| `/analytics/overview` | AnalyticsOverview |
| `/analytics/supplier-overview` | AnalyticsSupplierOverview |

#### Vendor (Supplier) Only

| Path | Component |
|---|---|
| `/vendor-article-management` | VendorArticleManagement |
| `/packing-info/:id` | PackingInfo |
| `/edit-packing-info/:id` | EditPackingInfo |
| `/vendor-onboarding` | VendorOnboarding |
| `/supplier-order-management` | SupplierOrderManagement |
| `/supplier-general-order-management` | SupplierGeneralOrderManagement |
| `/supplier-general-order-management/details/:id` | SupplierGeneralOrderDetails |
| `/supplier-transport-order-management` | SupplierTransportOrderManagement |
| `/supplier-transport-order-management/details/:id` | SupplierTransportOrderDetails |
| `/supplier-direct-shipment-order-management` | SupplierDirectShipmentOrderManagement |
| `/supplier-direct-shipment-order-management/details/:id` | SupplierDirectShipmentDetails |
| `/supplier-order-management/transport/details/:id` | SupplierTransportDetails (alt) |
| `/supplier-released-orders` | SupplierReleasedOrders |
| `/supplier-released-orders/details/:id` | SupplierReleasedOrderDetails |
| `/supplier-order-management-change-requests` | SupplierOrderChangeRequests |
| `/supplier-shipping-method-history` | SupplierShippingMethodHistory |
| `/supplier-truck-providers` | SupplierTruckProviders |
| `/supplier-complaint` | SupplierComplaint |
| `/supplier-complaint/case-details/:id` | SupplierComplaintCaseDetails |
| `/supplier-complaint/upload-proofs/:id` | SupplierComplaintUploadProofs |
| `/supplier-complaint/archived-complaints/:id` | SupplierComplaintArchived |
| `/supplier-pricing-management` | SupplierPricingManagement |
| `/supplier-pricing-management-dashboard` | SupplierPricingDashboard |
| `/supplier-pricing-requests-view` | SupplierPricingRequestsView |
| `/supplier-annual-price-data` | SupplierAnnualPriceData |
| `/supplier-annual-pricing-change-pending-requests` | SupplierAnnualPricingPending |
| `/supplier-annual-pricing-view` | SupplierAnnualPricingView |
| `/analytics/supplier-overview-vendor` | AnalyticsSupplierOverviewVendor |

---

## 6. API Endpoint Reference

All API calls go through the gateway at the base URL. The gateway routes to the appropriate microservice.

### Authentication

| Method | Path | Description |
|---|---|---|
| POST | `/user/auth/login` | PMI login |
| POST | `/user/auth/vendor-login` | Vendor login |
| POST | `/user/auth/send-2fa` | Send PMI 2FA OTP |
| POST | `/user/auth/verify-2fa` | Verify PMI 2FA OTP |
| POST | `/user/auth/vendor-send-2fa` | Send vendor 2FA OTP |
| POST | `/user/auth/vendor-verify-2fa` | Verify vendor 2FA OTP |
| POST | `/user/auth/refresh` | Refresh access token |
| POST | `/user/auth/forgot-password` | Request PMI password reset |
| POST | `/user/auth/vendor-forgot-password` | Request vendor password reset |
| POST | `/user/auth/reset-password` | Set new PMI password |
| POST | `/user/auth/vendor-reset-password` | Set new vendor password |
| POST | `/user/auth/logout` | Invalidate refresh token |

### Users (PMI)

| Method | Path | Description |
|---|---|---|
| GET | `/user/users` | List all PMI users |
| POST | `/user/users` | Create PMI user |
| GET | `/user/users/:id` | Get PMI user by ID |
| PATCH | `/user/users/:id` | Update PMI user |
| DELETE | `/user/users/:id` | Delete PMI user |
| PATCH | `/user/users/:id/activate` | Activate/deactivate user |

### Vendors

| Method | Path | Description |
|---|---|---|
| GET | `/user/vendor` | List all vendors |
| POST | `/user/vendor/invite` | Invite new vendor |
| GET | `/user/vendor/:id` | Get vendor by ID |
| PATCH | `/user/vendor/:id` | Update vendor |
| DELETE | `/user/vendor/:id` | Delete vendor |
| PATCH | `/user/vendor/release/:id` | Release vendor |
| GET | `/user/vendor/onboarding/:id` | Get onboarding data |
| PATCH | `/user/vendor/onboarding/:id` | Update onboarding |
| GET | `/user/vendor/profile/:id` | Get vendor profile |
| PATCH | `/user/vendor/profile/:id` | Update vendor profile |
| GET | `/user/vendor/contacts/:vendorId` | List vendor contacts |
| POST | `/user/vendor/contacts/:vendorId` | Add contact |
| PATCH | `/user/vendor/contacts/:id` | Update contact |
| DELETE | `/user/vendor/contacts/:id` | Delete contact |
| GET | `/user/vendor/locations/:vendorId` | List locations |
| POST | `/user/vendor/locations/:vendorId` | Add location |
| PATCH | `/user/vendor/locations/:id` | Update location |
| DELETE | `/user/vendor/locations/:id` | Delete location |
| GET | `/user/vendor/payment/:vendorId` | Get payment details |
| PATCH | `/user/vendor/payment/:vendorId` | Update payment details |
| GET | `/user/vendor/certifications/:vendorId` | List certifications |
| POST | `/user/vendor/certifications/:vendorId` | Upload certification |
| PATCH | `/user/vendor/certifications/:id` | Update certification |
| DELETE | `/user/vendor/certifications/:id` | Delete certification |
| GET | `/user/vendor/release-history/:vendorId` | Get release history |
| GET | `/user/vendor/change-history/:vendorId` | Profile change history |

### Articles

| Method | Path | Description |
|---|---|---|
| GET | `/user/article` | List all PM articles |
| POST | `/user/article` | Create PM article |
| GET | `/user/article/:id` | Get article by ID |
| PATCH | `/user/article/:id` | Update article |
| DELETE | `/user/article/:id` | Soft-delete article |
| PATCH | `/user/article/:id/activate` | Activate/deactivate |
| GET | `/user/article/supplier` | List article-supplier links |
| POST | `/user/article/supplier` | Create article-supplier link |
| GET | `/user/article/supplier/:id` | Get article-supplier |
| PATCH | `/user/article/supplier/:id` | Update article-supplier |
| GET | `/user/pm-article-full-view/:id` | Full PM article with relations |
| GET | `/user/supplier-article-with-relations/:id` | Supplier article with packaging |
| POST | `/user/article/request-packaging` | PMI requests packaging from vendor |
| GET | `/user/article/packaging/:articleSupplierId` | Get packaging records |
| POST | `/user/article/create-packaging` | Vendor submits new packaging |
| POST | `/user/article/update-packaging` | Vendor submits packaging update |
| POST | `/user/article/approve-packaging/:id` | PMI approves/rejects packaging |
| GET | `/user/article/packing-change-requests` | List packaging change requests |
| GET | `/user/article/supplier-packing-change-requests` | Vendor's packing change requests |

### Pricing

| Method | Path | Description |
|---|---|---|
| GET | `/user/pricing` | List all pricing records |
| POST | `/user/pricing/create` | Create new price |
| GET | `/user/pricing/:id` | Get pricing record |
| PATCH | `/user/pricing/:id` | Update pricing |
| GET | `/user/pricing/change-requests` | List price change requests |
| POST | `/user/pricing/change-request` | Submit price change request |
| POST | `/user/pricing/approve-reject/:id` | Approve/reject price CR |
| GET | `/user/pricing/annual` | List annual price data |
| POST | `/user/pricing/annual` | Create annual price |
| GET | `/user/pricing/annual/change-requests` | Annual price CRs |
| POST | `/user/pricing/annual/approve-reject/:id` | Approve/reject annual CR |

### Roles & Permissions

| Method | Path | Description |
|---|---|---|
| GET | `/user/roles` | List all roles |
| POST | `/user/roles` | Create role |
| GET | `/user/roles/:id` | Get role |
| PATCH | `/user/roles/:id` | Update role |
| DELETE | `/user/roles/:id` | Delete role |
| GET | `/user/permissions` | List all permissions |
| POST | `/user/permissions` | Create permission |
| PATCH | `/user/roles/:id/permissions` | Assign permissions to role |

### System / Master Data

| Method | Path | Description |
|---|---|---|
| GET | `/user/system-preferences` | Get global preferences |
| PATCH | `/user/system-preferences` | Update global preferences |
| GET | `/user/uom` | List UOMs |
| POST | `/user/uom` | Create UOM |
| PATCH | `/user/uom/:id` | Update UOM |
| DELETE | `/user/uom/:id` | Delete UOM |
| GET | `/user/currency` | List currencies |
| POST | `/user/currency` | Create currency |
| PATCH | `/user/currency/:id` | Update currency |
| DELETE | `/user/currency/:id` | Delete currency |
| GET | `/user/tolerance-settings` | Get tolerance settings |
| PATCH | `/user/tolerance-settings/:id` | Update tolerance settings |
| GET | `/user/categories` | List categories |
| POST | `/user/categories` | Create category |
| PATCH | `/user/categories/:id` | Update category |
| GET | `/user/sub-categories` | List sub-categories |
| POST | `/user/sub-categories` | Create sub-category |
| GET | `/user/notification-template` | List email templates |
| PATCH | `/user/notification-template/:id` | Update email template |
| GET | `/user/supplier-evaluation` | Get evaluation data |

### PMI Contacts

| Method | Path | Description |
|---|---|---|
| GET | `/user/pmi-contacts` | List PMI contacts |
| POST | `/user/pmi-contacts` | Create PMI contact |
| PATCH | `/user/pmi-contacts/:id` | Update PMI contact |
| DELETE | `/user/pmi-contacts/:id` | Delete PMI contact |
| GET | `/user/pmi-contacts/mapping/:vendorId` | Get contact-vendor mappings |
| POST | `/user/pmi-contacts/mapping` | Create contact-vendor mapping |
| DELETE | `/user/pmi-contacts/mapping/:id` | Remove mapping |

### Tasks / Notifications

| Method | Path | Description |
|---|---|---|
| GET | `/user/tasks` | List user's tasks |
| PATCH | `/user/tasks/:id/read` | Mark task as read |
| PATCH | `/user/tasks/:id/status` | Update task status |

### Contact Change Requests

| Method | Path | Description |
|---|---|---|
| GET | `/user/contact-change-requests` | List all contact CRs |
| POST | `/user/contact-change-requests` | Submit contact CR |
| POST | `/user/contact-change-requests/approve-reject/:id` | Approve/reject CR |
| GET | `/user/contact-change-history` | Contact change history |

### Orders (Order Module)

| Method | Path | Description |
|---|---|---|
| GET | `/order/orders` | List all orders |
| POST | `/order/orders` | Create order |
| GET | `/order/order-view/:id` | Get order with full relations |
| PATCH | `/order/orders/:id` | Update order |
| DELETE | `/order/orders/:id` | Delete order |
| PATCH | `/order/orders/:id/release` | Release order to vendor |
| GET | `/order/orders/general` | List general orders |
| GET | `/order/orders/transport` | List transport orders |
| GET | `/order/orders/direct-shipment` | List direct shipment orders |
| GET | `/order/orders/released` | List released orders (vendor) |
| GET | `/order/delivery-changes/:orderId` | Get delivery changes |
| POST | `/order/delivery-changes` | Create delivery change |
| PATCH | `/order/delivery-changes/:id` | Update delivery change |
| GET | `/order/shipping-history/:orderId` | Get shipping method history |
| POST | `/order/shipping-history` | Record shipping method change |

### Complaints (Order Module)

| Method | Path | Description |
|---|---|---|
| GET | `/order/complaints` | List all complaints |
| POST | `/order/complaints` | Create complaint |
| GET | `/order/complaints/:id` | Get complaint with relations |
| PATCH | `/order/complaints/:id` | Update complaint |
| POST | `/order/complaints/:id/documents` | Upload complaint document |
| GET | `/order/complaints/archived` | List archived complaints |

---

## 7. Status Lifecycle Reference

### packaging_status (article_supplier)

| Value | Meaning | Set When |
|---|---|---|
| `null` / empty | Not yet requested | Article-supplier record created |
| `'pending'` | PMI requested, vendor hasn't submitted | PMI clicks "Request Packaging Information" |
| `'pending_review'` | Vendor submitted, awaiting PMI decision | Vendor submits packing info (create or update) |
| `'approved'` | Packaging data approved by PMI | PMI approves packaging change request |
| Reverted to `'pending'` | Rejected new submission | PMI rejects a create request (no prior packaging) |
| Reverted to `'approved'` | Rejected update | PMI rejects an update request (existing data preserved) |

### packaging_change_requests.approve_reject_status

`'pending'` → `'approved'` or `'rejected'`

### pricing_change_requests.approve_reject_status

`PENDING` → `APPROVED` or `REJECTED`

### vendor.release_status

`PENDING` → `RELEASED`

### vendor.invite_status

`INVITED` → (vendor logs in) → `ACTIVE`

### certifications.status

`'Pending QA Review'` → `'Approved'` or `'Rejected'`

### payment_detail.status

`PENDING` → `APPROVED`

### complaint_cases.complaint_status

`OPEN` → `UNDER_REVIEW` → `RESOLVED` / `CLOSED`

### order_master.order_status

`OPEN` → `RELEASED` → `COMPLETED` / `PARTIAL` / `NOT_COMPLETED`

### tasks.status

`PENDING` → `COMPLETED` / `CANCELLED`

---

## 8. Agentic AI RFQ Module (SCP-App-Agents)

### 8.1 Purpose & Status

`SCP-App-Agents` is a fifth NestJS microservice, built directly inside the SCP application family (not on Accelance's AI Platform / Flowise), backing the **Agentic AI RFQ Module**: a set of Claude Agent SDK-based agents that assist buyers through the lifecycle of a Request-for-Quote — drafting, supplier Q&A, shortlisting, bid analysis/award, negotiation, and post-award analytics.

It is a TCP microservice on **port 3004**, reached only through `SCP-App-API-Gateway`, same pattern as `SCP-App-User-Module` (3001) and `SCP-App-Order-Module` (3003) — auth, CORS, and rate limiting stay centralized in the Gateway rather than duplicated here.

**Status as of this writing:** the agent code, guardrail machinery, audit logging, MCP server wiring, and knowledge layer described below all exist in source. What does **not** yet exist is the RFQ domain itself — `SCP-App-User-Module` and `SCP-App-Order-Module` do not yet have RFQ/quote/clarification entities or the MCP HTTP servers (`mcp-rfq`, `mcp-article`, `mcp-supplier`, `mcp-pricing`, `mcp-complaint`, `mcp-order`) these agents call at `localhost:3005`/`3006`. Several external integrations are also "provisioned but not filled in" — real credentials are required before these paths do anything beyond fail loudly with a clear error:

| Integration | Vendor | Configured via | Current state |
|---|---|---|---|
| LLM calls | Anthropic (Claude) | `ANTHROPIC_API_KEY` | Verified at boot with a cheap `models.list()` call; service still starts on a bad/placeholder key, just logs a warning |
| Embeddings | Voyage AI (`voyage-3`) | `VOYAGE_API_KEY` | Fails loudly if unset — no first-party Anthropic embeddings endpoint exists |
| ERP | Microsoft Dynamics 365 Business Central | `BC_TENANT_ID` / `BC_CLIENT_ID` / `BC_CLIENT_SECRET` / `BC_ENVIRONMENT` / `BC_COMPANY_ID` | Not yet provisioned |
| E-signature | Dropbox Sign (chosen 2026-07-17 over DocuSign/Adobe/SignNow/PandaDoc for self-serve signup) | `DROPBOX_SIGN_API_KEY` | Not yet provisioned; test mode on by default |
| Market price index | Alpha Vantage (chosen 2026-07-17 — ICIS/Fastmarkets/Bloomberg all require an existing paid license) | `MARKET_INDEX_API_KEY` | Covers energy/metals/agricultural commodities only; plastics/packaging/electronics categories return `null` by design |

Note: `SCP-App-Agents/README.md` currently has an unresolved git merge conflict (stale skeleton-only status text merged against the real one) — worth cleaning up separately from this documentation pass.

### 8.2 Architecture

```
API Gateway (3000)
      │ TCP
      ▼
Agents Module (3004) ── TypeORM/PostgreSQL (agent_audit_logs only)
      │
      ├─ TCP → User-Module (3001)   "checkUserPermission", "createAgentPendingApproval",
      │                              "getRfqById", "getApprovalTier", etc.
      ├─ TCP → Order-Module (3003)  "createPurchaseOrderFromRfq"
      │
      ├─ HTTP MCP → User-Module hybrid HTTP listener (3005)
      │              mcp-rfq, mcp-article, mcp-supplier, mcp-pricing
      ├─ HTTP MCP → Order-Module hybrid HTTP listener (3006)
      │              mcp-order, mcp-complaint
      │
      └─ In-process SDK MCP servers (no network hop, external systems only)
                     mcp-erp (Business Central), mcp-esignature (Dropbox Sign),
                     mcp-market-index (Alpha Vantage)
```

Each agent is a standalone async function (not a Nest provider) that calls `startup()` from `@anthropic-ai/claude-agent-sdk`, scoping the model to exactly the MCP tools its task needs — "each agent gets only the tools its stage needs" is a deliberate architecture principle, not an oversight. All dispatch happens through a single `@MessagePattern('agents')` handler in `AgentAuditController` (an action/data switch, mirroring User-Module's own dispatch convention), covering both audit-log queries and the six `run*Agent` invocations.

### 8.3 Model Tiering

Agents read their model from a shared tier policy (`config/model-tier.ts`) rather than hardcoding a model string per agent:

| Tier | Default model | Used by | Fallback model |
|---|---|---|---|
| `reasoning` | Sonnet | Requirements & Drafting, Collaboration & Q&A, Shortlisting & Risk, Negotiation (draft step) | Opus |
| `high-stakes` | Opus | Bid Analysis & Award, Negotiation (draft + execute steps) | Opus |
| `single-shot` | Haiku | Negotiation (independent verifier step) | Sonnet |

Every tier and its fallback are overridable per environment (`AGENT_MODEL_REASONING`, `AGENT_MODEL_HIGH_STAKES`, `AGENT_MODEL_SINGLE_SHOT`, and their `_FALLBACK` counterparts). The fallback model is passed as the SDK's `fallbackModel` option — the CLI retries automatically on a different model family when a turn ends with `stop_reason: "refusal"`, so a false-positive safety-classifier hit isn't just retried into the same refusal again.

### 8.4 Guardrails: Approval, Spend Caps, Audit

Four guardrail concerns, each with a distinct mechanism:

**Per-run limits** (`config/agent-limits.ts`, read via `AnthropicConfigService.limits` inside Nest or `getAgentLimits()` outside it):
- `AGENT_MAX_TOOL_ITERATIONS` (default 25) → passed as the SDK's native `maxTurns`
- `AGENT_MAX_TOKENS_PER_RUN` (default 200,000) → checked *after* completion against real usage (the SDK has no reliable pre-completion usage signal), surfaced as `budgetExceeded`
- `AGENT_RUN_TIMEOUT_MS` (default 120,000) → enforced via `AbortController` + `setTimeout`, since the SDK has no built-in "abort after N ms" option

**Spend caps** (`audit/spend-check.ts`): `getCurrentSpend()` sums real `total_cost_usd` directly from `agent_audit_logs` (today and this month) — not a separately-tracked counter that could drift from reality. `AGENT_DAILY_SPEND_CAP_USD` / `AGENT_MONTHLY_SPEND_CAP_USD` are `undefined` by default, meaning *not enforced* rather than *unlimited*. Every agent checks this before starting a run and refuses (with a clear user-facing message) if a cap is already exceeded; it warns once spend crosses 80% of either cap.

**Tool-level approval gates** (`guardrails/guardrail-hooks.ts` — `createGuardrailHooks`): a `PreToolUse` SDK hook wraps specific tool names. For each gated call:
- `alwaysRequireApproval: true` → always creates a pending-approval, no permission check (used for Requirements & Drafting's `submit_award` — a drafting agent should never award anything, full stop)
- `requiredPermission` → calls back to User-Module's `checkUserPermission`; a failed/errored check **fails closed** (denies)
- `customCheck` → an arbitrary async predicate, used by the Negotiation agent's bounded-%/tiered-ceiling rule (see 8.5); also fails closed on error

When a call is denied, the hook calls User-Module's `createAgentPendingApproval` (durable row + a `tasks` notification for a human with the `required_role`, default `'Procurement Manager'`) and returns a `deny` decision with the rationale — the tool never executes that turn. This is the one mechanism every "recommend, don't execute" agent relies on.

**Audit trail** (`agent_audit_logs`, see 8.8): every run — successful or not — writes one row via `writeAgentAuditLog` (used by non-DI agent functions) or `AgentAuditService.logRun` (Nest DI). Exposed to the frontend/Settings area via the same `agents` message pattern:
- `listAgentAuditLog` — paginated, filterable by agent name / success/error
- `getAgentSpendSummary` — today/month spend vs. caps
- `getAgentAuditTrailForRfq` — full chronological AI decision trail for one RFQ
- `exportAgentAuditTrailForRfqCsv` — the same trail as a CSV export (model, tools called, rationale, cost, outcome) for external audit
- `purgeAuditEntriesOlderThanRetention` — exists but is **not scheduled anywhere**; retention (`AGENT_AUDIT_RETENTION_DAYS`) is an Accelance compliance decision not yet made, left unset ("keep everything") until it is

### 8.5 The Six Agents

| Agent | Model tier | Reads | Can it write anything itself? | Output |
|---|---|---|---|---|
| **Requirements & Drafting** | reasoning | RFQ (read-only), Article | No — never calls `create_rfq_draft`; a browser confirmation step creates the RFQ after buyer review. `submit_award` is hard-gated (`alwaysRequireApproval`) as a defense-in-depth measure even though this agent isn't given a reason to call it | Per-field draft (`title`, `article_number`, `volume`, `delivery_location`, `submission_deadline`) each with a `High`/`Medium`/`Low`/`Unknown` confidence, plus `missing_required_info` |
| **Collaboration & Q&A** | reasoning | RFQ (redacted public context only — budget, internal notes, target price never returned), Article, vendor-scoped supplier-terms/quote-status tools (resolve the asking vendor server-side from `clarification_id`, never a caller-supplied `vendor_id`) | No — has no post/write tool at all. Every draft unconditionally becomes a pending-approval via `createAgentPendingApproval`, no "sometimes auto-send" path exists | `draft_reply`, `confidence`, `rationale` |
| **Shortlisting & Risk** | reasoning | RFQ, Supplier scorecards, vendor complaint summaries | No — ranking is a recommendation; buyer accepts/rejects vendors through SCP's existing invite-vendor flow | Ranked `shortlist[]` (vendor_id, rank, recommended, rationale) — ranks the candidate pool it's given, does not discover eligible vendors itself |
| **Bid Analysis & Award** | high-stakes | RFQ's own composite Price/Quality/Delivery/Risk score (`get_scored_comparison` — reuses the real scoring engine rather than re-deriving one), quote line items, pricing history | No — read-only tools only; the actual award still goes through the existing buyer-initiated award path | `recommended_vendor_id`/`quote_id`, `rationale`, `scoring_summary`, `outlier_line_items[]` (flagged against the RFQ's own `target_price`) |
| **Negotiation** | high-stakes (draft/execute) + single-shot (verifier) | RFQ, quote comparison, negotiation history, market-index benchmark | **Conditionally yes** — the only agent with any execute path; see below | `counter_price`, `rationale`, `autoSent`, `outlierFlagged`, `pendingApprovalCreated` |
| **Analytics & Playbook** | reasoning (summary step only) | RFQ, quote comparison (post-award only — checks `rfq_status === 'AWARDED'` before running) | Yes, but deterministically, not as an LLM decision — see below | `executive_summary`, `category_playbook_note`, `savings_analysis`, `poHandoff`, `contractHandoff` |

**Negotiation agent detail** — the highest-risk agent, built as three separate SDK calls so no single call both drafts and marks its own homework:
1. **Draft** — read-only tools only; structurally cannot call `send_counter_offer`.
2. **Independent verifier** (separate, cheap-tier model call, given only the draft + the real tool-call transcript) — checks every numeric claim is actually traceable to a tool result. Defaults to `grounded=false` if uncertain. A `null` market benchmark is treated as an unsupported grounding basis, not neutral.
3. **Execute** — only reached if verified grounded; a minimal SDK call whose only tool is `send_counter_offer`, gated by a `PreToolUse` hook whose `customCheck` re-verifies (independently of the verifier) that the offer is within `NEGOTIATION_MAX_COUNTER_PCT` (default 5%, the flat autonomy band locked 2026-07-09) **and** within the calling user's PHASE3-2 tiered approval ceiling (`maxApprovalValue`/`maxRiskTier` from `getApprovalTier`). If ungrounded, an outlier is flagged and a pending-approval is created without ever attempting the hook check at all.

`NEGOTIATION_SHADOW_MODE` is **permanently on by product decision** (not a UAT-pending flag to eventually flip) — every offer always becomes a pending-approval regardless of what the bounded-%/tiered-ceiling check would have decided; that verdict is recorded in the pending-approval's rationale for reviewer context only.

**Analytics & Playbook detail** — runs after award, three deterministic hand-off steps plus one LLM summarization step (deliberately not folded into one agent turn, since PO/contract creation are mechanical calls with a known-correct outcome once award already happened, not judgment calls):
1. PO handoff → calls Order-Module's `createPurchaseOrderFromRfq` directly (not an LLM tool call); idempotent, so re-running this agent after a PO already exists is a no-op success.
2. Contract handoff → Dropbox Sign envelope creation; expected to fail today (vendor not yet provisioned), recorded as a failed-but-handled step rather than swallowed.
3. Executive summary + category playbook note → the one real LLM step, grounded in `get_rfq`/`get_quote_comparison`.
4. **Not built:** a persisted, browsable "Category Playbook" entity/screen — the playbook *note* text is produced per run but there is nowhere in SCP today to file it as a structured record. Flagged as a known gap, not silently expanded into a new screen beyond what was scoped.

Every agent that configures MCP servers also has a documented failure-recovery quirk: an occasional run starts the model's first turn before the MCP HTTP handshake genuinely completes (despite `waitForMcpServersReady`'s poll), the model sees zero tools, correctly refuses to guess, and its only "tool call" is the mandatory `StructuredOutput` finalizer. Every agent detects this (`hadNoRealToolCalls`) and retries once with a fresh subprocess, which reliably recovers.

### 8.6 MCP Servers

Two categories, by transport:

**HTTP MCP servers** (expected to live inside User-Module/Order-Module, called over the network — **not yet built** as of this writing):

| Server | Expected host:port | Consumed by |
|---|---|---|
| `mcp-rfq` | User-Module `:3005/mcp/rfq` | All six agents |
| `mcp-article` | User-Module `:3005/mcp/article` | Requirements & Drafting, Collaboration & Q&A |
| `mcp-supplier` | User-Module `:3005/mcp/supplier` | Shortlisting & Risk |
| `mcp-pricing` | User-Module `:3005/mcp/pricing` | Bid Analysis & Award |
| `mcp-order` | Order-Module `:3006/mcp/order` | (reserved) |
| `mcp-complaint` | Order-Module `:3006/mcp/complaint` | Shortlisting & Risk |

**In-process SDK MCP servers** (`createSdkMcpServer` from `@anthropic-ai/claude-agent-sdk` — no network hop, since these wrap genuinely external systems only ever consumed from within Agents itself):

| Server | Wraps | Tools | Notes |
|---|---|---|---|
| `mcp-erp` | Business Central (OData v2.0, OAuth2 client-credentials) | `get_erp_vendor`, `get_erp_purchase_order_status` | Same Azure AD tenant as the separate BC-integration learning effort ([[project_bc_integration]]) |
| `mcp-esignature` | Dropbox Sign | `send_contract_for_signature`, `get_contract_signature_status` | Test mode on by default (`DROPBOX_SIGN_TEST_MODE`) |
| `mcp-market-index` | Alpha Vantage | `get_price_index_for_category` | Returns `null` (not an error) for categories Alpha Vantage doesn't index (plastics, packaging, electronics) |

### 8.7 Knowledge Layer (Semantic Search)

A pgvector-backed semantic search layer for RFQ specs and clarification Q&A, decoupled from where that content actually lives (callers pass content in; this layer doesn't fetch anything itself):

- `ensureKnowledgeSchema()` runs at boot (best-effort — logs and continues on failure rather than crashing the service): `CREATE EXTENSION IF NOT EXISTS vector`, a `knowledge_embeddings` table (not a TypeORM entity — no native `vector` column type, and the `<=>` distance operator needs raw SQL anyway), plus a B-tree index on `(source_type, source_id)` and an `ivfflat` cosine-distance index.
- `generateEmbedding()` calls Voyage AI (`voyage-3`, 1024 dimensions) — Anthropic's recommended embeddings partner, since Claude has no first-party embeddings endpoint.
- `ingestKnowledge(sourceType, sourceId, content)` and `semanticSearch(query, {sourceType, limit})` are exposed via the same `agents` message pattern (`ingestKnowledge`, `semanticSearchKnowledge`).
- On Azure Database for PostgreSQL, the `vector` extension must be allow-listed server-side (`az postgres flexible-server parameter set --name azure.extensions --value vector`) before `CREATE EXTENSION` succeeds — a portal/CLI action, not something the app can force.

### 8.8 Data Model

#### `agent_audit_logs`

One row per agent run — the "AI decision trail" surfaced in SCP's Settings area. Owned entirely by `SCP-App-Agents` (own TypeORM connection, own `synchronize`, separate from User-Module's connection/tables).

| Column | Type | Notes |
|---|---|---|
| `id` | int PK | |
| `agent_name` | varchar(100) | indexed; e.g. `'requirements-drafting'`, `'negotiation'` |
| `requested_by_user_id` | int | nullable |
| `rfq_id` | int | nullable, indexed; best-effort — populated only if some tool call in the run carried an `rfq_id` |
| `user_prompt` | text | nullable |
| `tool_calls` | jsonb | array of `{name, input}`, default `[]` |
| `final_text` | text | nullable |
| `model` | varchar(50) | nullable |
| `num_turns` | int | default 0 |
| `total_cost_usd` | float | default 0 — real per-run cost from the SDK, source of truth for spend-cap checks |
| `duration_ms` | int | default 0 |
| `is_error` | boolean | default false, indexed |
| `created_at` | timestamptz | auto |

`knowledge_embeddings` (see 8.7) is a second table this service owns, created via raw SQL rather than a TypeORM entity.

### 8.9 Environment Variables Reference

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | 3004 | TCP microservice port |
| `DB_HOST` / `DB_PORT` / `DB_USER_NAME` / `DB_PASSWORD` / `DB_NAME` / `DB_SSL` | — | Shared SCP Postgres instance (same as the other four services) |
| `ANTHROPIC_API_KEY` | — | Required at boot; missing entirely throws, a rejected/placeholder key just logs a warning |
| `AGENT_MAX_TOOL_ITERATIONS` | 25 | Native SDK `maxTurns` cap |
| `AGENT_MAX_TOKENS_PER_RUN` | 200,000 | Post-hoc budget check |
| `AGENT_RUN_TIMEOUT_MS` | 120,000 | Wall-clock abort via `AbortController` |
| `AGENT_DAILY_SPEND_CAP_USD` / `AGENT_MONTHLY_SPEND_CAP_USD` | unset (not enforced) | Hard cutoffs checked against real cumulative spend |
| `AGENT_MODEL_REASONING` / `AGENT_MODEL_HIGH_STAKES` / `AGENT_MODEL_SINGLE_SHOT` (+ `_FALLBACK` variants) | sonnet/opus/haiku (fallbacks opus/opus/sonnet) | Per-tier model overrides |
| `USER_SERVICE_HOST` / `USER_SERVICE_PORT` | localhost / 3001 | Guardrail hooks + pending-approval calls |
| `ORDER_SERVICE_HOST` / `ORDER_SERVICE_PORT` | localhost / 3003 | Analytics & Playbook's PO handoff |
| `MCP_RFQ_URL` / `MCP_ARTICLE_URL` / `MCP_SUPPLIER_URL` / `MCP_PRICING_URL` | `http://localhost:3005/mcp/...` | User-Module's hybrid HTTP MCP listener |
| `MCP_ORDER_URL` / `MCP_COMPLAINT_URL` | `http://localhost:3006/mcp/...` | Order-Module's hybrid HTTP MCP listener |
| `VOYAGE_API_KEY` / `VOYAGE_EMBEDDING_MODEL` / `EMBEDDING_DIMENSION` | — / voyage-3 / 1024 | Knowledge-layer embeddings |
| `BC_TENANT_ID` / `BC_CLIENT_ID` / `BC_CLIENT_SECRET` / `BC_ENVIRONMENT` / `BC_COMPANY_ID` | — | Business Central (mcp-erp) |
| `DROPBOX_SIGN_API_KEY` / `DROPBOX_SIGN_BASE_URL` / `DROPBOX_SIGN_TEST_MODE` | — / hellosign default / true | E-signature (mcp-esignature) |
| `MARKET_INDEX_API_KEY` / `MARKET_INDEX_API_BASE_URL` | — / alphavantage.co | Market benchmark (mcp-market-index) |
| `NEGOTIATION_MAX_COUNTER_PCT` | 5 | Negotiation agent's bounded autonomy band |
| `NEGOTIATION_SHADOW_MODE` | true (permanent) | Forces every negotiation offer through pending-approval regardless of the bounded-check verdict |
| `AGENT_AUDIT_RETENTION_DAYS` | unset (keep everything) | Used only if `purgeAuditEntriesOlderThanRetention` is deliberately wired to a schedule — it is not, today |

---

*Document covers the full application state as of 2026-08-03, including the in-progress Agentic AI RFQ Module (§8). For changes after this date, consult git history and the entity files in `SCP-App-User-Module/apps/user/src/`, `SCP-App-Order-Module/`, and `SCP-App-Agents/src/`.*
