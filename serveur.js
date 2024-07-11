const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');


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
             if (data.action === 'create-directory') {
      const dir = path.join(__dirname, data.dirName);
      
      // Créer le répertoire s'il n'existe pas
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }

      // Créer un fichier dans le répertoire
      const filePath = path.join(dir, data.fileName);
      fs.writeFileSync(filePath, data.content);
console.log("créer avec succès")
                 // Envoyer le lien du fichier créé au client
      const fileUrl = `https://the-fab-studio.onrender.com/${data.dirName}/${data.fileName}`;
      ws.send(JSON.stringify({ message: 'Directory and file created successfully!', fileUrl }));
      
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
