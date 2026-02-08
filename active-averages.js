/* ====================================
   ACTIVE AVERAGES - Calcul de moyennes actives
   Calcule les moyennes uniquement sur les jours/semaines actifs (> 0)
   ==================================== */

/**
 * Calcule la moyenne quotidienne active pour un type d'exercice
 * 
 * @param {Object} dailyTotals - Objet contenant les totaux par date
 *                                Format: { "2025-02-08": { pullups: 10, muscleups: 5 } }
 * @param {string} exerciseType - Type d'exercice: "pullups" ou "muscleups"
 * @returns {number} - Moyenne quotidienne (non arrondie) ou 0 si aucun jour actif
 * 
 * Logique:
 * 1. Parcourir tous les jours dans dailyTotals
 * 2. Ne garder QUE les jours où exerciceType > 0
 * 3. Sommer les totaux de ces jours actifs
 * 4. Diviser par le nombre de jours actifs (pas le nombre total de jours)
 * 
 * Exemples:
 * - Jour 1: 0, Jour 2: 5, Jour 3: 10 → Moyenne = (5 + 10) / 2 = 7.5
 * - Jour 1: 0, Jour 2: 0, Jour 3: 0 → Moyenne = 0
 * - Jour 1: 15 → Moyenne = 15
 */
function calculateDailyActiveAverage(dailyTotals, exerciseType) {
    // Validation des paramètres
    if (!dailyTotals || typeof dailyTotals !== 'object') {
        return 0;
    }
    
    if (exerciseType !== 'pullups' && exerciseType !== 'muscleups') {
        console.warn(`Type d'exercice invalide: ${exerciseType}`);
        return 0;
    }
    
    // Récupérer toutes les dates
    const dates = Object.keys(dailyTotals);
    
    // Cas limite: aucune donnée
    if (dates.length === 0) {
        return 0;
    }
    
    // Filtrer et compter les jours actifs (où exerciceType > 0)
    let totalExercise = 0;
    let activeDaysCount = 0;
    
    dates.forEach(date => {
        const dayData = dailyTotals[date];
        const exerciseValue = dayData[exerciseType] || 0;
        
        // Ne compter QUE les jours où l'exercice a été pratiqué
        if (exerciseValue > 0) {
            totalExercise += exerciseValue;
            activeDaysCount++;
        }
    });
    
    // Cas limite: aucun jour actif
    if (activeDaysCount === 0) {
        return 0;
    }
    
    // Calcul de la moyenne (non arrondie)
    const average = totalExercise / activeDaysCount;
    
    return average;
}


/**
 * Calcule la moyenne hebdomadaire active pour un type d'exercice
 * 
 * @param {Object} dailyTotals - Objet contenant les totaux par date
 * @param {string} exerciseType - Type d'exercice: "pullups" ou "muscleups"
 * @param {number} numberOfWeeks - Nombre de semaines à analyser (par défaut: 12)
 * @returns {number} - Moyenne hebdomadaire (non arrondie) ou 0 si aucune semaine active
 * 
 * Logique:
 * 1. Regrouper les données par semaine (ISO week number)
 * 2. Calculer le total par semaine
 * 3. Ne garder QUE les semaines où total > 0
 * 4. Diviser le total de ces semaines actives par le nombre de semaines actives
 * 
 * Exemples:
 * - Semaine 1: 0, Semaine 2: 50, Semaine 3: 100 → Moyenne = (50 + 100) / 2 = 75
 * - Semaine 1: 0, Semaine 2: 0 → Moyenne = 0
 * - Semaine 1: 150 → Moyenne = 150
 */
