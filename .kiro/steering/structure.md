# Project Structure

## Root Directory

```
├── src/                    # Source code
├── public/                 # Static assets
├── docs/                   # Documentation
├── database/               # Database migration scripts
├── scripts/                # Utility scripts
├── dist/                   # Build output
└── [*.md, *.sql]          # Documentation and SQL files
```

## Source Structure (`src/`)

```
src/
├── components/            # React components
│   ├── ui/               # Base UI components (Shadcn/ui)
│   ├── ManajemenAkses/   # Access management components
│   ├── ModulTeknis/      # Technical module components
│   ├── produk-layanan/   # Product/service components
│   ├── report/           # Report components
│   ├── Layout.tsx        # Main layout wrapper
│   ├── ProtectedRoute.tsx        # Auth route guard
│   ├── RoleProtectedRoute.tsx    # Role-based route guard
│   ├── SidebarNav.tsx            # Sidebar navigation
│   └── [*FormTable.tsx]          # Data table components
│
├── pages/                 # Page components (routes)
│   ├── api/              # API-related pages
│   ├── Index.tsx         # Dashboard/home
│   ├── Login.tsx         # Authentication
│   ├── Data*.tsx         # Data master pages
│   ├── Kalkulasi*.tsx    # Calculation pages
│   ├── Distribusi*.tsx   # Distribution pages
│   ├── Skenario*.tsx     # Tariff scenario pages
│   └── Manajemen*.tsx    # Management pages
│
├── hooks/                 # Custom React hooks
│   ├── use-toast.ts      # Toast notifications
│   ├── use-mobile.tsx    # Mobile detection
│   ├── use-form-operations.ts    # Form CRUD operations
│   ├── usePermissions.ts         # Permission checks
│   └── use*.ts                   # Domain-specific hooks
│
├── contexts/              # React contexts
│   ├── AuthContext.tsx           # Authentication state
│   └── GeneralSettingsContext.tsx # App settings
│
├── integrations/          # External service integrations
│   └── supabase/         # Supabase client & types
│
├── lib/                   # Core utilities
│   ├── utils.ts          # General utilities (cn, etc.)
│   ├── authService.ts    # Authentication logic
│   └── userManagement.ts # User management logic
│
├── services/              # Business logic services
│   └── bahanPorsiService.ts
│
├── utils/                 # Helper utilities
│   ├── database-operations.ts    # DB helpers
│   ├── notifications.ts          # Notification helpers
│   ├── auditTrail.ts            # Audit logging
│   ├── pdfGenerator.ts          # PDF export
│   ├── reportExport.ts          # Report export
│   └── role-check.ts            # Role validation
│
├── types/                 # TypeScript type definitions
│   ├── dasar-alokasi.ts
│   └── data-kegiatan.ts
│
├── App.tsx               # Root component
├── main.tsx              # Entry point
├── globals.css           # Global styles
└── vite-env.d.ts         # Vite type definitions
```

## Component Patterns

### Form Tables
Components ending with `FormTable.tsx` follow a consistent pattern:
- CRUD operations (Create, Read, Update, Delete)
- Data table with sorting, filtering, pagination
- Import/export functionality (CSV, Excel)
- Inline editing or modal forms
- Real-time updates via React Query

Examples: `BiayaFormTable.tsx`, `UnitKerjaFormTable.tsx`, `DaftarTindakanFormTable.tsx`

### Page Components
- One page per route
- Use `ProtectedRoute` or `RoleProtectedRoute` for auth
- Import form tables and UI components
- Handle page-level state and navigation

### UI Components (`components/ui/`)
- Shadcn/ui components (button, card, table, dialog, etc.)
- Reusable, composable primitives
- Styled with Tailwind CSS
- Follow Radix UI patterns

## Database Scripts

### Root SQL Files
- Migration scripts (`.sql`)
- Fix scripts (`fix-*.sql`)
- Creation scripts (`create-*.sql`)
- Test scripts (`test-*.sql`)

### `database/` Directory
- Organized migration files
- Date-prefixed for ordering
- Specific feature migrations

## Documentation

### Root Markdown Files
- Feature documentation (`DOKUMENTASI_*.md`)
- Implementation summaries (`IMPLEMENTASI_*.md`)
- Fix reports (`LAPORAN_*.md`)
- API documentation (`API_DOCUMENTATION.md`)

### `docs/` Directory
- Structured documentation
- Installation guides
- Architecture diagrams
- User guides

## Naming Conventions

### Files
- **Components**: PascalCase (e.g., `DataBiaya.tsx`)
- **Utilities**: camelCase (e.g., `database-operations.ts`)
- **Types**: kebab-case (e.g., `data-kegiatan.ts`)
- **SQL**: kebab-case (e.g., `create-tables.sql`)

### Database
- **Tables**: snake_case (e.g., `unit_kerja`)
- **Columns**: snake_case (e.g., `total_biaya`)
- **Functions**: snake_case with prefix (e.g., `calculate_total_cost`)

### Code
- **Components**: PascalCase
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Types/Interfaces**: PascalCase

## Import Patterns

```typescript
// External libraries
import { useState } from "react"
import { useQuery } from "@tanstack/react-query"

// Internal with alias
import { Button } from "@/components/ui/button"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"

// Relative imports (avoid when possible)
import { helper } from "./helper"
```

## Key Directories to Know

- **`src/components/ui/`**: Shadcn/ui base components
- **`src/pages/`**: All route pages
- **`src/integrations/supabase/`**: Supabase client and generated types
- **`src/hooks/`**: Reusable logic
- **`database/`**: Migration scripts
- **`docs/`**: User and technical documentation
