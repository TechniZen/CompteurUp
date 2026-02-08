# 📊 Documentation - Calcul des Moyennes Actives

## 🎯 Principe Fondamental

Les moyennes dans Sport Tracker sont calculées **uniquement sur les jours/semaines actifs**, c'est-à-dire où vous avez réellement fait de l'exercice (total > 0).

---

## ❌ Ce que nous NE faisons PAS

**Mauvaise méthode** (moyenne naïve):
```
Jour 1: 0 traction
Jour 2: 5 tractions
Jour 3: 10 tractions

Moyenne incorrecte = (0 + 5 + 10) / 3 = 5 tractions/jour ❌
```

**Problème**: Cela inclut les jours de repos, ce qui dilue artificiellement vos performances réelles.

---

## ✅ Ce que nous faisons

**Bonne méthode** (moyenne active):
```
Jour 1: 0 traction        → IGNORÉ
Jour 2: 5 tractions       → COMPTÉ
Jour 3: 10 tractions      → COMPTÉ

Moyenne correcte = (5 + 10) / 2 = 7.5 tractions/jour ✓
```

**Avantage**: Reflète votre performance réelle les jours où vous vous entraînez.

---

## 📅 Moyenne Quotidienne Active

### Définition
Moyenne du nombre de répétitions par **jour d'entraînement** (et non par jour calendaire).

### Algorithme
```javascript
1. Parcourir tous les jours dans l'historique
2. Pour chaque jour :
   - Si tractions > 0 : ajouter au compteur et à la somme
   - Si tractions = 0 : ignorer complètement ce jour
3. Moyenne = Somme des jours actifs / Nombre de jours actifs
```

### Exemples Réels

#### Exemple 1 : Semaine normale
```
Lundi    : 20 tractions
Mardi    : 0 traction (repos)
Mercredi : 25 tractions
Jeudi    : 0 traction (repos)
Vendredi : 30 tractions
Samedi   : 0 traction (repos)
Dimanche : 15 tractions

Jours actifs : Lundi, Mercredi, Vendredi, Dimanche (4 jours)
Total : 20 + 25 + 30 + 15 = 90 tractions
Moyenne active : 90 / 4 = 22.5 tractions par jour d'entraînement ✓

❌ Moyenne naïve (incorrecte) : 90 / 7 = 12.86 tractions/jour
```

#### Exemple 2 : Début d'utilisation
```
Jour 1 : 10 tractions
Jour 2 : 0 traction (pas encore utilisé l'app)
Jour 3 : 0 traction (pas encore utilisé l'app)

Jours actifs : 1
Total : 10 tractions
Moyenne active : 10 / 1 = 10 tractions ✓
```

#### Exemple 3 : Aucune activité
```
Tous les jours : 0 traction

Jours actifs : 0
Moyenne active : 0 ✓
```

---

## 📆 Moyenne Hebdomadaire Active

### Définition
Moyenne du nombre de répétitions par **semaine d'entraînement** (et non par semaine calendaire).

### Algorithme
```javascript
1. Regrouper les données par semaine ISO (lundi-dimanche)
2. Calculer le total par semaine
3. Pour chaque semaine :
   - Si total > 0 : ajouter au compteur et à la somme
   - Si total = 0 : ignorer complètement cette semaine
4. Moyenne = Somme des semaines actives / Nombre de semaines actives
```

### Qu'est-ce qu'une Semaine ISO ?
- Commence toujours un **lundi**
- Se termine un **dimanche**
- Norme internationale ISO 8601
- Permet des comparaisons cohérentes

### Exemples Réels

#### Exemple 1 : Mois avec pause
```
Semaine 1 : 150 tractions total
Semaine 2 : 0 traction (vacances, pas d'entraînement)
Semaine 3 : 200 tractions total
Semaine 4 : 0 traction (maladie)
Semaine 5 : 175 tractions total

Semaines actives : Semaines 1, 3, 5 (3 semaines)
Total : 150 + 200 + 175 = 525 tractions
Moyenne active : 525 / 3 = 175 tractions par semaine d'entraînement ✓

❌ Moyenne naïve (incorrecte) : 525 / 5 = 105 tractions/semaine
```

#### Exemple 2 : Débutant
```
Semaine 1 : 50 tractions
Semaine 2 : 0 traction (pas encore lancé)
Semaine 3 : 0 traction (pas encore lancé)

Semaines actives : 1
Total : 50 tractions
Moyenne active : 50 / 1 = 50 tractions ✓
```

---

## 🧮 Formules Mathématiques

### Moyenne Quotidienne Active
```
                  Σ (répétitions du jour i)
Moyenne = ──────────────────────────────────────
          Nombre de jours où répétitions > 0
```

### Moyenne Hebdomadaire Active
```
                  Σ (répétitions de la semaine j)
Moyenne = ────────────────────────────────────────
          Nombre de semaines où total > 0
```

---

## 💡 Cas Particuliers

### Cas 1 : Exercices Indépendants
Les tractions et muscle-ups sont calculés **indépendamment**.

```
Jour 1 : 10 tractions, 0 muscle-up
Jour 2 : 0 traction, 5 muscle-ups
Jour 3 : 15 tractions, 8 muscle-ups

Tractions :
  Jours actifs : Jours 1 et 3 (2 jours)
  Moyenne : (10 + 15) / 2 = 12.5 ✓

Muscle-ups :
  Jours actifs : Jours 2 et 3 (2 jours)
  Moyenne : (5 + 8) / 2 = 6.5 ✓
```

