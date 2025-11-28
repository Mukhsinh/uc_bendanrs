# Implementation Plan - UI Manajemen Tenant dan User Terpadu

## Overview

Implementation plan ini memecah enhancement UI Manajemen Akses menjadi task-task yang dapat dieksekusi secara incremental. Setiap task dirancang untuk build on previous tasks dan dapat diverifikasi secara independen.

## Progress Summary

**Overall Progress**: 14/17 Phases (82%)

### Phases Overview

- **Phase 1**: ✅ Setup struktur komponen dan service (2 tasks) - COMPLETED
- **Phase 2**: ✅ Service layer tenant management (5 tasks) - COMPLETED
- **Phase 3**: ✅ Update userManagement service (3 tasks) - COMPLETED
- **Phase 4**: ✅ Komponen SearchFilter (4 tasks) - COMPLETED
- **Phase 5**: ✅ Komponen TenantTable (5 tasks) - COMPLETED
- **Phase 6**: ✅ Komponen TenantUserList (3 tasks) - COMPLETED
- **Phase 7**: ✅ Komponen CreateTenantDialog (6 tasks) - COMPLETED
- **Phase 8**: ✅ Komponen TenantManagementTab (5 tasks) - COMPLETED
- **Phase 9**: ✅ Update UserManagementTab (6 tasks) - COMPLETED
- **Phase 10**: ✅ Halaman ManajemenAkses (7 tasks) - COMPLETED
- **Phase 11**: ✅ Update routing dan navigation (4 tasks) - COMPLETED
- **Phase 12**: ✅ Audit logging (4 tasks) - COMPLETED
- **Phase 13**: ✅ Loading states dan error handling (5 tasks) - COMPLETED
- **Phase 14**: ✅ Performance optimizations (4 tasks) - COMPLETED
- **Phase 15**: ❌ Property-based tests (9 tasks) - NOT STARTED
- **Phase 16**: ❌ Checkpoint (1 task) - NOT STARTED
- **Phase 17**: ⚠️ Documentation dan cleanup (4 tasks) - PARTIAL (2/4 completed)

**Total Tasks**: 72 tasks
**Completed**: 58 tasks (81%)
**Remaining**: 14 tasks (19%)

**Testing Approach**: Comprehensive testing with property-based tests
- Unit tests untuk semua components dan services ✅ COMPLETED
- Property-based tests dengan fast-check (100 iterations) ⚠️ IN PROGRESS
- Integration tests untuk complete flows ✅ COMPLETED
- All tests are required (no optional tests)

## Task List

- [x] 1. Setup struktur komponen dan service baru


  - Buat folder struktur untuk komponen ManajemenAkses
  - Buat file service tenantManagement.ts
  - Setup exports dan imports
  - _Requirements: 15.1, 15.2_

- [x] 1.1 Buat folder dan file struktur


  - Buat folder `src/components/ManajemenAkses/`
  - Buat file placeholder untuk semua komponen
  - Buat file `src/services/tenantManagement.ts`
  - _Requirements: 15.1_

- [x] 1.2 Setup TypeScript interfaces


  - Define interfaces untuk Tenant, TenantWithUsers
  - Define interfaces untuk form data
  - Export interfaces dari index file
  - _Requirements: 15.1_

- [x] 2. Implementasi service layer untuk tenant management


  - Implement fetchTenants dengan filtering
  - Implement fetchUsersByTenant
  - Implement toggleTenantStatus
  - Implement createTenant wrapper
  - _Requirements: 15.1, 15.2_

- [x] 2.1 Implement fetchTenants function


  - Query tenants table dengan join user_profiles
  - Add search query filtering
  - Add status filtering
  - Return tenant dengan user_count
  - _Requirements: 1.2, 13.2_

- [x] 2.2 Implement fetchUsersByTenant function

  - Query user_profiles dengan tenant_id filter
  - Join dengan user_roles untuk role info
  - Return user list dengan role dan status
  - _Requirements: 3.3, 3.4_

- [x] 2.3 Implement toggleTenantStatus function

  - Update tenant is_active status
  - Log audit trail
  - Return success/error result
  - _Requirements: 4.2, 4.4_

- [x] 2.4 Implement createTenant wrapper

  - Call existing createTenant from tenantOnboarding
  - Handle errors dan return formatted result
  - _Requirements: 2.2, 2.3, 2.4_

