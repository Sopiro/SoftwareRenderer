import { Vec2, Vec3 } from "./math.js";

export class Vertex
{
    constructor(pos, color, texCoord, normal, tangent, biTangent)
    {
        this.pos = pos;

        if (typeof color == "number")
        {
            this.color = new Vec3((color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
        }
        else if (color == undefined)
        {
            this.color = new Vec3(255, 0, 255);
        }
        else
        {
            this.color = color;
        }

        if (texCoord == undefined)
        {
            this.texCoord = new Vec2(0.0, 0.0);
        }
        else
        {
            this.texCoord = texCoord;
        }

        this.normal = normal;
        this.tangent = tangent;
        this.biTangent = biTangent;
    }
}