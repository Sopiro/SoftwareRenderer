import { Vector2 } from "./vec2.js";
import { Vector3 } from "./vec3.js";

export class Vertex
{
    constructor(pos, color, texCoord, normal, tangent, biTangent)
    {
        this.pos = pos;

        if (typeof color == "number") this.color = new Vector3((color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
        else if (color == undefined) this.color = new Vector3(255, 0, 255);
        else this.color = color;

        if (texCoord == undefined) this.texCoord = new Vector2(0, 0);
        else this.texCoord = texCoord;

        this.normal = normal;
        this.tangent = tangent;
        this.biTangent = biTangent;
    }
}