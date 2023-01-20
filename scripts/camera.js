import { Vec3, Mat4 } from "./math.js";

export class Camera
{
    constructor()
    {
        this.pos = new Vec3(0.0, 0.0, 0.0);
        this.rot = new Vec3(0.0, 0.0, 0.0);
        this.cameraTransform = new Mat4();
    }
}
