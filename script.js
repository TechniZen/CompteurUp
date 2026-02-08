/* ====================================
   SPORT TRACKER - APPLICATION JAVASCRIPT v2.0
   Application de suivi de performances sportives
   Tractions et Muscle-ups
   Avec fonctionnalités avancées
   ==================================== */

// ====================================
// CALCUL DES MOYENNES ACTIVES
// ====================================

/**
 * Calcule la moyenne quotidienne active pour un type d'exercice
 * Ne compte QUE les jours où l'exercice > 0
 * 
 * @param {Object} dailyTotals - Totaux par date
 * @param {string} exerciseType - "pullups" ou "muscleups"
 * @returns {number} - Moyenne active (non arrondie)
 */
function calculateDailyActiveAverage(dailyTotals, exerciseType) {
    if (!dailyTotals || typeof dailyTotals !== 'object') {
        return 0;
    }
    
    const dates = Object.keys(dailyTotals);
    if (dates.length === 0) {
        return 0;
    }
    
    let totalExercise = 0;
    let activeDaysCount = 0;
    
    dates.forEach(date => {
        const dayData = dailyTotals[date];
        const exerciseValue = dayData[exerciseType] || 0;
        
        // Ne compter QUE les jours actifs (> 0)
        if (exerciseValue > 0) {
            totalExercise += exerciseValue;
            activeDaysCount++;
        }
    });
    
    // Si aucun jour actif, retourner 0
    if (activeDaysCount === 0) {
        return 0;
    }
    
    // Moyenne = total des jours actifs / nombre de jours actifs
    return totalExercise / activeDaysCount;
}

/**
 * Calcule la moyenne hebdomadaire active pour un type d'exercice
 * Ne compte QUE les semaines où le total > 0
 * 
 * @param {Object} dailyTotals - Totaux par date
 * @param {string} exerciseType - "pullups" ou "muscleups"
 * @param {number} numberOfWeeks - Nombre de semaines à analyser
 * @returns {number} - Moyenne active (non arrondie)
 */
function calculateWeeklyActiveAverage(dailyTotals, exerciseType, numberOfWeeks = 12) {
    if (!dailyTotals || typeof dailyTotals !== 'object') {
        return 0;
    }
    
    const weeklyTotals = getWeeklyTotalsForAverage(dailyTotals, exerciseType, numberOfWeeks);
    
    if (weeklyTotals.length === 0) {
        return 0;
    }
    
    let totalExercise = 0;
    let activeWeeksCount = 0;
    
    weeklyTotals.forEach(weekTotal => {
        // Ne compter QUE les semaines actives (> 0)
        if (weekTotal > 0) {
            totalExercise += weekTotal;
            activeWeeksCount++;
        }
    });
    
    if (activeWeeksCount === 0) {
        return 0;
    }
    
    return totalExercise / activeWeeksCount;
}

/**
 * Regroupe les données par semaine ISO
 */
function getWeeklyTotalsForAverage(dailyTotals, exerciseType, numberOfWeeks) {
    const weeklyData = {};
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (numberOfWeeks * 7));
    
    Object.keys(dailyTotals).forEach(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        
        if (date < startDate || date > today) {
            return;
        }
        
        const weekKey = getISOWeekKey(date);
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = 0;
        }
        
        const exerciseValue = dailyTotals[dateStr][exerciseType] || 0;
        weeklyData[weekKey] += exerciseValue;
    });
    
    return Object.values(weeklyData);
}

/**
 * Génère une clé unique pour une semaine ISO
 */
function getISOWeekKey(date) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// ====================================
// CONFIGURATION ET CONSTANTES
// ====================================
const CONFIG = {
    STORAGE_KEY: 'sportTracker',
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 2000,
    NOTIFICATION_PERMISSION: 'sportTracker_notificationPermission'
};

const EXERCISE_TYPES = {
    PULLUPS: 'pullups',
    MUSCLEUPS: 'muscleups'
};

