import * as THREE from 'three';
import * as satLIB from 'satellite.js';
import axios from 'axios';
import { satellite_search_params } from '@/app/engine/interfaces/sat_data_intf';
import { satellite_position_params } from '@/app/engine/interfaces/sat_data_intf';

// TLE Response Interface for the Celestrak API
interface TLE_Response_Celestrak {
  line1: string;
  line2: string;
}

export default class Satellite implements satellite_search_params {
  // Stuff in use
  sat_id: string;
  name: string;
  status: string;
  norad_cat_id: number;

  // Stuff not in use 
  // norad_follow_id: number | null;
  // names: string | null;
  // image: string | null;
  // decayed: Date | null;
  // launched: Date | null;
  // deployed: Date | null;
  // website: string | null;
  // operator: string | null;
  // countries: string | null;
  // telemetries: any[] | null;
  // updated: Date | null;
  // citation: string | null;
  // is_frequency_violator: boolean | null;
  // associated_satellites: any[] | null;

  // Other Stuff used here
  Celestrak_API_url : string;
  ivan_API_url : string;
  ISS_ivan_API_url : string;
  ISS_Celestrak_API_url : string; 

  static earthRadius : number; 
  static scaleFactor : number;
  static altitude : number;
  
  positions : THREE.Vector3[];
  MarkerMesh!: THREE.Mesh;
  orbitLine! : THREE.Line;
  TLE_lines! : TLE_Response_Celestrak; 
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

    //environment variable for drawing the orbit 
    Satellite.earthRadius = 5;
    Satellite.scaleFactor = Satellite.earthRadius / 6371; // 6371 is the approximate radius of the Earth in km
    Satellite.altitude = 0.314; // scaled altitude for ISS

    // To simply test 
    const iss_test_sat = {name: "ISS", status: "active", norad_cat_id: 25544};
    this.ISS_Celestrak_API_url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${iss_test_sat.norad_cat_id}&FORMAT=TLE`;
    this.ISS_ivan_API_url = `https://tle.ivanstanojevic.me/api/tle/${iss_test_sat.norad_cat_id}`;

