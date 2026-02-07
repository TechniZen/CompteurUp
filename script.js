/* ====================================
   SPORT TRACKER - APPLICATION JAVASCRIPT
   Application de suivi de performances sportives
   Tractions et Muscle-ups
   ==================================== */

// ====================================
// CONFIGURATION ET CONSTANTES
// ====================================
const CONFIG = {
    STORAGE_KEY: 'sportTracker',
    ANIMATION_DURATION: 300,
    TOAST_DURATION: 2000
};

const EXERCISE_TYPES = {
    PULLUPS: 'pullups',
    MUSCLEUPS: 'muscleups'
};

const DAYS_OF_WEEK = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_OF_WEEK_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// ====================================
// GESTION DES DONNÉES
// ====================================
class DataManager {
    constructor() {
        this.data = this.loadData();
    }

    /**
     * Charge les données depuis le localStorage
     */
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

    /**
     * Structure de données par défaut
     */
    getDefaultData() {
        return {
            history: [],
            dailyTotals: {}
        };
    }

    /**
     * Sauvegarde les données dans le localStorage
     */
    saveData() {
        try {
            localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('Erreur de sauvegarde:', e);
            showToast('Erreur de sauvegarde des données');
        }
    }

    /**
     * Ajoute une entrée à l'historique
     */
    addEntry(type, quantity) {
        const now = new Date();
        const entry = {
            id: Date.now() + Math.random(), // ID unique
            type: type,
            quantity: quantity,
            timestamp: now.toISOString(),
            date: this.formatDate(now),
            day: DAYS_OF_WEEK_FULL[now.getDay()],
            time: this.formatTime(now)
        };

        this.data.history.unshift(entry); // Ajouter au début
        this.updateDailyTotal(type, quantity, this.formatDate(now));
        this.saveData();

        return entry;
    }

    /**
     * Met à jour le total quotidien
     */
    updateDailyTotal(type, quantity, date) {
        if (!this.data.dailyTotals[date]) {
            this.data.dailyTotals[date] = {
                pullups: 0,
                muscleups: 0
            };
        }
        this.data.dailyTotals[date][type] += quantity;
    }

    /**
     * Récupère le total du jour
     */
    getTodayTotal(type) {
        const today = this.formatDate(new Date());
        return this.data.dailyTotals[today]?.[type] || 0;
    }

    /**
     * Récupère les totaux des 7 derniers jours
     */
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

    /**
     * Calcule les statistiques hebdomadaires
     */
    getWeeklyStats() {
        const weekData = this.getWeeklyData();
        
        const totalPullups = weekData.reduce((sum, day) => sum + day.pullups, 0);
        const totalMuscleups = weekData.reduce((sum, day) => sum + day.muscleups, 0);

        return {
            totalPullups,
            totalMuscleups,
            avgPullups: Math.round(totalPullups / 7),
            avgMuscleups: Math.round(totalMuscleups / 7),
            weekData
        };
    }

    /**
     * Réinitialise le jour actuel
     */
    resetToday() {
        const today = this.formatDate(new Date());
        
        // Supprimer les entrées d'aujourd'hui de l'historique
        this.data.history = this.data.history.filter(entry => entry.date !== today);
        
        // Réinitialiser les totaux du jour
        if (this.data.dailyTotals[today]) {
            delete this.data.dailyTotals[today];
        }
        
        this.saveData();
    }

    /**
     * Efface tout l'historique
     */
    clearAll() {
        this.data = this.getDefaultData();
        this.saveData();
    }

    /**
     * Formate une date en YYYY-MM-DD
     */
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    /**
     * Formate l'heure en HH:MM
     */
    formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Formate une date pour l'affichage
     */
    formatDisplayDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }
}

