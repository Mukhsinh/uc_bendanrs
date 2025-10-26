# Deployment Guide - Aplikasi Unit Cost RS

## Overview
Aplikasi Unit Cost RS adalah aplikasi web yang dibangun dengan React, TypeScript, dan Supabase. Dokumentasi ini menjelaskan cara deployment dan maintenance aplikasi.

## Prerequisites

### System Requirements
- **Node.js**: v18.0.0 atau lebih baru
- **npm**: v8.0.0 atau lebih baru
- **Git**: v2.30.0 atau lebih baru
- **Browser**: Chrome, Firefox, Safari, Edge (versi terbaru)

### Development Tools
- **VS Code**: Editor yang direkomendasikan
- **Supabase CLI**: Untuk database management
- **PostgreSQL**: Database (via Supabase)

## Environment Setup

### 1. Local Development

#### Clone Repository
```bash
git clone <repository-url>
cd Aplikasi-Unit-Cost-RS
```

#### Install Dependencies
```bash
npm install
```

#### Environment Variables
Buat file `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

#### Start Development Server
```bash
npm run dev
```

Aplikasi akan berjalan di `http://localhost:8082`

### 2. Production Deployment

#### Build Application
```bash
npm run build
```

#### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

#### Deploy to Custom Server
```bash
# Build application
npm run build

# Copy dist folder to server
scp -r dist/* user@server:/var/www/html/
```

## Database Setup

### 1. Supabase Setup

