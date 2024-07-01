const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

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
            if (data.action === 'clientDateTime') {
                handleClientDateTime(ws, data);
            } else if (data.action === 'syncData') {
                handleSyncData(ws, data);
            } else if (data.action === 'requestSyncData') {
                requestSyncFromMostRecentClient(ws);
            } else if (data.action === "firstConnection") {
                // Identifier le client qui a envoyé le message
    let senderClient = null;
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            // Vérifier si ce client est celui qui a envoyé le message "firstConnection"
            if (client === ws) {
                senderClient = client;
            } else {
                // Envoyer le message "sendDate" à tous les autres clients
                client.send(JSON.stringify({ action: "sendDate" }));
            }
        }
    });

    // Si le client qui a envoyé le message est identifié, ne rien faire pour ce client
    if (senderClient !== null) {
        // Vous pouvez ajouter un traitement spécial si nécessaire, ou simplement ignorer
    }
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

function requestSyncFromMostRecentClient(ws) {
    const mostRecentClient = clientsDateTime.find(client => client.dateTime === latestDateTime);
    if (mostRecentClient) {
        mostRecentClient.ws.send(JSON.stringify({ action: "requestSyncDataFromClient" }));
    }
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