- [x] 2.5 Write unit tests untuk tenant services


  - Test fetchTenants dengan berbagai filters
  - Test toggleTenantStatus
  - Test error handling
  - _Requirements: 15.1_

- [x] 3. Update userManagement service dengan filtering


  - Add fetchUsers function dengan filters
  - Add toggleUserStatus helper
  - Maintain backward compatibility
  - _Requirements: 15.2, 14.2, 14.3, 14.4_

- [x] 3.1 Implement fetchUsers function


  - Call getAllUsers
  - Apply search query filter
  - Apply role filter
  - Apply status filter
  - _Requirements: 14.2, 14.3, 14.4_

- [x] 3.2 Implement toggleUserStatus helper

  - Call activateUser atau deactivateUser based on status
  - Return result
  - _Requirements: 8.2, 8.5_

- [x] 3.3 Write unit tests untuk user service updates


  - Test fetchUsers filtering logic
  - Test toggleUserStatus
  - _Requirements: 15.2_


- [x] 4. Buat komponen SearchFilter

  - Implement TenantSearchFilter component
  - Implement UserSearchFilter component
  - Add debouncing untuk search input
  - _Requirements: 13.1, 13.2, 14.1, 14.2_

- [x] 4.1 Implement TenantSearchFilter component

  - Input field untuk search query
  - Select dropdown untuk status filter
  - Handle onChange events
  - _Requirements: 13.1, 13.2, 13.3_

- [x] 4.2 Implement UserSearchFilter component

  - Input field untuk search query
  - Select dropdown untuk role filter
  - Select dropdown untuk status filter
  - Handle onChange events
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 4.3 Add debouncing untuk search input
  - Create useDebounce custom hook
  - Apply debounce to search inputs in both filters
  - Set delay 300ms
  - Test debouncing behavior manually
  - _Requirements: 13.2, 14.2_

- [x] 4.4 Write unit tests untuk SearchFilter components
  - Test TenantSearchFilter: search input changes, status filter changes
  - Test UserSearchFilter: search input changes, role filter changes, status filter changes
  - Test debouncing behavior dengan fake timers
  - Verify correct callbacks are called with debounced values
  - _Requirements: 13.2, 14.2_

- [x] 5. Buat TenantTable component
  - Implement table dengan expandable rows
  - Add status toggle switch
  - Add actions column
  - _Requirements: 1.2, 3.1, 4.1_

- [x] 5.1 Implement basic table structure
  - TableHeader dengan columns
  - TableBody dengan tenant rows
  - Loading state
  - Empty state
  - _Requirements: 1.2_

- [x] 5.2 Implement expandable row functionality
  - Add chevron icon untuk expand/collapse
  - Handle row click untuk toggle expand
  - Render TenantUserList dalam expanded row
  - _Requirements: 3.1, 3.2_

- [x] 5.3 Implement status toggle switch
  - Add Switch component
  - Handle toggle dengan confirmation
  - Update UI optimistically
  - _Requirements: 4.1, 4.2_

- [x] 5.4 Add actions column
  - Settings button untuk navigate ke tenant settings
  - Handle click events
  - _Requirements: 1.2_

- [x] 5.5 Write unit tests untuk TenantTable


  - Test row rendering dengan mock data
  - Test expand/collapse functionality
  - Test status toggle dengan mock handler
  - Test loading state display
  - Test empty state display
  - _Requirements: 1.2, 3.1, 4.1_

- [x] 6. Buat TenantUserList component
  - Display user list dalam expanded tenant row
  - Show user email, name, role, status
  - Add loading state
  - _Requirements: 3.3, 3.4_

- [x] 6.1 Implement TenantUserList component
  - Fetch users by tenant_id dengan useQuery
  - Render table dengan user data
  - Show role badges dengan colors
  - Show status badges
  - _Requirements: 3.3, 3.4_

- [x] 6.2 Add loading dan empty states
  - Show spinner saat loading
  - Show "Tidak ada user" jika empty
  - _Requirements: 11.1_

- [x] 6.3 Write unit tests untuk TenantUserList


  - Test user list rendering dengan mock data
  - Test loading state display
  - Test empty state display
  - Test role badge rendering
  - Test status badge rendering
  - _Requirements: 3.3_