// ====================================
// GESTION DE L'INTERFACE
// ====================================
class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.initElements();
        this.initEventListeners();
        this.initTheme();
        this.updateAll();
    }

    /**
     * Initialise les références aux éléments DOM
     */
    initElements() {
        // Compteurs
        this.pullupsTotal = document.getElementById('pullups-total');
        this.muscleupsTotal = document.getElementById('muscleups-total');
        
        // Date
        this.currentDate = document.getElementById('current-date');
        
        // Statistiques
        this.statTodayPullups = document.getElementById('stat-today-pullups');
        this.statTodayMuscleups = document.getElementById('stat-today-muscleups');
        this.statWeekPullups = document.getElementById('stat-week-pullups');
        this.statWeekMuscleups = document.getElementById('stat-week-muscleups');
        this.statAvgPullups = document.getElementById('stat-avg-pullups');
        this.statAvgMuscleups = document.getElementById('stat-avg-muscleups');
        this.weeklyChart = document.getElementById('weekly-chart');
        
        // Historique
        this.historyList = document.getElementById('history-list');
        
        // Toast
        this.toast = document.getElementById('toast');
    }

    /**
     * Initialise les écouteurs d'événements
     */
    initEventListeners() {
        // Boutons d'incrémentation
        document.querySelectorAll('.btn-increment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.target.dataset.type;
                const value = parseInt(e.target.dataset.value);
                this.handleIncrement(type, value);
            });
        });

        // Navigation entre onglets
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Bouton reset jour
        document.getElementById('reset-day').addEventListener('click', () => {
            this.handleResetDay();
        });

        // Bouton effacer historique
        document.getElementById('clear-history').addEventListener('click', () => {
            this.handleClearHistory();
        });

        // Toggle thème
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });
    }

    /**
     * Gère l'incrémentation d'un compteur
     */
    handleIncrement(type, value) {
        // Ajouter l'entrée
        this.dataManager.addEntry(type, value);
        
        // Mettre à jour l'interface
        this.updateCounters();
        this.updateStats();
        this.updateHistory();
        
        // Animation sur le compteur
        this.animateCounter(type);
        
        // Afficher notification
        const exerciseName = type === EXERCISE_TYPES.PULLUPS ? 'Tractions' : 'Muscle-ups';
        showToast(`+${value} ${exerciseName} 💪`);
    }

    /**
     * Anime le compteur lors d'un ajout
     */
    animateCounter(type) {
        const element = type === EXERCISE_TYPES.PULLUPS ? this.pullupsTotal : this.muscleupsTotal;
        element.style.animation = 'none';
        setTimeout(() => {
            element.style.animation = 'pulse 0.3s ease';
        }, 10);
    }

    /**
     * Change d'onglet
     */
    switchTab(tabName) {
        // Mettre à jour les boutons de navigation
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        // Mettre à jour les contenus
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabName);
        });

        // Rafraîchir les données si nécessaire
        if (tabName === 'stats') {
            this.updateStats();
        } else if (tabName === 'history') {
            this.updateHistory();
        }
    }

    /**
     * Réinitialise la journée
     */
    handleResetDay() {
        if (confirm('Êtes-vous sûr de vouloir réinitialiser les compteurs du jour ? Cette action est irréversible.')) {
            this.dataManager.resetToday();
            this.updateAll();
            showToast('Journée réinitialisée ✓');
        }
    }

    /**
     * Efface tout l'historique
     */
    handleClearHistory() {
        if (confirm('⚠️ ATTENTION : Voulez-vous vraiment effacer TOUT l\'historique ? Cette action est irréversible.')) {
            this.dataManager.clearAll();
            this.updateAll();
            showToast('Historique effacé');
        }
    }

    /**
     * Met à jour tous les éléments de l'interface
     */
    updateAll() {
        this.updateDate();
        this.updateCounters();
        this.updateStats();
        this.updateHistory();
    }

    /**
     * Met à jour la date affichée
     */
    updateDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        this.currentDate.textContent = now.toLocaleDateString('fr-FR', options);
    }

    /**
     * Met à jour les compteurs
     */
    updateCounters() {
        this.pullupsTotal.textContent = this.dataManager.getTodayTotal(EXERCISE_TYPES.PULLUPS);
        this.muscleupsTotal.textContent = this.dataManager.getTodayTotal(EXERCISE_TYPES.MUSCLEUPS);
    }

    /**
     * Met à jour les statistiques
     */
    updateStats() {
        const stats = this.dataManager.getWeeklyStats();

        // Stats du jour
        this.statTodayPullups.textContent = this.dataManager.getTodayTotal(EXERCISE_TYPES.PULLUPS);
        this.statTodayMuscleups.textContent = this.dataManager.getTodayTotal(EXERCISE_TYPES.MUSCLEUPS);

        // Stats de la semaine
        this.statWeekPullups.textContent = stats.totalPullups;
        this.statWeekMuscleups.textContent = stats.totalMuscleups;
        this.statAvgPullups.textContent = stats.avgPullups;
        this.statAvgMuscleups.textContent = stats.avgMuscleups;

        // Graphique hebdomadaire
        this.updateWeeklyChart(stats.weekData);
    }

    /**
     * Met à jour le graphique hebdomadaire
     */
    updateWeeklyChart(weekData) {
        // Trouver le max pour l'échelle
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

    /**
     * Met à jour l'historique
     */
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

    /**
     * Initialise le thème
     */
    initTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('theme-toggle').textContent = '☀️';
        }
    }

    /**
     * Bascule entre mode clair et sombre
     */
    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        const themeToggle = document.getElementById('theme-toggle');
        
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        showToast(isDark ? 'Mode sombre activé 🌙' : 'Mode clair activé ☀️');
    }
}

// ====================================
// FONCTIONS UTILITAIRES
// ====================================

/**
 * Affiche une notification toast
 */
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, CONFIG.TOAST_DURATION);
}

// ====================================
// INITIALISATION DE L'APPLICATION
// ====================================
let dataManager;
let uiManager;

document.addEventListener('DOMContentLoaded', () => {
    // Initialiser les managers
    dataManager = new DataManager();
    uiManager = new UIManager(dataManager);

    // Mettre à jour la date toutes les minutes
    setInterval(() => {
        uiManager.updateDate();
    }, 60000);

    console.log('Sport Tracker initialisé ✓');
});

// ====================================
// SERVICE WORKER (pour PWA future)
// ====================================
/*
// Décommenter pour activer la PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('Service Worker enregistré:', reg))
            .catch(err => console.error('Erreur Service Worker:', err));
    });
}
*/
