import { Vector3, Matrix4 } from "./math.js";

export class Camera
{
    constructor()
    {
        this.pos = new Vector3(0.0, 0.0, 0.0);
        this.rot = new Vector3(0.0, 0.0, 0.0);
        this.cameraTransform = new Matrix4();
    }
}
