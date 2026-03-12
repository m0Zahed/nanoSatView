import Satellite from '@/models/satellite.ts';
import * as THREE from 'three';
// import satelliteList from '@/assets/satellite_list.json';
function getSatelliteNames(satelliteList : any ) {
  const filteredList = satelliteList.filter((sat: any) => sat.name.toLowerCase() !== 'unknown satellite');
  const satellites = filteredList.map((sat: any) => new Satellite(sat));
  return satellites.map((sat:any) => ({ name: sat.name }));
}


/**
 * @brief Returns the Mesh object in the group
 */
function getMeshByName(group : THREE.Group, name : string) {
  for (let i = 0; i < group.children.length; i++) {
    if (group.children[i].name === name) {
      return group.children[i];
    }
  }
  return group.children[0];
}

/**
 * @brief Adds a meridian and equator line to a sphere, specify a radius
 * @param scene Scene to be added to.
 * @param group 
 * @param radius Specify the radius of the sphere 
 */
const addMeridianAndEquator = (group : THREE.Group = new THREE.Group(), radius = 5) => {
  const meridianMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff }); // Blue color for meridian
  const equatorMaterial = new THREE.LineBasicMaterial({ color: 0x800080 }); // Purple color for equator
  
  const meridianGeometry = new THREE.BufferGeometry();
  const equatorGeometry = new THREE.BufferGeometry();

  // Meridian line
  const meridianVertices = [];
  for (let i = -Math.PI / 2; i <= Math.PI / 2; i += Math.PI / 64) {
    const x = radius * Math.cos(i);
    const y = radius * Math.sin(i);
    meridianVertices.push(x, y, 0);
  }
  meridianGeometry.setAttribute('position', new THREE.Float32BufferAttribute(meridianVertices, 3));

  // Equator line
  const equatorVertices = [];
  for (let i = 0; i <= 2 * Math.PI; i += Math.PI / 64) {
    const x = radius * Math.cos(i);
    const z = radius * Math.sin(i);
    equatorVertices.push(x, 0, z);
  }
  equatorGeometry.setAttribute('position', new THREE.Float32BufferAttribute(equatorVertices, 3));

  const meridianLine = new THREE.Line(meridianGeometry, meridianMaterial);
  const equatorLine = new THREE.Line(equatorGeometry, equatorMaterial);

  group.add(meridianLine);
  group.add(equatorLine);
};

const addWireframe = (group : THREE.Group = new THREE.Group(), geometry : THREE.BufferGeometry, radius = 5) => {
    // Create wireframe for the sphere
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);

    group.add(wireframe);
}

export { getSatelliteNames, getMeshByName, addMeridianAndEquator, addWireframe };
