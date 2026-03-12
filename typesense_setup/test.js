const client = require('./config.js');

async function retrieveDocument() {
  try {
    // Attempt to retrieve the document by ID from the 'sats' collection
    const document = await client.collections('sats').documents('1798').retrieve();
    console.log('Document retrieved:', document);
  } catch (error) {
    console.error('Error retrieving document:', error);
  }
}

retrieveDocument();