    this.Celestrak_API_url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${this.norad_cat_id}&FORMAT=TLE`;
    this.ivan_API_url = `https://tle.ivanstanojevic.me/api/tle/${this.norad_cat_id}`;
    this.positions = [];
  }

  updated_parameters() : satellite_position_params | undefined {

    const currentDate = new Date();
    const time = new Date(currentDate.getTime());
    const positionAndVelocity = satLIB.propagate(this.satrec, time);
    const positionEci = positionAndVelocity.position;
    const velocity = positionAndVelocity.velocity;

    if (
      positionEci && typeof positionEci !== 'boolean' &&
      velocity && typeof velocity !== 'boolean'
    ) {
      const gmst = satLIB.gstime(time);
      const positionGd = satLIB.eciToGeodetic(positionEci, gmst);
      const longitude = positionGd.longitude * (180 / Math.PI);
      const latitude = positionGd.latitude * (180 / Math.PI);
      const height =
        (positionGd.height * Satellite.scaleFactor) +
        Satellite.earthRadius +
        Satellite.altitude;

      return {
        velocity: velocity, // now guaranteed to be EciVec3<number>
        latitude: latitude,
        longitude: longitude,
        elevation: positionGd.height,
        last_update_time: time,
      };
    } else {
      console.error('Invalid position or velocity data.');
      // Handle the error scenario appropriately.
    }
  }

  toJSON() {
    return {
      sat_id: this.sat_id,
      norad_cat_id: this.norad_cat_id,
      // norad_follow_id: this.norad_follow_id,
      name: this.name,
      // names: this.names,
      // image: this.image,
      status: this.status,
      // decayed: this.decayed ? this.decayed.toISOString() : null,
      // launched: this.launched.toISOString(),
      // deployed: this.deployed ? this.deployed.toISOString() : null,
      // website: this.website,
      // operator: this.operator,
      // countries: this.countries,
      // telemetries: this.telemetries,
      // updated: this.updated.toISOString(),
      // citation: this.citation,
      // is_frequency_violator: this.is_frequency_violator,
      // associated_satellites: this.associated_satellites,
    };
  }
  
  /**
   * @brief Fetches the TLEs and returns true if the TLE's have been updated.
   */
  public async fetch_TLEs(): Promise<boolean> {
    var to_return = true;
    try {

      const response = await axios.get<TLE_Response_Celestrak>(this.ivan_API_url);
      if(response.data === this.TLE_lines) {  // ERROR HERE (Axios Response <TLE_Response_Celestrak> does not match TLE_Response_Celestrak)
        to_return = false;
      }
      else {
        this.TLE_lines = response.data;
      }
      
      const { line1, line2 } = this._parse_TLE(this.TLE_lines);
     
      console.log('TLE Response:', response.data);
      //console.log('TLE Response:', response.data.line1);
      
      if (!line1 || !line2) {
        throw new Error('Invalid TLE data received');
      }
      
      this.satrec = satLIB.twoline2satrec(line1, line2);
      
      console.log(`Sat Rec for ${this.name}: `, this.satrec);
      
      if (!this.satrec) {
        throw new Error('Failed to parse TLE data');
      }

      return to_return;
    } catch (error) {
      console.error('Error fetching TLE data:', error);
      throw error;
    }
  }
  
  private _parse_TLE(data : any) {
      if(!data.line1 || !data.line2) {

        // Parse `line1` and `line2` if `response.data` is a single string
        const tleLines = data.split('\n').map((line : any) => line.trim());
        const line1 = tleLines[1]; // First TLE line
        const line2 = tleLines[2]; // Second TLE line
        return {line1 : line1, line2: line2};
      } else {
        return {line1 : data.line1, line2: data.line2};
      }
    }

  private _generate_positions(number_of_points : number) {

    console.log(`Satrec in generate positions,`, this.satrec);
    this.positions = [];
    const currentDate = new Date();
    for (let i = 0; i < number_of_points; i++) {
      const time = new Date(currentDate.getTime() + i * 60000);
      const positionAndVelocity = satLIB.propagate(this.satrec, time);
      const positionEci = positionAndVelocity.position;

      if (positionEci && typeof positionEci !== 'boolean') {
        const gmst = satLIB.gstime(time);
        const positionGd = satLIB.eciToGeodetic(positionEci, gmst); // ERROR HERE
        const longitude = positionGd.longitude * (180 / Math.PI);
        const latitude = positionGd.latitude * (180 / Math.PI);
        const height = (positionGd.height * Satellite.scaleFactor) + Satellite.earthRadius + Satellite.altitude; // Scale height

        const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
        const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
        const z = height * Math.sin(latitude * Math.PI / 180);

        this.positions.push(new THREE.Vector3(x, y, z));
      }
    }

   console.log(`Generated Positions for ${this.name}!`);
    
  } 
  
  private _generate_line_object() : void {
    try {
      console.log("Generating line, object!");
      if (!this.positions || this.positions.length === 0) {
        console.warn("Positions array is empty or undefined. No line generated.");
        return;  // Return null instead of throwing an error
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(this.positions);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      this.orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      this.orbitLine.rotation.x = -Math.PI / 2;

      console.log(`Generated line object for ${this.name}`);
      
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
      console.log(`Generated marker object for ${this.name}`);
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
      const positionAndVelocity = satLIB.propagate(this.satrec, time);
      const positionEci = positionAndVelocity.position;

      if (positionEci && typeof positionEci !== 'boolean') {
        const gmst = satLIB.gstime(time);
        const positionGd = satLIB.eciToGeodetic(positionEci, gmst); // ERROR HERE
        const longitude = positionGd.longitude * (180 / Math.PI);
        const latitude = positionGd.latitude * (180 / Math.PI);
        const height = (positionGd.height * Satellite.scaleFactor) + Satellite.earthRadius + Satellite.altitude; // Scale height

        const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
        const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
        const z = height * Math.sin(latitude * Math.PI / 180);
        
        const vector = new THREE.Vector3(x,y,z);
        // To sync with the current frame
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