### Cas 2 : Données Manquantes
Si un jour n'existe pas dans l'historique, il est considéré comme 0 et donc ignoré.

### Cas 3 : Valeurs Décimales
Les moyennes ne sont **pas arrondies** dans les calculs internes, mais peuvent l'être pour l'affichage UI.

```javascript
Moyenne brute : 7.5 tractions/jour
Affichage UI : 8 tractions/jour (arrondi)
```

---

## 🔍 Avantages de cette Méthode

### ✅ 1. Précision
Reflète vos **vraies performances** les jours où vous vous entraînez.

### ✅ 2. Motivation
Ne pénalise pas les jours de repos (essentiels pour la récupération).

### ✅ 3. Comparabilité
Permet de comparer des périodes avec différentes fréquences d'entraînement.

**Exemple**:
```
Période 1 : S'entraîne 7j/7 → 10 tractions/jour
Période 2 : S'entraîne 3j/7 → 20 tractions/jour

Avec moyenne active : On voit clairement que l'intensité a doublé ✓
Avec moyenne naïve : 10 vs ~8.5, différence masquée ❌
```

### ✅ 4. Suivi de Progression
Si votre moyenne active augmente, c'est que vous progressez **réellement** en force/endurance.

---

## 📊 Affichage dans l'App

### Section Statistiques
- **Moyenne quotidienne** : Calculée sur TOUS les jours de l'historique (pas seulement les 7 derniers)
- **Moyenne hebdomadaire** : Calculée sur les 12 dernières semaines par défaut

### Interprétation
```
Moyenne quotidienne : 15 tractions
→ "En moyenne, je fais 15 tractions par séance d'entraînement"

Moyenne hebdomadaire : 100 tractions
→ "En moyenne, je fais 100 tractions par semaine où je m'entraîne"
```

---

## 🛠️ Implémentation Technique

### Fonction Principale
```javascript
function calculateDailyActiveAverage(dailyTotals, exerciseType) {
    let total = 0;
    let activeDays = 0;
    
    for (const date in dailyTotals) {
        const value = dailyTotals[date][exerciseType];
        
        if (value > 0) {  // Condition clé : ignorer les 0
            total += value;
            activeDays++;
        }
    }
    
    return activeDays > 0 ? total / activeDays : 0;
}
```

### Gestion des Erreurs
- Données vides → Retourne 0
- Aucun jour actif → Retourne 0
- Un seul jour actif → Retourne le total de ce jour
- Type d'exercice invalide → Retourne 0 + warning console

---

## 📈 Exemple Complet : Suivi sur 1 Mois

```
Semaine 1 : Lun(10), Mer(12), Ven(15)           = 37 tractions
Semaine 2 : Mar(8), Jeu(10), Sam(14)            = 32 tractions
Semaine 3 : 0 (vacances)                        = 0 tractions
Semaine 4 : Lun(20), Mer(22), Ven(25), Dim(18)  = 85 tractions

Analyse :
──────────────────────────────────────────────────
Moyenne quotidienne active :
  Jours actifs : 10 jours
  Total : 10+12+15+8+10+14+20+22+25+18 = 154
  Moyenne : 154 / 10 = 15.4 tractions/jour ✓

Moyenne hebdomadaire active :
  Semaines actives : 3 (semaines 1, 2, 4)
  Total : 37 + 32 + 85 = 154
  Moyenne : 154 / 3 = 51.33 tractions/semaine ✓

❌ Si on avait utilisé la méthode naïve :
  Moyenne quotidienne : 154 / 30 = 5.13 (masque la performance)
  Moyenne hebdomadaire : 154 / 4 = 38.5 (masque la progression)
```

---

## 🎓 Pourquoi c'est Important

### Scénario Réaliste
Vous vous entraînez **3 fois par semaine** et faites **50 tractions par séance**.

**Avec moyenne active** :
- Moyenne = 50 tractions/jour ✓
- Reflète votre intensité réelle

**Avec moyenne naïve** :
- Moyenne = (150 tractions) / 7 jours = ~21.4 tractions/jour ❌
- Sous-estime votre performance de plus de 50% !

---

## 🔗 Ressources

- Fichier d'implémentation : `active-averages.js`
- Intégration : `script.js` (fonction `getWeeklyStats`)
- Tests : 5 exemples documentés dans `active-averages.js`

---

## ✅ Checklist de Validation

Lors du développement, vérifiez :
- [ ] Les jours à 0 sont **ignorés** (pas comptés dans le diviseur)
- [ ] Les semaines à 0 sont **ignorées** (pas comptées dans le diviseur)
- [ ] Si aucun jour actif → retourne 0 (pas d'erreur)
- [ ] Si 1 seul jour actif → retourne le total de ce jour
- [ ] Tractions et muscle-ups calculés **indépendamment**
- [ ] Pas d'arrondi dans les calculs internes
- [ ] Arrondi uniquement pour l'affichage UI

---

**Cette méthode garantit que vos statistiques reflètent vos vraies performances ! 💪**

_Version 2.0 - Février 2025_