- [x] 7. Buat CreateTenantDialog component
  - Implement form dengan validation
  - Add auto-generate slug dari name
  - Handle form submission
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 7.1 Setup form dengan React Hook Form dan Zod
  - Define Zod schema untuk validation
  - Setup useForm hook
  - Define form fields
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 7.2 Implement form fields
  - Input untuk nama rumah sakit
  - Input untuk slug (auto-generated)
  - Separator
  - Input untuk email admin
  - Input untuk nama admin
  - Input untuk password admin
  - _Requirements: 2.1_

- [x] 7.3 Implement auto-generate slug
  - Watch name field changes
  - Generate kebab-case slug
  - Update slug field
  - _Requirements: 12.3_

- [x] 7.4 Implement form submission
  - Call createTenant service
  - Show loading state
  - Handle success dengan toast dan refetch
  - Handle error dengan toast
  - _Requirements: 2.2, 2.5, 11.2, 11.5_

- [x] 7.6 Write unit tests untuk CreateTenantDialog
  - Test form validation errors (empty fields, invalid email, short password)
  - Test slug auto-generation from name input
  - Test form submission success flow
  - Test form submission error handling
  - Test dialog open/close behavior
  - _Requirements: 2.1, 12.1, 12.2, 12.3_


- [x] 8. Buat TenantManagementTab component
  - Integrate semua tenant components
  - Add search dan filter state management
  - Implement data fetching dengan React Query
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 8.1 Setup component structure
  - Import semua child components
  - Setup state untuk search, filter, dialogs
  - Setup useQuery untuk fetch tenants
  - _Requirements: 1.2_

- [x] 8.2 Implement data fetching
  - Use useQuery dengan queryKey includes filters
  - Handle loading state
  - Handle error state
  - Implement refetch function
  - _Requirements: 1.2, 11.1_

- [x] 8.3 Integrate child components
  - Render Card dengan header dan "Tambah Tenant Baru" button
  - Render TenantSearchFilter
  - Render TenantTable
  - Render CreateTenantDialog
  - _Requirements: 1.2, 1.3_

- [x] 8.4 Handle dialog state
  - Open/close CreateTenantDialog
  - Pass onSuccess callback untuk refetch
  - _Requirements: 2.5_



- [x] 9. Update UserManagementTab component
  - Extract dari ManajemenUser.tsx
  - Add search dan filter functionality
  - Maintain existing user management features
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9.1 Extract user management logic
  - Copy logic dari ManajemenUser.tsx
  - Convert to UserManagementTab component
  - Maintain all existing functionality
  - _Requirements: 5.1, 5.2_

- [x] 9.2 Add search dan filter
  - Add UserSearchFilter component
  - Update useQuery dengan filter parameters
  - Implement filtering logic
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 9.3 Update data fetching
  - Use fetchUsers service dengan filters
  - Handle loading dan error states
  - _Requirements: 5.2, 11.1_

- [x] 9.4 Maintain existing dialogs
  - Keep CreateUserDialog
  - Keep ChangeRoleDialog
  - Keep confirmation dialogs
  - _Requirements: 6.1, 7.1, 8.1_



- [x] 10. Buat ManajemenAkses page component
  - Implement tab interface
  - Add role-based tab visibility
  - Integrate TenantManagementTab dan UserManagementTab
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 10.1 Setup page structure
  - Import Tabs components dari shadcn/ui
  - Setup activeTab state
  - Get user role dari useAuth
  - _Requirements: 1.1, 10.2_

- [x] 10.2 Implement role-based tab visibility
  - Check if user is super admin (email === mukhsin9@gmail.com)
  - Show "Kelola Tenant" tab only for super admin
  - Show "Kelola User" tab for all users
  - Set default tab based on role
  - _Requirements: 1.1, 1.4, 1.5_

- [x] 10.3 Integrate tab content
  - Render TenantManagementTab dalam TabsContent
  - Render UserManagementTab dalam TabsContent
  - Handle tab switching
  - _Requirements: 1.1_

- [x] 10.4 Add page header
  - Display "Manajemen Akses" title
  - Show tenant context if applicable
  - _Requirements: 5.5_

