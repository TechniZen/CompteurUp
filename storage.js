/* ====================================
   STORAGE.JS - Gestion avancée du stockage
   Export/Import CSV & JSON
   Système de badges
   Gestion des objectifs
   ==================================== */

// ====================================
// SYSTÈME DE BADGES
// ====================================
const BADGES = [
    {
        id: 'first_workout',
        name: 'Premier entraînement',
        icon: '🎯',
        description: 'Commencez votre aventure !',
        condition: (data) => data.history.length >= 1
    },
    {
        id: 'pullups_50',
        name: '50 Tractions',
        icon: '💪',
        description: 'Atteignez 50 tractions au total',
        condition: (data) => {
            return data.history
                .filter(e => e.type === 'pullups')
                .reduce((sum, e) => sum + e.quantity, 0) >= 50;
        }
    },
    {
        id: 'pullups_100',
        name: '100 Tractions',
        icon: '🏋️',
        description: 'Atteignez 100 tractions au total',
        condition: (data) => {
            return data.history
                .filter(e => e.type === 'pullups')
                .reduce((sum, e) => sum + e.quantity, 0) >= 100;
        }
    },
    {
        id: 'pullups_500',
        name: '500 Tractions',
        icon: '🦾',
        description: 'Atteignez 500 tractions au total',
        condition: (data) => {
            return data.history
                .filter(e => e.type === 'pullups')
                .reduce((sum, e) => sum + e.quantity, 0) >= 500;
        }
    },
    {
        id: 'muscleups_50',
        name: '50 Muscle-ups',
        icon: '💥',
        description: 'Atteignez 50 muscle-ups au total',
        condition: (data) => {
            return data.history
                .filter(e => e.type === 'muscleups')
                .reduce((sum, e) => sum + e.quantity, 0) >= 50;
        }
    },
    {
        id: 'muscleups_100',
        name: '100 Muscle-ups',
        icon: '⚡',
        description: 'Atteignez 100 muscle-ups au total',
        condition: (data) => {
            return data.history
                .filter(e => e.type === 'muscleups')
                .reduce((sum, e) => sum + e.quantity, 0) >= 100;
        }
    },
    {
        id: 'streak_7',
        name: 'Semaine parfaite',
        icon: '🔥',
        description: '7 jours consécutifs d\'entraînement',
        condition: (data) => {
            const dates = [...new Set(data.history.map(e => e.date))].sort().reverse();
            let streak = 0;
            let currentDate = new Date();
            
            for (let i = 0; i < 7; i++) {
                const checkDate = new Date(currentDate);
                checkDate.setDate(checkDate.getDate() - i);
                const dateStr = checkDate.toISOString().split('T')[0];
                
                if (dates.includes(dateStr)) {
                    streak++;
                } else {
                    break;
                }
            }
            
            return streak >= 7;
        }
    },
    {
        id: 'daily_goal_achieved',
        name: 'Objectif quotidien',
        icon: '🎖️',
        description: 'Atteignez votre objectif du jour',
        condition: (data) => {
            if (!data.goals) return false;
            const today = new Date().toISOString().split('T')[0];
            const todayData = data.dailyTotals[today] || { pullups: 0, muscleups: 0 };
            
            const pullupsReached = todayData.pullups >= (data.goals.daily?.pullups || 50);
            const muscleupsReached = todayData.muscleups >= (data.goals.daily?.muscleups || 20);
            
            return pullupsReached && muscleupsReached;
        }
    },
    {
        id: 'weekly_goal_achieved',
        name: 'Objectif hebdomadaire',
        icon: '🏆',
        description: 'Atteignez votre objectif de la semaine',
        condition: (data) => {
            if (!data.goals) return false;
            
            // Calculer les totaux de la semaine
            const weekData = [];
            const today = new Date();
            
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];
                const dayData = data.dailyTotals[dateStr] || { pullups: 0, muscleups: 0 };
                weekData.push(dayData);
            }
            
            const weekPullups = weekData.reduce((sum, d) => sum + d.pullups, 0);
            const weekMuscleups = weekData.reduce((sum, d) => sum + d.muscleups, 0);
            
            const pullupsReached = weekPullups >= (data.goals.weekly?.pullups || 300);
            const muscleupsReached = weekMuscleups >= (data.goals.weekly?.muscleups || 100);
            
            return pullupsReached && muscleupsReached;
        }
    },
    {
        id: 'consistency_king',
        name: 'Roi de la régularité',
        icon: '👑',
        description: '30 jours d\'entraînement au total',
        condition: (data) => {
            const uniqueDays = new Set(data.history.map(e => e.date));
            return uniqueDays.size >= 30;
        }
    }
];

