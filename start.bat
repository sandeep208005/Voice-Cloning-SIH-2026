@echo off
title DeepShield AI Launcher
echo ============================================================
echo   DeepShield AI - Multimodal Defense Platform
echo ============================================================
echo.

echo [1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...
start "DeepShield Backend (FastAPI)" cmd /k "cd backend && python main.py"

timeout /t 3 >nul

echo [2/2] Starting Vite Frontend on http://localhost:5173 ...
start "DeepShield Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo   DeepShield AI is launching!
echo   - Frontend Application: http://localhost:5173
echo   - Backend API Docs:     http://127.0.0.1:8000/docs
echo   - Health Check:         http://127.0.0.1:8000/api/v1/health
echo ============================================================
echo.
pause
