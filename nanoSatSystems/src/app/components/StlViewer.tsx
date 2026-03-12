import { useRef, useState, useCallback, useEffect } from 'react';
import { Upload } from 'lucide-react';

interface StlViewerProps {
  className?: string;
}

export function StlViewer({ className = '' }: StlViewerProps) {
  const [hasModel, setHasModel] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<any>(null);

  // Lazy load Three.js only when needed
  const initializeScene = useCallback(async (geometry: any) => {
    if (!containerRef.current) return;

    // Dynamically import Three.js to avoid loading it until needed
    const THREE = await import('three');
    const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);

    // Camera setup
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 2000);
    camera.position.set(150, 150, 150);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // Model
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 500;

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Store references for cleanup
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      mesh,
      animationId,
      geometry,
      material,
      handleResize,
    };

    setHasModel(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        const { renderer, controls, geometry, material, handleResize, animationId } = sceneRef.current;
        
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
        
        window.removeEventListener('resize', handleResize);
        
        if (controls) controls.dispose();
        if (renderer) {
          renderer.dispose();
          if (containerRef.current?.contains(renderer.domElement)) {
            containerRef.current.removeChild(renderer.domElement);
          }
        }
        if (geometry) geometry.dispose();
        if (material) material.dispose();
        
        sceneRef.current = null;
      }
    };
  }, []);

  const handleFileLoad = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.stl')) {
      alert('Please upload a valid STL file');
      return;
    }

    // Clean up existing scene if any
    if (sceneRef.current) {
      const { renderer, controls, geometry, material, handleResize, animationId } = sceneRef.current;
      
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (controls) controls.dispose();
      if (renderer) {
        renderer.dispose();
        if (containerRef.current?.contains(renderer.domElement)) {
          containerRef.current.removeChild(renderer.domElement);
        }
      }
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      
      sceneRef.current = null;
      setHasModel(false);
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const arrayBuffer = event.target?.result as ArrayBuffer;
      
      // Dynamically import Three.js
      const THREE = await import('three');
      const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
      
      const loader = new STLLoader();
      const loadedGeometry = loader.parse(arrayBuffer);
      
      // Center the geometry
      loadedGeometry.computeBoundingBox();
      const center = new THREE.Vector3();
      loadedGeometry.boundingBox?.getCenter(center);
      loadedGeometry.translate(-center.x, -center.y, -center.z);
      
      // Compute normals for proper lighting
      loadedGeometry.computeVertexNormals();
      
      await initializeScene(loadedGeometry);
    };
    reader.readAsArrayBuffer(file);
  }, [initializeScene]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileLoad(files[0]);
    }
  }, [handleFileLoad]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileLoad(files[0]);
    }
  }, [handleFileLoad]);

  const handleClick = useCallback(() => {
    if (!hasModel) {
      fileInputRef.current?.click();
    }
  }, [hasModel]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".stl"
        onChange={handleFileInput}
        className="hidden"
      />

      <div
        className={`relative w-full h-full rounded-lg overflow-hidden border-2 transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-slate-700 bg-slate-900'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          ref={containerRef}
          className="absolute inset-0"
          style={{ display: hasModel ? 'block' : 'none' }}
        />

        {!hasModel && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer"
            onClick={handleClick}
          >
            <Upload className={`h-16 w-16 mb-4 transition-colors ${
              isDragging ? 'text-blue-500' : 'text-slate-500'
            }`} />
            <p className={`text-lg font-light transition-colors ${
              isDragging ? 'text-blue-400' : 'text-slate-400'
            }`}>
              {isDragging ? 'Drop STL file here' : 'Drag & drop STL file or click to browse'}
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Supports .stl files
            </p>
          </div>
        )}

        {isDragging && (
          <div className="absolute inset-0 bg-blue-500/10 border-4 border-blue-500 border-dashed rounded-lg pointer-events-none" />
        )}

        {hasModel && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-4 right-4 px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-white text-sm rounded-lg transition-colors backdrop-blur-sm border border-slate-600 z-10"
          >
            Load New File
          </button>
        )}
      </div>
    </div>
  );
}