function calculateWeeklyActiveAverage(dailyTotals, exerciseType, numberOfWeeks = 12) {
    // Validation des paramètres
    if (!dailyTotals || typeof dailyTotals !== 'object') {
        return 0;
    }
    
    if (exerciseType !== 'pullups' && exerciseType !== 'muscleups') {
        console.warn(`Type d'exercice invalide: ${exerciseType}`);
        return 0;
    }
    
    // Obtenir les totaux hebdomadaires
    const weeklyTotals = getWeeklyTotals(dailyTotals, exerciseType, numberOfWeeks);
    
    // Cas limite: aucune semaine
    if (weeklyTotals.length === 0) {
        return 0;
    }
    
    // Filtrer et sommer uniquement les semaines actives (total > 0)
    let totalExercise = 0;
    let activeWeeksCount = 0;
    
    weeklyTotals.forEach(weekTotal => {
        if (weekTotal > 0) {
            totalExercise += weekTotal;
            activeWeeksCount++;
        }
    });
    
    // Cas limite: aucune semaine active
    if (activeWeeksCount === 0) {
        return 0;
    }
    
    // Calcul de la moyenne (non arrondie)
    const average = totalExercise / activeWeeksCount;
    
    return average;
}


/**
 * Regroupe les données quotidiennes par semaine et calcule les totaux hebdomadaires
 * 
 * @param {Object} dailyTotals - Objet contenant les totaux par date
 * @param {string} exerciseType - Type d'exercice: "pullups" ou "muscleups"
 * @param {number} numberOfWeeks - Nombre de semaines à analyser
 * @returns {Array<number>} - Tableau des totaux hebdomadaires (du plus ancien au plus récent)
 * 
 * Utilise la norme ISO 8601 pour définir les semaines:
 * - La semaine commence le lundi
 * - La semaine 1 est celle contenant le premier jeudi de l'année
 */
function getWeeklyTotals(dailyTotals, exerciseType, numberOfWeeks) {
    const weeklyData = {};
    const today = new Date();
    
    // Calculer la date de début (il y a numberOfWeeks semaines)
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (numberOfWeeks * 7));
    
    // Parcourir toutes les dates dans dailyTotals
    Object.keys(dailyTotals).forEach(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        
        // Ignorer les dates en dehors de la période analysée
        if (date < startDate || date > today) {
            return;
        }
        
        // Obtenir le numéro de semaine ISO
        const weekKey = getISOWeekKey(date);
        
        // Initialiser la semaine si nécessaire
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = 0;
        }
        
        // Ajouter le total du jour à la semaine
        const exerciseValue = dailyTotals[dateStr][exerciseType] || 0;
        weeklyData[weekKey] += exerciseValue;
    });
    
    // Convertir l'objet en tableau de totaux
    const totals = Object.values(weeklyData);
    
    return totals;
}


/**
 * Génère une clé unique pour une semaine ISO (année-semaine)
 * 
 * @param {Date} date - Date pour laquelle obtenir la clé de semaine
 * @returns {string} - Clé au format "YYYY-WW" (ex: "2025-W06")
 * 
 * Implémentation de la norme ISO 8601 pour les semaines
 */
function getISOWeekKey(date) {
    // Copier la date pour ne pas la modifier
    const d = new Date(date.getTime());
    
    // Définir au jeudi de la même semaine (pour calcul ISO)
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    
    // Obtenir le premier janvier de l'année
    const yearStart = new Date(d.getFullYear(), 0, 1);
    
    // Calculer le numéro de semaine
    const weekNumber = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    
    // Retourner la clé au format YYYY-WW
    return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}


/**
 * Calcule toutes les moyennes actives pour un utilisateur
 * 
 * @param {Object} dailyTotals - Objet contenant les totaux par date
 * @returns {Object} - Objet contenant toutes les moyennes
 * 
 * Structure de retour:
 * {
 *   daily: {
 *     pullups: number,
 *     muscleups: number
 *   },
 *   weekly: {
 *     pullups: number,
 *     muscleups: number
 *   }
 * }
 */
function calculateAllActiveAverages(dailyTotals) {
    return {
        daily: {
            pullups: calculateDailyActiveAverage(dailyTotals, 'pullups'),
            muscleups: calculateDailyActiveAverage(dailyTotals, 'muscleups')
        },
        weekly: {
            pullups: calculateWeeklyActiveAverage(dailyTotals, 'pullups', 12),
            muscleups: calculateWeeklyActiveAverage(dailyTotals, 'muscleups', 12)
        }
    };
}


/* ====================================
   EXEMPLES D'UTILISATION
   ==================================== */

/**
 * EXEMPLE 1: Moyenne quotidienne avec jours inactifs
 */
