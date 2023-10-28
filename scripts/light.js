import { Vec3 } from "./math.js";

export class DirectionalLight
{
    constructor(intensity, direction)
    {
        this.intensity = intensity;
        this.direction = direction;

        this.rotation = new Vec3(0); // Euler rotation
        this.directionVS = new Vec3(); // Light direction in the view space
    }
}