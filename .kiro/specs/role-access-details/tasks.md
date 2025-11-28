# Implementation Plan - Rincian Role Akses

## Overview

Implementation plan ini memecah fitur "Rincian Role Akses" menjadi task-task yang dapat dieksekusi secara incremental. Setiap task dirancang untuk build on previous tasks dan dapat diverifikasi secara independen.

## Testing Approach

**Comprehensive testing dengan property-based tests:**
- Unit tests untuk semua components dan services
- Property-based tests dengan fast-check (100 iterations)
- Integration tests untuk complete flows
- All tests are required (no optional tests)

## Task List

- [x] 1. Setup database schema dan migrations



  - Buat tabel menu_items, role_permissions, permission_changelog
  - Setup RLS policies
  - Create indexes
  - Seed initial data
  - _Requirements: 10.1, 10.2, 10.3_




- [ ] 1.1 Create database migration file
  - Buat file `database/migrations/20241127_create_role_access_tables.sql`
  - Define menu_items table schema
  - Define role_permissions table schema

  - Define permission_changelog table schema


  - _Requirements: 10.1, 10.2, 10.3_

- [x] 1.2 Add RLS policies

  - Enable RLS on all three tables
  - Create policy for menu_items (allow read to authenticated)

  - Create policy for role_permissions (role-based visibility)
  - Create policy for permission_changelog (admin only)

  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 1.3 Create indexes for performance


  - Index on role_permissions(role_id)

  - Index on role_permissions(menu_id)
  - Index on permission_changelog(role_id, menu_id, created_at)
  - _Requirements: Performance_

- [ ] 1.4 Run migration and verify
  - Execute migration script via Supabase

  - Verify tables created successfully
  - Verify RLS policies active
  - Verify indexes created
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 1.5 Seed initial menu data
  - Create seed script untuk populate menu_items
  - Map existing routes ke menu structure
  - Insert menu hierarchy (parent-child relationships)
  - Verify menu data integrity
  - _Requirements: 10.2_


- [ ] 1.6 Seed initial permission data
  - Create seed script untuk populate role_permissions
  - Define default permissions per role
  - Insert permission data for all role-menu combinations
  - Verify permission data integrity
  - _Requirements: 10.3_


- [ ] 2. Buat service layer untuk role access
  - Implement roleAccessService.ts
  - Implement data fetching functions
  - Implement matrix building logic
  - Implement filtering and statistics

  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 2.1 Implement fetchAllRoles function
  - Query roles table ordered by level
  - Handle errors gracefully
  - Return typed Role array

  - _Requirements: 10.1_

- [ ] 2.2 Implement fetchAllMenuItems function
  - Query menu_items table with hierarchy
  - Fallback to hardcoded structure if table doesn't exist

  - Build parent-child relationships
  - Return typed MenuItem array with children
  - _Requirements: 10.2_

- [ ] 2.3 Implement fetchAllPermissions function
  - Query role_permissions table

  - Apply RLS filtering based on user role
  - Return typed Permission array
  - _Requirements: 10.3_

- [x] 2.4 Implement buildAccessMatrix function

  - Create Map of permissions by role-menu key
  - Build MatrixData array with accessByRole Map
  - Handle missing permissions (default to no access)
  - Return complete matrix data structure
  - _Requirements: 4.1_

- [ ] 2.5 Implement filterMatrix function
  - Filter by search query (menu name)
  - Auto-expand parent menus when submenu matches
  - Return filtered MatrixData array
  - _Requirements: 6.2, 6.3_


- [x] 2.6 Implement calculateStatistics function


  - Calculate accessible menu count per role
  - Calculate full access, read-only, no access counts
  - Calculate access percentage
  - Return RoleStatistics array
  - _Requirements: 11.2, 11.3_



- [ ] 2.7 Write unit tests untuk roleAccessService
  - Test fetchAllRoles with mock data
  - Test fetchAllMenuItems with hierarchy
  - Test buildAccessMatrix with various permissions
  - Test filterMatrix with search queries
  - Test calculateStatistics accuracy
  - _Requirements: 10.1, 10.2, 10.3_



- [ ] 3. Buat export service untuk PDF/Excel/CSV
  - Implement roleAccessExportService.ts
  - Implement PDF export dengan jsPDF
  - Implement Excel export dengan XLSX
  - Implement CSV export
  - _Requirements: 9.3, 9.4, 9.5_


