# PANDUAN KONFIGURASI DAN MAINTENANCE SISTEM
## APLIKASI UNIT COST RUMAH SAKIT

**Sistem Konfigurasi dan Pemeliharaan**  
**Maintenance dan Monitoring**

---

**Disusun oleh:**  
**MUKHSIN HADI, SE, M.Si, CGAA, CPFRM, CSEP, CRP, CPRM, CSCAP, CPABC**

**Hak Cipta: 000831709**

---

## DAFTAR ISI

1. [PENDAHULUAN](#pendahuluan)
2. [ARSITEKTUR SISTEM](#arsitektur-sistem)
3. [KONFIGURASI SISTEM](#konfigurasi-sistem)
4. [MAINTENANCE RUTIN](#maintenance-rutin)
5. [BACKUP DAN RECOVERY](#backup-dan-recovery)
6. [MONITORING DAN ALERTING](#monitoring-dan-alerting)
7. [PERFORMANCE OPTIMIZATION](#performance-optimization)
8. [SECURITY MAINTENANCE](#security-maintenance)
9. [TROUBLESHOOTING](#troubleshooting)
10. [DISASTER RECOVERY](#disaster-recovery)

---

## PENDAHULUAN

Panduan Konfigurasi dan Maintenance Sistem untuk Aplikasi Unit Cost Rumah Sakit memberikan petunjuk lengkap untuk mengelola, memelihara, dan mengoptimalkan sistem secara berkelanjutan. Sistem ini dibangun dengan teknologi modern dan memerlukan pemeliharaan rutin untuk memastikan performa optimal dan keamanan data.

### **Tujuan Panduan:**
- Memberikan panduan konfigurasi sistem yang komprehensif
- Menetapkan prosedur maintenance rutin yang efektif
- Menyediakan protokol backup dan recovery yang handal
- Menetapkan standar monitoring dan alerting
- Menyediakan panduan troubleshooting yang sistematis

### **Sasaran Pengguna:**
- **System Administrator** - Administrator sistem
- **Database Administrator** - Administrator database
- **IT Support** - Tim support teknis
- **Security Officer** - Petugas keamanan sistem

---

## ARSITEKTUR SISTEM

### **Technology Stack**

#### **1. Frontend Layer:**
- **React 18** - Framework UI modern
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool dan dev server
- **TanStack Query** - Server state management

#### **2. Backend Layer:**
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Database relasional
- **Row Level Security (RLS)** - Keamanan tingkat baris
- **Edge Functions** - Serverless functions

#### **3. Infrastructure Layer:**
- **Cloud Hosting** - Supabase Cloud
- **CDN** - Content Delivery Network
- **SSL/TLS** - Enkripsi data transit
- **Auto-scaling** - Scaling otomatis

### **System Architecture Diagram**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (Supabase)    │◄──►│   (PostgreSQL)  │
│                 │    │                 │    │                 │
│ • Components    │    │ • API Gateway   │    │ • Tables        │
│ • State Mgmt    │    │ • Auth Service  │    │ • Views         │
│ • UI/UX         │    │ • RLS Policies  │    │ • Functions     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN           │    │   Monitoring    │    │   Backup        │
│                 │    │                 │    │                 │
│ • Static Assets │    │ • Logs          │    │ • Automated     │
│ • Caching       │    │ • Metrics       │    │ • Point-in-time │
│ • Performance   │    │ • Alerts        │    │ • Recovery      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## KONFIGURASI SISTEM

### **1. Environment Configuration**

#### **Development Environment:**
```bash
# .env.development
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=development
VITE_DEBUG_MODE=true
VITE_LOG_LEVEL=debug
```

#### **Production Environment:**
```bash
# .env.production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_ENV=production
VITE_DEBUG_MODE=false
VITE_LOG_LEVEL=error
```

#### **Environment Variables Management:**
```javascript
// config/environment.js
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  },
  app: {
    env: import.meta.env.VITE_APP_ENV,
    debug: import.meta.env.VITE_DEBUG_MODE === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL
  }
};
```

### **2. Database Configuration**

#### **Connection Pool Settings:**
```sql
-- PostgreSQL configuration
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;
```

#### **Row Level Security (RLS) Setup:**
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can manage users" ON user_profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      JOIN roles r ON up.role_id = r.id
      WHERE up.id = auth.uid() 
        AND r.name IN ('Super Admin', 'Admin')
    )
  );
```

### **3. Application Configuration**

#### **Supabase Client Configuration:**
```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});
```

#### **API Configuration:**
```typescript
// config/api.ts
export const apiConfig = {
  baseURL: import.meta.env.VITE_SUPABASE_URL,
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};
```

---

## MAINTENANCE RUTIN

### **1. Daily Maintenance Tasks**

#### **System Health Check:**
```bash
#!/bin/bash
# daily-health-check.sh

echo "=== Daily System Health Check ==="
echo "Date: $(date)"

# Check database connectivity
echo "Checking database connectivity..."
psql -h localhost -U postgres -d unit_cost_rs -c "SELECT 1;" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Database connection: OK"
else
    echo "✗ Database connection: FAILED"
fi

# Check disk space
echo "Checking disk space..."
df -h | awk '$5 > 80 {print "WARNING: " $0}'

# Check memory usage
echo "Checking memory usage..."
free -h | awk 'NR==2{printf "Memory Usage: %s/%s (%.2f%%)\n", $3,$2,$3*100/$2 }'

# Check application logs for errors
echo "Checking application logs..."
tail -n 100 /var/log/unit-cost-rs/application.log | grep -i error | wc -l

echo "=== Health Check Complete ==="
```

#### **Automated Tasks:**
- **Database Statistics Update** - Update statistik database
- **Log Rotation** - Rotasi log files
- **Cache Cleanup** - Pembersihan cache
- **Performance Metrics** - Koleksi metrik performa

### **2. Weekly Maintenance Tasks**

#### **Database Maintenance:**
```sql
-- Weekly maintenance script
DO $$
BEGIN
    -- Update table statistics
    ANALYZE;
    
    -- Vacuum tables
    VACUUM ANALYZE;
    
    -- Check for long-running queries
    SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
    FROM pg_stat_activity 
    WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
    
    -- Check database size
    SELECT pg_size_pretty(pg_database_size('unit_cost_rs'));
    
END $$;
```

#### **Security Updates:**
```bash
#!/bin/bash
# weekly-security-update.sh

echo "=== Weekly Security Update ==="

# Update system packages
sudo apt update && sudo apt upgrade -y

# Check for security vulnerabilities
npm audit --audit-level moderate

# Update application dependencies
npm update

# Check SSL certificate expiry
openssl x509 -in /etc/ssl/certs/unit-cost-rs.crt -noout -dates

echo "=== Security Update Complete ==="
```

### **3. Monthly Maintenance Tasks**

#### **Comprehensive System Review:**
```bash
#!/bin/bash
# monthly-system-review.sh

echo "=== Monthly System Review ==="

# Generate system report
echo "Generating system report..."

# Database performance analysis
psql -h localhost -U postgres -d unit_cost_rs -f /scripts/monthly-db-analysis.sql

# Application performance metrics
node /scripts/performance-analysis.js

# Security audit
node /scripts/security-audit.js

# Backup verification
/scripts/verify-backups.sh

# Capacity planning
/scripts/capacity-analysis.sh

echo "=== Monthly Review Complete ==="
```

---

## BACKUP DAN RECOVERY

### **1. Backup Strategy**

#### **Backup Types:**
- **Full Backup** - Backup lengkap seluruh database
- **Incremental Backup** - Backup perubahan sejak backup terakhir
- **Differential Backup** - Backup perubahan sejak full backup
- **Point-in-Time Recovery** - Recovery ke waktu tertentu

#### **Automated Backup Script:**
```bash
#!/bin/bash
# automated-backup.sh

BACKUP_DIR="/backups/unit-cost-rs"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="unit_cost_rs"

# Create backup directory
mkdir -p $BACKUP_DIR

# Full database backup
echo "Starting full database backup..."
pg_dump -h localhost -U postgres -d $DB_NAME \
  --format=custom \
  --compress=9 \
  --verbose \
  --file="$BACKUP_DIR/full_backup_$DATE.dump"

# Backup user data only
echo "Backing up user data..."
pg_dump -h localhost -U postgres -d $DB_NAME \
  --table=auth.users \
  --table=user_profiles \
  --table=roles \
  --format=custom \
  --file="$BACKUP_DIR/user_data_$DATE.dump"

# Backup application files
echo "Backing up application files..."
tar -czf "$BACKUP_DIR/app_files_$DATE.tar.gz" /var/www/unit-cost-rs

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.dump" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### **2. Recovery Procedures**

#### **Full Database Recovery:**
```bash
#!/bin/bash
# database-recovery.sh

BACKUP_FILE=$1
DB_NAME="unit_cost_rs"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

echo "Starting database recovery from: $BACKUP_FILE"

# Stop application services
sudo systemctl stop unit-cost-rs

# Drop and recreate database
dropdb -h localhost -U postgres $DB_NAME
createdb -h localhost -U postgres $DB_NAME

# Restore from backup
pg_restore -h localhost -U postgres -d $DB_NAME \
  --verbose \
  --clean \
  --if-exists \
  $BACKUP_FILE

# Restart application services
sudo systemctl start unit-cost-rs

echo "Database recovery completed"
```

#### **Point-in-Time Recovery:**
```sql
-- Point-in-time recovery procedure
-- 1. Stop application
-- 2. Restore base backup
-- 3. Apply WAL files up to target time

-- Example recovery.conf
restore_command = 'cp /backups/wal/%f %p'
recovery_target_time = '2024-10-12 14:30:00'
recovery_target_action = 'promote'
```

### **3. Backup Verification**

#### **Backup Integrity Check:**
```bash
#!/bin/bash
# backup-verification.sh

BACKUP_DIR="/backups/unit-cost-rs"
VERIFICATION_LOG="/var/log/backup-verification.log"

echo "=== Backup Verification ===" >> $VERIFICATION_LOG
echo "Date: $(date)" >> $VERIFICATION_LOG

# Check backup file integrity
for backup_file in $BACKUP_DIR/*.dump; do
    if [ -f "$backup_file" ]; then
        echo "Verifying: $backup_file"
        
        # Test backup file
        pg_restore --list $backup_file > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✓ $backup_file: VALID" >> $VERIFICATION_LOG
        else
            echo "✗ $backup_file: CORRUPTED" >> $VERIFICATION_LOG
        fi
    fi
done

echo "=== Verification Complete ===" >> $VERIFICATION_LOG
```

---

## MONITORING DAN ALERTING

### **1. System Monitoring**

#### **Key Metrics to Monitor:**
- **CPU Usage** - Penggunaan CPU
- **Memory Usage** - Penggunaan memori
- **Disk I/O** - Input/Output disk
- **Network Traffic** - Traffic jaringan
- **Database Connections** - Koneksi database
- **Response Time** - Waktu respons aplikasi

#### **Monitoring Script:**
```bash
#!/bin/bash
# system-monitoring.sh

LOG_FILE="/var/log/system-monitoring.log"

echo "=== System Monitoring ===" >> $LOG_FILE
echo "Timestamp: $(date)" >> $LOG_FILE

# CPU Usage
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
echo "CPU Usage: $CPU_USAGE%" >> $LOG_FILE

# Memory Usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.2f", $3/$2 * 100.0}')
echo "Memory Usage: $MEMORY_USAGE%" >> $LOG_FILE

# Disk Usage
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
echo "Disk Usage: $DISK_USAGE%" >> $LOG_FILE

# Database connections
DB_CONNECTIONS=$(psql -h localhost -U postgres -d unit_cost_rs -t -c "SELECT count(*) FROM pg_stat_activity;")
echo "Database Connections: $DB_CONNECTIONS" >> $LOG_FILE

# Application response time
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' http://localhost:3000/api/health)
echo "Application Response Time: ${RESPONSE_TIME}s" >> $LOG_FILE
```

### **2. Application Monitoring**

#### **Health Check Endpoint:**
```typescript
// api/health.ts
export const healthCheck = async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      storage: await checkStorageHealth()
    }
  };

  const isHealthy = Object.values(healthStatus.services)
    .every(service => service.status === 'OK');

  res.status(isHealthy ? 200 : 503).json(healthStatus);
};
```

#### **Performance Monitoring:**
```typescript
// monitoring/performance.ts
export const performanceMonitor = {
  // Track API response times
  trackResponseTime: (endpoint: string, duration: number) => {
    console.log(`API ${endpoint}: ${duration}ms`);
    
    // Send to monitoring service
    if (duration > 5000) { // 5 seconds threshold
      alerting.sendAlert({
        type: 'PERFORMANCE',
        severity: 'WARNING',
        message: `Slow response time on ${endpoint}: ${duration}ms`,
        timestamp: new Date()
      });
    }
  },

  // Track database query performance
  trackQueryPerformance: (query: string, duration: number) => {
    if (duration > 1000) { // 1 second threshold
      console.warn(`Slow query detected: ${duration}ms - ${query}`);
    }
  },

  // Track memory usage
  trackMemoryUsage: () => {
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024)
    };

    return memUsageMB;
  }
};
```

### **3. Alerting System**

#### **Alert Configuration:**
```yaml
# alerting-config.yml
alerts:
  - name: "High CPU Usage"
    condition: "cpu_usage > 80"
    duration: "5m"
    severity: "WARNING"
    action: "send_email"

  - name: "High Memory Usage"
    condition: "memory_usage > 85"
    duration: "3m"
    severity: "CRITICAL"
    action: "send_sms"

  - name: "Database Connection Failure"
    condition: "db_connections = 0"
    duration: "1m"
    severity: "CRITICAL"
    action: "send_call"

  - name: "Disk Space Low"
    condition: "disk_usage > 90"
    duration: "10m"
    severity: "WARNING"
    action: "send_email"
```

#### **Alert Handler:**
```typescript
// alerting/handler.ts
export const alertHandler = {
  sendEmail: async (alert: Alert) => {
    const emailContent = {
      to: 'admin@unit-cost-rs.com',
      subject: `[${alert.severity}] ${alert.name}`,
      body: `
        Alert: ${alert.name}
        Severity: ${alert.severity}
        Time: ${alert.timestamp}
        Message: ${alert.message}
        Condition: ${alert.condition}
      `
    };

    await emailService.send(emailContent);
  },

  sendSMS: async (alert: Alert) => {
    if (alert.severity === 'CRITICAL') {
      await smsService.send({
        to: '+6281234567890',
        message: `CRITICAL ALERT: ${alert.name} - ${alert.message}`
      });
    }
  },

  sendCall: async (alert: Alert) => {
    if (alert.severity === 'CRITICAL') {
      await phoneService.call({
        to: '+6281234567890',
        message: `Critical system alert: ${alert.name}`
      });
    }
  }
};
```

---

## PERFORMANCE OPTIMIZATION

### **1. Database Optimization**

#### **Query Optimization:**
```sql
-- Analyze slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE mean_time > 1000 -- queries taking more than 1 second
ORDER BY mean_time DESC
LIMIT 10;

-- Create indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_users_email ON auth.users(email);
CREATE INDEX CONCURRENTLY idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX CONCURRENTLY idx_audit_logs_user_id ON audit_logs(user_id);

-- Update table statistics
ANALYZE;
```

#### **Connection Pooling:**
```typescript
// config/database.ts
import { Pool } from 'pg';

export const dbPool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  statement_timeout: 30000, // Query timeout
  query_timeout: 30000,
  application_name: 'unit-cost-rs'
});
```

### **2. Application Optimization**

#### **Caching Strategy:**
```typescript
// caching/redis.ts
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null
});

export const cacheService = {
  // Cache user data
  cacheUserData: async (userId: string, userData: any) => {
    await redis.setex(`user:${userId}`, 3600, JSON.stringify(userData));
  },

  // Get cached user data
  getCachedUserData: async (userId: string) => {
    const cached = await redis.get(`user:${userId}`);
    return cached ? JSON.parse(cached) : null;
  },

  // Cache API responses
  cacheApiResponse: async (key: string, data: any, ttl: number = 300) => {
    await redis.setex(`api:${key}`, ttl, JSON.stringify(data));
  },

  // Get cached API response
  getCachedApiResponse: async (key: string) => {
    const cached = await redis.get(`api:${key}`);
    return cached ? JSON.parse(cached) : null;
  }
};
```

#### **Code Splitting and Lazy Loading:**
```typescript
// Lazy loading components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Reports = lazy(() => import('./pages/Reports'));

// Route configuration with code splitting
const routes = [
  {
    path: '/',
    element: <Dashboard />
  },
  {
    path: '/users',
    element: <UserManagement />
  },
  {
    path: '/reports',
    element: <Reports />
  }
];
```

### **3. Frontend Optimization**

#### **Bundle Analysis:**
```bash
# Analyze bundle size
npm run build
npx vite-bundle-analyzer dist

# Optimize images
npm install -g imagemin-cli
imagemin src/assets/*.{jpg,png} --out-dir=dist/assets --plugin=webp
```

#### **Performance Monitoring:**
```typescript
// monitoring/performance.ts
export const frontendMonitoring = {
  // Track page load times
  trackPageLoad: (pageName: string) => {
    const loadTime = performance.now();
    
    if (loadTime > 3000) { // 3 seconds threshold
      console.warn(`Slow page load: ${pageName} - ${loadTime}ms`);
    }
  },

  // Track user interactions
  trackUserInteraction: (action: string, element: string) => {
    console.log(`User interaction: ${action} on ${element}`);
  },

  // Track errors
  trackError: (error: Error, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    // Send to error tracking service
    errorTracking.captureException(error, {
      tags: {
        context: context,
        page: window.location.pathname
      }
    });
  }
};
```

---

## SECURITY MAINTENANCE

### **1. Security Updates**

#### **Automated Security Scanning:**
```bash
#!/bin/bash
# security-scan.sh

echo "=== Security Scan ==="

# Check for vulnerable packages
npm audit --audit-level moderate

# Scan for malware
clamscan -r /var/www/unit-cost-rs

# Check file permissions
find /var/www/unit-cost-rs -type f -perm /o+w -ls

# Check for suspicious files
find /var/www/unit-cost-rs -name "*.php" -o -name "*.asp" -o -name "*.jsp"

echo "=== Security Scan Complete ==="
```

#### **SSL Certificate Management:**
```bash
#!/bin/bash
# ssl-renewal.sh

# Check certificate expiry
CERT_EXPIRY=$(openssl x509 -in /etc/ssl/certs/unit-cost-rs.crt -noout -enddate | cut -d= -f2)
CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( (CERT_EXPIRY_EPOCH - CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    echo "SSL Certificate expires in $DAYS_UNTIL_EXPIRY days. Renewal needed."
    
    # Renew certificate using Let's Encrypt
    certbot renew --quiet
    
    # Reload web server
    sudo systemctl reload nginx
else
    echo "SSL Certificate is valid for $DAYS_UNTIL_EXPIRY more days."
fi
```

### **2. Access Control**

#### **Regular Access Review:**
```sql
-- Review user access
SELECT 
  u.email,
  up.full_name,
  r.name as role_name,
  up.is_active,
  u.last_sign_in_at,
  COUNT(al.id) as login_count_30_days
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id
LEFT JOIN audit_logs al ON u.id = al.user_id 
  AND al.created_at >= CURRENT_DATE - INTERVAL '30 days'
  AND al.action = 'LOGIN'
GROUP BY u.id, u.email, up.full_name, r.name, up.is_active, u.last_sign_in_at
ORDER BY u.last_sign_in_at DESC;

-- Review inactive users
SELECT 
  u.email,
  up.full_name,
  r.name as role_name,
  u.last_sign_in_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN roles r ON up.role_id = r.id
WHERE u.last_sign_in_at < CURRENT_DATE - INTERVAL '90 days'
  AND up.is_active = true;
```

### **3. Security Monitoring**

#### **Intrusion Detection:**
```bash
#!/bin/bash
# intrusion-detection.sh

LOG_FILE="/var/log/security-monitoring.log"

echo "=== Security Monitoring ===" >> $LOG_FILE
echo "Date: $(date)" >> $LOG_FILE

# Check for failed login attempts
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | wc -l)
echo "Failed login attempts (24h): $FAILED_LOGINS" >> $LOG_FILE

# Check for suspicious IP addresses
SUSPICIOUS_IPS=$(grep "Failed password" /var/log/auth.log | awk '{print $11}' | sort | uniq -c | sort -nr | head -5)
echo "Suspicious IP addresses:" >> $LOG_FILE
echo "$SUSPICIOUS_IPS" >> $LOG_FILE

# Check for unusual file modifications
RECENT_MODIFICATIONS=$(find /var/www/unit-cost-rs -type f -mtime -1 -ls)
echo "Recent file modifications:" >> $LOG_FILE
echo "$RECENT_MODIFICATIONS" >> $LOG_FILE

echo "=== Security Monitoring Complete ===" >> $LOG_FILE
```

---

## TROUBLESHOOTING

### **1. Common Issues**

#### **Database Connection Issues:**

**Symptoms:**
- Application cannot connect to database
- Timeout errors
- Connection pool exhausted

**Diagnosis:**
```bash
# Check database service status
sudo systemctl status postgresql

# Check database connectivity
psql -h localhost -U postgres -d unit_cost_rs -c "SELECT 1;"

# Check connection limits
psql -h localhost -U postgres -d unit_cost_rs -c "SELECT count(*) FROM pg_stat_activity;"

# Check database logs
tail -f /var/log/postgresql/postgresql-*.log
```

**Solutions:**
1. **Restart Database Service** - `sudo systemctl restart postgresql`
2. **Increase Connection Limits** - Update `max_connections` in postgresql.conf
3. **Check Network Configuration** - Verify firewall and network settings
4. **Optimize Connection Pool** - Adjust pool size and timeout settings

#### **Application Performance Issues:**

**Symptoms:**
- Slow response times
- High CPU usage
- Memory leaks

**Diagnosis:**
```bash
# Check application processes
ps aux | grep node

# Check memory usage
free -h

# Check disk I/O
iostat -x 1 5

# Check application logs
tail -f /var/log/unit-cost-rs/application.log
```

**Solutions:**
1. **Optimize Database Queries** - Add indexes, optimize queries
2. **Implement Caching** - Use Redis for caching
3. **Scale Resources** - Increase CPU/memory
4. **Code Optimization** - Optimize application code

### **2. Error Handling**

#### **Application Error Handling:**
```typescript
// error-handling.ts
export const errorHandler = {
  // Global error handler
  handleError: (error: Error, context: string) => {
    console.error(`Error in ${context}:`, error);
    
    // Log error
    logger.error({
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date()
    });
    
    // Send alert for critical errors
    if (error.name === 'CriticalError') {
      alerting.sendCriticalAlert({
        error: error.message,
        context: context,
        timestamp: new Date()
      });
    }
  },

  // Database error handler
  handleDatabaseError: (error: any) => {
    if (error.code === '23505') { // Unique violation
      return { message: 'Data already exists', status: 409 };
    } else if (error.code === '23503') { // Foreign key violation
      return { message: 'Referenced data not found', status: 400 };
    } else {
      return { message: 'Database error occurred', status: 500 };
    }
  }
};
```

### **3. Recovery Procedures**

#### **System Recovery Checklist:**
```bash
#!/bin/bash
# system-recovery-checklist.sh

echo "=== System Recovery Checklist ==="

# 1. Check system resources
echo "1. Checking system resources..."
df -h
free -h
uptime

# 2. Check service status
echo "2. Checking service status..."
sudo systemctl status postgresql
sudo systemctl status nginx
sudo systemctl status unit-cost-rs

# 3. Check application logs
echo "3. Checking application logs..."
tail -20 /var/log/unit-cost-rs/application.log
tail -20 /var/log/nginx/error.log

# 4. Check database status
echo "4. Checking database status..."
psql -h localhost -U postgres -d unit_cost_rs -c "SELECT version();"

# 5. Test application endpoints
echo "5. Testing application endpoints..."
curl -f http://localhost:3000/api/health

echo "=== Recovery Checklist Complete ==="
```

---

## DISASTER RECOVERY

### **1. Disaster Recovery Plan**

#### **Recovery Time Objectives (RTO):**
- **Critical Systems** - 4 hours
- **Important Systems** - 8 hours
- **Non-Critical Systems** - 24 hours

#### **Recovery Point Objectives (RPO):**
- **Database** - 15 minutes
- **Application Data** - 1 hour
- **Configuration Files** - 4 hours

### **2. Backup and Recovery Procedures**

#### **Full System Recovery:**
```bash
#!/bin/bash
# full-system-recovery.sh

BACKUP_DATE=$1
RECOVERY_ENV=$2

if [ -z "$BACKUP_DATE" ] || [ -z "$RECOVERY_ENV" ]; then
    echo "Usage: $0 <backup_date> <recovery_environment>"
    exit 1
fi

echo "Starting full system recovery..."
echo "Backup Date: $BACKUP_DATE"
echo "Recovery Environment: $RECOVERY_ENV"

# 1. Prepare recovery environment
echo "Preparing recovery environment..."
sudo systemctl stop unit-cost-rs
sudo systemctl stop nginx

# 2. Restore database
echo "Restoring database..."
pg_restore -h localhost -U postgres -d unit_cost_rs \
  --clean --if-exists \
  /backups/unit-cost-rs/full_backup_${BACKUP_DATE}.dump

# 3. Restore application files
echo "Restoring application files..."
tar -xzf /backups/unit-cost-rs/app_files_${BACKUP_DATE}.tar.gz -C /

# 4. Restore configuration
echo "Restoring configuration..."
cp /backups/unit-cost-rs/config_${BACKUP_DATE}.tar.gz /tmp/
tar -xzf /tmp/config_${BACKUP_DATE}.tar.gz -C /

# 5. Restart services
echo "Restarting services..."
sudo systemctl start postgresql
sudo systemctl start nginx
sudo systemctl start unit-cost-rs

# 6. Verify recovery
echo "Verifying recovery..."
sleep 30
curl -f http://localhost:3000/api/health

if [ $? -eq 0 ]; then
    echo "Recovery completed successfully"
else
    echo "Recovery failed - manual intervention required"
fi
```

### **3. Business Continuity**

#### **High Availability Setup:**
```yaml
# docker-compose.ha.yml
version: '3.8'

services:
  app:
    image: unit-cost-rs:latest
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://user:pass@postgres:5432/unit_cost_rs
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=unit_cost_rs
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

#### **Load Balancing Configuration:**
```nginx
# nginx.conf
upstream app_servers {
    server app_1:3000 weight=1;
    server app_2:3000 weight=1;
    server app_3:3000 weight=1;
}

server {
    listen 80;
    listen 443 ssl;
    
    ssl_certificate /etc/ssl/unit-cost-rs.crt;
    ssl_certificate_key /etc/ssl/unit-cost-rs.key;
    
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/health {
        access_log off;
        proxy_pass http://app_servers;
    }
}
```

---

**Copyright © 2024 Mukhsin Hadi. Hak Cipta Dilindungi Undang-Undang**
