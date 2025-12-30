
import { db, auth, collection, addDoc, getDocs, doc, setDoc, deleteDoc, query, where, onAuthStateChanged, signOut } from './firebase-config.js';

// Finance Tracker v3.0 - Cloud Sync Edition
// Now powered by Google Firebase

// ============================================
// DATA MANAGEMENT
// ============================================

class FinanceTracker {
    constructor() {
        // Initialize state, but don't load data yet (waiting for login)
        this.entries = [];
        this.bills = [];
        this.spending = [];
        this.settings = this.defaultSettings();

        // Safety Lock: Prevent edits until Cloud Sync is done
        this.showLoading();

        // Setup Logout (Global Listener)
        this.setupLogout();

        // Wait for Auth before doing anything
        this.initAuth();
    }

    setupLogout() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#logout-btn');
            if (btn) {
                if (confirm('Are you sure you want to log out?')) {
                    signOut(auth).then(() => {
                        console.log('User signed out');
                        window.location.href = 'login.html';
                    }).catch((error) => {
                        console.error('Sign out error', error);
                        alert('Logout failed: ' + error.message);
                    });
                }
            }
        });
    }

    showLoading() {
        if (document.getElementById('app-loading-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'app-loading-overlay';
        overlay.innerHTML = '<div class="text-white text-2xl font-bold animate-pulse">☁️ Syncing...</div>';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-80 z-[100] flex items-center justify-center backdrop-blur-sm';
        document.body.appendChild(overlay);
    }

    hideLoading() {
        const overlay = document.getElementById('app-loading-overlay');
        if (overlay) overlay.remove();
    }

    async initAuth() {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log("User logged in:", user.email);
                this.userId = user.uid;
                window.tracker = this;
                await this.initData(); // Load cloud data
                this.hideLoading(); // Unlock the app
            } else {
                console.log("No user, redirecting to login");
                window.location.href = 'login.html';
            }
        });
    }

    async initData() {
        // Show loading state here if desired
        await this.loadAllDataFromCloud();

        this.setupEventListeners();
        this.render();

        // Setup logout button if it exists
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                signOut(auth).then(() => window.location.href = 'login.html');
            });
        }
    }

    defaultSettings() {
        return {
            weeklyTarget: 0,
            monthlyTarget: 0,
            targetHourly: 0,
            minRunway: 30,
            dailyExpenses: 0,
            startingBalance: 0,
            budgets: {
                food: 300,
                gas: 200,
                fun: 150,
                misc: 100
            }
        };
    }

    // ============================================
    // CLOUD SYNC METHODS
    // ============================================

    async loadAllDataFromCloud() {
        try {
            const docRef = doc(db, "users", this.userId);
            const docSnap = await getDocs(query(collection(db, "users"), where("__name__", "==", this.userId)));

            // Check if user exists using getDocs (safer for initial load) or getDoc
            // We'll use getDoc for simplicity
            // actually import of getDoc wasn't added, let's use onSnapshot for real-time or just setDoc to ensuring it exists

            // Re-implementing with standardized setDoc merge
            // We read the doc directly
            // Since we need to import getDoc, let's just use the query we have or import it.
            // Simplified: Just use the collection query we imported

            const q = query(collection(db, "users"), where("__name__", "==", this.userId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userData = querySnapshot.docs[0].data();
                this.entries = userData.entries || [];
                this.bills = userData.bills || [];
                this.spending = userData.spending || [];
                this.settings = { ...this.defaultSettings(), ...userData.settings };
                console.log("Cloud data loaded successfully");
            } else {
                console.log("New user detected, creating empty profile");
                await this.saveToCloud(); // Create initial doc
            }
        } catch (error) {
            console.error("Error loading cloud data:", error);
            alert("Error loading data from cloud. check console.");
        }
    }

    async saveToCloud() {
        if (!this.userId) return;

        const dataToSave = {
            entries: this.entries,
            bills: this.bills,
            spending: this.spending,
            settings: this.settings,
            lastUpdated: new Date().toISOString()
        };

        try {
            await setDoc(doc(db, "users", this.userId), dataToSave);
            console.log("Data synced to cloud ☁️");
            this.showSyncStatus();
        } catch (error) {
            console.error("Cloud save failed:", error);
            alert("⚠️ SAVE FAILED: " + error.message + "\n\n(Check Firestore Rules in Firebase Console)");
        }
    }

    showSyncStatus() {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-bounce';
        toast.innerHTML = '☁️ Saved to Cloud';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // ============================================
    // LEGACY METHODS OVERRIDES
    // ============================================

    // Check local storage for backup or migration if needed
    // But for V3, we rely on cloud.

    // Updates to modification methods to trigger saveToCloud
    // The original addEntry method is modified to call saveToCloud
    // The original deleteEntry, deleteBill, deleteSpending methods are modified to call saveToCloud
    // The original saveSettings method is replaced with the new one that calls saveToCloud

    // ============================================
    // LOAD/SAVE DATA
    // ============================================

    loadEntries() {
        const stored = localStorage.getItem('financeEntries');
        return stored ? JSON.parse(stored) : [];
    }

    saveEntries() {
        this.saveToCloud();
    }

    loadBills() {
        // Legacy load, ignored if cloud works, but kept for safety
        const stored = localStorage.getItem('financeBills');
        return stored ? JSON.parse(stored) : [];
    }

    saveBills() {
        this.saveToCloud();
    }

    loadSpending() {
        // Legacy load
        const stored = localStorage.getItem('financeSpending');
        return stored ? JSON.parse(stored) : [];
    }

    saveSpending() {
        this.saveToCloud();
    }

    loadSettings() {
        const stored = localStorage.getItem('financeSettings');
        return stored ? JSON.parse(stored) : {
            weeklyTarget: 400,
            monthlyTarget: 1600,
            targetHourly: 15,
            minRunway: 7,
            dailyExpenses: 50,
            startingBalance: 0,
            budgets: {
                food: 300,
                gas: 200,
                fun: 150,
                misc: 100
            }
        };
    }

    saveSettings() {
        this.saveToCloud();
        this.render(); // also render
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================

    setupEventListeners() {
        // Income form
        const incomeForm = document.getElementById('income-form');
        if (incomeForm) {
            incomeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addEntry();
            });
        }

        // Bills form
        const billsForm = document.getElementById('bills-form');
        if (billsForm) {
            billsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addBill();
            });
        }

        // Spending form
        const spendingForm = document.getElementById('spending-form');
        if (spendingForm) {
            spendingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.addSpending();
            });
        }

        // Work planner
        const plannerInputs = document.querySelectorAll('#planner-hours, #planner-shift, #planner-day');
        plannerInputs.forEach(input => {
            input.addEventListener('input', () => this.updateWorkPlanner());
        });

        // Settings toggle
        const settingsToggle = document.getElementById('settings-toggle');
        if (settingsToggle) {
            settingsToggle.addEventListener('click', () => {
                const settingsPanel = document.getElementById('settings-panel');
                if (settingsPanel) settingsPanel.classList.toggle('hidden');
            });
        }

        // Bills toggle
        const billsToggle = document.getElementById('bills-toggle');
        if (billsToggle) {
            billsToggle.addEventListener('click', () => {
                const billsPanel = document.getElementById('bills-panel');
                if (billsPanel) billsPanel.classList.toggle('hidden');
            });
        }

        // Budget toggle
        const budgetToggle = document.getElementById('budget-toggle');
        if (budgetToggle) {
            budgetToggle.addEventListener('click', () => {
                const budgetPanel = document.getElementById('budget-panel');
                if (budgetPanel) budgetPanel.classList.toggle('hidden');
            });
        }

        // Save settings
        const saveSettings = document.getElementById('save-settings');
        if (saveSettings) {
            saveSettings.addEventListener('click', () => {
                this.updateSettings();
            });
        }

        // Clear all data
        const clearData = document.getElementById('clear-data');
        if (clearData) {
            clearData.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
                    this.clearAllData();
                }
            });
        }

        this.populateSettings();
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const entryDate = document.getElementById('entry-date');
        if (entryDate) entryDate.value = today;
        const spendingDate = document.getElementById('spending-date');
        if (spendingDate) spendingDate.value = today;
    }

    // ============================================
    // INCOME ENTRY MANAGEMENT
    // ============================================

    addEntry() {
        const date = document.getElementById('entry-date').value;
        const source = document.getElementById('entry-source').value;
        const hours = parseFloat(document.getElementById('entry-hours').value);
        const gross = parseFloat(document.getElementById('entry-gross').value);
        const expenses = parseFloat(document.getElementById('entry-expenses').value) || 0;

        // Determine shift type and day of week
        const entryDate = new Date(date);
        const dayOfWeek = entryDate.getDay(); // 0-6 (Sun-Sat)

        // Smart shift detection based on hours (you can enhance this later with time input)
        let shiftType = 'other';
        if (source === 'DoorDash') {
            // Heuristic: distribute based on entry ID for demo
            // In production, you'd ask user or use time stamps
            const shiftTypes = ['breakfast', 'lunch', 'dinner', 'lateNight'];
            shiftType = shiftTypes[Math.floor(Math.random() * shiftTypes.length)];
        }

        const entry = {
            id: Date.now(),
            date,
            source,
            hours,
            gross,
            expenses,
            net: gross - expenses,
            hourly: hours > 0 ? (gross - expenses) / hours : 0,
            shiftType,
            dayOfWeek
        };

        this.entries.unshift(entry);
        this.saveEntries();
        this.render();

        document.getElementById('income-form').reset();
        this.setDefaultDate();
        this.showNotification('Entry added successfully! 🎉');
    }

    deleteEntry(id) {
        if (confirm('Delete this entry?')) {
            this.entries = this.entries.filter(e => e.id !== id);
            this.saveEntries();
            this.render();
            this.showNotification('Entry deleted');
        }
    }

    // ============================================
    // BILLS MANAGEMENT
    // ============================================

    addBill() {
        const name = document.getElementById('bill-name').value;
        const amount = parseFloat(document.getElementById('bill-amount').value);
        const frequency = document.getElementById('bill-frequency').value;
        const dueDate = parseInt(document.getElementById('bill-due').value);

        const bill = {
            id: Date.now(),
            name,
            amount,
            frequency,
            dueDate,
            isAuto: false
        };

        this.bills.push(bill);
        this.saveBills();
        this.render();

        document.getElementById('bills-form').reset();
        this.showNotification('Bill added! 📋');
    }

    deleteBill(id) {
        if (confirm('Delete this bill?')) {
            this.bills = this.bills.filter(b => b.id !== id);
            this.saveBills();
            this.render();
            this.showNotification('Bill deleted');
        }
    }

    // ============================================
    // SPENDING MANAGEMENT
    // ============================================

    addSpending() {
        const date = document.getElementById('spending-date').value;
        const category = document.getElementById('spending-category').value;
        const amount = parseFloat(document.getElementById('spending-amount').value);
        const note = document.getElementById('spending-note').value;

        const spending = {
            id: Date.now(),
            date,
            category,
            amount,
            note
        };

        this.spending.unshift(spending);
        this.saveSpending();
        this.render();

        document.getElementById('spending-form').reset();
        this.setDefaultDate();
        this.showNotification('Spending logged! 💸');
    }

    deleteSpending(id) {
        if (confirm('Delete this spending entry?')) {
            this.spending = this.spending.filter(s => s.id !== id);
            this.saveSpending();
            this.render();
            this.showNotification('Spending deleted');
        }
    }

    // Quick preset spending (one-tap)
    addQuickSpending(category, amount, note) {
        const today = new Date().toISOString().split('T')[0];
        const spending = {
            id: Date.now(),
            date: today,
            category: category,
            amount: amount,
            note: note
        };
        this.spending.unshift(spending);
        this.saveSpending();
        this.render();
        this.showNotification('Spending added: ' + note + ' - $' + amount);
    }

    // ============================================
    // ENHANCED BILLS & BUDGET CHECKS
    // ============================================

    // Check if bills are covered
    checkBillsCoverage() {
        const balance = this.calculateCurrentBalance();
        const monthlyBills = this.calculateMonthlyBills();
        const covered = balance >= monthlyBills;
        const shortfall = covered ? 0 : monthlyBills - balance;

        return {
            covered,
            monthlyBills,
            balance,
            shortfall
        };
    }

    // Get next 3 upcoming bills
    getUpcomingBillsTimeline() {
        return this.getUpcomingBills(30).slice(0, 3);
    }

    // Get spending alerts based on budget status
    getSpendingAlerts() {
        const alerts = [];
        const budgetStatus = this.calculateBudgetStatus();
        const billsCoverage = this.checkBillsCoverage();

        // Check each budget category
        Object.entries(budgetStatus).forEach(([category, status]) => {
            if (status.percent >= 100) {
                alerts.push({
                    level: 'critical',
                    icon: '❌',
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    message: (category.charAt(0).toUpperCase() + category.slice(1)) + ' budget exceeded - No discretionary spending recommended'
                });
            } else if (status.percent >= 90) {
                alerts.push({
                    level: 'warning',
                    icon: '⚠️',
                    category: category.charAt(0).toUpperCase() + category.slice(1),
                    message: (category.charAt(0).toUpperCase() + category.slice(1)) + ' budget at ' + Math.round(status.percent) + '% - Consider cutting back'
                });
            }
        });

        // Check bills coverage
        if (!billsCoverage.covered) {
            alerts.push({
                level: 'critical',
                icon: '🚨',
                category: 'Bills',
                message: 'You need ' + this.formatCurrency(billsCoverage.shortfall) + ' more to cover upcoming bills'
            });
        }

        // Check daily spending rate
        const avgDailySpending = this.calculateAvgDailySpending();
        if (avgDailySpending > this.settings.dailyExpenses) {
            const overage = avgDailySpending - this.settings.dailyExpenses;
            alerts.push({
                level: 'warning',
                icon: '⚠️',
                category: 'Spending',
                message: 'Daily spending ' + this.formatCurrency(overage) + ' over target - Runway shrinking faster than planned'
            });
        }

        return alerts;
    }

    // Calculate average daily spending
    calculateAvgDailySpending() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

        const monthSpending = this.spending.filter(s => new Date(s.date) >= oneMonthAgo);
        const total = monthSpending.reduce((sum, s) => sum + s.amount, 0);

        return total / 30;
    }

    // ============================================
    // CALCULATIONS - INCOME
    // ============================================

    calculateCurrentBalance() {
        const totalIncome = this.entries.reduce((sum, e) => sum + e.net, 0);
        const totalSpending = this.spending.reduce((sum, s) => sum + s.amount, 0);
        return this.settings.startingBalance + totalIncome - totalSpending;
    }

    calculateWeekNet() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        return this.entries
            .filter(e => new Date(e.date) >= oneWeekAgo)
            .reduce((sum, e) => sum + e.net, 0);
    }

    calculateMonthNet() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

        return this.entries
            .filter(e => new Date(e.date) >= oneMonthAgo)
            .reduce((sum, e) => sum + e.net, 0);
    }

    calculateAvgHourly(days = null) {
        let entries = this.entries;

        if (days) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            entries = entries.filter(e => new Date(e.date) >= cutoff);
        }

        if (entries.length === 0) return 0;

        const totalNet = entries.reduce((sum, e) => sum + e.net, 0);
        const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

        return totalHours > 0 ? totalNet / totalHours : 0;
    }

    // ============================================
    // CALCULATIONS - BILLS & RUNWAY
    // ============================================

    calculateMonthlyBills() {
        return this.bills.reduce((sum, bill) => {
            if (bill.frequency === 'monthly') {
                return sum + bill.amount;
            } else if (bill.frequency === 'weekly') {
                return sum + (bill.amount * 4.33); // Avg weeks per month
            }
            return sum;
        }, 0);
    }

    getUpcomingBills(days = 30) {
        const today = new Date();
        const upcoming = [];

        this.bills.forEach(bill => {
            if (bill.frequency === 'monthly') {
                const dueThisMonth = new Date(today.getFullYear(), today.getMonth(), bill.dueDate);
                const dueNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, bill.dueDate);

                if (dueThisMonth >= today && dueThisMonth <= new Date(today.getTime() + days * 24 * 60 * 60 * 1000)) {
                    upcoming.push({ ...bill, dueDate: dueThisMonth });
                } else if (dueNextMonth <= new Date(today.getTime() + days * 24 * 60 * 60 * 1000)) {
                    upcoming.push({ ...bill, dueDate: dueNextMonth });
                }
            }
        });

        return upcoming.sort((a, b) => a.dueDate - b.dueDate);
    }

    calculateRunway() {
        const balance = this.calculateCurrentBalance();
        const upcomingBills = this.getUpcomingBills(30);
        const billsTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
        const safeBalance = balance - billsTotal;
        const dailyExpenses = this.settings.dailyExpenses;

        if (dailyExpenses <= 0) return Infinity;
        if (safeBalance <= 0) return 0;

        return Math.floor(safeBalance / dailyExpenses);
    }

    // ============================================
    // CALCULATIONS - BUDGET
    // ============================================

    calculateBudgetStatus() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);

        const monthSpending = this.spending.filter(s => new Date(s.date) >= oneMonthAgo);

        const status = {};
        Object.keys(this.settings.budgets).forEach(category => {
            const limit = this.settings.budgets[category];
            const spent = monthSpending
                .filter(s => s.category === category)
                .reduce((sum, s) => sum + s.amount, 0);

            const remaining = limit - spent;
            const percent = limit > 0 ? (spent / limit) * 100 : 0;

            let color = 'green';
            if (percent >= 90) color = 'red';
            else if (percent >= 70) color = 'yellow';

            status[category] = {
                limit,
                spent,
                remaining,
                percent,
                color
            };
        });

        return status;
    }

    // ============================================
    // ANALYTICS - DAY OF WEEK
    // ============================================

    getBestWorstDays() {
        const dayStats = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Initialize
        for (let i = 0; i < 7; i++) {
            dayStats[i] = { name: dayNames[i], totalNet: 0, totalHours: 0, count: 0 };
        }

        // Calculate
        this.entries.forEach(entry => {
            if (entry.dayOfWeek !== undefined) {
                dayStats[entry.dayOfWeek].totalNet += entry.net;
                dayStats[entry.dayOfWeek].totalHours += entry.hours;
                dayStats[entry.dayOfWeek].count++;
            }
        });

        // Find best and worst
        let best = null;
        let worst = null;
        let bestRate = 0;
        let worstRate = Infinity;

        Object.values(dayStats).forEach(day => {
            if (day.count >= 2) { // Need at least 2 entries
                const avgRate = day.totalHours > 0 ? day.totalNet / day.totalHours : 0;
                if (avgRate > bestRate) {
                    bestRate = avgRate;
                    best = { ...day, avgRate };
                }
                if (avgRate < worstRate && avgRate > 0) {
                    worstRate = avgRate;
                    worst = { ...day, avgRate };
                }
            }
        });

        return { best, worst };
    }

    // ============================================
    // ANALYTICS - SHIFT INTELLIGENCE
    // ============================================

    getShiftIntelligence() {
        const shifts = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const shiftNames = {
            breakfast: 'Breakfast (7-10:30am)',
            lunch: 'Lunch (11:30am-2:30pm)',
            dinner: 'Dinner (5-9pm)',
            lateNight: 'Late Night (9pm-12am)'
        };

        // Analyze DoorDash entries
        const dashEntries = this.entries.filter(e => e.source === 'DoorDash' && e.hours > 0);

        dashEntries.forEach(entry => {
            const key = entry.shiftType + '_' + entry.dayOfWeek;
            if (!shifts[key]) {
                shifts[key] = {
                    shiftType: entry.shiftType,
                    dayOfWeek: entry.dayOfWeek,
                    shiftName: shiftNames[entry.shiftType] || entry.shiftType,
                    dayName: dayNames[entry.dayOfWeek],
                    totalNet: 0,
                    totalHours: 0,
                    count: 0
                };
            }
            shifts[key].totalNet += entry.net;
            shifts[key].totalHours += entry.hours;
            shifts[key].count++;
        });

        // Calculate averages and find best/worst
        const shiftList = Object.values(shifts)
            .filter(s => s.count >= 1)
            .map(s => ({
                ...s,
                avgRate: s.totalHours > 0 ? s.totalNet / s.totalHours : 0
            }))
            .sort((a, b) => b.avgRate - a.avgRate);

        return {
            all: shiftList,
            best: shiftList[0] || null,
            worst: shiftList[shiftList.length - 1] || null
        };
    }

    // ============================================
    // WORK PLANNER
    // ============================================

    predictWorkOutcome(hours, shiftType, dayOfWeek) {
        // Find historical average for this shift type
        const similarShifts = this.entries.filter(e =>
            e.source === 'DoorDash' &&
            e.shiftType === shiftType &&
            (dayOfWeek === null || e.dayOfWeek === dayOfWeek)
        );

        let avgRate = this.calculateAvgHourly(30); // Default to 30-day average

        if (similarShifts.length >= 2) {
            const totalNet = similarShifts.reduce((sum, e) => sum + e.net, 0);
            const totalHours = similarShifts.reduce((sum, e) => sum + e.hours, 0);
            avgRate = totalHours > 0 ? totalNet / totalHours : avgRate;
        }

        const expectedNet = hours * avgRate;
        const newBalance = this.calculateCurrentBalance() + expectedNet;
        const upcomingBills = this.getUpcomingBills(30);
        const billsTotal = upcomingBills.reduce((sum, b) => sum + b.amount, 0);
        const newRunway = Math.floor((newBalance - billsTotal) / this.settings.dailyExpenses);

        let status = 'GOOD';
        let statusColor = 'text-green-600';
        if (newRunway < this.settings.minRunway) {
            status = 'WARNING';
            statusColor = 'text-yellow-600';
        }
        if (newBalance < billsTotal) {
            status = 'CRITICAL';
            statusColor = 'text-red-600';
        }

        return {
            expectedNet,
            avgRate,
            newBalance,
            newRunway,
            status,
            statusColor
        };
    }

    updateWorkPlanner() {
        if (!document.getElementById('planner-hours')) return;

        const hours = parseFloat(document.getElementById('planner-hours').value) || 0;
        const shiftType = document.getElementById('planner-shift').value;
        const dayOfWeek = document.getElementById('planner-day').value === 'any' ? null : parseInt(document.getElementById('planner-day').value);

        if (hours <= 0) {
            document.getElementById('planner-results').innerHTML = '<div class="text-gray-500">Enter hours to see prediction</div>';
            return;
        }

        const prediction = this.predictWorkOutcome(hours, shiftType, dayOfWeek);

        document.getElementById('planner-results').innerHTML =
            '<div class="grid grid-cols-2 gap-4">' +
            '<div>' +
            '<div class="text-sm text-gray-600">Expected Net</div>' +
            '<div class="text-2xl font-bold text-purple-600">' + this.formatCurrency(prediction.expectedNet) + '</div>' +
            '<div class="text-xs text-gray-500">@ ' + this.formatCurrency(prediction.avgRate) + '/hr</div>' +
            '</div>' +
            '<div>' +
            '<div class="text-sm text-gray-600">New Balance</div>' +
            '<div class="text-2xl font-bold ' + (prediction.newBalance >= 0 ? 'text-green-600' : 'text-red-600') + '">' + this.formatCurrency(prediction.newBalance) + '</div>' +
            '</div>' +
            '<div>' +
            '<div class="text-sm text-gray-600">New Runway</div>' +
            '<div class="text-2xl font-bold ' + (prediction.newRunway >= this.settings.minRunway ? 'text-green-600' : 'text-red-600') + '">' + prediction.newRunway + ' days</div>' +
            '</div>' +
            '<div>' +
            '<div class="text-sm text-gray-600">Status</div>' +
            '<div class="text-2xl font-bold ' + prediction.statusColor + '">' + prediction.status + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="mt-4 p-3 bg-purple-50 rounded-lg text-sm">' +
            '💡 Working ' + hours + ' hours would put you at <strong>' + this.formatCurrency(prediction.newBalance) + '</strong> with <strong>' + prediction.newRunway + ' days</strong> of runway.' +
            '</div>';
    }

    // ============================================
    // DECISION ENGINE (ENHANCED)
    // ============================================

    getDecision() {
        const balance = this.calculateCurrentBalance();
        const runway = this.calculateRunway();
        const weekNet = this.calculateWeekNet();
        const monthNet = this.calculateMonthNet();
        const weeklyTarget = this.settings.weeklyTarget;
        const monthlyTarget = this.settings.monthlyTarget;
        const minRunway = this.settings.minRunway;
        const budgetStatus = this.calculateBudgetStatus();

        const reasons = [];
        let status = 'YOU\'RE GOOD';
        let icon = '✅';
        let color = 'text-green-600';
        let bgColor = 'bg-green-50';

        // RULE 1: Negative balance = CRITICAL
        if (balance < 0) {
            status = 'DASH TODAY';
            icon = '❌';
            color = 'text-red-600';
            bgColor = 'bg-red-50';
            reasons.push('⚠️ Balance is negative (' + this.formatCurrency(balance) + ')');
        }

        // RULE 2: Low runway = CRITICAL
        if (runway < minRunway) {
            if (status !== 'DASH TODAY') {
                status = 'DASH TODAY';
                icon = '❌';
                color = 'text-red-600';
                bgColor = 'bg-red-50';
            }
            reasons.push('⚠️ Runway is only ' + runway + ' days (need ' + minRunway + '+)');
        }

        // RULE 3: Budget pressure
        const redBudgets = Object.entries(budgetStatus).filter(([_, b]) => b.color === 'red');
        if (redBudgets.length > 0 && status === "YOU'RE GOOD") {
            status = 'OPTIONAL';
            icon = '🟡';
            color = 'text-yellow-600';
            bgColor = 'bg-yellow-50';
            redBudgets.forEach(([cat, _]) => {
                reasons.push('💸 ' + (cat.charAt(0).toUpperCase() + cat.slice(1)) + ' budget critical');
            });
        }

        // RULE 4: Weekly target not met
        if (weekNet < weeklyTarget) {
            if (status === "YOU'RE GOOD") {
                status = 'OPTIONAL';
                icon = '🟡';
                color = 'text-yellow-600';
                bgColor = 'bg-yellow-50';
            }
            const remaining = weeklyTarget - weekNet;
            reasons.push('📊 Weekly goal not met (' + this.formatCurrency(remaining) + ' to go)');
        }

        // Add positive indicators
        if (status === "YOU'RE GOOD") {
            reasons.push('✅ Balance is healthy (' + this.formatCurrency(balance) + ')');
            reasons.push('✅ Runway is ' + runway + ' days');
            if (weekNet >= weeklyTarget) {
                reasons.push('✅ Weekly target achieved!');
            }
            if (monthNet >= monthlyTarget) {
                reasons.push('✅ Monthly target achieved!');
            }
        }

        // If optional, add context
        if (status === 'OPTIONAL') {
            if (balance > 0) {
                reasons.push('✓ Balance is positive (' + this.formatCurrency(balance) + ')');
            }
            if (runway >= minRunway) {
                reasons.push('✓ Runway is ' + runway + ' days');
            }
        }

        return { status, icon, color, bgColor, reasons };
    }

    // ============================================
    // RENDERING
    // ============================================

    render() {
        this.renderStats();
        this.renderMonthlyStats();
        this.renderBillsOverview();
        this.renderBudgetOverview();
        this.renderProgress();
        this.renderDecision();
        this.renderShiftIntelligence();
        this.renderChart();
        this.renderEntries();
        this.renderBillsList();
        this.renderSpendingList();
        this.updateWorkPlanner();
    }

    renderStats() {
        const balance = this.calculateCurrentBalance();
        const weekNet = this.calculateWeekNet();
        const avgHourly = this.calculateAvgHourly();
        const runway = this.calculateRunway();

        if (document.getElementById('current-balance')) {
            document.getElementById('current-balance').textContent = this.formatCurrency(balance);
            document.getElementById('current-balance').className = 'text-3xl font-bold mt-2 ' + (balance >= 0 ? 'text-green-600' : 'text-red-600');
        }

        if (document.getElementById('week-net')) {
            document.getElementById('week-net').textContent = this.formatCurrency(weekNet);
            document.getElementById('week-net').className = 'text-3xl font-bold mt-2 ' + (weekNet >= 0 ? 'text-green-600' : 'text-red-600');
        }

        if (document.getElementById('avg-hourly')) {
            document.getElementById('avg-hourly').textContent = this.formatCurrency(avgHourly);
        }

        if (document.getElementById('runway')) {
            document.getElementById('runway').textContent = (runway === Infinity ? '∞ days' : runway + ' days');
            document.getElementById('runway').className = 'text-3xl font-bold mt-2 ' + (runway >= this.settings.minRunway ? 'text-green-600' : 'text-red-600');
        }
    }

    renderMonthlyStats() {
        if (!document.getElementById('month-net')) return;

        const monthNet = this.calculateMonthNet();
        const monthAvg = this.calculateAvgHourly(30);
        const dayStats = this.getBestWorstDays();

        document.getElementById('month-net').textContent = this.formatCurrency(monthNet);
        document.getElementById('month-net').className = 'text-3xl font-bold mt-2 ' + (monthNet >= 0 ? 'text-green-600' : 'text-red-600');

        document.getElementById('month-avg').textContent = this.formatCurrency(monthAvg);

        if (dayStats.best) {
            document.getElementById('best-day').textContent = dayStats.best.name + ' (' + this.formatCurrency(dayStats.best.avgRate) + '/hr)';
        } else {
            document.getElementById('best-day').textContent = 'Need more data';
        }

        if (dayStats.worst) {
            document.getElementById('worst-day').textContent = dayStats.worst.name + ' (' + this.formatCurrency(dayStats.worst.avgRate) + '/hr)';
        } else {
            document.getElementById('worst-day').textContent = 'Need more data';
        }
    }

    renderBillsOverview() {
        if (!document.getElementById('bills-total')) return;

        const monthlyTotal = this.calculateMonthlyBills();
        const upcoming = this.getUpcomingBills(7);
        const balance = this.calculateCurrentBalance();
        const billsCovered = balance >= monthlyTotal;

        document.getElementById('bills-total').textContent = this.formatCurrency(monthlyTotal);

        if (upcoming.length > 0) {
            const next = upcoming[0];
            const daysUntil = Math.ceil((next.dueDate - new Date()) / (1000 * 60 * 60 * 24));
            document.getElementById('next-bill').textContent = next.name + ' - ' + this.formatCurrency(next.amount) + ' (' + daysUntil + ' days)';
        } else {
            document.getElementById('next-bill').textContent = 'No bills due soon';
        }

        document.getElementById('bills-covered').textContent = billsCovered ? '✅ Covered' : '❌ Short';
        document.getElementById('bills-covered').className = 'text-2xl font-bold ' + (billsCovered ? 'text-green-600' : 'text-red-600');
    }

    renderBudgetOverview() {
        const budgetStatus = this.calculateBudgetStatus();
        const billsCoverage = this.checkBillsCoverage();

        // Smart Summary Card
        const summaryContainer = document.getElementById('budget-summary');
        if (summaryContainer) {
            const categories = Object.entries(budgetStatus);
            const redCategories = categories.filter(([_, s]) => s.percent >= 100);
            const yellowCategories = categories.filter(([_, s]) => s.percent >= 80 && s.percent < 100);
            const greenCategories = categories.filter(([_, s]) => s.percent < 80);

            let summaryStatus, summaryIcon, summaryText, summaryBg, summaryBorder, summaryTextColor;

            if (!billsCoverage.covered) {
                summaryStatus = 'critical';
                summaryIcon = '🚨';
                summaryText = 'Bills not covered — Need ' + this.formatCurrency(billsCoverage.shortfall) + ' more.Fun spending locked.';
                summaryBg = 'bg-red-50';
                summaryBorder = 'border-red-300';
                summaryTextColor = 'text-red-800';
            } else if (redCategories.length > 0) {
                const cat = redCategories[0][0];
                summaryStatus = 'over';
                summaryIcon = '🔴';
                summaryText = (cat.charAt(0).toUpperCase() + cat.slice(1)) + ' budget blown — Work recommended';
                summaryBg = 'bg-red-50';
                summaryBorder = 'border-red-300';
                summaryTextColor = 'text-red-800';
            } else if (yellowCategories.length > 0) {
                const cat = yellowCategories[0][0];
                const pct = Math.round(yellowCategories[0][1].percent);
                summaryStatus = 'warning';
                summaryIcon = '🟡';
                summaryText = (cat.charAt(0).toUpperCase() + cat.slice(1)) + ' at ' + pct + '% — Chill on spending';
                summaryBg = 'bg-yellow-50';
                summaryBorder = 'border-yellow-300';
                summaryTextColor = 'text-yellow-800';
            } else {
                const maxRemaining = Math.max(...categories.map(([_, s]) => s.remaining));
                const maxCat = categories.find(([_, s]) => s.remaining === maxRemaining);
                summaryStatus = 'good';
                summaryIcon = '🟢';
                summaryText = 'Budget healthy — ' + this.formatCurrency(maxRemaining) + ' ' + maxCat[0] + ' left';
                summaryBg = 'bg-green-50';
                summaryBorder = 'border-green-300';
                summaryTextColor = 'text-green-800';
            }

            summaryContainer.innerHTML =
                '<div class="flex items-center ' + summaryBg + ' ' + summaryBorder + ' ' + summaryTextColor + '">' +
                '<span class="text-3xl mr-3">' + summaryIcon + '</span>' +
                '<div class="flex-1">' +
                '<div class="font-bold text-lg">' + summaryText + '</div>' +
                '</div>' +
                '</div>';
            summaryContainer.className = 'mb-4 p-4 rounded-lg border-2 ' + summaryBg + ' ' + summaryBorder;
        }

        // Category Breakdown with Progress Bars
        const container = document.getElementById('budget-overview');
        if (!container) return;

        container.innerHTML = Object.entries(budgetStatus).map(([category, status]) => {
            let colorClass = 'bg-green-500';
            let bgClass = 'bg-green-50 border-green-200';

            if (status.color === 'yellow') {
                colorClass = 'bg-yellow-500';
                bgClass = 'bg-yellow-50 border-yellow-200';
            } else if (status.color === 'red') {
                colorClass = 'bg-red-500';
                bgClass = 'bg-red-50 border-red-200';
            }

            // Check lock status
            const locked = status.percent >= 100 && !billsCoverage.covered;

            return '<div class="p-4 rounded-lg border-2 mb-4 ' + bgClass + '">' +
                '<div class="flex justify-between items-center mb-2">' +
                '<h3 class="font-bold capitaliz">' + category + '</h3>' +
                '<span class="text-sm font-bold ' + (status.percent >= 100 ? 'text-red-600' : 'text-gray-600') + '">' +
                Math.round(status.percent) + '%' +
                '</span>' +
                '</div>' +

                '<div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">' +
                '<div class="' + colorClass + ' h-2.5 rounded-full" style="width: ' + Math.min(status.percent, 100) + '%"></div>' +
                '</div>' +

                '<div class="text-sm text-gray-700 mb-1">' +
                this.formatCurrency(status.spent) + ' / ' + this.formatCurrency(status.limit) +
                '</div>' +

                '<div class="text-lg font-bold ' + (status.remaining > 0 ? 'text-green-600' : 'text-red-600') + '">' +
                'Remaining: ' + this.formatCurrency(Math.max(status.remaining, 0)) +
                '</div>' +

                (locked ? '<div class="text-xs text-red-600 font-bold mt-2">🔒 LOCKED - Bills not covered</div>' : '') +
                '</div>';
        }).join('');
    }
}