- [ ] 3.1 Implement exportToPDF function
  - Setup jsPDF with landscape orientation
  - Add title and generation date
  - Create table with autoTable
  - Format access indicators (✓, ✗, 👁)
  - Generate filename with date pattern


  - Trigger download
  - _Requirements: 9.3, 9.5_

- [x] 3.2 Implement exportToExcel function


  - Create workbook with XLSX
  - Create summary sheet with full matrix
  - Create detail sheet per role
  - Format cells with colors
  - Generate filename with date pattern
  - Trigger download


  - _Requirements: 9.4, 9.5_

- [ ] 3.3 Implement exportToCSV function
  - Build CSV string from matrix data
  - Format access levels as text


  - Create Blob and download link
  - Generate filename with date pattern
  - Trigger download


  - _Requirements: 9.5_


- [ ] 3.4 Write unit tests untuk export service
  - Test PDF generation with mock data
  - Test Excel generation with multiple sheets

  - Test CSV generation with correct format
  - Test filename pattern correctness
  - _Requirements: 9.3, 9.4, 9.5_

- [x] 4. Buat AccessStatistics component

  - Display statistics cards per role
  - Show accessible menu count
  - Show access percentage with progress bar
  - Show breakdown (full, read-only, no access)
  - _Requirements: 11.1, 11.2, 11.3, 11.4_


- [ ] 4.1 Implement RoleStatCard component
  - Display role badge with color
  - Display accessible/total menu count
  - Display progress bar for percentage

  - Display breakdown details
  - _Requirements: 11.2, 11.3, 11.4_

- [ ] 4.2 Implement AccessStatistics component
  - Grid layout for stat cards (responsive)
  - Map over statistics array

  - Render RoleStatCard for each role
  - Handle loading state
  - _Requirements: 11.1_

- [ ] 4.3 Write unit tests untuk AccessStatistics
  - Test stat card rendering with mock data
  - Test percentage calculation display
  - Test breakdown counts display
  - Test responsive grid layout
  - _Requirements: 11.2, 11.3_

- [ ] 5. Buat AccessMatrixToolbar component
  - Search input dengan debouncing
  - Role filter dropdown
  - Expand/Collapse all buttons
  - Export button dengan dropdown menu
  - _Requirements: 5.1, 6.1, 7.5, 9.1, 9.2_

- [ ] 5.1 Implement search input
  - Input field dengan placeholder


  - Handle onChange dengan debouncing (300ms)
  - Clear button
  - _Requirements: 6.1, 6.2_


- [ ] 5.2 Implement role filter dropdown
  - Select component dengan "Semua Role" option

  - Map roles to SelectItem
  - Handle filter change
  - _Requirements: 5.1, 5.2_


- [ ] 5.3 Implement expand/collapse buttons
  - "Expand All" button

  - "Collapse All" button
  - Handle click events
  - _Requirements: 7.5_


- [ ] 5.4 Implement export dropdown menu
  - DropdownMenu component
  - Export button trigger
  - Menu items: PDF, Excel, CSV

  - Handle export action with loading state
  - _Requirements: 9.1, 9.2_

- [ ] 5.5 Write unit tests untuk AccessMatrixToolbar
  - Test search input debouncing

  - Test role filter selection
  - Test expand/collapse button clicks
  - Test export menu interactions
  - _Requirements: 5.1, 6.1, 9.1_


- [ ] 6. Buat AccessIndicator component
  - Display checkmark untuk full access
  - Display X untuk no access
  - Display eye untuk read-only
  - Display partial indicator
  - _Requirements: 4.2, 4.3, 4.4_


- [ ] 6.1 Implement AccessIndicator logic
  - Check access level properties
  - Determine indicator type (full, read-only, partial, none)
  - Render appropriate icon with color
  - Add text label
  - _Requirements: 4.2, 4.3, 4.4_


- [ ] 6.2 Write unit tests untuk AccessIndicator
  - Test full access indicator (green checkmark)
  - Test no access indicator (red X)
  - Test read-only indicator (blue eye)
  - Test partial access indicator (yellow checkmark)

  - _Requirements: 4.2, 4.3, 4.4_

