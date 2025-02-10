import { ListItem, ListItemText, Button } from "@mui/material";
import React, { useState, useEffect } from 'react';

interface SatelliteItemProps {
  satellite: Satellite_Details;
  onToggleHidden: (satName: string) => void;
}

const SatelliteItem: React.FC<SatelliteItemProps> = ({ satellite, onToggleHidden }) => {
  const [hide_show, set_hide_show] = useState<string>("Hide");
   
  return (
    <ListItem key={satellite.name} divider>
      <ListItemText
        primary={satellite.name || `Satellite ${satellite.name}`}
        secondary={
          <>
            <div style={{ color: 'white' }}>
              <strong>Velocity:</strong>{" "}
              {satellite.velocity !== undefined ? satellite.velocity.toFixed(2) : "N/A"}
              {" "} 
              <strong>Latitude:</strong>{" "}
              {satellite.lat !== undefined ? satellite.lat.toFixed(2) : "N/A"}

              {" "} 
              <strong>Longitude:</strong>{" "}
              {satellite.longitude !== undefined ? satellite.longitude.toFixed(2) : "N/A"}
              {" "} 

              <strong>Elevation:</strong>{" "}
              {satellite.elevation !== undefined ? satellite.elevation.toFixed(2) : "N/A"}
              {" "} 

              <strong>Last TLE Time:</strong>{" "}
              {satellite.lastTLETime ? new Date(satellite.lastTLETime).toLocaleString() : "N/A"}
              {" "} 
            </div>
          </>
        }
      />
      <Button
        variant="contained"
        onClick={() => { 
          onToggleHidden(satellite.name)
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

export default SatelliteItem;