const DAYS_OF_WEEK = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_OF_WEEK_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// ====================================
// GESTION DES DONNÉES (mise à jour)
// ====================================
class DataManager {
    constructor() {
        this.data = this.loadData();
    }

    loadData() {
        const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error('Erreur de parsing des données:', e);
                return this.getDefaultData();
            }
        }
        return this.getDefaultData();
    }

    getDefaultData() {
        return {
            history: [],
            dailyTotals: {}
        };
    }

    saveData() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Erreur de sauvegarde:', e);
            showToast('Erreur de sauvegarde des données');
        }
    }

    addEntry(type, quantity) {
        const now = new Date();
        const entry = {
            id: Date.now() + Math.random(),
            type: type,
            quantity: quantity,
            timestamp: now.toISOString(),
            date: this.formatDate(now),
            day: DAYS_OF_WEEK_FULL[now.getDay()],
            time: this.formatTime(now)
        };

        this.data.history.unshift(entry);
        this.updateDailyTotal(type, quantity, this.formatDate(now));
        this.saveData();

        return entry;
    }

    updateDailyTotal(type, quantity, date) {
        if (!this.data.dailyTotals[date]) {
            this.data.dailyTotals[date] = {
                pullups: 0,
                muscleups: 0
            };
        }
        this.data.dailyTotals[date][type] += quantity;
    }

    getTodayTotal(type) {
        const today = this.formatDate(new Date());
        return this.data.dailyTotals[today]?.[type] || 0;
    }

    getWeeklyData() {
        const weekData = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            const dayOfWeek = DAYS_OF_WEEK[date.getDay()];

            weekData.push({
                date: dateStr,
                day: dayOfWeek,
                isToday: i === 0,
                pullups: this.data.dailyTotals[dateStr]?.pullups || 0,
                muscleups: this.data.dailyTotals[dateStr]?.muscleups || 0
            });
        }

        return weekData;
    }

    getWeeklyStats() {
        const weekData = this.getWeeklyData();
        
        const totalPullups = weekData.reduce((sum, day) => sum + day.pullups, 0);
        const totalMuscleups = weekData.reduce((sum, day) => sum + day.muscleups, 0);

        // MOYENNES ACTIVES: calculées uniquement sur les jours où total > 0
        const activePullups = calculateDailyActiveAverage(this.data.dailyTotals, 'pullups');
        const activeMuscleups = calculateDailyActiveAverage(this.data.dailyTotals, 'muscleups');

        return {
            totalPullups,
            totalMuscleups,
            // Moyennes actives (arrondi pour l'affichage)
            avgPullups: Math.round(activePullups),
            avgMuscleups: Math.round(activeMuscleups),
            // Moyennes brutes (non arrondies, pour calculs ultérieurs si besoin)
            avgPullupsRaw: activePullups,
            avgMuscleupsRaw: activeMuscleups,
            weekData
        };
    }

    resetToday() {
        const today = this.formatDate(new Date());
        
        this.data.history = this.data.history.filter(entry => entry.date !== today);
        
        if (this.data.dailyTotals[today]) {
            delete this.data.dailyTotals[today];
        }
        
        this.saveData();
    }

    clearAll() {
        this.data = this.getDefaultData();
        this.saveData();
    }

    replaceData(newData) {
        this.data = newData;
        this.saveData();
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    formatDisplayDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// ====================================
// GESTION DES NOTIFICATIONS
// ====================================
class NotificationManager {
    constructor() {
        this.enabled = localStorage.getItem('notifications_enabled') === 'true';
        this.interval = parseInt(localStorage.getItem('notification_interval')) || 2;
        this.intervalId = null;
    }

    async requestPermission() {
        if (!('Notification' in window)) {
            showToast('Les notifications ne sont pas supportées');
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }

        return false;
    }

    async enable(interval) {
        const hasPermission = await this.requestPermission();
        
        if (!hasPermission) {
            showToast('⚠️ Permission refusée pour les notifications');
            return false;
        }

        this.enabled = true;
        this.interval = interval;
        localStorage.setItem('notifications_enabled', 'true');
        localStorage.setItem('notification_interval', interval.toString());
        
        this.startNotifications();
        showToast('✅ Notifications activées');
        return true;
    }

    disable() {
        this.enabled = false;
        localStorage.setItem('notifications_enabled', 'false');
        this.stopNotifications();
        showToast('Notifications désactivées');
    }

    startNotifications() {
        if (!this.enabled) return;

        this.stopNotifications();
        
        const intervalMs = this.interval * 60 * 60 * 1000;
        
        this.intervalId = setInterval(() => {
            this.sendNotification();
        }, intervalMs);
    }

    stopNotifications() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    sendNotification() {
        if (!this.enabled || Notification.permission !== 'granted') return;

        const title = '💪 Sport Tracker';
        const options = {
            body: 'C\'est l\'heure de s\'entraîner ! 🏋️',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: 'workout-reminder',
            requireInteraction: false,
            vibrate: [200, 100, 200]
        };

        try {
            const notification = new Notification(title, options);
            
            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        } catch (e) {
            console.error('Erreur d\'envoi de notification:', e);
        }
    }
}

// ====================================
// GESTION DE L'INTERFACE (mise à jour)
// ====================================
class UIManager {
    constructor(dataManager, goalsManager, badgeManager, chartsManager, notificationManager) {
        this.dataManager = dataManager;
        this.goalsManager = goalsManager;
        this.badgeManager = badgeManager;
        this.chartsManager = chartsManager;
        this.notificationManager = notificationManager;
        
        this.initElements();
        this.initEventListeners();
        this.initTheme();
        this.updateAll();
    }

    initElements() {
        this.pullupsTotal = document.getElementById('pullups-total');
        this.muscleupsTotal = document.getElementById('muscleups-total');
        this.currentDate = document.getElementById('current-date');
        this.statTodayPullups = document.getElementById('stat-today-pullups');
        this.statTodayMuscleups = document.getElementById('stat-today-muscleups');
        this.statWeekPullups = document.getElementById('stat-week-pullups');
        this.statWeekMuscleups = document.getElementById('stat-week-muscleups');
        this.statAvgPullups = document.getElementById('stat-avg-pullups');
        this.statAvgMuscleups = document.getElementById('stat-avg-muscleups');
        this.weeklyChart = document.getElementById('weekly-chart');
        this.historyList = document.getElementById('history-list');
        this.badgesGrid = document.getElementById('badges-grid');
        this.toast = document.getElementById('toast');
    }

    initEventListeners() {
        document.querySelectorAll('.btn-increment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const value = parseInt(e.target.dataset.value);
                this.handleIncrement(type, value);
            });
        });

        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        document.getElementById('reset-day').addEventListener('click', () => {
            this.handleResetDay();
        });

        document.getElementById('clear-history').addEventListener('click', () => {
            this.handleClearHistory();
        });

        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        document.getElementById('save-goals').addEventListener('click', () => {
            this.saveGoals();
        });

        ['daily-pullups-goal', 'daily-muscleups-goal', 
         'weekly-pullups-goal', 'weekly-muscleups-goal'].forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.addEventListener('change', () => {
                    this.updateGoalsProgress();
                });
            }
        });

        document.getElementById('export-json').addEventListener('click', () => {
            this.exportJSON();
        });

        document.getElementById('export-csv').addEventListener('click', () => {
            this.exportCSV();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            this.handleImport(e.target.files[0]);
        });

        const notifToggle = document.getElementById('notifications-enabled');
        notifToggle.addEventListener('change', (e) => {
            this.toggleNotifications(e.target.checked);
        });

        const notifInterval = document.getElementById('notification-interval');
        notifInterval.addEventListener('change', (e) => {
            if (this.notificationManager.enabled) {
                this.notificationManager.enable(parseInt(e.target.value));
            }
        });

        document.getElementById('show-comparisons').addEventListener('click', () => {
            this.showComparisons();
        });

        document.getElementById('reset-all').addEventListener('click', () => {
            this.handleResetAll();
        });
    }

    handleIncrement(type, value) {
        this.dataManager.addEntry(type, value);
        
        this.updateCounters();
        this.updateStats();
        this.updateHistory();
        this.updateGoalsProgress();
        
        const newBadges = this.badgeManager.checkBadges(this.dataManager.data);
        if (newBadges.length > 0) {
            this.updateBadges();
            newBadges.forEach(badge => {
                this.showBadgeUnlocked(badge);
            });
        }
        
        this.animateCounter(type);
        
        const exerciseName = type === EXERCISE_TYPES.PULLUPS ? 'Tractions' : 'Muscle-ups';
        showToast(`+${value} ${exerciseName} 💪`);
    }

    animateCounter(type) {
        const element = type === EXERCISE_TYPES.PULLUPS ? this.pullupsTotal : this.muscleupsTotal;
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'pulse 0.3s ease';
        }, 10);
    }

    switchTab(tabName) {
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        if (tabName === 'stats') {
            this.updateStats();
        } else if (tabName === 'history') {
            this.updateHistory();
        } else if (tabName === 'goals') {
            this.updateGoals();
        } else if (tabName === 'badges') {
            this.updateBadges();
        } else if (tabName === 'settings') {
            this.updateSettings();
        }
    }

    handleResetDay() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser les compteurs du jour ? Cette action est irréversible.')) {
            this.dataManager.resetToday();
            this.updateAll();
            showToast('Journée réinitialisée ✓');
        }
    }

    handleClearHistory() {
        if (confirm('⚠️ ATTENTION : Voulez-vous vraiment effacer TOUT l\'historique ? Cette action est irréversible.')) {
            this.dataManager.clearAll();
            this.updateAll();
            showToast('Historique effacé');
        }
    }

    handleResetAll() {
        if (confirm('⚠️ DANGER : Voulez-vous vraiment réinitialiser TOUTES les données (historique, objectifs, badges) ? Cette action est IRRÉVERSIBLE.')) {
            if (confirm('Dernière confirmation : Êtes-vous ABSOLUMENT sûr ?')) {
                this.dataManager.clearAll();
                localStorage.removeItem('sportTracker_goals');
                localStorage.removeItem('sportTracker_badges');
                location.reload();
            }
        }
    }

    updateAll() {
        this.updateDate();
        this.updateCounters();
        this.updateStats();
        this.updateHistory();
        this.updateGoals();
        this.updateBadges();
    }

    updateDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.currentDate.textContent = now.toLocaleDateString('fr-FR', options);
    }

    updateCounters() {
        this.pullupsTotal.textContent = this.dataManager.getTodayTotal(EXERCISE_TYPES.PULLUPS);
        this.muscleupsTotal.textContent = this.dataManager.getTodayTotal(EXERCISE_TYPES.MUSCLEUPS);
    }

    updateStats() {
        const stats = this.dataManager.getWeeklyStats();

        this.statTodayPullups.textContent = this.dataManager.getTodayTotal(EXERCISE_TYPES.PULLUPS);
        this.statTodayMuscleups.textContent = this.dataManager.getTodayTotal(EXERCISE_TYPES.MUSCLEUPS);

        this.statWeekPullups.textContent = stats.totalPullups;
        this.statWeekMuscleups.textContent = stats.totalMuscleups;
        this.statAvgPullups.textContent = stats.avgPullups;
        this.statAvgMuscleups.textContent = stats.avgMuscleups;

        this.updateWeeklyChart(stats.weekData);
        
        this.chartsManager.updateAllCharts(this.dataManager.data.dailyTotals);
    }

    updateWeeklyChart(weekData) {
        const maxPullups = Math.max(...weekData.map(d => d.pullups), 1);
        const maxMuscleups = Math.max(...weekData.map(d => d.muscleups), 1);
        const maxValue = Math.max(maxPullups, maxMuscleups);

        this.weeklyChart.innerHTML = weekData.map(day => {
            const pullupsHeight = (day.pullups / maxValue) * 100;
            const muscleupsHeight = (day.muscleups / maxValue) * 100;

            return `
                <div class="chart-bar">
                    <div class="bar-container">
                        ${day.pullups > 0 ? `<div class="bar pullups" style="height: ${pullupsHeight}%" title="Tractions: ${day.pullups}"></div>` : ''}
                        ${day.muscleups > 0 ? `<div class="bar muscleups" style="height: ${muscleupsHeight}%" title="Muscle-ups: ${day.muscleups}"></div>` : ''}
                    </div>
                    <div class="chart-day ${day.isToday ? 'today' : ''}">${day.day}</div>
                </div>
            `;
        }).join('');
    }

    updateHistory() {
        const history = this.dataManager.data.history;

        if (history.length === 0) {
            this.historyList.innerHTML = '<p class="empty-state">Aucune entrée pour le moment</p>';
            return;
        }

        this.historyList.innerHTML = history.map(entry => {
            const exerciseName = entry.type === EXERCISE_TYPES.PULLUPS ? '🏋️ Tractions' : '💥 Muscle-ups';
            const exerciseClass = entry.type;

            return `
                <div class="history-item ${exerciseClass}">
                    <div class="history-type ${exerciseClass}">
                        ${exerciseName} +${entry.quantity}
                    </div>
                    <div class="history-details">
                        <span>${entry.day} ${this.dataManager.formatDisplayDate(entry.date)}</span>
                        <span>${entry.time}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateGoals() {
        const goals = this.goalsManager.getGoals();
        
        document.getElementById('daily-pullups-goal').value = goals.daily.pullups;
        document.getElementById('daily-muscleups-goal').value = goals.daily.muscleups;
        document.getElementById('weekly-pullups-goal').value = goals.weekly.pullups;
        document.getElementById('weekly-muscleups-goal').value = goals.weekly.muscleups;
        
        this.updateGoalsProgress();
    }

    updateGoalsProgress() {
        const todayPullups = this.dataManager.getTodayTotal('pullups');
        const todayMuscleups = this.dataManager.getTodayTotal('muscleups');
        
        const weekStats = this.dataManager.getWeeklyStats();
        
        const goals = this.goalsManager.getGoals();
        
        const dailyPullupsPercent = Math.min(100, (todayPullups / goals.daily.pullups) * 100);
        const dailyMuscleupsPercent = Math.min(100, (todayMuscleups / goals.daily.muscleups) * 100);
        
        document.getElementById('daily-pullups-progress').style.width = `${dailyPullupsPercent}%`;
        document.getElementById('daily-muscleups-progress').style.width = `${dailyMuscleupsPercent}%`;
        document.getElementById('daily-pullups-text').textContent = `${todayPullups}/${goals.daily.pullups}`;
        document.getElementById('daily-muscleups-text').textContent = `${todayMuscleups}/${goals.daily.muscleups}`;
        
        const weeklyPullupsPercent = Math.min(100, (weekStats.totalPullups / goals.weekly.pullups) * 100);
        const weeklyMuscleupsPercent = Math.min(100, (weekStats.totalMuscleups / goals.weekly.muscleups) * 100);
        
        document.getElementById('weekly-pullups-progress').style.width = `${weeklyPullupsPercent}%`;
        document.getElementById('weekly-muscleups-progress').style.width = `${weeklyMuscleupsPercent}%`;
        document.getElementById('weekly-pullups-text').textContent = `${weekStats.totalPullups}/${goals.weekly.pullups}`;
        document.getElementById('weekly-muscleups-text').textContent = `${weekStats.totalMuscleups}/${goals.weekly.muscleups}`;
    }

    saveGoals() {
        const dailyPullups = parseInt(document.getElementById('daily-pullups-goal').value);
        const dailyMuscleups = parseInt(document.getElementById('daily-muscleups-goal').value);
        const weeklyPullups = parseInt(document.getElementById('weekly-pullups-goal').value);
        const weeklyMuscleups = parseInt(document.getElementById('weekly-muscleups-goal').value);
        
        this.goalsManager.setDailyGoal('pullups', dailyPullups);
        this.goalsManager.setDailyGoal('muscleups', dailyMuscleups);
        this.goalsManager.setWeeklyGoal('pullups', weeklyPullups);
        this.goalsManager.setWeeklyGoal('muscleups', weeklyMuscleups);
        
        this.updateGoalsProgress();
        showToast('✅ Objectifs sauvegardés');
    }

    updateBadges() {
        const allBadges = this.badgeManager.getAllBadges();
        
        this.badgesGrid.innerHTML = allBadges.map(badge => {
            const lockedClass = badge.unlocked ? 'unlocked' : 'locked';
            const unlockedDate = badge.unlockedAt ? 
                `<div class="badge-unlocked-date">Débloqué le ${new Date(badge.unlockedAt).toLocaleDateString('fr-FR')}</div>` : '';
            
            return `
                <div class="badge-item ${lockedClass}">
                    <div class="badge-icon">${badge.icon}</div>
                    <div class="badge-name">${badge.name}</div>
                    <div class="badge-description">${badge.description}</div>
                    ${unlockedDate}
                </div>
            `;
        }).join('');
    }

    showBadgeUnlocked(badge) {
        showToast(`🏅 Badge débloqué : ${badge.name} !`, 3000);
    }

    updateSettings() {
        const notifEnabled = this.notificationManager.enabled;
        document.getElementById('notifications-enabled').checked = notifEnabled;
        document.getElementById('notification-interval').value = this.notificationManager.interval;
        document.getElementById('notification-interval-container').style.display = 
            notifEnabled ? 'block' : 'none';
    }

    toggleNotifications(enabled) {
        if (enabled) {
            const interval = parseInt(document.getElementById('notification-interval').value);
            this.notificationManager.enable(interval);
            document.getElementById('notification-interval-container').style.display = 'block';
        } else {
            this.notificationManager.disable();
            document.getElementById('notification-interval-container').style.display = 'none';
        }
    }

    exportJSON() {
        DataExporter.exportJSON(
            this.dataManager.data,
            this.goalsManager.getGoals(),
            this.badgeManager.getUnlockedBadges()
        );
        showToast('📥 Export JSON réussi');
    }

    exportCSV() {
        DataExporter.exportCSV(this.dataManager.data);
        showToast('📥 Export CSV réussi');
    }

    async handleImport(file) {
        if (!file) return;
        
        try {
            const imported = await DataImporter.importFile(file);
            
            const action = confirm(
                'Voulez-vous FUSIONNER les données importées avec les existantes ?\n\n' +
                'OK = Fusionner (garder les deux)\n' +
                'Annuler = Remplacer (perdre les données actuelles)'
            );
            
            if (action) {
                const merged = DataImporter.mergeData(this.dataManager.data, imported);
                this.dataManager.replaceData(merged);
            } else {
                this.dataManager.replaceData(imported.data);
                
                if (imported.goals) {
                    localStorage.setItem('sportTracker_goals', JSON.stringify(imported.goals));
                    this.goalsManager.goals = imported.goals;
                }
                
                if (imported.badges && imported.badges.length > 0) {
                    localStorage.setItem('sportTracker_badges', JSON.stringify(imported.badges));
                    this.badgeManager.unlockedBadges = imported.badges;
                }
            }
            
            this.updateAll();
            showToast('📤 Import réussi !');
            
            document.getElementById('import-file').value = '';
        } catch (error) {
            console.error('Erreur d\'import:', error);
            showToast('❌ Erreur : ' + error.message);
        }
    }

    showComparisons() {
        const modal = document.getElementById('comparisons-modal');
        modal.classList.add('show');
        
        this.updateComparisonContent('daily');
        
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.onclick = () => modal.classList.remove('show');
        
        modal.onclick = (e) => {
            if (e.target === modal) modal.classList.remove('show');
        };
        
        modal.querySelectorAll('.comparison-btn').forEach(btn => {
            btn.onclick = (e) => {
                modal.querySelectorAll('.comparison-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.updateComparisonContent(e.target.dataset.type);
            };
        });
    }

    updateComparisonContent(type) {
        const content = document.getElementById('comparison-content');
        const dailyTotals = this.dataManager.data.dailyTotals;
        
        if (type === 'daily') {
            content.innerHTML = this.generateDailyComparison(dailyTotals);
        } else if (type === 'weekly') {
            content.innerHTML = this.generateWeeklyComparison(dailyTotals);
        } else if (type === 'monthly') {
            content.innerHTML = this.generateMonthlyComparison(dailyTotals);
        }
    }

    generateDailyComparison(dailyTotals) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = this.dataManager.formatDate(today);
        const yesterdayStr = this.dataManager.formatDate(yesterday);
        
        const todayData = dailyTotals[todayStr] || { pullups: 0, muscleups: 0 };
        const yesterdayData = dailyTotals[yesterdayStr] || { pullups: 0, muscleups: 0 };
        
        const pullupsDiff = todayData.pullups - yesterdayData.pullups;
        const muscleupsDiff = todayData.muscleups - yesterdayData.muscleups;
        
        return `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Période</th>
                        <th>Tractions</th>
                        <th>Muscle-ups</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Aujourd'hui</td>
                        <td>${todayData.pullups}</td>
                        <td>${todayData.muscleups}</td>
                    </tr>
                    <tr>
                        <td>Hier</td>
                        <td>${yesterdayData.pullups}</td>
                        <td>${yesterdayData.muscleups}</td>
                    </tr>
                    <tr>
                        <td><strong>Différence</strong></td>
                        <td class="comparison-diff ${pullupsDiff >= 0 ? 'positive' : 'negative'}">
                            ${pullupsDiff >= 0 ? '+' : ''}${pullupsDiff}
                        </td>
                        <td class="comparison-diff ${muscleupsDiff >= 0 ? 'positive' : 'negative'}">
                            ${muscleupsDiff >= 0 ? '+' : ''}${muscleupsDiff}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    generateWeeklyComparison(dailyTotals) {
        const thisWeek = this.getWeekTotal(dailyTotals, 0);
        const lastWeek = this.getWeekTotal(dailyTotals, 1);
        
        const pullupsDiff = thisWeek.pullups - lastWeek.pullups;
        const muscleupsDiff = thisWeek.muscleups - lastWeek.muscleups;
        
        return `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Période</th>
                        <th>Tractions</th>
                        <th>Muscle-ups</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Cette semaine</td>
                        <td>${thisWeek.pullups}</td>
                        <td>${thisWeek.muscleups}</td>
                    </tr>
                    <tr>
                        <td>Semaine dernière</td>
                        <td>${lastWeek.pullups}</td>
                        <td>${lastWeek.muscleups}</td>
                    </tr>
                    <tr>
                        <td><strong>Différence</strong></td>
                        <td class="comparison-diff ${pullupsDiff >= 0 ? 'positive' : 'negative'}">
                            ${pullupsDiff >= 0 ? '+' : ''}${pullupsDiff}
                        </td>
                        <td class="comparison-diff ${muscleupsDiff >= 0 ? 'positive' : 'negative'}">
                            ${muscleupsDiff >= 0 ? '+' : ''}${muscleupsDiff}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    generateMonthlyComparison(dailyTotals) {
        const thisMonth = this.getMonthTotal(dailyTotals, 0);
        const lastMonth = this.getMonthTotal(dailyTotals, 1);
        
        const pullupsDiff = thisMonth.pullups - lastMonth.pullups;
        const muscleupsDiff = thisMonth.muscleups - lastMonth.muscleups;
        
        const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                           'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
        
        const today = new Date();
        const thisMonthName = monthNames[today.getMonth()];
        const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const lastMonthName = monthNames[lastMonthDate.getMonth()];
        
        return `
            <table class="comparison-table">
                <thead>
                    <tr>
                        <th>Période</th>
                        <th>Tractions</th>
                        <th>Muscle-ups</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>${thisMonthName}</td>
                        <td>${thisMonth.pullups}</td>
                        <td>${thisMonth.muscleups}</td>
                    </tr>
                    <tr>
                        <td>${lastMonthName}</td>
                        <td>${lastMonth.pullups}</td>
                        <td>${lastMonth.muscleups}</td>
                    </tr>
                    <tr>
                        <td><strong>Différence</strong></td>
                        <td class="comparison-diff ${pullupsDiff >= 0 ? 'positive' : 'negative'}">
                            ${pullupsDiff >= 0 ? '+' : ''}${pullupsDiff}
                        </td>
                        <td class="comparison-diff ${muscleupsDiff >= 0 ? 'positive' : 'negative'}">
                            ${muscleupsDiff >= 0 ? '+' : ''}${muscleupsDiff}
                        </td>
                    </tr>
                </tbody>
            </table>
        `;
    }

    getWeekTotal(dailyTotals, weeksAgo) {
        let pullups = 0;
        let muscleups = 0;
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - (weeksAgo * 7) - i);
            const dateStr = this.dataManager.formatDate(date);
            const dayData = dailyTotals[dateStr] || { pullups: 0, muscleups: 0 };
            pullups += dayData.pullups;
            muscleups += dayData.muscleups;
        }
        
        return { pullups, muscleups };
    }

    getMonthTotal(dailyTotals, monthsAgo) {
        let pullups = 0;
        let muscleups = 0;
        const today = new Date();
        const month = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() - monthsAgo + 1, 0);
        
        for (let d = new Date(month); d <= monthEnd; d.setDate(d.getDate() + 1)) {
            const dateStr = this.dataManager.formatDate(d);
            const dayData = dailyTotals[dateStr] || { pullups: 0, muscleups: 0 };
            pullups += dayData.pullups;
            muscleups += dayData.muscleups;
        }
        
        return { pullups, muscleups };
    }

    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('theme-toggle').textContent = '☀️';
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        const themeToggle = document.getElementById('theme-toggle');
        
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        this.chartsManager.updateTheme();
        
        showToast(isDark ? 'Mode sombre activé 🌙' : 'Mode clair activé ☀️');
    }
}

// ====================================
// FONCTIONS UTILITAIRES
// ====================================
function showToast(message, duration = CONFIG.TOAST_DURATION) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// ====================================
// INITIALISATION
// ====================================
let dataManager;
let goalsManager;
let badgeManager;
let chartsManager;
let notificationManager;
let uiManager;

document.addEventListener('DOMContentLoaded', () => {
    dataManager = new DataManager();
    goalsManager = new GoalsManager();
    badgeManager = new BadgeManager();
    chartsManager = new ChartsManager();
    notificationManager = new NotificationManager();
    uiManager = new UIManager(dataManager, goalsManager, badgeManager, chartsManager, notificationManager);

    setInterval(() => {
        uiManager.updateDate();
    }, 60000);

    if (notificationManager.enabled) {
        notificationManager.startNotifications();
    }

    console.log('Sport Tracker v2.0 initialisé ✓');
});

// ====================================
// SERVICE WORKER (PWA)
// ====================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker enregistré:', reg))
            .catch(err => console.error('Erreur Service Worker:', err));
    });
}
