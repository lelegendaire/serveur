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

// Fichier de stockage des données
const dataFilePath = path.join(__dirname, 'data.json');

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
            } else if (data.action === 'saveData') {
                saveDataToServer(data.storeName, data.data);
            } else if (data.action === 'getData') {
                getDataFromServer(ws);
            } else if (data.action === "firstConnection") {
                wss.clients.forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {                      
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
    saveDataToServer(storeName, syncData);
    broadcastToClientsExcept(ws, { action: "syncData", storeName: storeName, data: syncData });
}

function saveDataToServer(storeName, data) {
    let storedData = {};
    if (fs.existsSync(dataFilePath)) {
        storedData = JSON.parse(fs.readFileSync(dataFilePath));
    }
    storedData[storeName] = data;
    fs.writeFileSync(dataFilePath, JSON.stringify(storedData));
    console.log(`Données sauvegardées pour le store: ${storeName}`);
}

function getDataFromServer(ws) {
    if (fs.existsSync(dataFilePath)) {
        const storedData = JSON.parse(fs.readFileSync(dataFilePath));
        for (const [storeName, data] of Object.entries(storedData)) {
            ws.send(JSON.stringify({ action: "syncData", storeName: storeName, data: data }));
        }
    } else {
        ws.send(JSON.stringify({ action: "syncData", storeName: "", data: [] }));
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