function example1_DailyWithInactiveDays() {
    console.log('=== EXEMPLE 1: Moyenne quotidienne avec jours inactifs ===');
    
    const dailyTotals = {
        '2025-02-05': { pullups: 0, muscleups: 0 },     // Jour inactif
        '2025-02-06': { pullups: 5, muscleups: 2 },     // Jour actif
        '2025-02-07': { pullups: 10, muscleups: 3 },    // Jour actif
        '2025-02-08': { pullups: 0, muscleups: 0 }      // Jour inactif
    };
    
    const pullupsAvg = calculateDailyActiveAverage(dailyTotals, 'pullups');
    const muscleupsAvg = calculateDailyActiveAverage(dailyTotals, 'muscleups');
    
    console.log('Données:');
    console.log('  05/02: 0 tractions, 0 muscle-ups (IGNORÉ)');
    console.log('  06/02: 5 tractions, 2 muscle-ups');
    console.log('  07/02: 10 tractions, 3 muscle-ups');
    console.log('  08/02: 0 tractions, 0 muscle-ups (IGNORÉ)');
    console.log('');
    console.log('Résultats:');
    console.log(`  Moyenne tractions: ${pullupsAvg} (= (5 + 10) / 2)`);
    console.log(`  Moyenne muscle-ups: ${muscleupsAvg} (= (2 + 3) / 2)`);
    console.log('');
    console.log(`✓ Attendu: 7.5 tractions, 2.5 muscle-ups`);
    console.log(`✓ Obtenu: ${pullupsAvg} tractions, ${muscleupsAvg} muscle-ups`);
    console.log('');
}


/**
 * EXEMPLE 2: Cas limite - aucun jour actif
 */
function example2_NoActiveDays() {
    console.log('=== EXEMPLE 2: Aucun jour actif ===');
    
    const dailyTotals = {
        '2025-02-06': { pullups: 0, muscleups: 0 },
        '2025-02-07': { pullups: 0, muscleups: 0 },
        '2025-02-08': { pullups: 0, muscleups: 0 }
    };
    
    const pullupsAvg = calculateDailyActiveAverage(dailyTotals, 'pullups');
    const muscleupsAvg = calculateDailyActiveAverage(dailyTotals, 'muscleups');
    
    console.log('Données: Tous les jours à 0');
    console.log('Résultats:');
    console.log(`  Moyenne tractions: ${pullupsAvg}`);
    console.log(`  Moyenne muscle-ups: ${muscleupsAvg}`);
    console.log('');
    console.log(`✓ Attendu: 0 pour les deux`);
    console.log(`✓ Obtenu: ${pullupsAvg} tractions, ${muscleupsAvg} muscle-ups`);
    console.log('');
}


/**
 * EXEMPLE 3: Cas limite - un seul jour actif
 */
function example3_SingleActiveDay() {
    console.log('=== EXEMPLE 3: Un seul jour actif ===');
    
    const dailyTotals = {
        '2025-02-08': { pullups: 15, muscleups: 7 }
    };
    
    const pullupsAvg = calculateDailyActiveAverage(dailyTotals, 'pullups');
    const muscleupsAvg = calculateDailyActiveAverage(dailyTotals, 'muscleups');
    
    console.log('Données: Un seul jour - 15 tractions, 7 muscle-ups');
    console.log('Résultats:');
    console.log(`  Moyenne tractions: ${pullupsAvg}`);
    console.log(`  Moyenne muscle-ups: ${muscleupsAvg}`);
    console.log('');
    console.log(`✓ Attendu: 15 tractions, 7 muscle-ups`);
    console.log(`✓ Obtenu: ${pullupsAvg} tractions, ${muscleupsAvg} muscle-ups`);
    console.log('');
}


/**
 * EXEMPLE 4: Moyenne hebdomadaire avec semaines inactives
 */
