/* ====================================
   CHARTS.JS - Gestion des graphiques Chart.js
   Graphiques avancés pour les statistiques
   ==================================== */

// ====================================
// GESTIONNAIRE DE GRAPHIQUES
// ====================================
class ChartsManager {
    constructor() {
        this.charts = {
            daily: null,
            weekly: null,
            monthly: null
        };
        
        this.initCharts();
    }

    /**
     * Initialise tous les graphiques
     */
    initCharts() {
        // Configuration globale Chart.js
        if (typeof Chart !== 'undefined') {
            Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif';
            Chart.defaults.color = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
        }
    }

    /**
     * Met à jour le thème des graphiques (mode clair/sombre)
     */
    updateTheme() {
        const isDark = document.body.classList.contains('dark-mode');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#B0B0B0' : '#757575';
        
        if (typeof Chart !== 'undefined') {
            Chart.defaults.color = textColor;
            Chart.defaults.borderColor = gridColor;
        }
        
        // Recréer tous les graphiques avec le nouveau thème
        this.updateAllCharts();
    }

    /**
     * Crée ou met à jour le graphique d'évolution quotidienne (30 jours)
     */
    updateDailyChart(dailyTotals) {
        const canvas = document.getElementById('dailyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Données des 30 derniers jours
        const data = this.getLast30DaysData(dailyTotals);
        
        // Détruire l'ancien graphique s'il existe
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }
        
        // Créer le nouveau graphique
        this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Tractions',
                        data: data.pullups,
                        borderColor: '#2196F3',
                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: 'Muscle-ups',
                        data: data.muscleups,
                        borderColor: '#FF5722',
                        backgroundColor: 'rgba(255, 87, 34, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            title: (context) => {
                                return context[0].label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45,
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    /**
     * Crée ou met à jour le graphique des totaux hebdomadaires (12 semaines)
     */
    updateWeeklyChart(dailyTotals) {
        const canvas = document.getElementById('weeklyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Données des 12 dernières semaines
        const data = this.getLast12WeeksData(dailyTotals);
        
        // Détruire l'ancien graphique s'il existe
        if (this.charts.weekly) {
            this.charts.weekly.destroy();
        }
        
        // Créer le nouveau graphique
        this.charts.weekly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Tractions',
                        data: data.pullups,
                        backgroundColor: '#2196F3',
                        borderRadius: 6,
                        borderSkipped: false
                    },
                    {
                        label: 'Muscle-ups',
                        data: data.muscleups,
                        backgroundColor: '#FF5722',
                        borderRadius: 6,
                        borderSkipped: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 10
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Crée ou met à jour le graphique de comparaison mensuelle
     */
    updateMonthlyChart(dailyTotals) {
        const canvas = document.getElementById('monthlyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Données des 6 derniers mois
        const data = this.getLast6MonthsData(dailyTotals);
        
        // Détruire l'ancien graphique s'il existe
        if (this.charts.monthly) {
            this.charts.monthly.destroy();
        }
        
        // Créer le nouveau graphique
        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'Tractions',
                        data: data.pullups,
                        backgroundColor: 'rgba(33, 150, 243, 0.8)',
                        borderColor: '#2196F3',
                        borderWidth: 2,
                        borderRadius: 8
                    },
                    {
                        label: 'Muscle-ups',
                        data: data.muscleups,
                        backgroundColor: 'rgba(255, 87, 34, 0.8)',
                        borderColor: '#FF5722',
                        borderWidth: 2,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: 'bold'
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0,
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            color: this.getGridColor()
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                size: 11
                            }
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * Récupère les données des 30 derniers jours
     */
    getLast30DaysData(dailyTotals) {
        const labels = [];
        const pullups = [];
        const muscleups = [];
        const today = new Date();

        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = this.formatDate(date);
            
            // Label court pour mobile
            const label = `${date.getDate()}/${date.getMonth() + 1}`;
            labels.push(label);
            
            const dayData = dailyTotals[dateStr] || { pullups: 0, muscleups: 0 };
            pullups.push(dayData.pullups);
            muscleups.push(dayData.muscleups);
        }

        return { labels, pullups, muscleups };
    }

    /**
     * Récupère les données des 12 dernières semaines
     */
    getLast12WeeksData(dailyTotals) {
        const labels = [];
        const pullups = [];
        const muscleups = [];
        const today = new Date();

        for (let i = 11; i >= 0; i--) {
            let weekPullups = 0;
            let weekMuscleups = 0;
            
            // Calculer le début de la semaine
            const weekStart = new Date(today);
            weekStart.setDate(weekStart.getDate() - (i * 7) - today.getDay());
            
            // Sommer les 7 jours de la semaine
            for (let j = 0; j < 7; j++) {
                const date = new Date(weekStart);
                date.setDate(date.getDate() + j);
                const dateStr = this.formatDate(date);
                
                const dayData = dailyTotals[dateStr] || { pullups: 0, muscleups: 0 };
                weekPullups += dayData.pullups;
                weekMuscleups += dayData.muscleups;
            }
            
            // Label: "Sem. 1", "Sem. 2", etc.
            labels.push(`S${12 - i}`);
            pullups.push(weekPullups);
            muscleups.push(weekMuscleups);
        }

        return { labels, pullups, muscleups };
    }

    /**
     * Récupère les données des 6 derniers mois
     */
    getLast6MonthsData(dailyTotals) {
        const labels = [];
        const pullups = [];
        const muscleups = [];
        const today = new Date();
        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 
                           'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        for (let i = 5; i >= 0; i--) {
            const month = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);
            
            let monthPullups = 0;
            let monthMuscleups = 0;
            
            // Parcourir tous les jours du mois
            for (let d = new Date(month); d <= monthEnd; d.setDate(d.getDate() + 1)) {
                const dateStr = this.formatDate(d);
                const dayData = dailyTotals[dateStr] || { pullups: 0, muscleups: 0 };
                monthPullups += dayData.pullups;
                monthMuscleups += dayData.muscleups;
            }
            
            labels.push(monthNames[month.getMonth()]);
            pullups.push(monthPullups);
            muscleups.push(monthMuscleups);
        }

        return { labels, pullups, muscleups };
    }

    /**
     * Met à jour tous les graphiques
     */
    updateAllCharts(dailyTotals) {
        if (!dailyTotals) return;
        
        this.updateDailyChart(dailyTotals);
        this.updateWeeklyChart(dailyTotals);
        this.updateMonthlyChart(dailyTotals);
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
     * Obtient la couleur de grille selon le thème
     */
    getGridColor() {
        const isDark = document.body.classList.contains('dark-mode');
        return isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    }
}
