import Satellite from "./satellite";

export default class SatelliteManager {

  constructor() {
    
  }
  
  public async fetch_TLEs() : void {

      const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544/tles');
      console.log('TLE Response:', response.data);
      const { line1, line2 } = response.data;

  } 

  // TODO This is simply a test function. Generalize this function to be able to plot any satellites TLE
  // Propagate the orbit of the ISS and then plot it.
  public async propagateISSOrbit() {
    try {
      const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544/tles');
      console.log('TLE Response:', response.data);
      const { line1, line2 } = response.data;

      const satrec = satellite.twoline2satrec(line1, line2);
      const positions = [];
      const earthRadius = 5;
      const scaleFactor = earthRadius / 6371; // 6371 is the approximate radius of the Earth in km
      const altitude = 0.314; // scaled altitude for ISS

      const currentDate = new Date();
      for (let i = 0; i < 1400; i++) {
        const time = new Date(currentDate.getTime() + i * 60000);
        const positionAndVelocity = satellite.propagate(satrec, time);
        const positionEci = positionAndVelocity.position;

        if (positionEci) {
          const gmst = satellite.gstime(time);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          const longitude = positionGd.longitude * (180 / Math.PI);
          const latitude = positionGd.latitude * (180 / Math.PI);
          const height = (positionGd.height * scaleFactor) + earthRadius + altitude; // Scale height

          const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
          const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
          const z = height * Math.sin(latitude * Math.PI / 180);

          positions.push(new THREE.Vector3(x, y, z));
        }
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(positions);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitLine.rotation.x = - Math.PI / 2;
      sceneRef.current.add(orbitLine);


      const issGeometry = new THREE.SphereGeometry(0.1, 32, 32);
      const issMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const issMesh = new THREE.Mesh(issGeometry, issMaterial);
      sceneRef.current.add(issMesh);

      const updateISSPosition = () => {
        const time = new Date();
        const positionAndVelocity = satellite.propagate(satrec, time);
        const positionEci = positionAndVelocity.position;

        if (positionEci) {
          const gmst = satellite.gstime(time);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          const longitude = positionGd.longitude * (180 / Math.PI);
          const latitude = positionGd.latitude * (180 / Math.PI);
          const height = (positionGd.height * scaleFactor) + earthRadius + altitude; // Scale height

          const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
          const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
          const z = height * Math.sin(latitude * Math.PI / 180);
          
          const vector = new THREE.Vector3(x,y,z);
          vector.applyAxisAngle(new THREE.Vector3(1,0,0), - Math.PI / 2);
          issMesh.position.set(vector.x, vector.y, vector.z);
        }
      };

      setInterval(updateISSPosition, 1000);
    } catch (error) {
      console.error('Error fetching TLE data:', error);
    }
  };
}
