import Satellite_ from "./satellite.ts";
import * as THREE from 'three';
import { satellite_search_params }  from '../interfaces/sat_data_intf'

interface Satellite_Details extends Satellite_ {
   checked : boolean; 
} 

export default class SatelliteManager {
  
  tracked_satellites : Map<string, Satellite_Details>;
  earthRadius : number;
  scaleFactor : number; 
  altitude : number;
  Celestrak_API_url : string;
  mainScene : THREE.Scene;

  constructor(scene : THREE.Scene) {
    this.mainScene = scene;
  }
  
  /**
   * @brief This will be ran before update and add, NECESSARY STEP!
   */
  public reset_tracked_sat_list() {
      this.tracked_satellites?.forEach( (value, key) => {
        value.checked = false; 
      });
  }

  public add(satelliteData: satellite_search_params) {
    try {
      // Initialize Satellite_Details object using the provided data
      const selected_sat: Satellite_Details = new Satellite_(satelliteData) as Satellite_Details;

      // Fetch TLE data based on the NORAD ID
      selected_sat.fetch_TLEs();
      selected_sat.create_3d_models();
      selected_sat.init();
      this.show(selected_sat);

      // Mark the satellite as tracked
      selected_sat.checked = true;

      // Add to tracked satellites using its NORAD ID as the key
      this.tracked_satellites.set(selected_sat.norad_cat_id.toString(), selected_sat);
    } catch (error) {
      console.error(
        `Error adding satellite with NORAD ID ${satelliteData.norad_cat_id}:`,
        error
      );
    }
  }

  /**
   * @brief supposed to re
   */
  public update(sat_name : string) {
    try{ 
      
      // '!' added to ensure that the satellite is definitely found
      const selected_sat : Satellite = this.tracked_satellites.get(sat_name)!;
      if(selected_sat.fetch_TLEs()) {
        selected_sat.create_3d_models(); 
        selected_sat.init();
        this.show(selected_sat);
        selected_sat.checked = true;
        this.tracked_satellites[sat_name] = selected_sat;

      } else {
       console.log("The TLE's have no updates.");
      }
    } catch(error) {
      console.error('Error in updating the satellite details:', error);
    }
  }

  private _remove(sat_nmae  : string) {
      Satellite = this.tracked_satellites.delete(sat_name)!;
  }
  
  /**
   * @brief Called to remove all unchecked
   */
  public clean() {
    this.tracked_satellites?.forEach((key, value) => {
      if(!value.checked)
      {
        this.tracked_satellites.delete(key);
      }
    });
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
    this.mainScene.remove(active_sat.get_orbit());  
    this.mainScene.remove(active_sat.get_marker());  
  }

  /**
   * @brief Stops rednering the satellite and deletes the position generated positions array
   */
  public show(active_sat : Satellite) : void {
    this.mainScene.add(active_sat.get_orbit());  
    this.mainScene.add(active_sat.get_marker());  
  }
}
