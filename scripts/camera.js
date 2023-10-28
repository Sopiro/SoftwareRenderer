import { Vec3, Mat4 } from "./math.js";

export class Camera
{
    constructor()
    {
        this.pos = new Vec3();
        this.rot = new Vec3(); // Euler rotation
        this.cameraTransform = new Mat4();
    }
}
