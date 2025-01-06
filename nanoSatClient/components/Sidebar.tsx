import React, { useState } from 'react';
import { Drawer, IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchAutocomplete from './SearchAutoComplete';
import SidebarSnippet from './SidebarSnippet';
import Satellite from '@/models/satellite';
import { satellite_search_params } from '../interfaces/sat_data_intf'

/**
 * @brief the Sidebar component will be used to search for NanoSats and Sats alike. 
 *
 * @p Once the search is complete it will add to currently tracked sattelites. 
 *    This has no close button and instead the user will have to click in the area outside the right bar.    
 */
interface SidebarProps {
  isVisible: boolean;
  toggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ trackedSatList, setTrackedSat, isVisible, toggle }) => {
  
  /**
   * @brief Add non-duplicate values to the tracked satellite array `trackedSat`
   */
  const addTrackedSatellites = (selectedSat : satellite_search_params) => {

    setTrackedSat(prevTrackedSat => {
      // If satellite is not present add it to the trackedSatList
      if (!prevTrackedSat.some(sat => sat.name === satName)) {
        return [...prevTrackedSat, selectedSat];
      }

      console.log(`Satellite ${satName} is already being tracked.`);
      return prevTrackedSat;

    });
  };

  const removeTrackedSatellite = (satName: string) => {
    setTrackedSat(prevTrackedSat => {

      const existingSat = prevTrackedSat.some(sat => sat.name === satName);

      if (existingSat) {
        // Remove the satellite if it already exists
        return prevTrackedSat.filter(sat => sat.name !== satName);
      }

      return prevTrackedSat;
    });
  }

  return (
    <Drawer
      anchor="right"
      open={isVisible}
      onClose={toggle}
      PaperProps={{
        sx: {
          width: '500px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          color: 'white',
          borderLeft: '2px dashed white',
        },
      }}
    >
      <Box sx={{ padding: '20px' }}>
        <IconButton 
          onClick={toggle} 
          sx={{ 
            color: 'white', 
            position: 'absolute', 
            top: '10px', 
            right: '20px', 
            width: '40px', 
            height: '40px', 
            backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
            borderRadius: '50%', // To make it a circle
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.7)', // Darker background on hover
            }
          }}
        >
          <CloseIcon />
        </IconButton>
          
        <SearchAutocomplete addSatellite={addTrackedSatellites} />

        <Typography variant="h5" sx={{ pt : '10px'}}>
          Tracking Satellites  
        </Typography>

        {trackedSatList.length ? 
          trackedSatList.map( (satellite) => (
            <SidebarSnippet SatName={satellite.name} Status={satellite.status} removeSat={removeTrackedSatellite} />)) : 
            <SidebarSnippet SatName="N/A" Status="Add Satellites to Track" removeSat={()=>(console.log("Cannot remove empty Satellite!"))}/>}
      
      </Box>
    </Drawer>
  );
};

export default Sidebar;
