const stompit = require("stompit");

function handleStompit() {
  const connectionHeaders = {
    "heart-beat": "50000,0", // Fréquence des battements pour garder la connexion ouverte
    host: "/",
    "client-id": "3DSEpita-CBY", // Identifiant unique
    login: "b3935f56-98da-4d38-ab19-6a44660cdb11", // Login de l'agent CLM
    passcode: "$h~$7p4!:q=LtCuNHqG4G%q\"",
  };
    console.log(connectionHeaders.passcode)
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
            
        
          message.readString('utf8', (error, body) => {
              if (error) {
                  console.error("Erreur lors de la lecture du message :", error.message);
                  return;
              }

              try {
                  const event = JSON.parse(body); // Analyse du JSON
                  console.log(event)
                  const title = event.subject?.title; // Récupère le champ title
              } catch (parseError) {
                  console.error("Erreur lors de l'analyse du JSON :", parseError.message);
              }

              client.ack(message); // Accusé de réception
          });
        
    });
  });
}

// Lancement de la fonction principale
handleStompit();
