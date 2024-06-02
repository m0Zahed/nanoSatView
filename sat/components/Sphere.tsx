import React, { useRef, useEffect } from 'react';
import globe from "../assets/earthmap.png";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const Sphere: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Set up the scene, camera, and renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });

    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // Create a sphere
    const geometry = new THREE.SphereGeometry(5, 36, 36);

    // Initialize material
    let material = new THREE.MeshBasicMaterial();
    let sphere = new THREE.Mesh();
    // Log the globe variable to check its value
    console.log('globe:', globe);

    // Load the stereographic projection texture
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(globe.src, (texture) => {
      material = new THREE.MeshBasicMaterial({ map: texture });
      sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
    }, undefined, (error) => {
      console.error('An error occurred loading the texture:', error);
      // Fallback material in case of error
      material = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
      sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);
    });

    camera.position.z = 15;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      // sphere.rotation.x += 0.01;
      sphere.rotation.y += 0.01;
      renderer.render(scene, camera);
    };

    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    animate();

    // Cleanup function
    return () => {
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} />;
};

export default Sphere;