renderProgress() {
    if (!document.getElementById('progress-current')) return;

    const weekNet = this.calculateWeekNet();
    const weeklyTarget = this.settings.weeklyTarget;
    const percent = weeklyTarget > 0 ? Math.min((weekNet / weeklyTarget) * 100, 100) : 0;

    document.getElementById('progress-current').textContent = this.formatCurrency(weekNet);
    document.getElementById('progress-target').textContent = this.formatCurrency(weeklyTarget);
    document.getElementById('progress-percent').textContent = Math.round(percent) + '%';
    document.getElementById('progress-bar').style.width = percent + '%';

    const progressBar = document.getElementById('progress-bar');
    if (percent >= 100) {
        progressBar.className = 'h-4 rounded-full transition-all duration-500 gradient-green';
    } else if (percent >= 70) {
        progressBar.className = 'h-4 rounded-full transition-all duration-500 gradient-bg';
    } else if (percent >= 40) {
        progressBar.className = 'h-4 rounded-full transition-all duration-500 gradient-yellow';
    } else {
        progressBar.className = 'h-4 rounded-full transition-all duration-500 bg-red-400';
    }

    const statusEl = document.getElementById('progress-status');
    if (weeklyTarget === 0) {
        statusEl.textContent = 'Set your weekly target in Settings';
        statusEl.className = 'text-sm text-gray-600 mt-2';
    } else if (percent >= 100) {
        statusEl.textContent = '🎉 Weekly target achieved! You\'re crushing it!';
        statusEl.className = 'text-sm text-green-600 font-medium mt-2';
    } else if (percent >= 70) {
        statusEl.textContent = '💪 ' + Math.round(100 - percent) + '% to go - almost there!';
        statusEl.className = 'text-sm text-purple-600 mt-2';
    } else {
        const remaining = weeklyTarget - weekNet;
        statusEl.textContent = this.formatCurrency(remaining) + ' more needed this week';
        statusEl.className = 'text-sm text-gray-600 mt-2';
    }
}

