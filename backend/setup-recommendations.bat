@echo off
echo ========================================
echo Content-Based Recommendation System Setup
echo ========================================
echo.

cd recommendation-engine

echo [1/4] Creating Python virtual environment...
python -m venv venv
if %errorlevel% neq 0 (
    echo ERROR: Failed to create virtual environment
    echo Please ensure Python 3.8+ is installed and in PATH
    pause
    exit /b 1
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat
if %errorlevel% neq 0 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo [3/4] Installing Python dependencies...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [4/4] Testing recommendation engine...
echo.
echo Please enter a product ID from your database to test:
set /p PRODUCT_ID="Product ID: "

python recommend.py %PRODUCT_ID%
if %errorlevel% neq 0 (
    echo ERROR: Recommendation engine test failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo To use the recommendation engine:
echo 1. Activate venv: venv\Scripts\activate
echo 2. Run: python recommend.py [product_id]
echo.
pause