// ====================================
// GESTION DES BADGES
// ====================================
class BadgeManager {
    constructor() {
        this.unlockedBadges = this.loadUnlockedBadges();
    }

    loadUnlockedBadges() {
        const stored = localStorage.getItem('sportTracker_badges');
        return stored ? JSON.parse(stored) : [];
    }

    saveUnlockedBadges() {
        localStorage.setItem('sportTracker_badges', JSON.stringify(this.unlockedBadges));
    }

    checkBadges(data) {
        const newlyUnlocked = [];

        BADGES.forEach(badge => {
            const alreadyUnlocked = this.unlockedBadges.some(b => b.id === badge.id);
            
            if (!alreadyUnlocked && badge.condition(data)) {
                const unlockedBadge = {
                    ...badge,
                    unlockedAt: new Date().toISOString()
                };
                this.unlockedBadges.push(unlockedBadge);
                newlyUnlocked.push(unlockedBadge);
            }
        });

        if (newlyUnlocked.length > 0) {
            this.saveUnlockedBadges();
        }

        return newlyUnlocked;
    }

    getUnlockedBadges() {
        return this.unlockedBadges;
    }

    getAllBadges() {
        return BADGES.map(badge => {
            const unlocked = this.unlockedBadges.find(b => b.id === badge.id);
            return {
                ...badge,
                unlocked: !!unlocked,
                unlockedAt: unlocked?.unlockedAt
            };
        });
    }
}