renderDecision() {
    if (!document.getElementById('decision-icon')) return;

    const decision = this.getDecision();

    document.getElementById('decision-icon').textContent = decision.icon;
    document.getElementById('decision-text').textContent = decision.status;
    document.getElementById('decision-text').className = 'text-4xl font-bold ' + decision.color;

    const mainReason = decision.reasons.length > 0 ? decision.reasons[0] : 'All systems normal';
    document.getElementById('decision-reason').textContent = mainReason.replace(/^[^\s]+\s/, '');

    const detailsContainer = document.getElementById('decision-details');
    if (decision.reasons.length > 0) {
        detailsContainer.innerHTML = '<div class="font-medium mb-2">Analysis:</div>' +
            decision.reasons.map(r => '<div class="py-1">• ' + r + '</div>').join('');
    } else {
        detailsContainer.innerHTML = '<div class="text-gray-500">No data yet - add some entries!</div>';
    }

    const indicator = document.getElementById('decision-indicator');
    if (indicator) {
        indicator.className = 'decision-card rounded-2xl shadow-xl p-8 text-center mb-6 ' + decision.bgColor;
    }
}

renderShiftIntelligence() {
    const container = document.getElementById('shift-intelligence');
    if (!container) return;

    const intelligence = this.getShiftIntelligence();

    if (!intelligence.best) {
        container.innerHTML = '<div class="text-gray-500 text-center py-4">Add more DoorDash entries to see shift analysis</div>';
        return;
    }

    let worstHtml = '';
    if (intelligence.worst) {
        worstHtml = '<div class="bg-red-50 border-2 border-red-200 rounded-lg p-4">' +
            '<div class="text-sm font-medium text-red-900 mb-2">⚠️ Worst Shift</div>' +
            '<div class="text-xl font-bold text-red-800">' + intelligence.worst.dayName + ' ' + intelligence.worst.shiftName + '</div>' +
            '<div class="text-2xl font-bold text-red-600 mt-1">' + this.formatCurrency(intelligence.worst.avgRate) + '/hr</div>' +
            '<div class="text-xs text-red-700 mt-1">Based on ' + intelligence.worst.count + ' shifts</div>' +
            '</div>';
    }

    let allShiftsHtml = '';
    if (intelligence.all.length > 2) {
        const shiftsList = intelligence.all.slice(0, 5).map(s =>
            '<div class="flex justify-between items-center text-sm py-1 px-2 bg-gray-50 rounded">' +
            '<span>' + s.dayName + ' ' + s.shiftName + '</span>' +
            '<span class="font-bold">' + this.formatCurrency(s.avgRate) + '/hr</span>' +
            '</div>'
        ).join('');

        allShiftsHtml = '<div class="mt-4">' +
            '<div class="text-sm font-medium text-gray-700 mb-2">All Shifts (sorted by $/hr)</div>' +
            '<div class="space-y-1">' + shiftsList + '</div>' +
            '</div>';
    }

    container.innerHTML = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">' +
        '<div class="bg-green-50 border-2 border-green-200 rounded-lg p-4">' +
        '<div class="text-sm font-medium text-green-900 mb-2">🏆 Best Shift</div>' +
        '<div class="text-xl font-bold text-green-800">' + intelligence.best.dayName + ' ' + intelligence.best.shiftName + '</div>' +
        '<div class="text-2xl font-bold text-green-600 mt-1">' + this.formatCurrency(intelligence.best.avgRate) + '/hr</div>' +
        '<div class="text-xs text-green-700 mt-1">Based on ' + intelligence.best.count + ' shifts</div>' +
        '</div>' +
        worstHtml +
        '</div>' +
        allShiftsHtml;
}

