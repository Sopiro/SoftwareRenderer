import { Vector3 } from "./math.js";

export class Face
{
    constructor(v0, v1, v2)
    {
        this.v0 = v0;
        this.v1 = v1;
        this.v2 = v2;
    }

    calcNormal()
    {
        const edge1 = this.v1.pos.sub(this.v0.pos);
        const edge2 = this.v2.pos.sub(this.v0.pos);

        const normal = edge2.cross(edge1).normalized();

        this.v0.normal = normal;
        this.v1.normal = normal;
        this.v2.normal = normal;
    }

    calcTangentAndBiTangent()
    {
        const edge1 = this.v1.pos.sub(this.v0.pos);
        const edge2 = this.v2.pos.sub(this.v0.pos);
        const deltaUV1 = this.v1.texCoord.sub(this.v0.texCoord);
        const deltaUV2 = this.v2.texCoord.sub(this.v0.texCoord);

        const f = 1.0 / (deltaUV1.x * deltaUV2.y - deltaUV2.x * deltaUV1.y);

        let tangent = new Vector3(
            f * (deltaUV2.y * edge1.x - deltaUV1.y * edge2.x),
            f * (deltaUV2.y * edge1.y - deltaUV1.y * edge2.y),
            f * (deltaUV2.y * edge1.z - deltaUV1.y * edge2.z)
        );

        tangent.normalize();

        this.v0.tangent = tangent;
        this.v1.tangent = tangent;
        this.v2.tangent = tangent;

        this.v0.biTangent = this.v0.normal.normalized().cross(this.v0.tangent).normalized();
        this.v1.biTangent = this.v1.normal.normalized().cross(this.v1.tangent).normalized();
        this.v2.biTangent = this.v2.normal.normalized().cross(this.v2.tangent).normalized();
    }
}
