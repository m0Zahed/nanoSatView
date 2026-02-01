/** 
 *
 *  Engine 
 *
 *  The following contains all the logic to render the planet and then 
 *
 *        White -> x           -> ECI
 *        brown -> y           -> ECEF 
 */

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { addMeridianAndEquator } from '@/app/engine/utils/utils';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import frameManager from '@/app/engine/models/frameManager';
import planet from '@/app/engine/models/planet';
import sunLight from '@/app/engine/models/sunLight';
import satelliteManager from '@/app/engine/models/satelliteManager';
import SatelliteList from './SatelliteList';
import { satellite_search_params } from '@/app/engine/interfaces/sat_data_intf';

/**
 * @brief The engine will take care of all the rendering 
 *        - Globe
 *        - axes
 *        - Rotations
 *        - Orbits
 *        - Satellites
 *
 */

interface EngineProps {
  trackedSatList: satellite_search_params[]; 
  setTrackedSat: (sat: any) => void; 
}

const Engine: React.FC<EngineProps> = ({ trackedSatList , setTrackedSat }) => {

  // Wait for the DOM and Browser window to get initialised.
  // Why? wierd bug happens with initialisation where the renderer is mounted twice,
  // This basically ensures it's only mounted once
  if (typeof document === 'undefined' || typeof window === 'undefined')  
    return <div />;
  
  // -------------------- Initialize THREEJS Variables -----------------------

  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>(new THREE.Scene());
  const rendererRef = useRef<THREE.WebGLRenderer>(new THREE.WebGLRenderer({ antialias: true }));
  const cameraRef = useRef<THREE.PerspectiveCamera>(
    new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  );
  const planetRef = useRef<planet | null>(null);
  const sunLightRef = useRef<sunLight | null>(null);
  const managerRef = useRef<frameManager | null>(null);  
  const satManagerRef = useRef<satelliteManager | null>(null);
  const controlsRef = useRef<any | null>(null);
  const initialisedScene = useRef<boolean>(false);

  // -------------------------- FUNCTIONS ------------------------------------
  
  const initialiseWorld = (length=7) => {
    if(!initialisedScene.current) { 
      planetRef.current = new planet(); 
      sunLightRef.current = new sunLight();
      managerRef.current = new frameManager(length, planetRef.current, sunLightRef.current);
      satManagerRef.current = new satelliteManager(sceneRef.current);

      addMeridianAndEquator(planetRef.current.group);
      managerRef.current.addAllFramesToScene(sceneRef.current);
      initialisedScene.current = true;
    }
  };  

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    managerRef.current?.rotateFrame('ECEF', 0.0001, 'z');

    // Rotations
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    // Update controls
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  };

  // Handle window resize
  const handleResize = () => {
    if (rendererRef.current && cameraRef.current) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      rendererRef.current.setSize(width, height);
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // First-time initialization of all Three.js entities
  const initialiseScene = (mount: HTMLDivElement) => {

    // Initialize renderer
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(rendererRef.current.domElement);

    // Initialize camera
    cameraRef.current.position.z = 15;

    // Initialize controls
    controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement);
    controlsRef.current.enableZoom = true;
  };
  
  /**
   * @brief The following is an update function that will be called when the trackedSatList is updated.
   * The following code syncs the Engine with the sidebar.
   */
  useEffect(() => {
    if(satManagerRef.current) {
      satManagerRef.current.reset_tracked_sat_list();
      trackedSatList?.forEach(satellite => {
         satManagerRef.current?.has(satellite.name) ? 
           satManagerRef.current?.update(satellite.name) 
           : satManagerRef.current?.add(satellite);
      }); 
      satManagerRef.current.clean();
    }
  }, [trackedSatList]) 

  // -------------------------- MAIN ------------------------------------

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
     
    initialiseScene(mount);
    initialiseWorld();
    window.addEventListener('resize', handleResize);
     
    animate();

    // Cleanup function, 
    return () => {
      if (mount && mount.firstChild) {
        mount.removeChild(mount.firstChild);
      }
      rendererRef.current.dispose();
      controlsRef.current?.dispose();
    };
  }, []);

  return <>
    <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />
    {satManagerRef.current ? <SatelliteList satelliteManager={satManagerRef.current} />:  <></>}    
  </>;
};

export default Engine;