- [x] 10.7 Write unit tests untuk ManajemenAkses
  - Test tab rendering based on super admin role
  - Test tab rendering based on tenant admin role
  - Test tab switching functionality
  - Test page header displays correct title
  - Test tenant context display when available
  - _Requirements: 1.1, 1.4, 1.5_


- [x] 11. Update routing dan navigation
  - Rename route dari /manajemen-user ke /manajemen-akses
  - Update sidebar navigation
  - Update breadcrumbs
  - _Requirements: 15.1_

- [x] 11.1 Update App.tsx routes
  - Change route path dari /manajemen-user ke /manajemen-akses
  - Update component import
  - _Requirements: 15.1_

- [x] 11.2 Update SidebarNav.tsx
  - Change navigation link dari "Manajemen User" ke "Manajemen Akses"
  - Update href dari /manajemen-user ke /manajemen-akses
  - Update icon jika perlu
  - _Requirements: 15.1_

- [x] 11.3 Update breadcrumbs
  - Update breadcrumb text
  - Update breadcrumb links
  - _Requirements: 15.1_

- [x] 11.4 Test navigation
  - Verify route accessible
  - Verify sidebar link works
  - Verify breadcrumbs correct
  - _Requirements: 15.1_

- [x] 12. Implement audit logging untuk tenant operations
  - Log tenant creation
  - Log tenant status changes
  - Log super admin access
  - _Requirements: 4.4, 9.3, 15.3_