renderChart() {
    const chartContainer = document.getElementById('weekly-chart');
    const labelsContainer = document.getElementById('chart-labels');

    if (!chartContainer || !labelsContainer) return;

    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }

    const dailyTotals = days.map(day => {
        const dayStr = day.toISOString().split('T')[0];
        return this.entries
            .filter(e => e.date === dayStr)
            .reduce((sum, e) => sum + e.net, 0);
    });

    const maxValue = Math.max(...dailyTotals, 1);

    chartContainer.innerHTML = days.map((day, i) => {
        const value = dailyTotals[i];
        const heightPercent = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const color = value > 0 ? 'bg-green-500' : 'bg-gray-300';
        const displayValue = value > 0 ? '$' + value.toFixed(0) : '';

        return '<div class="flex-1 flex flex-col justify-end items-center">' +
            '<div class="text-xs font-medium text-gray-700 mb-1">' + displayValue + '</div>' +
            '<div class="chart-bar w-full ' + color + ' rounded-t" ' +
            'style="height: ' + Math.max(heightPercent, 2) + '%" ' +
            'title="' + this.formatCurrency(value) + '"></div>' +
            '</div>';
    }).join('');

    labelsContainer.innerHTML = days.map(day => {
        const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
        return '<div class="flex-1 text-center">' + dayName + '</div>';
    }).join('');
}

