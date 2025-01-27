/**
 * This file will be used for defining interfaces for transferring satellite data 
 */

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

