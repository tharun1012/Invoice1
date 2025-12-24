@echo off
echo ========================================
echo Invoice OCR Backend Server
echo ========================================
echo.

cd /d "%~dp0"

echo Checking Python installation...
python --version 2>nul
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8+ from https://python.org
    pause
    exit /b 1
)

echo.
echo Installing dependencies...
pip install -r requirements.txt

echo.
echo Starting OCR API Server on http://localhost:5000
echo Press Ctrl+C to stop
echo.

python app.py