renderEntries() {
    const tbody = document.getElementById('entries-table');
    const noEntries = document.getElementById('no-entries');

    if (!tbody || !noEntries) return;

    if (this.entries.length === 0) {
        tbody.innerHTML = '';
        noEntries.classList.remove('hidden');
        return;
    }

    noEntries.classList.add('hidden');

    tbody.innerHTML = this.entries.slice(0, 20).map(entry => {
        const dateStr = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const netColor = entry.net >= 0 ? 'text-green-600' : 'text-red-600';

        return '<tr class="hover:bg-gray-50 transition-colors">' +
            '<td class="px-4 py-3 text-sm text-gray-800">' + dateStr + '</td>' +
            '<td class="px-4 py-3 text-sm text-gray-800">' + entry.source + '</td>' +
            '<td class="px-4 py-3 text-sm text-gray-800 text-right">' + entry.hours.toFixed(1) + '</td>' +
            '<td class="px-4 py-3 text-sm text-gray-800 text-right">' + this.formatCurrency(entry.gross) + '</td>' +
            '<td class="px-4 py-3 text-sm text-gray-800 text-right">' + this.formatCurrency(entry.expenses) + '</td>' +
            '<td class="px-4 py-3 text-sm font-medium text-right ' + netColor + '">' + this.formatCurrency(entry.net) + '</td>' +
            '<td class="px-4 py-3 text-sm text-gray-800 text-right">' + this.formatCurrency(entry.hourly) + '</td>' +
            '<td class="px-4 py-3 text-right">' +
            '<button onclick="tracker.deleteEntry(' + entry.id + ')" class="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>' +
            '</td>' +
            '</tr>';
    }).join('');
}

