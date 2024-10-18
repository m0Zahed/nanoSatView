const Typesense = require('typesense');

// Configure the Typesense client
let client = new Typesense.Client({
  nodes: [{
    host: 'localhost',  // Adjust if your Typesense server is not local
    port: '8108',       // Default Typesense port
    protocol: 'http'    // Use 'https' for secure connections
  }],
  apiKey: 'xyz',  
  connectionTimeoutSeconds: 2
});

module.exports = client;