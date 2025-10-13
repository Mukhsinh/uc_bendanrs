@echo off
echo ========================================
echo Double Distribution Biaya Rumah Sakit
echo ========================================
echo.

echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Python not found. Please install Python first.
    echo Download from: https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

echo Python found! Installing dependencies...
pip install pandas numpy openpyxl

echo.
echo Running double distribution script...
python double_distribution_biaya_rs.py

echo.
echo Script completed. Check the generated Excel file.
pause
