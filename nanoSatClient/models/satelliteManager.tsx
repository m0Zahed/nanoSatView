import Satellite_ from "./satellite.ts";
import * as THREE from 'three';
import { satellite_search_params }  from '../interfaces/sat_data_intf'
import { Box, Paper, List, ListItem, ListItemText, Button } from '@mui/material';

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

  constructor(scene : THREE.Scene) {
    this.tracked_satellites = new Map();
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

  public async add(satelliteData: satellite_search_params) {
    try {
      // Initialize Satellite_Details object using the provided data
      const selected_sat: Satellite_Details = new Satellite_(satelliteData);
      
      // Fetch TLE data based on the NORAD ID
      await selected_sat.fetch_TLEs();
      selected_sat.create_3d_models();
      selected_sat.init();
      this.show(selected_sat);

      // Mark the satellite as tracked
      selected_sat.checked = true;
      selected_sat.hidden = false;

      // Add to tracked satellites using its NORAD ID as the key
      this.tracked_satellites.set(selected_sat.norad_cat_id.toString(), selected_sat);
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
      const selected_sat : Satellite = this.tracked_satellites.get(sat_name)!;
      if(await selected_sat.fetch_TLEs()) {
        this.hide(selected_sat.name);
        selected_sat.create_3d_models(); 
        selected_sat.init();
        this.show(selected_sat);
        selected_sat.checked = true;
        this.tracked_satellites[sat_name] = selected_sat;
        this.show(selected_sat.name);
      } else {
       console.log("The TLE's have no updates.");
      }
    } catch(error) {
      console.error('Error in updating the satellite details:', error);
    }
  }

  private _remove(sat_name : string) {
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
  public hide(sat_name : string) : void {
    if(this.has(sat_name)) {
      const active_sat : Satellite = this.tracked_satellites.get(sat_name)!;
      this.mainScene.remove(active_sat.get_orbit());  
      this.mainScene.remove(active_sat.get_marker());  
    }
  }

  /**
   * @brief Stops rednering the satellite and deletes the position generated positions array
   */
  public show(sat_name : string) : void {
    if(this.has(sat_name)) {
      const active_sat : Satellite = this.tracked_satellites.get(sat_name)!;
      this.mainScene.add(active_sat.get_orbit());  
      this.mainScene.add(active_sat.get_marker());  
    }
  }

  /**
   * Returns a JSX element that displays the list of satellites.
   */
  public ret_sat_list(): JSX.Element {
    const handleToggleHidden = (satKey: string) => {
      const sat = this.tracked_satellites.get(satKey);
      if (!sat) return;
      if (sat.hidden) {
        this.show(satKey);
        sat.hidden = false;
      } else {
        this.hide(satKey);
        sat.hidden = true;
      }
      // Note: You might need to trigger a re-render in your React component
      // to reflect the changes if they are not updating automatically.
    };

    return (
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100vw',
          height: '33vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        }}
      >
        <Paper sx={{ width: '80%', maxHeight: '90%', overflowY: 'auto', padding: 2 }}>
          <List>
            {Array.from(this.tracked_satellites.entries()).map(([key, sat]) => (
              <ListItem key={key} divider>
                <ListItemText
                  primary={sat.name || `Satellite ${key}`}
                  secondary={
                    <>
                      <div>
                        <strong>Velocity:</strong>{' '}
                        {sat.velocity !== undefined ? sat.velocity.toFixed(2) : 'N/A'}
                      </div>
                      <div>
                        <strong>Latitude:</strong>{' '}
                        {sat.lat !== undefined ? sat.lat.toFixed(2) : 'N/A'}
                      </div>
                      <div>
                        <strong>Longitude:</strong>{' '}
                        {sat.longitude !== undefined ? sat.longitude.toFixed(2) : 'N/A'}
                      </div>
                      <div>
                        <strong>Elevation:</strong>{' '}
                        {sat.elevation !== undefined ? sat.elevation.toFixed(2) : 'N/A'}
                      </div>
                      <div>
                        <strong>Last TLE Time:</strong>{' '}
                        {sat.lastTLETime ? new Date(sat.lastTLETime).toLocaleString() : 'N/A'}
                      </div>
                    </>
                  }
                />
                <Button
                  variant="contained"
                  onClick={() => handleToggleHidden(key)}
                  sx={{ height: 'fit-content' }}
                >
                  {sat.hidden ? 'Show' : 'Hide'}
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  }

}
