import { Face } from "./face.js";
import { Vec2, Vec3 } from "./math.js";
import { Vertex } from "./vertex.js";

export class Mesh
{
    constructor(positions, texCoords, normals, indices)
    {
        this.positions = positions;
        this.texCoords = texCoords;
        this.normals = normals;
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
        return new Vec3(this.positions[pos][0], this.positions[pos][1], this.positions[pos][2]);
    }

    getTexCoord(tex)
    {
        return new Vec2(this.texCoords[tex][0], this.texCoords[tex][1]);
    }

    getNormal(nor)
    {
        return new Vec3(this.normals[nor][0], this.normals[nor][1], this.normals[nor][2]);
    }
}
