/**
 * This file will be used for defining interfaces for transferring satellite data 
 */

import { EciVec3 } from "satellite.js";

/**
 * The following interface defines the information that the typesense shall return 
 * The norad_id can be used to query for satellite TLEs using CleStrak, 
 *
 * 
 */
export interface satellite_search_params {
  name: string;
  status: string;
  norad_cat_id: number;
}


/***
 * Interface between satellite object and the 
 */
export interface satellite_position_params {
  velocity: EciVec3<number>;
  latitude: number;
  longitude: number;
  elevation: number;
  last_update_time: any;
}


