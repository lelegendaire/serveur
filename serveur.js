// Afficher un message lorsque le serveur WebSocket est démarré avec succès

// Importer la bibliothèque ws pour créer un serveur WebSocket
const WebSocket = require('ws');

// Créer un nouveau serveur WebSocket qui écoute sur le port 5500
const wss = new WebSocket.Server({ port: process.env.PORT || 8080  });

// Stocker les données de la base de données dans une variable (à des fins de démonstration)
let latestDateTime = null;
let clientsDateTime = [];

// Gérer les connexions entrantes des clients
wss.on('connection', function connection(ws) {
    console.log('Nouvelle connexion WebSocket établie');

    // Gérer les messages entrants des clients
    ws.on('message', function incoming(message) {
        const data_parse = JSON.parse(message);

        if (data_parse.action === 'update') {
            console.log("confirmation update");

            // Diffuser la mise à jour à tous les autres clients connectés
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }

        if (data_parse.action === 'clientDateTime') {
            const clientDateTime = data_parse.dateTime;
            clientsDateTime.push(clientDateTime);
            latestDateTime = clientsDateTime.reduce((a, b) => a > b ? a : b);

            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ action: "latestDateTime", dateTime: latestDateTime }));
                }
            });
        }
    });

    // Gérer la fermeture de la connexion
    ws.on('close', function close() {
        console.log('Connexion WebSocket fermée');
    });
});

// Message de succès lors du démarrage du serveur WebSocket
wss.on('listening', function () {
    console.log('Serveur WebSocket démarré avec succès sur le port 5500');
});
