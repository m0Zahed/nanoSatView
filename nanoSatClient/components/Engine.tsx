/** 
 *
 *  Engine 
 *
 *  The following contains all the logic to render the planet and then 
 *
 *  The Orientation of the axes is as follows. Because the 
 *        White -> x           -> ECI
 *        brown -> y           -> ECEF 
 */

import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { addMeridianAndEquator } from '../utils/utils';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import axios from 'axios';
import * as satellite from 'satellite.js';
import frameManager from '@/models/frameManager.ts';
import planet from '@/models/planet.ts';
import sunLight from '@/models/sunLight';

const Engine: React.FC = () => {

  // Wait for the DOM and Browser window to get initialised.
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
  const controlsRef = useRef<OrbitControls | null>(null);
  const initialisedScene = useRef<boolean>(false);
  // -------------------------- FUNCTIONS ------------------------------------
  
  const initialiseWorld = (length=7) => {
    if(!initialisedScene.current) { 
      planetRef.current = new planet(); 
      sunLightRef.current = new sunLight();
      managerRef.current = new frameManager(length, planetRef.current, sunLightRef.current);
      addMeridianAndEquator(planetRef.current.group);
      managerRef.current.addAllFramesToScene(sceneRef.current);
      initialisedScene.current = true;
    }
  };  

  // Animation loop
  const animate = () => {
    requestAnimationFrame(animate);

    managerRef.current.rotateFrame('ECEF', 0.0001, 'z');

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

  // Propagate the orbit of the ISS and then plot it.
  const propagateISSOrbit = async () => {
    try {
      const response = await axios.get('https://api.wheretheiss.at/v1/satellites/25544/tles');
      console.log('TLE Response:', response.data);
      const { line1, line2 } = response.data;

      const satrec = satellite.twoline2satrec(line1, line2);
      const positions = [];
      const earthRadius = 5;
      const scaleFactor = earthRadius / 6371; // 6371 is the approximate radius of the Earth in km
      const altitude = 0.314; // scaled altitude for ISS

      const currentDate = new Date();
      for (let i = 0; i < 1400; i++) {
        const time = new Date(currentDate.getTime() + i * 60000);
        const positionAndVelocity = satellite.propagate(satrec, time);
        const positionEci = positionAndVelocity.position;

        if (positionEci) {
          const gmst = satellite.gstime(time);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          const longitude = positionGd.longitude * (180 / Math.PI);
          const latitude = positionGd.latitude * (180 / Math.PI);
          const height = (positionGd.height * scaleFactor) + earthRadius + altitude; // Scale height

          const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
          const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
          const z = height * Math.sin(latitude * Math.PI / 180);

          positions.push(new THREE.Vector3(x, y, z));
        }
      }

      const orbitGeometry = new THREE.BufferGeometry().setFromPoints(positions);
      const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
      const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
      orbitLine.rotation.x = - Math.PI / 2;
      sceneRef.current.add(orbitLine);


      const issGeometry = new THREE.SphereGeometry(0.1, 32, 32);
      const issMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const issMesh = new THREE.Mesh(issGeometry, issMaterial);
      sceneRef.current.add(issMesh);

      const updateISSPosition = () => {
        const time = new Date();
        const positionAndVelocity = satellite.propagate(satrec, time);
        const positionEci = positionAndVelocity.position;

        if (positionEci) {
          const gmst = satellite.gstime(time);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);
          const longitude = positionGd.longitude * (180 / Math.PI);
          const latitude = positionGd.latitude * (180 / Math.PI);
          const height = (positionGd.height * scaleFactor) + earthRadius + altitude; // Scale height

          const x = height * Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);
          const y = height * Math.cos(latitude * Math.PI / 180) * Math.sin(longitude * Math.PI / 180);
          const z = height * Math.sin(latitude * Math.PI / 180);
          
          const vector = new THREE.Vector3(x,y,z);
          vector.applyAxisAngle(new THREE.Vector3(1,0,0), - Math.PI / 2);
          issMesh.position.set(vector.x, vector.y, vector.z);
        }
      };

      setInterval(updateISSPosition, 1000);
    } catch (error) {
      console.error('Error fetching TLE data:', error);
    }
  };
  // -------------------------- MAIN ------------------------------------

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
     
    initialiseScene(mount);
    initialiseWorld();
    window.addEventListener('resize', handleResize);

    // propagateISSOrbit();
    animate();
    // propagateISSOrbit();

    // Cleanup function
    return () => {
      if (mount && mount.firstChild) {
        mount.removeChild(mount.firstChild);
      }
      rendererRef.current.dispose();
      controlsRef.current?.dispose();
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default Engine;
