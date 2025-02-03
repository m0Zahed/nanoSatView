import Satellite_ from "./satellite.ts";
import * as THREE from 'three';
import { satellite_search_params }  from '../interfaces/sat_data_intf';

interface Satellite_Details extends Satellite_ {
   checked : boolean; // deletes the satellite 
   hidden : boolean; // hides the sat from viewing
} 

export default class SatelliteManager {
  
  tracked_satellites : Map<string, Satellite_Details>;
  earthRadius : number;
  scaleFactor : number; 
  altitude : number;
  Celestrak_API_url : string;
  mainScene : THREE.Scene;
  setTrigger?: React.Dispatch<React.SetStateAction<boolean>>;


  constructor(scene : THREE.Scene) {
    this.tracked_satellites = new Map<string, Satellite_Details>();
    this.mainScene = scene;
  }

  /**
   * @brief Triggers updates of the satellite list.
   *
   * The updaters functions do the following tasks:
   * 1. For each satellite it calls the a updater function which is defined in the
   * satelliteList component.
   */
  public triggerUpdate() {
    this.setTrigger?.( val => !val); 
  }

  /**
   * @brief Updater set in SatelliteList, triggers reacts whenever value is changed
   */
  public setUpdater(setState: React.Dispatch<React.SetStateAction<Map<string, Satellite_Details>>>) {
    this.setTrigger = setState;
  }

  /**
   * @brief This will be ran before update and add, NECESSARY STEP!
   */
  public reset_tracked_sat_list() {
      this.tracked_satellites?.forEach( (value, key) => {
        value.checked = false; 
      });
  }

  public async add(satelliteData: satellite_search_params) {
    try {
      // Initialize Satellite_Details object using the provided data
      const selected_sat: Satellite_Details = new Satellite_(satelliteData);
      
      // Fetch TLE data based on the NORAD ID
      await selected_sat.fetch_TLEs();
      selected_sat.create_3d_models();
      selected_sat.init();

      // Mark the satellite as tracked
      selected_sat.checked = true;

      // Add to tracked satellites using its NORAD ID as the key
      this.tracked_satellites.set(selected_sat.name, selected_sat);
      console.log("Hooray!");
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
  public async update(sat_name : string) {
    try{ 
       
      // '!' added to ensure that the satellite is definitely found
      const selected_sat : Satellite_ = this.tracked_satellites.get(sat_name)!;
      if(await selected_sat.fetch_TLEs()) {
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

  private _remove(sat_name : string) {
      this.hide(sat_name);
      this.tracked_satellites.delete(sat_name)!;
      console.log(`Removed ${sat_name} permanently!`);
  }
  
  /**
   * @brief Called to remove all unchecked
   */
  public clean() {
    setTimeout(() => {
      this.tracked_satellites?.forEach((sat, sat_Name) => {
        !sat.checked ? this._remove(sat.name) : this.show(sat.name);
      });
      this.triggerUpdate();
      console.log("Cleaned!");
    }, 5000); // 5 seconds in milliseconds
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
  public hide(sat_name : string) : void {
    if(this.has(sat_name)) {
      const active_sat : Satellite_ = this.tracked_satellites.get(sat_name)!;
      this.mainScene.remove(active_sat.get_orbit());  
      this.mainScene.remove(active_sat.get_marker());  
      active_sat.hidden = true;
    }
  }

  /**
   * @brief Stops rednering the satellite and deletes the position generated positions array
   */
  public show(sat_name : string) : void {
    if(this.has(sat_name)) {
      const active_sat : Satellite_ = this.tracked_satellites.get(sat_name)!;
      this.mainScene.add(active_sat.get_orbit());  
      this.mainScene.add(active_sat.get_marker());  
      active_sat.hidden = false;
    }
  }

}