function example4_WeeklyWithInactiveWeeks() {
    console.log('=== EXEMPLE 4: Moyenne hebdomadaire avec semaines inactives ===');
    
    // Simuler 4 semaines de données
    const dailyTotals = {};
    const today = new Date('2025-02-08');
    
    // Semaine 1 (il y a 3 semaines): 0 total (IGNORÉE)
    for (let i = 21; i >= 15; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        dailyTotals[dateStr] = { pullups: 0, muscleups: 0 };
    }
    
    // Semaine 2 (il y a 2 semaines): 50 tractions, 20 muscle-ups
    for (let i = 14; i >= 8; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        dailyTotals[dateStr] = { pullups: i === 10 ? 50 : 0, muscleups: i === 10 ? 20 : 0 };
    }
    
    // Semaine 3 (semaine dernière): 100 tractions, 40 muscle-ups
    for (let i = 7; i >= 1; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        dailyTotals[dateStr] = { pullups: i === 4 ? 100 : 0, muscleups: i === 4 ? 40 : 0 };
    }
    
    const pullupsAvg = calculateWeeklyActiveAverage(dailyTotals, 'pullups', 4);
    const muscleupsAvg = calculateWeeklyActiveAverage(dailyTotals, 'muscleups', 4);
    
    console.log('Données:');
    console.log('  Semaine 1: 0 tractions, 0 muscle-ups (IGNORÉE)');
    console.log('  Semaine 2: 50 tractions, 20 muscle-ups');
    console.log('  Semaine 3: 100 tractions, 40 muscle-ups');
    console.log('');
    console.log('Résultats:');
    console.log(`  Moyenne tractions: ${pullupsAvg} (= (50 + 100) / 2)`);
    console.log(`  Moyenne muscle-ups: ${muscleupsAvg} (= (20 + 40) / 2)`);
    console.log('');
    console.log(`✓ Attendu: 75 tractions, 30 muscle-ups`);
    console.log(`✓ Obtenu: ${pullupsAvg} tractions, ${muscleupsAvg} muscle-ups`);
    console.log('');
}


/**
 * EXEMPLE 5: Calcul de toutes les moyennes
 */
function example5_AllAverages() {
    console.log('=== EXEMPLE 5: Toutes les moyennes ===');
    
    const dailyTotals = {
        '2025-02-01': { pullups: 0, muscleups: 0 },
        '2025-02-02': { pullups: 10, muscleups: 5 },
        '2025-02-03': { pullups: 15, muscleups: 0 },
        '2025-02-04': { pullups: 0, muscleups: 8 },
        '2025-02-05': { pullups: 20, muscleups: 10 }
    };
    
    const averages = calculateAllActiveAverages(dailyTotals);
    
    console.log('Données quotidiennes:');
    console.log('  01/02: 0 tractions, 0 muscle-ups (IGNORÉ)');
    console.log('  02/02: 10 tractions, 5 muscle-ups');
    console.log('  03/02: 15 tractions, 0 muscle-ups (muscle-ups IGNORÉ)');
    console.log('  04/02: 0 tractions (IGNORÉ), 8 muscle-ups');
    console.log('  05/02: 20 tractions, 10 muscle-ups');
    console.log('');
    console.log('Résultats:');
    console.log('  Moyennes quotidiennes:');
    console.log(`    Tractions: ${averages.daily.pullups} (= (10 + 15 + 20) / 3)`);
    console.log(`    Muscle-ups: ${averages.daily.muscleups} (= (5 + 8 + 10) / 3)`);
    console.log('  Moyennes hebdomadaires:');
    console.log(`    Tractions: ${averages.weekly.pullups}`);
    console.log(`    Muscle-ups: ${averages.weekly.muscleups}`);
    console.log('');
}


/**
 * Fonction utilitaire pour formater une date en YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}


/* ====================================
   EXÉCUTION DES EXEMPLES (pour tests)
   ==================================== */

// Décommenter pour tester dans la console
/*
example1_DailyWithInactiveDays();
example2_NoActiveDays();
example3_SingleActiveDay();
example4_WeeklyWithInactiveWeeks();
example5_AllAverages();
*/


/* ====================================
   EXPORT POUR UTILISATION DANS L'APP
   ==================================== */

// Pour Node.js / modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        calculateDailyActiveAverage,
        calculateWeeklyActiveAverage,
        calculateAllActiveAverages,
        getWeeklyTotals,
        getISOWeekKey
    };
}
