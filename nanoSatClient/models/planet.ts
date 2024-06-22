import * as THREE from 'three';
import lat_long_coord from "../assets/Equirectangular_projection_SW.png";
import nightTime from "../assets/nightime.jpg";
import nightTime1 from "../assets/nightime2.jpg";
import globe1 from "../assets/NE2_50M_SR_W.png";
import clouds from "../assets/clouds_wiki_4k.png";

export default class Planet {
  private sphereRef: THREE.Mesh | null = null;
  private coordRef: THREE.Mesh | null = null;
  private cloudRef: THREE.Mesh | null = null;
  private textureLoaderRef: THREE.TextureLoader = new THREE.TextureLoader();
  private loadedTexture: boolean = false;
  private radius : int;
  group: THREE.Group = new THREE.Group();

  constructor(radius = 5) {
    this.initialiseTexture(radius);
  }

  private loadTexture(src: string): THREE.Texture {
    const texture = this.textureLoaderRef.load(src);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.minFilter = THREE.LinearMipMapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  private initialiseTexture(radius) {
    const coordmesh = new THREE.MeshStandardMaterial({ map: this.loadTexture(globe1.src) });
    const earthMesh = new THREE.MeshBasicMaterial({
      opacity: 0.57,
      map: this.loadTexture(nightTime1.src),
      blending: THREE.AdditiveBlending
    });
    const cloudMesh = new THREE.MeshStandardMaterial({
      map: this.loadTexture(clouds.src),
      transparent: true,
      opacity: 0.2
    });
    const geometry = new THREE.SphereGeometry(5, 36, 36);

    this.sphereRef = new THREE.Mesh(geometry, earthMesh);
    this.sphereRef.name = 'cloudRef';
    this.cloudRef = new THREE.Mesh(geometry, cloudMesh);
    this.cloudRef.name = 'cloudRef';
    this.cloudRef.scale.setScalar(1.01);
    this.coordRef = new THREE.Mesh(geometry, coordmesh);
    this.coordRef.name = 'cloudRef';

<<<<<<< HEAD
=======
    // Light
    const lights = new THREE.DirectionalLight(0xFFFFFF);
    lights.position.set(10, 0, 0);

>>>>>>> 243907303ae2eb4f9e7b2d85bde2e5e0ec9762f0
    // Create a Group Reference
    this.group.add(this.sphereRef);
    this.group.add(this.coordRef);
    this.group.add(this.cloudRef);
<<<<<<< HEAD
=======
    this.group.add(lights);
>>>>>>> 243907303ae2eb4f9e7b2d85bde2e5e0ec9762f0

    this.loadedTexture = true;

  }
}
