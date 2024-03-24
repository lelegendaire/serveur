

// Afficher un message lorsque le serveur WebSocket est démarré avec succès

// Importer la bibliothèque ws pour créer un serveur WebSocket
const WebSocket = require('ws');

// Créer un nouveau serveur WebSocket qui écoute sur le port 5500
const wss = new WebSocket.Server({ port: 3306 });

// Stocker les données de la base de données dans une variable (à des fins de démonstration)


// Gérer les connexions entrantes des clients
wss.on('connection', function connection(ws) {
    console.log('Nouvelle connexion WebSocket établie');



    // Gérer les messages entrants des clients
    ws.on('message', function incoming(message) {
        // Analyser le message JSON reçu
        const data_parse = JSON.parse(message);

        // Mettre à jour la base de données côté serveur
        if (data_parse.action === 'update') {
            console.log("confirmation update")

            // Mettre à jour la variable database avec les nouvelles données



            // Diffuser la mise à jour à tous les autres clients connectés
            wss.clients.forEach(function each(client) {
                if (client !== ws && client.readyState === WebSocket.OPEN) {

                    client.send(message);
                }
            });
        }
    });


    // Gérer la fermeture de la connexion
    ws.on('close', function close() {
        console.log('Connexion WebSocket fermée');
    });
});
wss.on('listening', function () {
    console.log('Serveur WebSocket démarré avec succès sur le port 5500');
});

