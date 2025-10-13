# Double Distribution Biaya Rumah Sakit - PowerShell Script
# ========================================================

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Double Distribution Biaya Rumah Sakit" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Python installation
Write-Host "Checking Python installation..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Python not found. Please install Python first." -ForegroundColor Red
    Write-Host "Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "Make sure to check 'Add Python to PATH' during installation." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install dependencies
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Yellow
try {
    pip install pandas numpy openpyxl
    Write-Host "Dependencies installed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error installing dependencies. Please check your internet connection." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Run the script
Write-Host ""
Write-Host "Running double distribution script..." -ForegroundColor Yellow
try {
    python double_distribution_biaya_rs.py
    Write-Host ""
    Write-Host "Script completed successfully!" -ForegroundColor Green
    Write-Host "Check the generated Excel file in the current directory." -ForegroundColor Cyan
} catch {
    Write-Host "Error running script. Please check the error message above." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
