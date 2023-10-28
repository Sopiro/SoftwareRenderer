import { Face } from "./face.js";
import { Vec2, Vec3 } from "./math.js";
import { Vertex } from "./vertex.js";

export class Model
{
    constructor(vPositions, vTexCoords, vNormals, indices)
    {
        this.vPositions = vPositions;
        this.vTexCoords = vTexCoords;
        this.vNormals = vNormals;
        this.indices = indices;
        this.faces = [];

        for (let i = 0; i < this.indices.length; ++i)
        {
            let vFace = this.indices[i];

            let face = [];
            for (let v = 0; v < 3; v++)
            {
                const pos = this.getPosition(vFace[v][0] - 1);
                const tex = this.getTexCoord(vFace[v][1] - 1);
                const nor = this.getNormal(vFace[v][2] - 1);
                face.push(new Vertex(pos, 0xffffff, tex, nor));
            }

            face = new Face(face[0], face[1], face[2]);
            face.calcTangentAndBiTangent();

            this.faces.push(face);
        }
    }

    getPosition(pos)
    {
        return new Vec3(this.vPositions[pos][0], this.vPositions[pos][1], this.vPositions[pos][2]);
    }

    getTexCoord(tex)
    {
        return new Vec2(this.vTexCoords[tex][0], this.vTexCoords[tex][1]);
    }

    getNormal(nor)
    {
        return new Vec3(this.vNormals[nor][0], this.vNormals[nor][1], this.vNormals[nor][2]);
    }
}
