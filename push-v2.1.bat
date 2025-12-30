@echo off
echo ========================================
echo Finance Tracker v2.1 - Smart Budget Update
echo ========================================
echo.

cd C:\Users\jm774\Documents\Finance

echo [1/3] Adding changes...
git add .

echo.
echo [2/3] Committing...
git commit -m "v2.1: Smart Budget Status + Hard Stop Rule + Auto-date"

echo.
echo [3/3] Pushing to GitHub...
git push

echo.
echo ========================================
echo Done! Changes pushed to GitHub!
echo ========================================
echo.
echo Your site will update in 1-2 minutes at:
echo https://laizywaizy.github.io/finance-tracker/
echo.
echo NEW FEATURES:
echo - Smart budget status card (Am I chilling or cooking myself?)
echo - Progress bars with remaining amounts
echo - Hard stop rule (Fun locked when bills not covered)
echo - Spending impacts dashboard
echo - Auto-fill today's date on mobile
echo.
pause