- [ ] 7. Buat MenuRow component
  - Render menu dengan indentasi
  - Expandable untuk parent menus

  - Render access cells per role
  - Handle click events
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 7.1, 7.2, 7.3, 7.4_

- [ ] 7.1 Implement menu cell rendering
  - Calculate indentation based on level

  - Display chevron for parent menus
  - Display menu icon if available
  - Display menu name
  - _Requirements: 3.3, 3.4, 3.5_


- [ ] 7.2 Implement expand/collapse logic
  - Handle chevron click
  - Toggle expanded state
  - Show/hide children based on state
  - _Requirements: 7.1, 7.2, 7.3, 7.4_


- [ ] 7.3 Implement access cell rendering
  - Map roles to access cells
  - Render AccessIndicator for each role
  - Handle cell click to open detail dialog
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 7.4 Implement recursive rendering for children

  - Render child MenuRow components when expanded
  - Pass incremented level for indentation
  - Maintain expand state per menu
  - _Requirements: 3.2, 7.3_

- [x] 7.5 Write unit tests untuk MenuRow

  - Test indentation calculation
  - Test chevron display for parents
  - Test expand/collapse toggle
  - Test children visibility
  - Test access cell rendering
  - _Requirements: 3.3, 3.5, 7.1, 7.2_


- [ ] 8. Buat AccessMatrix component
  - Table dengan sticky header
  - Render role headers
  - Render menu rows

  - Handle scroll
  - _Requirements: 2.1, 3.1, 4.1_

- [ ] 8.1 Implement table structure
  - Table component dengan border dan rounded corners

  - Sticky header dengan role badges
  - Sticky first column (menu names)
  - Max height dengan scroll
  - _Requirements: 2.1, 3.1_


- [ ] 8.2 Implement role header rendering
  - Map roles to TableHead
  - Display role badge dengan color
  - Center align headers
  - _Requirements: 2.1, 2.3_

- [ ] 8.3 Implement menu rows rendering
  - Map matrix data to MenuRow components
  - Pass expanded state
  - Pass toggle handler
  - Pass cell click handler
  - _Requirements: 3.1, 4.1_

- [ ] 8.4 Add loading and empty states
  - Skeleton loader for initial load
  - Empty state when no data
  - Error state when fetch fails
  - _Requirements: 1.4, 13.1_

- [ ] 8.5 Write unit tests untuk AccessMatrix
  - Test table rendering with mock data
  - Test role header display
  - Test menu row rendering
  - Test loading state
  - Test empty state
  - _Requirements: 2.1, 3.1, 4.1_

- [ ] 9. Buat PermissionDetailDialog component
  - Dialog untuk detail permission
  - Display operation list dengan status
  - Display RLS policy jika ada
  - Display special conditions
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 9.1 Implement dialog structure
  - Dialog component dengan max width

  - DialogHeader dengan title dan description
  - DialogContent dengan sections
  - DialogFooter dengan close button
  - _Requirements: 8.1, 8.5_



- [ ] 9.2 Implement operations list
  - List 6 operations (view, create, update, delete, export, import)
  - Display checkmark atau X per operation
  - Display operation icon

  - Color code allowed/denied

  - _Requirements: 8.2_

- [ ] 9.3 Implement RLS policy display
  - Conditional rendering jika policy exists
  - Display policy dalam code block
  - Format policy untuk readability

  - _Requirements: 8.3_

- [ ] 9.4 Implement special conditions display
  - Conditional rendering jika conditions exist
  - Display conditions dalam readable format
  - Show note about RBAC + RLS

  - _Requirements: 8.4_

- [ ] 9.5 Write unit tests untuk PermissionDetailDialog
  - Test dialog open/close
  - Test operations list rendering
  - Test RLS policy conditional display
  - Test conditions conditional display
  - _Requirements: 8.2, 8.3, 8.4_

- [ ] 10. Buat RoleAccessDetailsTab component
  - Container untuk semua sub-components
  - State management untuk filters dan expand
  - Data fetching dengan React Query
  - Integration semua components
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 10.1 Setup component structure
  - Import semua child components
  - Setup state (search, roleFilter, expandedMenus, selectedCell)


  - Setup useQuery hooks untuk data fetching
  - _Requirements: 1.3_

