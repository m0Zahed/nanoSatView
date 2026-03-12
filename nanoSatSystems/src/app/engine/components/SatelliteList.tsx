import React, { useState, useEffect } from 'react';
import SatelliteManager, { Satellite_Details } from '@/app/engine/models/satelliteManager';
import { Box, Paper, List, ListItem, ListItemText, Button } from '@mui/material';

import * as satLIB from 'satellite.js';
import SatelliteItem from './satelliteItem';

interface SatelliteListProps {
  satelliteManager: SatelliteManager;
}

const SatelliteList: React.FC<SatelliteListProps> = ({ satelliteManager }) => {

  // State to hold tracked satellites
  const [trackedSatellites, setTrackedSatellites] = useState<Map<string, Satellite_Details>>(
    satelliteManager.tracked_satellites
  );

  const [trigger, setTrigger] = useState<boolean>(true);
  
  useEffect(() => {
    satelliteManager.setUpdater(setTrigger);  
  }, []);

  const handleToggleHidden = (satKey: string) => {
    const sat = trackedSatellites.get(satKey);
    if (!sat) return;
    if (sat.hidden) {
      satelliteManager.show(satKey);
      sat.hidden = false;
    } else {
      satelliteManager.hide(satKey);
      sat.hidden = true;
    }
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
        backgroundColor: 'transparent', // Set the background to be fully transparent
      }}
    >
      <Paper
        sx={{
          width: '80%',
          maxHeight: '90%',
          overflowY: 'auto',
          padding: 2,
          color: 'white', // Ensure the text inside is white
          backgroundColor: 'transparent', // Set Paper background to be transparent
          boxShadow: 'none', // Optional: remove shadow if you want it fully transparent
        }}
      >
        <List>
          {Array.from(satelliteManager.tracked_satellites.entries()).map(([key, sat]) => (
            <SatelliteItem 
              satellite={sat} 
              onToggleHidden={handleToggleHidden} 
            />
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default SatelliteList;

