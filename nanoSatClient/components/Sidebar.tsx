import React, { useState } from 'react';
import { Drawer, IconButton, Typography, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SearchAutocomplete from './SearchAutoComplete';
import SidebarSnippet from './SidebarSnippet';
import Satellite from '@/models/satellite';

interface SidebarProps {
  isVisible: boolean;
  toggle: () => void;
}

interface TrackedSat {
  name: string;
  status: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isVisible, toggle }) => {
  const [trackedSat, setTrackedSat] = useState<TrackedSat[]>([]);
  
  /**
   * @brief Add non-duplicate values to the tracked satellite array `trackedSat`
    */
  const addTrackedSatellites = (satName: string, status: string) => {
    setTrackedSat(prevTrackedSat => {
      if (!prevTrackedSat.some(sat => sat.name === satName)) {
        return [...prevTrackedSat, { name: satName, status: status }];
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

        {trackedSat.length ? 
          trackedSat.map( (satellite) => (
            <SidebarSnippet SatName={satellite.name} Status={satellite.status} removeSat={removeTrackedSatellite} />)) : 
            <SidebarSnippet SatName="N/A" Status="Add Satellites to Track" removeSat={()=>(console.log("Cannot remove empty Satellite!"))}/>}
      
      </Box>
    </Drawer>
  );
};

export default Sidebar;