// ====================================
// EXPORT DE DONNÉES
// ====================================
class DataExporter {
    /**
     * Exporte les données en JSON
     */
    static exportJSON(data, goals, badges) {
        const exportData = {
            version: '2.0',
            exportDate: new Date().toISOString(),
            data: data,
            goals: goals,
            badges: badges,
            metadata: {
                totalEntries: data.history.length,
                daysTracked: Object.keys(data.dailyTotals).length
            }
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `sport-tracker-${this.getDateString()}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Exporte les données en CSV
     */
    static exportCSV(data) {
        // En-têtes CSV
        const headers = ['Type', 'Quantité', 'Date', 'Jour', 'Heure', 'Timestamp'];
        
        // Lignes de données
        const rows = data.history.map(entry => [
            entry.type === 'pullups' ? 'Tractions' : 'Muscle-ups',
            entry.quantity,
            entry.date,
            entry.day,
            entry.time,
            entry.timestamp
        ]);

        // Construire le CSV
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Ajouter BOM UTF-8 pour Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `sport-tracker-${this.getDateString()}.csv`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Obtient une chaîne de date pour le nom de fichier
     */
    static getDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
}

// ====================================
// IMPORT DE DONNÉES
// ====================================
class DataImporter {
    /**
     * Importe des données depuis un fichier
     */
    static async importFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const extension = file.name.split('.').pop().toLowerCase();
                    
                    let importedData;
                    
                    if (extension === 'json') {
                        importedData = this.parseJSON(content);
                    } else if (extension === 'csv') {
                        importedData = this.parseCSV(content);
                    } else {
                        throw new Error('Format de fichier non supporté');
                    }
                    
                    resolve(importedData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
            reader.readAsText(file);
        });
    }

    /**
     * Parse un fichier JSON
     */
    static parseJSON(content) {
        const parsed = JSON.parse(content);
        
        // Validation de la structure
        if (!parsed.data || !parsed.data.history || !parsed.data.dailyTotals) {
            throw new Error('Structure JSON invalide');
        }
        
        return {
            data: parsed.data,
            goals: parsed.goals || null,
            badges: parsed.badges || []
        };
    }

    /**
     * Parse un fichier CSV
     */
    static parseCSV(content) {
        const lines = content.trim().split('\n');
        
        if (lines.length < 2) {
            throw new Error('Fichier CSV vide');
        }
        
        // Ignorer la première ligne (en-têtes)
        const dataLines = lines.slice(1);
        
        const history = [];
        const dailyTotals = {};
        
        dataLines.forEach(line => {
            const values = line.split(',');
            
            if (values.length < 6) return;
            
            const type = values[0].toLowerCase().includes('traction') ? 'pullups' : 'muscleups';
            const quantity = parseInt(values[1]);
            const date = values[2];
            const day = values[3];
            const time = values[4];
            const timestamp = values[5];
            
            // Ajouter à l'historique
            history.push({
                id: Date.now() + Math.random(),
                type,
                quantity,
                date,
                day,
                time,
                timestamp
            });
            
            // Mettre à jour les totaux quotidiens
            if (!dailyTotals[date]) {
                dailyTotals[date] = { pullups: 0, muscleups: 0 };
            }
            dailyTotals[date][type] += quantity;
        });
        
        return {
            data: {
                history: history.reverse(), // Plus récent en premier
                dailyTotals
            },
            goals: null,
            badges: []
        };
    }

    /**
     * Fusionne les données importées avec les données existantes
     */
    static mergeData(existingData, importedData) {
        // Fusionner les historiques en évitant les doublons
        const allHistory = [...existingData.history, ...importedData.data.history];
        
        // Supprimer les doublons basés sur le timestamp
        const uniqueHistory = Array.from(
            new Map(allHistory.map(item => [item.timestamp, item])).values()
        );
        
        // Trier par timestamp décroissant
        uniqueHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Recalculer les totaux quotidiens
        const dailyTotals = {};
        uniqueHistory.forEach(entry => {
            if (!dailyTotals[entry.date]) {
                dailyTotals[entry.date] = { pullups: 0, muscleups: 0 };
            }
            dailyTotals[entry.date][entry.type] += entry.quantity;
        });
        
        return {
            history: uniqueHistory,
            dailyTotals
        };
    }
}

// ====================================
// GESTION DES OBJECTIFS
// ====================================
class GoalsManager {
    constructor() {
        this.goals = this.loadGoals();
    }

    loadGoals() {
        const stored = localStorage.getItem('sportTracker_goals');
        return stored ? JSON.parse(stored) : this.getDefaultGoals();
    }

    getDefaultGoals() {
        return {
            daily: {
                pullups: 50,
                muscleups: 20
            },
            weekly: {
                pullups: 300,
                muscleups: 100
            }
        };
    }

    saveGoals() {
        localStorage.setItem('sportTracker_goals', JSON.stringify(this.goals));
    }

    setDailyGoal(type, value) {
        this.goals.daily[type] = parseInt(value);
        this.saveGoals();
    }

    setWeeklyGoal(type, value) {
        this.goals.weekly[type] = parseInt(value);
        this.saveGoals();
    }

    getGoals() {
        return this.goals;
    }

    /**
     * Calcule la progression vers les objectifs
     */
    calculateProgress(dailyTotals, weeklyTotals) {
        return {
            daily: {
                pullups: {
                    current: dailyTotals.pullups,
                    goal: this.goals.daily.pullups,
                    percentage: Math.min(100, (dailyTotals.pullups / this.goals.daily.pullups) * 100)
                },
                muscleups: {
                    current: dailyTotals.muscleups,
                    goal: this.goals.daily.muscleups,
                    percentage: Math.min(100, (dailyTotals.muscleups / this.goals.daily.muscleups) * 100)
                }
            },
            weekly: {
                pullups: {
                    current: weeklyTotals.pullups,
                    goal: this.goals.weekly.pullups,
                    percentage: Math.min(100, (weeklyTotals.pullups / this.goals.weekly.pullups) * 100)
                },
                muscleups: {
                    current: weeklyTotals.muscleups,
                    goal: this.goals.weekly.muscleups,
                    percentage: Math.min(100, (weeklyTotals.muscleups / this.goals.weekly.muscleups) * 100)
                }
            }
        };
    }
}

// ====================================
// INTERFACE POUR SYNCHRONISATION CLOUD (FUTURE)
// ====================================
class CloudSync {
    /**
     * Interface abstraite pour future synchronisation cloud
     * Peut être implémentée avec Firebase, Supabase, etc.
     */
    
    constructor(config = {}) {
        this.enabled = false;
        this.config = config;
        // TODO: Initialiser le client cloud (Firebase, Supabase, etc.)
    }

    /**
     * Synchronise les données locales vers le cloud
     */
    async syncToCloud(data) {
        if (!this.enabled) {
            console.log('Synchronisation cloud désactivée');
            return false;
        }
        
        // TODO: Implémenter la logique de synchronisation
        // Exemple avec Firebase:
        // await firebase.firestore().collection('users').doc(userId).set(data);
        
        console.log('Synchronisation vers le cloud...', data);
        return true;
    }

    /**
     * Récupère les données depuis le cloud
     */
    async syncFromCloud() {
        if (!this.enabled) {
            console.log('Synchronisation cloud désactivée');
            return null;
        }
        
        // TODO: Implémenter la logique de récupération
        // Exemple avec Firebase:
        // const doc = await firebase.firestore().collection('users').doc(userId).get();
        // return doc.data();
        
        console.log('Récupération depuis le cloud...');
        return null;
    }

    /**
     * Active la synchronisation automatique
     */
    enableAutoSync(interval = 300000) { // 5 minutes par défaut
        if (!this.enabled) return;
        
        // TODO: Implémenter la synchronisation automatique
        this.syncInterval = setInterval(() => {
            this.syncToCloud();
        }, interval);
    }

    /**
     * Désactive la synchronisation automatique
     */
    disableAutoSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
    }
}
