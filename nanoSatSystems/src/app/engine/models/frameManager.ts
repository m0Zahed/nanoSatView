import AxesManager from './AxesManager';
import * as THREE from 'three';
import planet from './planet';
import sunLight from './sunLight';

export default class frameManager {
  private axeMan : AxesManager;
  private framesAdded = false; // New flag to check if frames are added
  planet : planet;
  sunLight : sunLight;

  /**
   * @brief Constructor adds an Axes Manager and Planet Object, frameManager manages all operation related to frames
   *        This includes,
   *        - Adding objects to frames
   *        - Rendering the ECi and ECEF frames 
   */
  constructor(length : number, planet_ : planet, sunLight_ : sunLight){
    this.axeMan = new AxesManager(length);
    this.planet = planet_;
    this.sunLight = sunLight_;
    this._addPlanetToECEF();
    this._addSunLightToECI();
  }

  /**
   * @brief Adds sunlight to the ECI 
   */
  private _addSunLightToECI(){
    this.axeMan.addObjectToFrame(this.sunLight.get(), 'ECI');
  } 

  /**
   * @brief Applies frame rotation and adds planet to ECEF Group 
   */
  private _addPlanetToECEF(){
    this.axeMan.applyFrameRotation(this.planet.group, Math.PI/2, 'x', 'Renderer');
    this.axeMan.addObjectToFrame(this.planet.group, 'ECEF');
  } 
  
  /**
   * @brief adds all frames to the scene
   */
  addAllFramesToScene(scene : THREE.Scene){
    if(!this.framesAdded) { 
      this.axeMan.addFrameToScene(scene, 'ECEF');
      this.axeMan.addFrameToScene(scene, 'ECI');
      this.framesAdded = true;
    }
  }

  /**
   * @brief rotate w.r.t an axis in a particular frame. 
   */
  rotate(group : THREE.Group, angle : number, axis : 'x' | 'y' | 'z', frameName : 'ECEF' | 'ECI') {
    this.axeMan.applyFrameRotation(group, angle, axis, frameName);
  }
  
  /**
   *@brief Allows for rotating a frame 
   */
  rotateFrame(frameName : 'Renderer' | 'ECEF' | 'ECI', angle : number, axis : 'x' | 'y' | 'z') {
    this.axeMan.applyFrameRotation(this.getFrameByName(frameName), angle, axis, frameName);
  }
  
  /**
   * @brief returns a frame by name
   */
  getFrameByName(frameName : "Renderer" | "ECEF" | "ECI") : THREE.Object3D
  {
    return this.axeMan.getFrameByName(frameName)!;
  }
}
