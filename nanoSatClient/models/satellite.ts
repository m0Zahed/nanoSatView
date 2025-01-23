import * as THREE from 'three';
import * as satellite from 'satellite.js';
import axios from 'axios';

// TLE Response Interface for the Celestrak API
interface TLE_Response_Celestrak {
  line1: string;
  line2: string;
}

export default class Satellite {
  // Stuff in use
  sat_id: string;
  norad_cat_id: number;
  name: string;
  status: string;

  // Stuff not in use 
  norad_follow_id: number | null;
  names: string | null;
  image: string | null;
  decayed: Date | null;
  launched: Date | null;
  deployed: Date | null;
  website: string | null;
  operator: string | null;
  countries: string | null;
  telemetries: any[] | null;
  updated: Date | null;
  citation: string | null;
  is_frequency_violator: boolean | null;
  associated_satellites: any[] | null;

  // Other Stuff used here
  Celestrak_API_url : string;

  static earthRadius : number; 
  static scaleFactor : number;
  static altitude : number;
  
  positions : THREE.Vector3[];
  MarkerMesh : THREE.Mesh;
  orbitLine : THREE.Line;
  TLE_lines : TLE_Response_Celestrak; 
  satrec : any; 

  /**
   * The following constructor is for the specifications defined
   * in v0.1 of nanoSatView
   */
  constructor(data: any) {
    this.sat_id = data.sat_id;
    this.norad_cat_id = data.norad_cat_id;
    this.name = data.name;
    this.status = data.status;
    this.Celestrak_API_url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${this.norad_cat_id}&FORMAT=TLE`;
    this.positions = [];
  }

  toJSON() {
    return {
      sat_id: this.sat_id,
      norad_cat_id: this.norad_cat_id,
      norad_follow_id: this.norad_follow_id,
      name: this.name,
      names: this.names,
      image: this.image,
      status: this.status,
      decayed: this.decayed ? this.decayed.toISOString() : null,
      launched: this.launched.toISOString(),
      deployed: this.deployed ? this.deployed.toISOString() : null,
      website: this.website,
      operator: this.operator,
      countries: this.countries,
      telemetries: this.telemetries,
      updated: this.updated.toISOString(),
      citation: this.citation,
      is_frequency_violator: this.is_frequency_violator,
      associated_satellites: this.associated_satellites,
    };
  }
  
  /**
   * @brief Fetches the TLEs and returns true if the TLE's have been updated.
   */
  public async fetch_TLEs(): Promise<boolean> {
    const to_return = true;
    try {

      const response = await axios.get<TLE_Response_Celestrak>(this.Celestrak_API_url);
      if(response === this.TLE_lines) {
        to_return = false;
      }
      else {
        this.TLE_lines = response;
      }
      
      const { line1, line2 } = this.TLE_lines;
     
      console.log('TLE Response:', response.data);
      
      if (!line1 || !line2) {
        throw new Error('Invalid TLE data received');
      }
      
      this.satrec = satellite.twoline2satrec(line1, line2);
      
      if (!this.satrec) {
        throw new Error('Failed to parse TLE data');
      }

      return to_return;
    } catch (error) {
      console.error('Error fetching TLE data:', error);
      throw error;
    }
  }

  private _generate_positions(number_of_points : number) {

    this.positions = [];
    const currentDate = new Date();
    for (let i = 0; i < number_of_points; i++) {
      const time = new Date(currentDate.getTime() + i * 60000);
      const positionAndVelocity = satellite.propagate(this.satrec, time);
      const positionEci = positionAndVelocity.position;

      if (positionEci) {
        const gmst = satellite.gstime(time);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);
        const longitude = positionGd.longitude * (180 / Math.PI);
        const latitude = positionGd.latitude * (180 / Math.PI);
        const height = (positionGd.height * this.scaleFactor) + this.earthRadius + this,altitude; // Scale height

        const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
        const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
        const z = height * Math.sin(latitude * Math.PI / 180);

        this.positions.push(new THREE.Vector3(x, y, z));
      }
    }
  } 
  
  private _generate_line_object() : void {
    try {
      if (!this.positions || this.positions.length === 0) {
        console.warn("Positions array is empty or undefined. No line generated.");
        return null;  // Return null instead of throwing an error
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(this.positions);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      this.orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      this.orbitLine.rotation.x = -Math.PI / 2;

    } catch (error) {
      console.error("Error generating line object:", error);
    }
  }
  
  /**
   * TODO: Create several more functions to select different 3D objects
   * for the marker.
   */
  private _generate_marker() : void { 
    try {
      const MarkerGeometry = new THREE.SphereGeometry(0.1, 32, 32);
      const MarkerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      this.MarkerMesh = new THREE.Mesh(MarkerGeometry, MarkerMaterial);
    } catch (error) {
      console.error("Error generating line object:", error);
    }

  }
  
  /**
   * @brief Generates the orbit line and position marker
  * @see You can modify the number of positions you'd like to 
  */
  public create_3d_models() : void {
    // Generates a specified number of points 
    this._generate_positions(1400); 

    // Generates the orbit 
    this._generate_line_object()

    // Generates the position market
    this._generate_marker()
  }
  
  /**
   * @ Initializes the marker on the orbit 
   */
  public init() {
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
        this.MarkerMesh.position.set(vector.x, vector.y, vector.z);
      }
  }
  
  /**
   * @returns the orbit object
   */
  public get_orbit() : THREE.Object3D {
    return this.orbitLine;
  }

  /**
   * @returns the marker object
   */
  public get_marker() : THREE.Object3D {
    return this.MarkerMesh;
  }
  
}
  //
  // // TODO This is simply a test function. Generalize this function to be able to plot any satellites TLE
  // // Propagate the orbit of the ISS and then plot it.
  // public async propagateISSOrbit() {
  //   try {
  //     const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544/tles');
  //     console.log('TLE Response:', response.data);
  //     const { line1, line2 } = response.data;
  //
  //     const satrec = satellite.twoline2satrec(line1, line2);
  //     const positions = [];
  //     const earthRadius = 5;
  //     const scaleFactor = earthRadius / 6371; // 6371 is the approximate radius of the Earth in km
  //     const altitude = 0.314; // scaled altitude for ISS
  //
  //     const currentDate = new Date();
  //     for (let i = 0; i < 1400; i++) {
  //       const time = new Date(currentDate.getTime() + i * 60000);
  //       const positionAndVelocity = satellite.propagate(satrec, time);
  //       const positionEci = positionAndVelocity.position;
  //
  //       if (positionEci) {
  //         const gmst = satellite.gstime(time);
  //         const positionGd = satellite.eciToGeodetic(positionEci, gmst);
  //         const longitude = positionGd.longitude * (180 / Math.PI);
  //         const latitude = positionGd.latitude * (180 / Math.PI);
  //         const height = (positionGd.height * scaleFactor) + earthRadius + altitude; // Scale height
  //
  //         const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
  //         const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
  //         const z = height * Math.sin(latitude * Math.PI / 180);
  //
  //         positions.push(new THREE.Vector3(x, y, z));
  //       }
  //     }
  //
  //     const orbitGeometry = new THREE.BufferGeometry().setFromPoints(positions);
  //     const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
  //     const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
  //     orbitLine.rotation.x = - Math.PI / 2;
  //     sceneRef.current.add(orbitLine);
  //
  //
  //     const issGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  //     const issMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  //     const issMesh = new THREE.Mesh(issGeometry, issMaterial);
  //     sceneRef.current.add(issMesh);
  //
  //     const updateISSPosition = () => {
  //       const time = new Date();
  //       const positionAndVelocity = satellite.propagate(satrec, time);
  //       const positionEci = positionAndVelocity.position;
  //
  //       if (positionEci) {
  //         const gmst = satellite.gstime(time);
  //         const positionGd = satellite.eciToGeodetic(positionEci, gmst);
  //         const longitude = positionGd.longitude * (180 / Math.PI);
  //         const latitude = positionGd.latitude * (180 / Math.PI);
  //         const height = (positionGd.height * scaleFactor) + earthRadius + altitude; // Scale height
  //
  //         const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
  //         const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
  //         const z = height * Math.sin(latitude * Math.PI / 180);
  //         
  //         const vector = new THREE.Vector3(x,y,z);
  //         vector.applyAxisAngle(new THREE.Vector3(1,0,0), - Math.PI / 2);
  //         issMesh.position.set(vector.x, vector.y, vector.z);
  //       }
  //     };
  //
  //     setInterval(updateISSPosition, 1000);
  //   } catch (error) {
  //     console.error('Error fetching TLE data:', error);
  //   }
  // };
