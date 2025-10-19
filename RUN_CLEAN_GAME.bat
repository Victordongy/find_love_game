@echo off
echo.
echo ========================================
echo   Starting Find Love Game (Clean)
echo ========================================
echo.
echo Starting local web server...
echo.
echo Game will open in your browser at:
echo http://localhost:8000/index_clean.html
echo.
echo Press CTRL+C to stop the server
echo.

REM Start Python HTTP server (works with Python 3)
python -m http.server 8000

pause
