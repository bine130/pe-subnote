@echo off
echo ====================================
echo PE Subnote - Stop Server
echo ====================================
echo.

:menu
echo Select an option:
echo 1. Stop Backend (Port 8000)
echo 2. Stop Student App (Port 5173)
echo 3. Stop Admin App (Port 5174)
echo 4. Stop All
echo 5. Stop Custom Port
echo 6. Exit
echo.

set /p choice="Choose (1-6): "

if "%choice%"=="1" goto backend
if "%choice%"=="2" goto student
if "%choice%"=="3" goto admin
if "%choice%"=="4" goto all
if "%choice%"=="5" goto custom
if "%choice%"=="6" goto end

echo Invalid choice.
echo.
goto menu

:backend
echo.
echo [Stopping Backend Server - Port 8000]
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a
)
echo Backend server stopped.
echo.
pause
goto menu

:student
echo.
echo [Stopping Student App - Port 5173]
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a
)
echo Student App stopped.
echo.
pause
goto menu

:admin
echo.
echo [Stopping Admin App - Port 5174]
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a
)
echo Admin App stopped.
echo.
pause
goto menu

:all
echo.
echo [Stopping All Servers]
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    echo Killing Backend process %%a
    taskkill /F /PID %%a
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do (
    echo Killing Student App process %%a
    taskkill /F /PID %%a
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    echo Killing Admin App process %%a
    taskkill /F /PID %%a
)
echo All servers stopped.
echo.
pause
goto menu

:custom
echo.
set /p port="Enter port number to stop: "
echo [Stopping processes on Port %port%]
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :%port% ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a
)
echo Port %port% processes stopped.
echo.
pause
goto menu

:end
echo.
echo Exiting...
exit
