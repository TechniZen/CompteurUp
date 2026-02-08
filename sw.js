/* ====================================
   SERVICE WORKER - PWA
   Ce fichier permet de faire fonctionner l'application hors ligne
   
   Pour l'activer :
   1. Décommenter le code d'enregistrement dans script.js (à la fin du fichier)
   2. Servir l'application via HTTPS ou localhost
   3. Le service worker se chargera automatiquement
   ==================================== */

const CACHE_NAME = 'sport-tracker-v2';

// Liste des fichiers à mettre en cache pour le fonctionnement hors ligne
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/storage.js',
    '/charts.js',
    '/manifest.json',
    'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js'
];

// Installation du service worker
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installation en cours...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Mise en cache des fichiers');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                console.log('Service Worker: Installation terminée');
                // Force le nouveau service worker à devenir actif immédiatement
                return self.skipWaiting();
            })
    );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activation en cours...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Supprimer les anciens caches
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('Service Worker: Activation terminée');
            // Prendre le contrôle de toutes les pages immédiatement
            return self.clients.claim();
        })
    );
});

// Interception des requêtes réseau
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Si le fichier est en cache, le retourner
                if (response) {
                    return response;
                }

                // Sinon, faire la requête réseau
                return fetch(event.request).then((response) => {
                    // Vérifier que la réponse est valide
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // Cloner la réponse pour la mettre en cache
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // En cas d'erreur (pas de réseau et pas de cache)
                // Vous pouvez retourner une page d'erreur personnalisée ici
                console.log('Service Worker: Ressource non disponible:', event.request.url);
            })
    );
});

/* ====================================
   FONCTIONNALITÉS SUPPLÉMENTAIRES
   ==================================== */

// Gestion des notifications push (optionnel)
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Nouvelle notification',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200]
    };

    event.waitUntil(
        self.registration.showNotification('Sport Tracker', options)
    );
});

// Gestion du clic sur les notifications
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.openWindow('/')
    );
});

// Synchronisation en arrière-plan (optionnel)
// Permet de synchroniser les données quand la connexion revient
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Ici, vous pouvez synchroniser les données avec un serveur
            console.log('Service Worker: Synchronisation des données...')
        );
    }
});
