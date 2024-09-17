import {  Autocomplete,  AutocompleteSection,  AutocompleteItem} from "@nextui-org/autocomplete";
import React,{ useEffect, useRef } from "react";
import { getSatelliteNames } from "@/utils/utils";

const AutocompleteSearchBar  : React.FC = () => {
  const satListRef = useRef<{name : string}[] | null>(getSatelliteNames());
  
  useEffect( () => {
      // satListRef.current = getSatelliteNames();
  },[]);


  return (
   <div className="flex w-full flex-wrap md:flex-nowrap gap-4 px-4">
    <Autocomplete 
      label="Select satellite from SatelliteJS" 
      className="max-w-xs" 
    >
      { satListRef.current.map((sat : {name : string}) => (
        <AutocompleteItem key={sat.name} value={sat.name}>
          {sat.name}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  </div> 
  );
}

export default AutocompleteSearchBar;