- [ ] 10.2 Implement data fetching
  - useQuery untuk roles dengan staleTime 10 min
  - useQuery untuk menus dengan staleTime 10 min
  - useQuery untuk permissions dengan staleTime 5 min
  - Handle loading states
  - Handle error states
  - _Requirements: 1.3, 1.4, 1.5, 10.4_


- [ ] 10.3 Implement data processing
  - useMemo untuk buildAccessMatrix
  - useMemo untuk filterMatrix
  - useMemo untuk calculateStatistics
  - Optimize re-renders dengan React.memo
  - _Requirements: Performance_


- [ ] 10.4 Integrate child components
  - Render Card dengan header
  - Render AccessStatistics
  - Render AccessMatrixToolbar
  - Render AccessMatrix atau loading skeleton

  - Render PermissionDetailDialog
  - _Requirements: 1.2_

- [ ] 10.5 Implement filter and search handlers
  - Handle search query change
  - Handle role filter change
  - Handle expand all/collapse all
  - Handle cell click
  - _Requirements: 5.2, 6.2, 7.2_

- [ ] 10.6 Implement export handler
  - Handle export action
  - Show loading state during export
  - Call appropriate export function
  - Show success/error toast
  - _Requirements: 9.3, 9.4, 9.5, 13.3_

- [ ] 10.7 Write unit tests untuk RoleAccessDetailsTab
  - Test component rendering
  - Test data fetching
  - Test filter interactions
  - Test search interactions
  - Test export interactions
  - _Requirements: 1.2, 1.3, 1.4_


- [ ] 11. Integrate tab ke ManajemenAkses page
  - Add "Rincian Role Akses" tab
  - Import RoleAccessDetailsTab component
  - Handle tab switching
  - _Requirements: 1.1, 1.2_

- [ ] 11.1 Update ManajemenAkses.tsx
  - Import RoleAccessDetailsTab component
  - Add TabsTrigger untuk "Rincian Role Akses"
  - Add TabsContent dengan RoleAccessDetailsTab
  - Wrap dengan ErrorBoundary
  - _Requirements: 1.1_

- [ ] 11.2 Test tab integration
  - Verify tab appears in tab list
  - Verify tab click shows content
  - Verify tab switching works
  - Verify error boundary catches errors
  - _Requirements: 1.2_

- [ ] 12. Implement role-based visibility
  - Filter visible roles based on user role
  - Apply RLS policies on data fetching
  - Hide Super Admin info from non-Super Admin
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 12.1 Implement getVisibleRoles utility
  - Create utility function in roleAccessService
  - Check user role level
  - Return filtered roles based on hierarchy
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 12.2 Apply visibility filter in RoleAccessDetailsTab
  - Get current user role
  - Filter roles using getVisibleRoles
  - Pass filtered roles to child components
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 12.3 Verify RLS policies enforce visibility
  - Test Guest user sees only Guest role
  - Test User sees User and Guest roles
  - Test Manager sees Manager, User, Guest roles
  - Test Admin sees all except Super Admin
  - Test Super Admin sees all roles
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 12.4 Write unit tests untuk role visibility
  - Test getVisibleRoles with each role level
  - Test filtering logic correctness
  - Test RLS policy enforcement
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 13. Add audit logging untuk sensitive operations
  - Log export operations
  - Log permission detail views
  - Log filter/search usage (optional)
  - _Requirements: Security_

- [ ] 13.1 Implement audit logging untuk export
  - Call logAuditTrail after successful export
  - Include export format, user_id, timestamp
  - Include filtered data summary
  - _Requirements: Security_

- [ ] 13.2 Implement audit logging untuk detail views
  - Call logAuditTrail when permission detail opened
  - Include role_id, menu_id, user_id
  - Include timestamp
  - _Requirements: Security_

- [ ] 13.3 Write unit tests untuk audit logging
  - Test export audit log creation
  - Test detail view audit log creation
  - Verify log data completeness
  - _Requirements: Security_

- [ ] 14. Implement error handling dan loading states
  - Add error boundaries
  - Add loading skeletons
  - Add error messages dengan retry
  - Add success notifications
  - _Requirements: 1.4, 1.5, 11.1, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 14.1 Add loading skeletons
  - Create MatrixSkeleton component
  - Show skeleton during initial load
  - Show skeleton during refresh
  - _Requirements: 1.4, 13.1_

