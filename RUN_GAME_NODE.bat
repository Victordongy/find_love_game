@echo off
echo Starting Find Love Game Server with Node.js...
echo.
echo Open your browser and go to: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server when done.
echo.
cd /d "C:\Users\Victo\OneDrive\dev\find_love_game"
npx http-server -p 8000
pause