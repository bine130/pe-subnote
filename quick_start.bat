@echo off
echo ====================================
echo PE Subnote Quick Start
echo ====================================
echo.

:menu
echo Select an option:
echo 1. Start Backend Server
echo 2. Start Student App (PWA)
echo 3. Start Admin App
echo 4. Start All (in new windows)
echo 5. Setup Backend (venv + install packages)
echo 6. Setup Frontend (npm install)
echo 7. Exit
echo.

set /p choice="Choose (1-7): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto student
if "%choice%"=="3" goto admin
if "%choice%"=="4" goto all
if "%choice%"=="5" goto setup_backend
if "%choice%"=="6" goto setup_frontend
if "%choice%"=="7" goto end

echo Invalid choice.
echo.
goto menu

:backend
echo.
echo [Starting Backend Server]
cd backend
if not exist venv (
    echo Virtual environment not found. Please run option 5 first.
    pause
    cd ..
    goto menu
)
call venv\Scripts\activate
echo Starting Backend server...
echo API docs: http://localhost:8000/docs
uvicorn app.main:app --reload --port 8000
goto end

:student
echo.
echo [Starting Student App]
cd frontend\student-app
if not exist node_modules (
    echo node_modules not found. Please run option 6 first.
    pause
    cd ..\..
    goto menu
)
echo Starting Student App...
echo Visit: http://localhost:5173
npm run dev
goto end

:admin
echo.
echo [Starting Admin App]
cd frontend\admin-app
if not exist node_modules (
    echo node_modules not found. Please run option 6 first.
    pause
    cd ..\..
    goto menu
)
echo Starting Admin App...
echo Visit: http://localhost:5174
npm run dev
goto end

:all
echo.
echo [Starting All Servers]
echo Opening new windows for each server...
start "Backend Server" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
timeout /t 2 /nobreak >nul
start "Student App" cmd /k "cd /d %~dp0frontend\student-app && npm run dev"
timeout /t 2 /nobreak >nul
start "Admin App" cmd /k "cd /d %~dp0frontend\admin-app && npm run dev"
echo.
echo All servers started in new windows:
echo - Backend: http://localhost:8000/docs
echo - Student: http://localhost:5173
echo - Admin: http://localhost:5174
echo.
pause
goto menu

:setup_backend
echo.
echo [Backend Setup]
cd backend

if exist venv (
    echo Virtual environment already exists.
) else (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing packages...
pip install -r requirements.txt

echo.
echo Backend setup complete!
echo Please check .env file is configured correctly.
echo.
pause
cd ..
goto menu

:setup_frontend
echo.
echo [Frontend Setup]

echo Installing Student App packages...
cd frontend\student-app
call npm install
cd ..\..

echo.
echo Installing Admin App packages...
cd frontend\admin-app
call npm install
cd ..\..

echo.
echo Frontend setup complete!
echo.
pause
goto menu

:end
echo.
echo Exiting...
exit