- [x] 12.1 Add audit logging ke createTenant service
  - Update tenantManagement.ts createTenant function
  - Call logAuditTrail after successful tenant creation
  - Include tenant_id, action='create_tenant', user_id, IP, user agent
  - Handle audit logging errors gracefully (don't fail tenant creation)
  - _Requirements: 2.5, 15.3_

- [x] 12.2 Add audit logging ke toggleTenantStatus service
  - Update tenantManagement.ts toggleTenantStatus function
  - Log status changes with old and new status values
  - Include tenant_id, action='toggle_tenant_status', metadata with status change
  - _Requirements: 4.4, 15.3_

- [x] 12.3 Add audit logging untuk super admin access
  - Update fetchUsersByTenant to log when super admin views tenant users
  - Log when super admin expands tenant row (action='view_tenant_users')
  - Include tenant_id being accessed and super admin user_id
  - _Requirements: 9.3, 15.3_

- [x] 13. Add loading states dan error handling
  - Implement loading spinners
  - Add error boundaries
  - Add toast notifications
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 13.1 Add loading states to components
  - Verify TenantManagementTab shows loading spinner during initial fetch
  - Verify UserManagementTab shows loading spinner during initial fetch
  - Verify CreateTenantDialog shows loading state on submit button
  - Add skeleton loaders for table rows during loading
  - _Requirements: 11.1, 11.2, 11.3_

- [x] 13.2 Implement error handling with error boundaries
  - Create ErrorBoundary component for ManajemenAkses page
  - Wrap TenantManagementTab and UserManagementTab with ErrorBoundary
  - Display user-friendly error messages with retry button
  - Log errors to console for debugging
  - _Requirements: 11.4_

- [x] 13.3 Add success notifications
  - Verify toast notification on successful tenant creation
  - Verify toast notification on successful user creation
  - Verify toast notification on successful status changes
  - Ensure toast messages are clear and actionable
  - _Requirements: 11.5_

- [x] 14. Implement performance optimizations
  - Add React Query caching
  - Implement debounced search
  - Add optimistic updates
  - Memoize expensive computations
  - _Requirements: Performance considerations_

- [x] 14.1 Configure React Query caching
  - Update tenant queries with staleTime: 5 minutes (300000ms)
  - Update user queries with staleTime: 2 minutes (120000ms)
  - Configure cacheTime for both queries
  - Setup query invalidation on mutations
  - _Requirements: Performance_

- [x] 14.2 Implement debounced search (if not done in 4.3)
  - Create or verify useDebounce hook exists
  - Apply debounce to TenantSearchFilter search input
  - Apply debounce to UserSearchFilter search input
  - Set 300ms delay for all search inputs
  - _Requirements: 13.2, 14.2_

- [x] 14.3 Add optimistic updates for status toggle
  - Update TenantTable status toggle to use optimistic updates
  - Update React Query cache immediately on toggle
  - Rollback cache on error
  - Show error toast if rollback occurs
  - _Requirements: Performance_

- [x] 14.4 Add memoization to components
  - Memoize filtered tenant lists with useMemo in TenantManagementTab
  - Memoize filtered user lists with useMemo in UserManagementTab
  - Wrap pure components with React.memo (TenantSearchFilter, UserSearchFilter)
  - Profile performance improvements
  - _Requirements: Performance_

- [ ] 15. Write property-based tests dengan fast-check
  - Test universal properties across all inputs
  - Verify correctness properties from design document
  - Run 100 iterations per property
  - _Requirements: Testing Strategy_

- [x] 15.1 Write property test untuk slug generation


  - **Property 16: Slug Auto-generation Correctness**
  - **Validates: Requirements 12.3**
  - Generate random tenant names (including special chars, spaces, uppercase)
  - Verify generated slug is valid kebab-case (lowercase, hyphens only)
  - Verify slug contains no spaces or special characters
  - Test dengan 100 iterations

- [x] 15.2 Write property test untuk super admin tab visibility


  - **Property 1: Super Admin Tab Visibility**
  - **Validates: Requirements 1.1**
  - Generate user dengan email mukhsin9@gmail.com
  - Render ManajemenAkses component
  - Verify both "Kelola Tenant" and "Kelola User" tabs are rendered
  - Test dengan 100 iterations

- [x] 15.3 Write property test untuk tenant admin tab restriction

  - **Property 2: Tenant Admin Tab Restriction**
  - **Validates: Requirements 1.4**
  - Generate user dengan email yang bukan mukhsin9@gmail.com
  - Render ManajemenAkses component
  - Verify only "Kelola User" tab is rendered
  - Verify "Kelola Tenant" tab is NOT rendered
  - Test dengan 100 iterations

- [x] 15.4 Write property test untuk user list filtering


  - **Property 7: User List Tenant Filtering**
  - **Validates: Requirements 5.2**
  - Generate multiple tenants dengan random users
  - For each tenant admin, verify only their tenant's users are visible
  - Verify no cross-tenant data leakage
  - Test dengan 100 iterations

- [x] 15.5 Write property test untuk super admin audit logging

  - **Property 12: Super Admin Audit Logging**
  - **Validates: Requirements 9.3**
  - Perform super admin operations (create tenant, toggle status, view users)
  - Query tenant_audit_log table for each operation
  - Verify audit log entries created with correct data
  - Test dengan 100 iterations

- [x] 15.6 Write property test untuk loading state visibility

  - **Property 17: Loading State Visibility**
  - **Validates: Requirements 11.1, 11.2**
  - Simulate async operations with delays
  - Verify loading indicators are displayed during operations
  - Verify loading indicators disappear after completion
  - Test dengan 100 iterations

- [x] 15.7 Write property test untuk error messages

  - **Property 19: Error Message Clarity**
  - **Validates: Requirements 11.4**
  - Simulate various error scenarios (network, validation, permission)
  - Verify clear and actionable error messages are displayed
  - Verify error messages include retry options where appropriate
  - Test dengan 100 iterations

- [x] 15.8 Write property test untuk search query filtering

  - **Property 13: Search Query Filtering Accuracy**
  - **Validates: Requirements 13.2, 14.2**
  - Generate random tenant/user data
  - Generate random search queries
  - Verify only matching items displayed
  - Test dengan 100 iterations

- [x] 15.9 Write property test untuk super admin cross-tenant access

  - **Property 11: Super Admin Cross-Tenant Access**
  - **Validates: Requirements 9.2**
  - Login as super admin (mukhsin9@gmail.com)
  - Access all tenant data via TenantManagementTab
  - Verify access allowed to all tenants
  - Verify audit log entries created for each access
  - Test dengan 100 iterations

- [x] 16. Checkpoint - Ensure all tests pass


  - Run all unit tests: npm run test
  - Run all property tests: verify 100 iterations pass
  - Run all integration tests: verify end-to-end flows work
  - Fix any failing tests before proceeding
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Documentation dan cleanup
  - Update README dengan new features
  - Add inline code comments
  - Remove old ManajemenUser.tsx file
  - Clean up unused imports
  - _Requirements: Documentation_

- [x] 17.1 Update README.md
  - Add section for "Manajemen Akses" feature
  - Document tab interface (Kelola Tenant, Kelola User)
  - Document super admin features (cross-tenant access, audit logging)
  - Add screenshots or diagrams if helpful
  - _Requirements: Documentation_

- [x] 17.2 Add code comments
  - Add JSDoc comments to all exported components
  - Add JSDoc comments to all service functions
  - Add inline comments for complex logic (slug generation, role checks)
  - Document prop types and return types
  - _Requirements: Documentation_

- [x] 17.3 Cleanup old files


  - Verify ManajemenUser.tsx is still being used (it is - different from ManajemenAkses)
  - Remove unused imports from all files
  - Remove unused code and commented-out sections
  - _Requirements: Cleanup_

- [x] 17.4 Final verification


  - Test all features manually in browser
  - Verify no console errors or warnings
  - Verify no TypeScript compilation errors
  - Run production build and verify no issues
  - Test on different screen sizes (mobile, tablet, desktop)
  - _Requirements: Quality Assurance_

---

## Implementation Status Notes

### ✅ Completed (81%)

**Core Implementation:**
- ✅ All component structure created and functional
- ✅ Service layer fully implemented (tenantManagement.ts, userManagement.ts updates)
- ✅ UI components working (TenantManagementTab, UserManagementTab, TenantTable, TenantUserList, CreateTenantDialog, SearchFilter)
- ✅ Page integration complete (ManajemenAkses.tsx with tab interface)
- ✅ Routing updated (/manajemen-akses)
- ✅ Navigation updated (SidebarNav.tsx)
- ✅ Role-based access control implemented (super admin vs tenant admin)
- ✅ Unit tests for all components completed
- ✅ Audit logging implemented for all tenant operations
- ✅ Error boundaries and loading states implemented
- ✅ Performance optimizations (debouncing, caching, optimistic updates, memoization)
- ✅ JSDoc comments added to all components and services

**What Works:**
- ✅ Super admin can see both "Kelola Tenant" and "Kelola User" tabs
- ✅ Tenant admin only sees "Kelola User" tab
- ✅ Tenant creation with auto-generated slug
- ✅ Tenant list with expandable rows showing users
- ✅ User list with search and filter (with debouncing)
- ✅ Status toggle for tenants (with optimistic updates)
- ✅ Form validation with Zod
- ✅ Audit logging for create, update, and view operations
- ✅ Error boundaries catch and display errors gracefully
- ✅ Loading states for all async operations
- ✅ React Query caching (5 min for tenants, 2 min for users)

### ⚠️ Remaining Work (19%)

**Property-Based Testing (Priority: HIGH):**
- [ ] 15.1 - Property test untuk slug generation (Property 16)
- [ ] 15.2 - Property test untuk super admin tab visibility (Property 1)
- [ ] 15.3 - Property test untuk tenant admin tab restriction (Property 2)
- [ ] 15.4 - Property test untuk user list filtering (Property 7)
- [ ] 15.5 - Property test untuk super admin audit logging (Property 12)
- [ ] 15.6 - Property test untuk loading state visibility (Property 17)
- [ ] 15.7 - Property test untuk error messages (Property 19)
- [ ] 15.8 - Property test untuk search query filtering (Property 13)
- [ ] 15.9 - Property test untuk super admin cross-tenant access (Property 11)

**Final Tasks (Priority: MEDIUM):**
- [ ] 16. Checkpoint - Ensure all tests pass
- [ ] 17.3 - Code cleanup (remove unused imports, commented code)
- [ ] 17.4 - Final verification (manual testing, production build)

### Next Steps

1. **Implement Property-Based Tests:** Write 9 property tests using fast-check to verify universal correctness properties
2. **Run Checkpoint:** Ensure all tests (unit + property) pass with 100 iterations
3. **Code Cleanup:** Remove unused code and imports
4. **Final Verification:** Manual testing and production build verification

### Testing Setup

Testing infrastructure is ready:
- ✅ `fast-check` library installed
- ✅ Vitest configured (vitest.config.ts)
- ✅ Test helpers available (src/test/helpers/database.ts)
- ✅ Unit tests completed for all components
- ⚠️ Property-based tests need to be written (9 tests remaining)

