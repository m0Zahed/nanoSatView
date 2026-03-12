import * as THREE from 'three';

export default class sunLight {
  private lights : THREE.DirectionalLight; 

  constructor(){
    // Light
    this.lights = new THREE.DirectionalLight(0xFFFFFF);
    this.lights.position.set(10, 0, 0);
  }

  addToScene(scene  : THREE.Scene){
    scene.add(this.lights);
  }

  get() : THREE.DirectionalLight {
    return this.lights;
  }
}