renderBillsList() {
    const container = document.getElementById('bills-list');
    if (!container) return;

    if (this.bills.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-4">No bills added yet</div>';
        return;
    }

    container.innerHTML = this.bills.map(bill => {
        const suffix = bill.frequency === 'monthly' ? 'th' : '';
        return '<div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">' +
            '<div>' +
            '<div class="font-medium">' + bill.name + '</div>' +
            '<div class="text-sm text-gray-600">' + bill.frequency + ' - Due: ' + bill.dueDate + suffix + '</div>' +
            '</div>' +
            '<div class="flex items-center gap-3">' +
            '<div class="text-lg font-bold">' + this.formatCurrency(bill.amount) + '</div>' +
            '<button onclick="tracker.deleteBill(' + bill.id + ')" class="text-red-500 hover:text-red-700 text-sm">Delete</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

renderSpendingList() {
    const container = document.getElementById('spending-list');
    if (!container) return;

    if (this.spending.length === 0) {
        container.innerHTML = '<div class="text-gray-500 text-center py-4">No spending logged yet</div>';
        return;
    }

    container.innerHTML = this.spending.slice(0, 10).map(s => {
        const dateStr = new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const noteHtml = s.note ? '<div class="text-xs text-gray-500">' + s.note + '</div>' : '';

        return '<div class="flex justify-between items-center p-2 hover:bg-gray-50 rounded">' +
            '<div class="flex-1">' +
            '<div class="text-sm font-medium capitalize">' + s.category + '</div>' +
            '<div class="text-xs text-gray-600">' + dateStr + '</div>' +
            noteHtml +
            '</div>' +
            '<div class="flex items-center gap-2">' +
            '<div class="font-bold text-red-600">' + this.formatCurrency(s.amount) + '</div>' +
            '<button onclick="tracker.deleteSpending(' + s.id + ')" class="text-red-500 hover:text-red-700 text-xs">×</button>' +
            '</div>' +
            '</div>';
    }).join('');
}

// ============================================
// SETTINGS
// ============================================

populateSettings() {
    // Helper function to safely set value
    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.value = value;
    };

    setVal('weekly-target', this.settings.weeklyTarget);
    setVal('monthly-target', this.settings.monthlyTarget);
    setVal('target-hourly', this.settings.targetHourly);
    setVal('min-runway', this.settings.minRunway);
    setVal('daily-expenses', this.settings.dailyExpenses);
    setVal('starting-balance', this.settings.startingBalance);

    // Budgets
    setVal('budget-food', this.settings.budgets.food);
    setVal('budget-gas', this.settings.budgets.gas);
    setVal('budget-fun', this.settings.budgets.fun);
    setVal('budget-misc', this.settings.budgets.misc);
}

updateSettings() {
    this.settings.weeklyTarget = parseFloat(document.getElementById('weekly-target').value);
    this.settings.monthlyTarget = parseFloat(document.getElementById('monthly-target').value);
    this.settings.targetHourly = parseFloat(document.getElementById('target-hourly').value);
    this.settings.minRunway = parseInt(document.getElementById('min-runway').value);
    this.settings.dailyExpenses = parseFloat(document.getElementById('daily-expenses').value);
    this.settings.startingBalance = parseFloat(document.getElementById('starting-balance').value);

    this.settings.budgets.food = parseFloat(document.getElementById('budget-food').value);
    this.settings.budgets.gas = parseFloat(document.getElementById('budget-gas').value);
    this.settings.budgets.fun = parseFloat(document.getElementById('budget-fun').value);
    this.settings.budgets.misc = parseFloat(document.getElementById('budget-misc').value);

    this.saveSettings();
    this.render();
    this.showNotification('Settings saved! ⚙️');
}

clearAllData() {
    localStorage.removeItem('financeEntries');
    localStorage.removeItem('financeBills');
    localStorage.removeItem('financeSpending');
    localStorage.removeItem('financeSettings');
    this.entries = [];
    this.bills = [];
    this.spending = [];
    this.settings = this.loadSettings();
    this.populateSettings();
    this.render();
    this.showNotification('All data cleared');
}

// ============================================
// UTILITIES
// ============================================

formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}





// ============================================
// INITIALIZE APP
// ============================================

// Make tracker globally available
window.tracker = null;

document.addEventListener('DOMContentLoaded', () => {
    window.tracker = new FinanceTracker();
});
