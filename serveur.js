const WebSocket = require('ws');
const express = require('express');
const fs = require('fs');
const path = require('path');

// Configurer le serveur HTTP avec Express
const app = express();
const port = process.env.PORT || 8080;

// Répertoire public pour les fichiers statiques
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Démarrer le serveur HTTP
const server = app.listen(port, () => {
  console.log(`HTTP server is running on port ${port}`);
});

// Configurer le serveur WebSocket
const wss = new WebSocket.Server({ server });

let latestDateTime = null;
let clientsDateTime = [];

wss.on('connection', (ws) => {
    console.log('Nouvelle connexion WebSocket établie');

    if (latestDateTime) {
        ws.send(JSON.stringify({ action: "latestDateTime", dateTime: latestDateTime }));
    }

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
                   if (data.action === 'create-site') {
            const dirPath = path.join(__dirname, 'User', data.username, data.sitename);
            const filePath = path.join(dirPath, 'index.html');

            // Créer le répertoire s'il n'existe pas
            fs.mkdir(dirPath, { recursive: true }, err => {
                if (err) {
                    return ws.send(JSON.stringify({ status: 'error', message: 'Erreur lors de la création du répertoire' }));
                }

                // Créer le fichier index.html avec du contenu par défaut
                const content = `
                    <html>
                        <head>
                            <title>Welcome to ${data.sitename}</title>
                        </head>
                        <body>
                            <h1>Welcome to ${data.sitename}</h1>
                        </body>
                    </html>
                `;
                fs.writeFile(filePath, content, err => {
                    if (err) {
                        return ws.send(JSON.stringify({ status: 'error', message: 'Erreur lors de la création du fichier' }));
                    }

                    ws.send(JSON.stringify({ status: 'success', message: 'Site créé avec succès' }));
                });
            });
        }

            if (data.action === 'clientDateTime') {
                handleClientDateTime(ws, data);
            } else if (data.action === 'syncData') {
                handleSyncData(ws, data);
           
            } else if (data.action === "firstConnection") {
                // Identifier le client qui a envoyé le message
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {                      
                        // Envoyer le message "sendDate" à tous les autres clients
                    client.send(JSON.stringify({ action: "sendDate" }));
                        
                    }
                });

              
            }
        } catch (error) {
            console.error('Erreur lors de l\'analyse du message:', error);
        }
    });

    ws.on('close', () => {
        console.log('Connexion WebSocket fermée');
    });
});

wss.on('listening', () => {
    const address = wss.address();
    console.log(`Serveur WebSocket démarré avec succès sur le port ${address.port}`);
  console.log(address)
});

function handleClientDateTime(ws, data) {
    const clientDateTime = data.dateTime;
    clientsDateTime.push({ ws: ws, dateTime: clientDateTime });

    latestDateTime = clientsDateTime.reduce((latest, current) => {
        return latest.dateTime > current.dateTime ? latest : current;
    }).dateTime;

    broadcastToClients({ action: "latestDateTime", dateTime: latestDateTime });
}

function handleSyncData(ws, data) {
    const { storeName, data: syncData } = data;
    broadcastToClientsExcept(ws, { action: "syncData", storeName: storeName, data: syncData });
}



function broadcastToClients(message) {
    const messageString = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageString);
        }
    });
}
function broadcastToClientsExcept(sender, message) {
    const messageString = JSON.stringify(message);
    wss.clients.forEach((client) => {
        if (client !== sender && client.readyState === WebSocket.OPEN) {
            client.send(messageString);
        }
    });
}
