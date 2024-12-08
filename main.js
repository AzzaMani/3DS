const stompit = require("stompit");
const axios = require("axios");
const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 4242 });
const mysql = require("mysql2");
const express = require("express");
const app = express();
const cors = require("cors");


app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "events_db",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL database");
});

function saveEventToDB(event) {
  const query = `
    INSERT INTO events 
    (source, type_event, event_id, timestamp, event_type, service_event_name, user, eventClass, relative_path, title)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    event.source || "N/A", // Event source
    event.type || "N/A", // Event type
    event.id || "N/A", // Unique event ID
    new Date(event.time), // Event timestamp
    event.data?.eventType || "N/A", // Type of the event
    event.data?.serviceName || "N/A", // Service name
    event.data?.user || "N/A", // User associated with the event
    event.data?.eventClass || "N/A", // Event class (e.g., Document)
    event.data?.subject?.relativePath || "N/A", // Relative path to the document
    event.data?.subject?.title || "N/A", // Document title
  ];

  db.query(query, values, (err) => {
    if (err) {
      console.error("Error saving event:", err.message);
    } else {
      console.log("Event saved to database");
    }
  });
}
app.get("/events", (req, res) => {
  db.query("SELECT * FROM events ORDER BY timestamp DESC", (err, results) => {
    if (err) {
      return res.status(500).send(err.message);
    }
    res.json(results);
  });
});

app.listen(3000, () => console.log("endpoint /GET event running on http://localhost:3000"));


wss.on("connection", (socket) => {
  console.log("Client connecté au WebSocket");

  socket.on("error", (err) => {
    console.error("Erreur WebSocket côté client :", err.message);
  });
});

function handleStompit() {
  const connectionHeaders = {
    "heart-beat": "50000,0", 
    host: "/",
    "client-id": "3DSEpita-CBY", 
    login: "b3935f56-98da-4d38-ab19-6a44660cdb11",
    passcode: "$h~$7p4!:q=LtCuNHqG4G%q\"",
  };
  console.log("Connexion établie au serveur ActiveMQ");

  // Serveurs ActiveMQ disponibles
  const servers = [
    {
      ssl: true,
      host: "eu1-msgbus-1.3dexperience.3ds.com",
      port: 80,
      connectHeaders: connectionHeaders,
    },
  ];

  // Initialisation de la connexion STOMP avec gestion des échecs
  const manager = new stompit.ConnectFailover(servers, {
    initialReconnectDelay: 100, // Temps avant la première tentative de reconnexion
    maxReconnectDelay: 30000, // Temps maximum entre les tentatives de reconnexion
    useExponentialBackOff: true, // Utilisation de la stratégie exponentielle
    maxReconnects: 30, // Nombre maximum de reconnexions
    randomize: false, // Désactivation de la randomisation des serveurs
  });

  // En-têtes pour la souscription au topic
  const subscribeHeaders = {
    destination: "/topic/3dsevents.R1132102747346.3DSpace.user", // ID du Tenant et topic cible
    activemqSubscriptionName: "UniqueIDForTheActiveMQ", // Identifiant unique pour la souscription
    ack: "client-individual", // Mode d'accusé de réception
  };

  // Connexion et écoute des événements
  manager.connect((error, client, reconnect) => {
    if (error) {
      console.error("Erreur de connexion :", error.message);
      return;
    }

    console.log("Connecté à ActiveMQ");

    // Souscription au topic
    client.subscribe(subscribeHeaders, (error, message) => {
      if (error) {
        console.error("Erreur de souscription :", error.message);
        return;
      }
      console.log(
        "Souscription réussie au topic :",
        subscribeHeaders.destination
      );

      message.readString("utf8", async (error, body) => {
        if (error) {
          console.error(
            "Erreur lors de la lecture du message :",
            error.message
          );
          return;
        }

        try {
          const event = JSON.parse(body);
          const source = event.data?.subject?.source;
          const relative_path = event.data?.subject?.relativePath;
          const url = source + relative_path;
          console.log("Constructed URL:", url);

          const response = await axios.get(url, {
            headers: {
              Authorization: `Basic ${Buffer.from(
                `${connectionHeaders.login}:${connectionHeaders.passcode}`
              ).toString("base64")}`,
            },
          });

          event.data.subject.title = response.data.data[0].dataelements.title;
          console.log(
            "************************************************************"
          );
          console.log("Event with document title:", event);

          /* setInterval(() => {
            const testEvent = {
              source: "Test Source",
              time: new Date().toISOString(),
              data: {
                subject: { title: "Test Document" },
                eventClass: "Document",
                user: "TestUser",
              },
            }; */
          // }, 5000);
          
          wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(event));
            }
          });
          console.log("Événement envoyé ");
          saveEventToDB(event);
          console.log("Événement enregistré dans la base de donnée");

        } catch (parseError) {
          console.error(
            "Erreur lors de l'analyse du JSON :",
            parseError.message
          );
        }
        

        client.ack(message); // Accusé de réception
      });
    });
  });
}

// Lancement de la fonction principale
handleStompit();