- [ ] 14.2 Add error handling
  - Wrap components dengan ErrorBoundary
  - Display error messages dengan retry button
  - Handle fetch errors gracefully
  - Fallback to cached data if available
  - _Requirements: 1.5, 10.5, 13.4_

- [ ] 14.3 Add loading states untuk operations
  - Show spinner on export button during export
  - Show loading indicator during data refresh
  - Disable interactions during loading
  - _Requirements: 13.2, 13.3_

- [ ] 14.4 Add success notifications
  - Toast notification after successful export
  - Toast notification after successful data refresh
  - Clear and actionable messages
  - _Requirements: 13.5_

- [ ] 14.5 Write unit tests untuk error handling
  - Test error boundary catches errors
  - Test error messages display
  - Test retry functionality
  - Test loading states
  - _Requirements: 1.4, 1.5, 13.4_

- [ ] 15. Implement performance optimizations
  - Add memoization
  - Configure React Query caching
  - Add debouncing
  - Optimize rendering
  - _Requirements: Performance_

- [ ] 15.1 Add memoization
  - useMemo untuk matrix data computation
  - useMemo untuk filtered data
  - useMemo untuk statistics calculation
  - React.memo untuk pure components
  - _Requirements: Performance_

- [ ] 15.2 Configure React Query caching
  - Set staleTime: 10 min untuk roles
  - Set staleTime: 10 min untuk menus
  - Set staleTime: 5 min untuk permissions
  - Configure cache invalidation
  - _Requirements: Performance_

- [ ] 15.3 Add debouncing
  - Debounce search input (300ms)
  - Debounce filter changes (200ms)
  - Use useDebounce hook
  - _Requirements: Performance_

- [ ] 15.4 Optimize rendering
  - Lazy load PermissionDetailDialog
  - Lazy load export libraries
  - Code split RoleAccessDetailsTab
  - Profile performance improvements
  - _Requirements: Performance_

- [ ] 16. Write property-based tests dengan fast-check
  - Test universal properties across all inputs
  - Verify correctness properties from design document
  - Run 100 iterations per property
  - _Requirements: Testing Strategy_

- [ ] 16.1 Write property test untuk role ordering
  - **Property 5: Role Ordering Consistency**
  - **Validates: Requirements 2.2**
  - Generate random role arrays
  - Verify ordering is always: Super Admin, Admin, Manager, User, Guest
  - Test dengan 100 iterations

- [ ] 16.2 Write property test untuk matrix completeness
  - **Property 13: Matrix Cell Completeness**
  - **Validates: Requirements 4.1**
  - Generate random roles and menus
  - Verify cell count = |roles| × |menus|
  - Test dengan 100 iterations

- [ ] 16.3 Write property test untuk indentation calculation
  - **Property 10: Indentation by Level**
  - **Validates: Requirements 3.3**
  - Generate menus with random levels (0-5)
  - Verify indentation = level × 24 pixels
  - Test dengan 100 iterations

- [ ] 16.4 Write property test untuk search filtering
  - **Property 20: Search Filtering Accuracy**
  - **Validates: Requirements 6.2**
  - Generate random menu data and search queries
  - Verify only matching menus displayed
  - Test dengan 100 iterations

- [ ] 16.5 Write property test untuk statistics accuracy
  - **Property 33: Statistics Count Accuracy**
  - **Property 34: Statistics Percentage Accuracy**
  - **Validates: Requirements 11.2, 11.3**
  - Generate random permission data
  - Verify accessible count and percentage calculations
  - Test dengan 100 iterations

- [ ] 16.6 Write property test untuk role visibility
  - **Property 37-41: Role Visibility Restrictions**
  - **Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**
  - Generate users with different roles
  - Verify correct roles visible per user role
  - Test dengan 100 iterations

- [ ] 16.7 Write property test untuk access indicators
  - **Property 14-16: Access Indicators**
  - **Validates: Requirements 4.2, 4.3, 4.4**
  - Generate random access levels
  - Verify correct indicator displayed
  - Test dengan 100 iterations

- [ ] 16.8 Write property test untuk export completeness
  - **Property 29-31: Export Completeness**
  - **Validates: Requirements 9.3, 9.4, 9.5**
  - Generate random matrix data
  - Verify exported files contain all data
  - Verify filename pattern correctness
  - Test dengan 100 iterations

