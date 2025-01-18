import Satellite from "./satellite";
import * as THREE from 'three';
import { satellite_search_params }  from '../interfaces/sat_data_intf'

interface Satellite_Details extends satellite_search_params {
   checked : boolean; 
} 

export default class SatelliteManager {
  
  iss_test_sat : satellite_search_params;
  tracked_satellites : Map<string, Satellite>;
  earthRadius : number;
  scaleFactor : number; 
  altitude : number;
  Celestrak_API_url : string;
  mainScene : THREE.Scene;

  constructor(scene : THREE.Scene) {
    //environment variable for drawing the orbit 
    earthRadius = 5;
    scaleFactor = earthRadius / 6371; // 6371 is the approximate radius of the Earth in km
    altitude = 0.314; // scaled altitude for ISS

    // To simply test 
    iss_test_sat = {name: "ISS", status: "active", norad_cat_id: 25544};
    Celestrak_API_url = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${this.iss_test_sat.norad_cat_id}&FORMAT=TLE`;
    this.mainScene = scene;
  }
 
  public add(sat_name : string) {
    try{ 
      const found_sat = this.tracked_satellites.has(sat_name);
      if (!found_sat) {
        throw "Satellite not found in tracked list, aborting update.";
      }
      
      // '!' added to ensure that the satellite is definitely found
      const selected_sat : Satellite = this.tracked_satellites.get(sat_name)!;
      selected_sat.fetch_TLEs();
      selected_sat.create_3d_models(); 
      selected_sat.init();
      this.show(selected_sat);

    } catch(error) {
      console.error('Error in updating the satellite details:', error);
    }
  }
  

  public remove() {
    
  }

  /**
   * @brief Checks if a sat is being tracked for not 
   */
  public has(sat_name : string) {
    return this.tracked_satellites.has(sat_name);
  } 
  
  /**
   * @brief Hides the satellite by removing the object from the scene 
   */
  public hide(active_sat : Satellite) : void {
  }

  /**
   * @brief Stops rednering the satellite and deletes the position generated positions array
   */
  public show(active_sat : Satellite) : void {
    this.mainScene.add(active_sat.get_orbit());  
    this.mainScene.add(active_sat.get_marker());  
  }
}
