# PowerShell script untuk testing aplikasi
Write-Host "=== TESTING APLIKASI UNIT COST RS ===" -ForegroundColor Green

# Check if npm is installed
Write-Host "1. Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "   ✅ npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "   ❌ npm not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if .env file exists
Write-Host "2. Checking .env file..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ✅ .env file exists" -ForegroundColor Green
    $envContent = Get-Content ".env"
    Write-Host "   Content:" -ForegroundColor Cyan
    $envContent | ForEach-Object { Write-Host "     $_" -ForegroundColor Gray }
} else {
    Write-Host "   ❌ .env file not found" -ForegroundColor Red
    Write-Host "   Creating .env file..." -ForegroundColor Yellow
    
    @"
VITE_SUPABASE_URL=https://koepzicdtovtknsqlnac.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXB6aWNkdG92dGtuc3FsbmFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDg1NzgsImV4cCI6MjA3Mjg4NDU3OH0.QUpuIaPDlDVp2LKSJYkBj4z3IY0aJwyCNhOXyVC2Ui0
"@ | Out-File -FilePath ".env" -Encoding UTF8
    
    Write-Host "   ✅ .env file created" -ForegroundColor Green
}

# Check if node_modules exists
Write-Host "3. Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "   ✅ node_modules exists" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start development server
Write-Host "4. Starting development server..." -ForegroundColor Yellow
Write-Host "   🌐 Application will be available at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   🧪 Test page: http://localhost:5173/test-supabase" -ForegroundColor Cyan
Write-Host "   🔐 Login page: http://localhost:5173/login" -ForegroundColor Cyan
Write-Host "   📊 Biaya page: http://localhost:5173/data-master/biaya" -ForegroundColor Cyan
Write-Host ""
Write-Host "   Press Ctrl+C to stop the server" -ForegroundColor Red
Write-Host ""

# Start the development server
npm run dev
