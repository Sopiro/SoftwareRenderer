import { Face } from "./face.js";
import { Vec2, Vec3 } from "./math.js";
import { Vertex } from "./vertex.js";

export class Mesh
{
    constructor(positions, texCoords, normals, indices)
    {
        this.faces = [];

        for (let i = 0; i < indices.length; ++i)
        {
            let vFace = indices[i];

            let vertices = [];
            for (let v = 0; v < 3; v++)
            {
                const p = vFace[v][0] - 1;
                const t = vFace[v][1] - 1;
                const n = vFace[v][2] - 1;

                const pos = new Vec3(positions[p][0], positions[p][1], positions[p][2]);
                const tex = new Vec2(texCoords[t][0], texCoords[t][1]);
                const nor = new Vec3(normals[n][0], normals[n][1], normals[n][2]);

                vertices.push(new Vertex(pos, 0xffffff, tex, nor));
            }

            let face = new Face(vertices[0], vertices[1], vertices[2]);
            face.calcTangentAndBiTangent();

            this.faces.push(face);
        }
    }
}
