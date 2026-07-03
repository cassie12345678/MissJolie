@echo off
REM ====================================================
REM BOOKING REMINDERS SCRIPT - WINDOWS TASK SCHEDULER
REM Dit script wordt uitgevoerd door Windows Task Scheduler
REM Aanbevolen: elke 1-2 uur uitvoeren
REM ====================================================

echo Starting Booking Reminders Check...
echo ====================================

REM Pas het pad naar PHP aan indien nodig
REM Voor XAMPP is dit meestal: C:\xampp\php\php.exe
REM Voor andere installaties, controleer waar php.exe staat

C:\xampp\php\php.exe "D:\www\includes\send-booking-reminders.php"

echo.
echo ====================================
echo Booking Reminders Check Completed
echo %DATE% %TIME%
echo ====================================

REM Optioneel: log output naar bestand
REM >> D:\www\includes\reminder-script-log.txt