- [ ] 16.9 Write property test untuk expand/collapse
  - **Property 23-25: Expand/Collapse Toggle**
  - **Validates: Requirements 7.2, 7.3, 7.4**
  - Generate menu hierarchies
  - Verify children visibility based on expand state
  - Test dengan 100 iterations

- [ ] 17. Write integration tests
  - Test complete user flows
  - Test role-based access control
  - Test data consistency
  - Test export functionality
  - _Requirements: Testing Strategy_

- [ ] 17.1 Write integration test untuk complete flow
  - Load tab → filter → search → view details → export
  - Verify each step works correctly
  - Verify state persistence
  - _Requirements: Testing Strategy_

- [ ] 17.2 Write integration test untuk role-based access
  - Test visibility restrictions per role
  - Test RLS policy enforcement
  - Test permission detail access
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 17.3 Write integration test untuk export
  - Test PDF export end-to-end
  - Test Excel export end-to-end
  - Test CSV export end-to-end
  - Verify file contents
  - _Requirements: 9.3, 9.4, 9.5_

- [ ] 18. Checkpoint - Ensure all tests pass
  - Run all unit tests: npm run test
  - Run all property tests: verify 100 iterations pass
  - Run all integration tests: verify end-to-end flows work
  - Fix any failing tests before proceeding
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Documentation dan cleanup
  - Update README dengan new feature
  - Add inline code comments
  - Add JSDoc comments
  - Clean up unused imports
  - _Requirements: Documentation_

- [ ] 19.1 Update README.md
  - Add section for "Rincian Role Akses" feature
  - Document access matrix functionality
  - Document export capabilities
  - Add screenshots or diagrams
  - _Requirements: Documentation_

- [ ] 19.2 Add code comments
  - Add JSDoc comments to all exported components
  - Add JSDoc comments to all service functions
  - Add inline comments for complex logic
  - Document prop types and return types
  - _Requirements: Documentation_

- [ ] 19.3 Cleanup code
  - Remove unused imports
  - Remove commented-out code
  - Format code consistently
  - Run linter and fix issues
  - _Requirements: Cleanup_

- [ ] 19.4 Final verification
  - Test all features manually in browser
  - Verify no console errors or warnings
  - Verify no TypeScript compilation errors
  - Run production build and verify no issues
  - Test on different screen sizes
  - Test with different user roles
  - _Requirements: Quality Assurance_

---

## Implementation Status Notes

### Task Summary

**Total Tasks**: 95 tasks
**Phases**: 19 phases

**Phase Breakdown:**
1. Database setup (6 tasks)
2. Service layer - data (7 tasks)
3. Service layer - export (4 tasks)
4. AccessStatistics component (3 tasks)
5. AccessMatrixToolbar component (5 tasks)
6. AccessIndicator component (2 tasks)
7. MenuRow component (5 tasks)
8. AccessMatrix component (5 tasks)
9. PermissionDetailDialog component (5 tasks)
10. RoleAccessDetailsTab component (7 tasks)
11. Page integration (2 tasks)
12. Role-based visibility (4 tasks)
13. Audit logging (3 tasks)
14. Error handling (5 tasks)
15. Performance optimizations (4 tasks)
16. Property-based tests (9 tasks)
17. Integration tests (3 tasks)
18. Checkpoint (1 task)
19. Documentation (4 tasks)

### Next Steps

1. **Start with Phase 1**: Setup database schema dan migrations
2. **Then Phase 2**: Implement service layer untuk data fetching
3. **Then Phase 3**: Implement export service
4. **Then Phases 4-10**: Build UI components incrementally
5. **Then Phases 11-15**: Integration, security, and optimizations
6. **Then Phases 16-17**: Comprehensive testing
7. **Finally Phase 18-19**: Checkpoint and documentation

### Dependencies

- Phase 2-3 depend on Phase 1 (database must exist)
- Phases 4-9 can be done in parallel (independent components)
- Phase 10 depends on Phases 4-9 (integrates all components)
- Phase 11 depends on Phase 10 (page integration)
- Phases 12-15 depend on Phase 11 (enhancements)
- Phases 16-17 depend on all previous phases (testing)
- Phases 18-19 are final steps

