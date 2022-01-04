import { Vector3 } from "./math.js";

export class DirectionalLight
{
    constructor()
    {
        this.rotation = 0;
        this.intensity = 1.2;
        this.posRelativeToZero = new Vector3(1, 0.5, 0.3).normalized();
        this.dirVS = new Vector3();
    }
}