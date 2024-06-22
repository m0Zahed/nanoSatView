import * as THREE from 'three';
import { MeshLine, MeshLineMaterial } from 'three.meshline';

/**
 * @brief This class manages all the axes in the project
 */
export default class AxesManager {
  length: number;
  Rendererframe: THREE.Group;
  ECEFframe: THREE.Group;
  ECIframe: THREE.Group;
  ECEFAngle: number;
  ECIAngle: number;

  /**
   * @brief Construct an AxesManager class, which is
   * responsible for holding all the different coordinate systems
   * associated with the project
   */
  constructor(length: number) {
    this.length = length;
    this.Rendererframe = new THREE.Group();
    this.ECEFframe = new THREE.Group();
    this.ECIframe = new THREE.Group();

    // Initialize all three axes
    this._initializeAxesGroup(this.Rendererframe, 0x0000ff, 0.1); // Blue, line thickness 0.1
    this._initializeAxesGroup(this.ECEFframe, 0x8b4513, 0.1); // Brown, line thickness 0.1
    this._initializeAxesGroup(this.ECIframe, 0xffffff, 0.1, true); // White (dashed), line thickness 0.1

    // Apply initial rotations
    // 90 Degrees to have Z axis pointing up and Y axis to the right plus 23.45 degrees declination
    this.ECEFAngle = (-90 - 23.45) * Math.PI / 180; 
    this.ECIAngle = - Math.PI / 2;
    this.ECEFframe.rotation.x = this.ECEFAngle;
    this.ECIframe.rotation.x = this.ECIAngle;
  }

  /**
   * @brief Helper function to get a frame by name
   */
  getFrameByName(name: string): THREE.Group | null {
    switch (name) {
      case 'Renderer': return this.Rendererframe;
      case 'ECEF': return this.ECEFframe;
      case 'ECI': return this.ECIframe;
      default: return null;
    }
  }
  
  /**
   * @brief Add object to frame 
   */
  addObjectToFrame(object : THREE.Object3D, frameName : 'Renderer' | 'ECEF' | 'ECI'){
    switch (frameName) {
      case 'Renderer':
        this.Rendererframe.add(object); 
        break;
      case 'ECEF':
        this.ECEFframe.add(object); 
        break;
      case 'ECI':
        this.ECIframe.add(object); 
        break;
      default:
        console.log("FrameName not found!");
        break;
    } 
  }  

  /**
   * @brief Retrieves the normalized direction vector of each axis in a specified frame
   */
  getAxisDirection(frameName: string, axis: 'x' | 'y' | 'z'): THREE.Vector3 | null {
    const frame = this.getFrameByName(frameName);
    if (!frame) return null;

    let dir = new THREE.Vector3();
    switch (axis) {
      case 'x': dir = new THREE.Vector3(1, 0, 0); break;
      case 'y': dir = new THREE.Vector3(0, 1, 0); break;
      case 'z': dir = new THREE.Vector3(0, 0, 1); break;
    }

    dir.applyQuaternion(frame.quaternion);
    return dir.normalize();
  }
  
  /**
   * @brief Applies the final transformation to
   * ECEF and ECI frame w.r.t an axis from the frame.
   */
  applyFrameRotation(object: THREE.Object3D, angle : number, rotationAxis: 'x' | 'y' | 'z', frameName: "Renderer" | "ECEF" | "ECI") {
    const axis = this.getAxisDirection(frameName, rotationAxis);
    if (!axis) {
      console.log('Frame not Found!');
      return;
    }
    this._rotateObject(object, axis, angle);
  }

  /**
   * @brief Initializes the axes group with the specified color and style
   */
  private _initializeAxesGroup(frame: THREE.Group, color: number, lineWidth: number, dashed: boolean = false) {
    const createAxis = (dir: THREE.Vector3, color: number, lineWidth: number) => {
      const points = [new THREE.Vector3(0, 0, 0), dir.clone().multiplyScalar(this.length)];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new MeshLineMaterial({ color: color, lineWidth: lineWidth });
      const line = new MeshLine();
      line.setGeometry(geometry);
      return new THREE.Mesh(line.geometry, material);
    };

    const xAxis = createAxis(new THREE.Vector3(1, 0, 0), color, lineWidth);
    const yAxis = createAxis(new THREE.Vector3(0, 1, 0), color, lineWidth);
    const zAxis = createAxis(new THREE.Vector3(0, 0, 1), color, lineWidth);

    frame.add(xAxis);
    frame.add(yAxis);
    frame.add(zAxis);

    this._addLabel(frame, 'X', new THREE.Vector3(this.length, 0, 0));
    this._addLabel(frame, 'Y', new THREE.Vector3(0, this.length, 0));
    this._addLabel(frame, 'Z', new THREE.Vector3(0, 0, this.length));
  }

  /**
   * @brief Rotates an object w.r.t to a normalized direction vector
   */
  private _rotateObject(object: THREE.Object3D, axis: THREE.Vector3, angle: number) {
    const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    object.quaternion.multiplyQuaternions(quaternion, object.quaternion);
  }

  /**
   * @brief Sets color of all the three axes of the coordinate system.
   */
  private _setcolor(axes: string, color: number) {
    const frame = this.getFrameByName(axes);
    if (frame) {
      frame.children.forEach(child => {
        if (child instanceof THREE.Line) {
          (child.material as THREE.LineBasicMaterial).color.set(color);
        }
      });
    }
  }

  /**
   * @brief Adds a label to the end of an axis
   */
  private _addLabel(frame: THREE.Group, text: string, position: THREE.Vector3) {
    const sprite = this._createTextSprite(text);
    sprite.position.copy(position);
    frame.add(sprite);
  }

  /**
   * @brief Creates a text sprite for labeling axes
   */
  private _createTextSprite(text: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = '38px Arial';
    context.fillStyle = 'yellow';
    context.fillText(text, 0, 24);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(1, 0.5, 1); // Scale sprite to the size of the text
    return sprite;
  }
  
  /**
   * @brief Adds a particular Frame to the Scene 
   */
  addFrameToScene(scene : THEE.Scene, frame : 'Renderer' | 'ECEF' | 'ECI')
  {
    console.error("location" , this.getFrameByName(frame));
    scene.add(this.getFrameByName(frame)); 
  }
}

