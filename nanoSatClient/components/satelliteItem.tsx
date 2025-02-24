import { ListItem, ListItemText, Button } from "@mui/material";
import React, { useState, useEffect } from 'react';
import { satellite_position_params } from '../interfaces/sat_data_intf'
import { Satellite_Details } from "@/models/satelliteManager";

interface SatelliteItemProps {
  satellite: Satellite_Details;
  onToggleHidden: (satName: string) => void;
}

const SatelliteItem: React.FC<SatelliteItemProps> = ({ satellite, onToggleHidden }) => {
  const [hide_show, set_hide_show] = useState<string>("Hide");
  const [positions, set_positions] = useState<satellite_position_params>(satellite.updated_parameters());

  useEffect(() => {
    const intervalId = setInterval(() => {
      set_positions(satellite.updated_parameters());
    }, 1000);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, []);
  
  return (
    <ListItem key={satellite.names} divider>
      <ListItemText
        primary={satellite.names || `Satellite ${satellite.names}`}
        secondary={
          <>
            <div style={{ color: 'white' }}>
              <strong>Velocity:</strong>{" "}
              {positions.velocity !== undefined ? JSON.stringify(positions.velocity) : "N/A"}
              {" "} 
              <strong>Latitude:</strong>{" "}
              {positions.latitude !== undefined ? positions.latitude : "N/A"}

              {" "} 
              <strong>Longitude:</strong>{" "}
              {positions.longitude !== undefined ? positions.longitude : "N/A"}
              {" "} 

              <strong>Elevation:</strong>{" "}
              {positions.elevation !== undefined ? positions.elevation : "N/A"}
              {" "} 

            </div>
          </>
        }
      />

      <Button
        variant="contained"
        onClick={() => { 
          onToggleHidden(satellite.names!)
          hide_show === "Hide" ?
            set_hide_show("Show") : set_hide_show("Hide"); 
        }}
        sx={{
              height: "fit-content",
              backgroundColor: 'transparent', // Transparent background
              color: 'lightgreen', // Green text
              borderColor: 'green', // Optional: if you want a green border
              borderWidth: 1, // Optional: if you want a border around the button
            }}
      >
        {hide_show}
      </Button>
    </ListItem>
  );
};

              //<strong>Last TLE Time:</strong>{" "}
              //{positions.lastTLETime !== undefined ? new Date(positions.last_update_time) : "N/A"}
              //{" "} 
export default SatelliteItem;
