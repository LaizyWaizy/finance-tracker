@echo off
echo ========================================
echo Finance Tracker - Push to GitHub
echo ========================================
echo.

cd C:\Users\jm774\Documents\Finance

echo [1/4] Adding remote...
git remote add origin https://github.com/LaizyWaizy/finance-tracker.git

echo.
echo [2/4] Setting branch to main...
git branch -M main

echo.
echo [3/4] Pushing to GitHub...
git push -u origin main

echo.
echo ========================================
echo Done! Your code is now on GitHub!
echo ========================================
echo.
echo Next step: Enable GitHub Pages
echo 1. Go to: https://github.com/LaizyWaizy/finance-tracker/settings/pages
echo 2. Under "Source", select "main" branch
echo 3. Click "Save"
echo 4. Wait 1-2 minutes
echo 5. Your site will be live at: https://laizywaizy.github.io/finance-tracker/
echo.
pause
