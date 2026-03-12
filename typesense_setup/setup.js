const fs = require('fs/promises');
const client = require('./config.js');


// Schema definition for the 'sats' collection
// Keep this schema the same as the one in nanoSat client
let satSchema = {
  'name': 'sats',
  'fields': [
    {'name': 'name', 'type': 'string'},
    {'name': 'status', 'type': 'string'},
    {'name': 'norad_cat_id', 'type': 'int32'}
  ],
};

async function setupTypesenseCollection() {
  try {
    // Create the collection in Typesense
    const data = await client.collections().create(satSchema);
    console.log('Collection created:', data);
  } catch (error) {
    console.error('Error creating collection:', error);
  }
}

async function processAndIndexSatellites() {
  try {
    // Read the satellite data from the file
    const booksInJsonl = await fs.readFile("./satellite_list.json", 'utf8');
    const satellites = JSON.parse(booksInJsonl);

    // Filter and map the data
    const filteredData = satellites
      .filter(sat => sat.name !== "Unknown Satellite")
      .reduce((acc, current) => {
        const x = acc.find(item => item.name === current.name);
        if (!x) {
          acc.push({ name: current.name, status: current.status, norad_cat_id: current.norad_cat_id});
        }
        return acc;
      }, []);

    // Ensure the collection exists
    await setupTypesenseCollection();

    // Index the filtered data in Typesense
    for (let satellite of filteredData) {
      try {
        const indexedData = await client.collections('sats').documents().create(satellite);
        console.log('Indexed:', indexedData);
      } catch (error) {
        console.error('Error indexing data:', error);
      }
    }
  } catch (error) {
    console.error('Error processing file:', error);
  }
}

async function setupAndIndexData() {
    try {
        await processAndIndexSatellites();
    } catch (error) {
        console.error('Error setting up Typesense and indexing data:', error);
    }
}

setupAndIndexData();
