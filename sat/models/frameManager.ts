import AxesManager from './AxesManager.ts';

export default class frameManager {
  axeMan : AxesManager;
  planet : planet;
  private framesAdded = false; // New flag to check if frames are added

  /**
   * @brief 
   */
  constructor(length : int, planet_ : planet){
    this.axeMan = new AxesManager(length);
    this.planet = planet_;
    this._addPlanetToECEF();
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
   * @brief Rotate the plane by an amount specified 
   */
  rotatePlanet(angle : number){
    this.axeMan.applyFrameRotation(this.planet, angle, 'z', 'ECEF');
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
    return this.axeMan.getFrameByName(frameName);
  }
}
