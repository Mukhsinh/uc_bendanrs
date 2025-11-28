# Technology Stack

## Frontend

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5
- **Routing**: React Router DOM v6
- **State Management**: TanStack React Query v5
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React
- **Data Processing**: Papa Parse (CSV), XLSX (Excel)
- **PDF Generation**: jsPDF
- **Notifications**: Sonner (toast)

## Backend

- **BaaS**: Supabase
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth (JWT)
- **Real-time**: Supabase Realtime (WebSocket)
- **Security**: Row Level Security (RLS) - 280 policies
- **Database Objects**:
  - 77 tables
  - 285 functions (stored procedures)
  - 248 triggers (auto-calculation)
  - 17 views
  - 183 indexes

## Development

- **Node Version**: 22.x
- **Package Manager**: npm >=8.0.0
- **TypeScript**: 5.3.3
- **Path Aliases**: `@/*` maps to `./src/*`

## Common Commands

```bash
# Development
npm run dev              # Start dev server (port 8080)

# Build
npm run build            # TypeScript compile + Vite build
npm run build:dev        # Build in development mode
npm run preview          # Preview production build

# Database
npm run db:setup         # Setup/migrate database
npm run db:backup        # Backup database only
npm run db:migrate       # Migrate between Supabase projects
```

## Environment Variables

Required in `.env.local`:
```
VITE_SUPABASE_URL=<supabase_project_url>
VITE_SUPABASE_ANON_KEY=<supabase_anon_key>
```

## Code Style

- **TypeScript**: Strict mode enabled
- **Components**: Functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Use `@/` alias for src imports
- **Styling**: Tailwind utility classes, CSS variables for theming
- **Forms**: React Hook Form with Zod schemas
- **API Calls**: Supabase client via `@/integrations/supabase`

## Database Conventions

- **Table Names**: snake_case (e.g., `unit_kerja`, `data_biaya`)
- **Functions**: snake_case with descriptive prefixes (e.g., `calculate_`, `auto_`, `trigger_`)
- **Triggers**: Prefix with `auto_` or `trigger_`
- **Views**: snake_case with `_view` suffix where applicable
- **RLS**: Enable on all tables, policies per role

## Performance

- Code splitting with manual chunks (vendor, supabase, ui)
- Lazy loading for large components
- React Query for caching and optimistic updates
- Database indexes on foreign keys and frequently queried columns