#### Create Supabase Project
1. Login ke [Supabase](https://supabase.com)
2. Create new project
3. Pilih region terdekat
4. Set password untuk database

#### Get Project Credentials
1. Go to Settings > API
2. Copy Project URL dan anon key
3. Update environment variables

### 2. Database Migrations

#### Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

#### Manual Migration
Jika menggunakan Supabase Dashboard:
1. Go to SQL Editor
2. Copy dan paste migration files
3. Execute migrations satu per satu

### 3. Database Configuration

#### Enable RLS
```sql
-- Enable RLS for all tables
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_biaya ENABLE ROW LEVEL SECURITY;
ALTER TABLE kalkulasi_biaya_gizi ENABLE ROW LEVEL SECURITY;
ALTER TABLE bahan_porsi ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_barang_gizi ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_kerja ENABLE ROW LEVEL SECURITY;
```

#### Create RLS Policies
```sql
-- Audit trail policies
CREATE POLICY "Audit trail is viewable by everyone" ON audit_trail FOR SELECT USING (true);
CREATE POLICY "Audit trail is insertable by system" ON audit_trail FOR INSERT WITH CHECK (true);

-- Data biaya policies
CREATE POLICY "Data biaya is viewable by everyone" ON data_biaya FOR SELECT USING (true);
CREATE POLICY "Data biaya is manageable by authenticated users" ON data_biaya FOR ALL USING (auth.role() = 'authenticated');

-- Similar policies for other tables...
```

## Configuration

### 1. Application Configuration

#### Supabase Configuration
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

#### Environment Variables
```env
# Production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=your-local-anon-key
```

### 2. Database Configuration

#### Connection Settings
```typescript
// Supabase connection settings
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)
```

#### Performance Settings
```sql
-- Database performance settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

## Monitoring

### 1. Application Monitoring

#### Error Tracking
```typescript
// Error boundary component
import { ErrorBoundary } from 'react-error-boundary'

function ErrorFallback({error, resetErrorBoundary}) {
  return (
    <div role="alert">
      <h2>Something went wrong:</h2>
      <pre>{error.message}</pre>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}

// Usage
<ErrorBoundary FallbackComponent={ErrorFallback}>
  <App />
</ErrorBoundary>
```

#### Performance Monitoring
```typescript
// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Send to analytics service
  console.log(metric)
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

### 2. Database Monitoring

#### Query Performance
```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Monitor table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Connection Monitoring
```sql
-- Monitor active connections
SELECT count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';

-- Monitor database size
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
```

## Maintenance

### 1. Regular Maintenance

#### Database Maintenance
```sql
-- Analyze tables for better query planning
ANALYZE;

-- Vacuum tables to reclaim space
VACUUM ANALYZE;

-- Reindex for better performance
REINDEX DATABASE your_database;
```

#### Application Maintenance
```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix security vulnerabilities
npm audit fix
```

### 2. Backup and Recovery

#### Database Backup
```bash
# Backup database
pg_dump -h your-host -U your-user -d your-database > backup.sql

# Restore database
psql -h your-host -U your-user -d your-database < backup.sql
```

#### Application Backup
```bash
# Backup application files
tar -czf app-backup.tar.gz dist/

# Backup configuration
cp .env.local .env.local.backup
```

### 3. Security Maintenance

#### Security Updates
```bash
# Update all dependencies
npm update

# Check for security issues
npm audit

# Fix security issues
npm audit fix --force
```

#### Database Security
```sql
-- Review user permissions
SELECT * FROM information_schema.role_table_grants
WHERE grantee = 'your-user';

-- Review RLS policies
SELECT * FROM pg_policies
WHERE schemaname = 'public';
```

## Troubleshooting

### 1. Common Issues

#### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run build
```

#### Database Connection Issues
```typescript
// Check connection
const { data, error } = await supabase
  .from('audit_trail')
  .select('count')
  .limit(1)

if (error) {
  console.error('Database connection error:', error)
}
```

#### Performance Issues
```sql
-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Check table bloat
SELECT schemaname, tablename, n_dead_tup, n_live_tup
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000;
```

### 2. Error Handling

#### Application Errors
```typescript
// Global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // Send to error tracking service
})

// Unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Send to error tracking service
})
```

#### Database Errors
```typescript
// Database error handling
try {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
  
  if (error) {
    throw error
  }
} catch (error) {
  console.error('Database error:', error)
  // Handle specific error types
  if (error.code === 'PGRST116') {
    // Handle RLS error
  } else if (error.code === '23505') {
    // Handle unique constraint error
  }
}
```

## Scaling

### 1. Database Scaling

#### Connection Pooling
```typescript
// Configure connection pooling
const supabase = createClient(url, key, {
  db: {
    schema: 'public'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true
  },
  global: {
    headers: {
      'X-Client-Info': 'app-name'
    }
  }
})
```

#### Read Replicas
```sql
-- Configure read replicas
-- This is handled by Supabase automatically
```

### 2. Application Scaling

#### CDN Configuration
```typescript
// Configure CDN for static assets
const cdnUrl = 'https://cdn.your-domain.com'
const assetUrl = `${cdnUrl}/assets/`
```

#### Caching Strategy
```typescript
// Implement caching
const cache = new Map()

function getCachedData(key: string) {
  if (cache.has(key)) {
    return cache.get(key)
  }
  return null
}

function setCachedData(key: string, data: any) {
  cache.set(key, data)
  // Set expiration
  setTimeout(() => cache.delete(key), 300000) // 5 minutes
}
```

## Security

### 1. Application Security

#### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' https://*.supabase.co;
">
```

#### Authentication Security
```typescript
// Secure authentication
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Prevent URL-based session detection
  }
})
```

### 2. Database Security

#### RLS Policies
```sql
-- Comprehensive RLS policies
CREATE POLICY "Users can only see their own data" ON data_biaya
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can only update their own data" ON data_biaya
FOR UPDATE USING (auth.uid() = user_id);
```

#### Audit Trail Security
```sql
-- Audit trail security
CREATE POLICY "Audit trail is read-only" ON audit_trail
FOR SELECT USING (true);

CREATE POLICY "Audit trail is insert-only" ON audit_trail
FOR INSERT WITH CHECK (true);
```

---

*Deployment Guide untuk Aplikasi Unit Cost RS v1.0*
*Terakhir diperbarui: 24 Oktober 2025*