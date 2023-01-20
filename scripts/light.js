import { Vec3 } from "./math.js";

export class DirectionalLight
{
    constructor()
    {
        this.rotation = new Vec3(0, 0, 0);

        this.intensity = 1.1;
        this.posRelativeToZero = new Vec3(1.0, 1.0, 0.7).normalized();
        this.dirVS = new Vec3(0.0, 0.0, 0.0); // Light direction in the view space
        this.color = 0xffffff;
    }
}