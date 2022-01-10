import { Vector2, Vector3, Matrix4 } from "./math.js";
import { Bitmap } from "./bitmap.js";
import { Vertex } from "./vertex.js";
import * as Resources from "./resources.js";
import * as Util from "./utils.js";
import { Constants } from "./constants.js";
import { DirectionalLight } from "./light.js";

// Render flags
export const RENDER_CW = 0;
export const RENDER_CCW = 1;
export const SET_Z_9999 = 2;
export const RENDER_FACE_NORMAL = 4;
export const CALC_LIGHT = 8;
export const RENDER_VERTEX_NORMAL = 16;
export const RENDER_TANGENT_SPACE = 32;
export const FLIP_NORMALMAP_Y = 64;
export const DISABLE_NORMAL_MAPPING = 128;

const NORMAL_LENGTH = 0.1;

export class Renderer extends Bitmap
{
    constructor(width, height, camera)
    {
        super(width, height);
        this.camera = camera;

        this.zClipNear = 0.2;
        this.zBuffer = new Float32Array(width * height);

        // Shader variables
        {
            this.sun = new DirectionalLight();

            this.ambient = 0.25;
            this.specularIntensity = 1000;

            this.transform = new Matrix4();
            this.difuseMap = Resources.textures.sample0;
            this.normalMap = Resources.textures.default_normal;

            // Tangent matrix
            this.tbn = new Matrix4();
        }

        this.defaultRenderFlag = RENDER_CW | CALC_LIGHT;
        this.renderFlag = 0;
    }

    clear(clearColor)
    {
        for (let i = 0; i < this.pixels.length; i++)
        {
            this.pixels[i] = clearColor;
            this.zBuffer[i] = 100000;
        }
    }

    drawPoint(v)
    {
        v = this.cameraTransform(v);

        if (v.pos.z < this.zClipNear) return;

        const sx = Util.int((v.pos.x / v.pos.z * Constants.FOV + Constants.WIDTH / 2.0));
        const sy = Util.int((v.pos.y / v.pos.z * Constants.FOV + Constants.HEIGHT / 2.0));

        this.renderPixel(new Vector3(sx, sy, v.pos.z), v.color);
    }

    drawLine(v0, v1)
    {
        v0 = this.cameraTransform(v0);
        v1 = this.cameraTransform(v1);

        // z-Near clipping
        if (v0.pos.z < this.zClipNear && v1.pos.z < this.zClipNear) return;

        if (v0.pos.z < this.zClipNear)
        {
            let per = (this.zClipNear - v0.pos.z) / (v1.pos.z - v0.pos.z);
            v0.pos = v0.pos.add(v1.pos.sub(v0.pos).mul(per));
            v0.color = Util.lerpVector2(v0.color, v1.color, per);
        }

        if (v1.pos.z < this.zClipNear)
        {
            let per = (this.zClipNear - v1.pos.z) / (v0.pos.z - v1.pos.z);
            v1.pos = v1.pos.add(v0.pos.sub(v1.pos).mul(per));
            v1.color = Util.lerpVector2(v1.color, v0.color, per);
        }

        // Transform a vertices in camera space to viewport space at one time (Avoid heavy matrix multiplication)
        // Projection transform + viewport transform
        let p0 = new Vector2(v0.pos.x / v0.pos.z * Constants.FOV + Constants.WIDTH / 2.0 - 0.5, v0.pos.y / v0.pos.z * Constants.FOV + Constants.HEIGHT / 2.0 - 0.5);
        let p1 = new Vector2(v1.pos.x / v1.pos.z * Constants.FOV + Constants.WIDTH / 2.0 - 0.5, v1.pos.y / v1.pos.z * Constants.FOV + Constants.HEIGHT / 2.0 - 0.5);

        // Render left to right
        if (p1.x < p0.x)
        {
            let tmp = p0;
            p0 = p1;
            p1 = tmp;

            tmp = v0;
            v0 = v1;
            v1 = tmp;
        }

        let x0 = Math.ceil(p0.x);
        let y0 = Math.ceil(p0.y);
        let x1 = Math.ceil(p1.x);
        let y1 = Math.ceil(p1.y);

        if (x0 < 0) x0 = 0;
        if (x1 > Constants.WIDTH) x1 = Constants.WIDTH;
        if (y0 < 0) y0 = 0;
        if (y1 > Constants.HEIGHT) y1 = Constants.HEIGHT;

        let dx = p1.x - p0.x;
        let dy = p1.y - p0.y;

        let m = Math.abs(dy / dx);

        if (m <= 1)
        {
            for (let x = x0; x < x1; x++)
            {
                let per = (x - p0.x) / (p1.x - p0.x);

                let y = p0.y + (p1.y - p0.y) * per;
                let z = 1 / ((1 - per) / v0.pos.z + per / v1.pos.z);

                let c = Util.lerp2AttributeVec3(v0.color, v1.color, (1 - per), per, v0.pos.z, v1.pos.z, z);

                this.renderPixel(new Vector3(Util.int(x), Util.int(y), z), c);
            }
        }
        else
        {
            if (p1.y < p0.y)
            {
                let tmp = p0;
                p0 = p1;
                p1 = tmp;

                tmp = v0;
                v0 = v1;
                v1 = tmp;
            }

            x0 = Math.ceil(p0.x);
            y0 = Math.ceil(p0.y);
            x1 = Math.ceil(p1.x);
            y1 = Math.ceil(p1.y);

            if (x0 < 0) x0 = 0;
            if (x1 > Constants.WIDTH) x1 = Constants.WIDTH;
            if (y0 < 0) y0 = 0;
            if (y1 > Constants.HEIGHT) y1 = Constants.HEIGHT;

            for (let y = y0; y < y1; y++)
            {
                let per = (y - p0.y) / (p1.y - p0.y);

                let x = p0.x + (p1.x - p0.x) * per;
                let z = 1 / ((1 - per) / v0.pos.z + per / v1.pos.z);

                let c = Util.lerp2AttributeVec3(v0.color, v1.color, (1 - per), per, v0.pos.z, v1.pos.z, z);
                this.renderPixel(new Vector3(Util.int(x), Util.int(y), z), c);
            }
        }
    }

    drawFace(f)
    {
        this.drawTriangle(f.v0, f.v1, f.v2);
    }

    // Expect the input vertices to be in the local space
    drawTriangle(v0, v1, v2)
    {
        // Render CCW
        if ((this.renderFlag & RENDER_CCW) == RENDER_CCW)
        {
            const tmp = v0;
            v0 = v1;
            v1 = tmp;
        }

        if (v0.normal == undefined || v1.normal == undefined || v2.normal == undefined)
        {
            const normal = v2.pos.sub(v0.pos).cross(v1.pos.sub(v0.pos)).normalized();
            v0.normal = normal;
            v1.normal = normal;
            v2.normal = normal;
        }

        v0 = this.modelTransform(v0);
        v1 = this.modelTransform(v1);
        v2 = this.modelTransform(v2);

        // Render Face normal
        if ((this.renderFlag & RENDER_FACE_NORMAL) == RENDER_FACE_NORMAL && (this.renderFlag & RENDER_TANGENT_SPACE) != RENDER_TANGENT_SPACE)
        {
            const center = v0.pos.add(v1.pos.add(v2.pos)).div(3.0);
            this.drawLine(new Vertex(center, 0xffffff), new Vertex(center.add(v0.normal.add(v1.normal).add(v2.normal).normalized().mul(NORMAL_LENGTH)), 0xff00ff));
        }

        // Render Vertex normal
        if ((this.renderFlag & RENDER_VERTEX_NORMAL) == RENDER_VERTEX_NORMAL)
        {
            const pos = v0.pos;
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.normal.mul(NORMAL_LENGTH)), 0x0000ff));
        }

        // Render Tangent space
        if ((this.renderFlag & RENDER_TANGENT_SPACE) == RENDER_TANGENT_SPACE && v0.tangent != undefined)
        {
            const pos = v0.pos.add(v1.pos).add(v2.pos).div(3);
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.tangent.mul(NORMAL_LENGTH)), 0xff0000));
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.biTangent.mul(NORMAL_LENGTH)), 0x00ff00));
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.normal.mul(NORMAL_LENGTH)), 0x0000ff));
        }

        v0 = this.cameraTransform(v0);
        v1 = this.cameraTransform(v1);
        v2 = this.cameraTransform(v2);

        // Vertex Shader + Geometry Shader Begin
        {
            if (this.normalMap != undefined)
            {
                this.tbn = this.tbn.fromAxis(v0.tangent, v0.biTangent, v0.normal.add(v1.normal).add(v2.normal).normalized());
            }
        }
        // Vertex Shader + Geometry Shader End

        // z-Near clipping for triangle (my own algorithm used)
        if (v0.pos.z < this.zClipNear && v1.pos.z < this.zClipNear && v2.pos.z < this.zClipNear)
        {
            return;
        }
        else if (v0.pos.z > this.zClipNear && v1.pos.z > this.zClipNear && v2.pos.z > this.zClipNear)
        {
            this.drawTriangleVS(v0, v1, v2);
            return;
        }

        const vps = [v0, v1, v2, v0];
        const drawVertices = [];

        for (let i = 0; i < 3; i++)
        {
            const cv = vps[i];
            const nv = vps[i + 1];

            const cvToNear = cv.pos.z - this.zClipNear;
            const nvToNear = nv.pos.z - this.zClipNear;

            if (cvToNear < 0 && nvToNear < 0) continue;

            // If the edge intersects with z-Near plane
            if (cvToNear * nvToNear < 0)
            {
                const per = (this.zClipNear - cv.pos.z) / (nv.pos.z - cv.pos.z);

                const clippedPos = cv.pos.add(nv.pos.sub(cv.pos).mul(per));
                const clippedCol = cv.color.add(nv.color.sub(cv.color).mul(per));
                const clippedTxC = cv.texCoord.add(nv.texCoord.sub(cv.texCoord).mul(per));

                if (cvToNear > 0) drawVertices.push(cv);
                drawVertices.push(new Vertex(clippedPos, clippedCol, clippedTxC, cv.normal));
            }
            else
            {
                drawVertices.push(cv);
            }
        }

        switch (drawVertices.length)
        {
            case 3:
                this.drawTriangleVS(drawVertices[0], drawVertices[1], drawVertices[2])
                break;
            case 4:
                this.drawTriangleVS(drawVertices[0], drawVertices[1], drawVertices[2])
                this.drawTriangleVS(drawVertices[0], drawVertices[2], drawVertices[3])
                break;
        }
    }

    // Expect the input vertices to be in the camera space(view space)
    drawTriangleVS(vp0, vp1, vp2)
    {
        const z0 = vp0.pos.z;
        const z1 = vp1.pos.z;
        const z2 = vp2.pos.z;

        // Transform a vertices in camera space to viewport space at one time (Avoid heavy matrix multiplication)
        // Projection transform + viewport transform
        const p0 = new Vector2(vp0.pos.x / vp0.pos.z * Constants.FOV + Constants.WIDTH / 2.0 - 0.5, vp0.pos.y / vp0.pos.z * Constants.FOV + Constants.HEIGHT / 2.0 - 0.5);
        const p1 = new Vector2(vp1.pos.x / vp1.pos.z * Constants.FOV + Constants.WIDTH / 2.0 - 0.5, vp1.pos.y / vp1.pos.z * Constants.FOV + Constants.HEIGHT / 2.0 - 0.5);
        const p2 = new Vector2(vp2.pos.x / vp2.pos.z * Constants.FOV + Constants.WIDTH / 2.0 - 0.5, vp2.pos.y / vp2.pos.z * Constants.FOV + Constants.HEIGHT / 2.0 - 0.5);

        let minX = Math.ceil(Math.min(p0.x, p1.x, p2.x));
        let maxX = Math.ceil(Math.max(p0.x, p1.x, p2.x));
        let minY = Math.ceil(Math.min(p0.y, p1.y, p2.y));
        let maxY = Math.ceil(Math.max(p0.y, p1.y, p2.y));

        if (minX < 0) minX = 0;
        if (minY < 0) minY = 0;
        if (maxX > Constants.WIDTH) maxX = Constants.WIDTH;
        if (maxY > Constants.HEIGHT) maxY = Constants.HEIGHT;

        const v10 = new Vector2(p1.x - p0.x, p1.y - p0.y);
        const v21 = new Vector2(p2.x - p1.x, p2.y - p1.y);
        const v02 = new Vector2(p0.x - p2.x, p0.y - p2.y);
        const v20 = new Vector2(p2.x - p0.x, p2.y - p0.y);

        const area = v10.cross(v20);

        // Culling back faces
        if (area < 0) return;

        let depthMin = (this.renderFlag & SET_Z_9999) == SET_Z_9999 ? 9999 : 0;
        let calcLight = (this.renderFlag & CALC_LIGHT) == CALC_LIGHT ? true : false;

        for (let y = minY; y < maxY; y++)
        {
            for (let x = minX; x < maxX; x++)
            {
                let p = new Vector2(x, y);

                let w0 = v21.cross(p.sub(p1));
                let w1 = v02.cross(p.sub(p2));
                let w2 = v10.cross(p.sub(p0));

                // Render Clock wise
                if (w0 < 0 || w1 < 0 || w2 < 0) continue;

                w0 /= area;
                w1 /= area;
                w2 /= area;

                // Z value of current fragment(pixel)
                const z = 1.0 / (w0 / z0 + w1 / z1 + w2 / z2);
                let color = 0;

                // Fragment(Pixel) Shader Begin
                {
                    const uv = Util.lerp3AttributeVec2(vp0.texCoord, vp1.texCoord, vp2.texCoord, w0, w1, w2, z0, z1, z2, z);
                    const pixelPos = vp0.pos.mul(w0).add(vp1.pos.mul(w1)).add(vp2.pos.mul(w2)).mulXYZ(1, 1, -1);
                    // let c = Util.lerp3AttributeVec3(v0.color, v1.color, v2.color, w0, w1, w2, z0, z1, z2, z);

                    let pixelNormal = undefined;
                    if (this.normalMap != undefined && (this.renderFlag & DISABLE_NORMAL_MAPPING) != DISABLE_NORMAL_MAPPING)
                    {
                        let sampledNormal = Util.sample(this.normalMap, uv.x, uv.y);
                        sampledNormal = Util.convertColorToVectorRange2(sampledNormal).normalized();

                        if ((this.renderFlag & FLIP_NORMALMAP_Y) != FLIP_NORMALMAP_Y)
                            sampledNormal.y *= -1;

                        sampledNormal = this.tbn.mulVector(sampledNormal, 0);
                        pixelNormal = sampledNormal.normalized();
                    }
                    else
                    {
                        pixelNormal = Util.lerp3AttributeVec3(vp0.normal, vp1.normal, vp2.normal, w0, w1, w2, z0, z1, z2, z);
                    }

                    if (this.difuseMap == undefined)
                        color = Util.lerp3AttributeVec3(vp0.color, vp1.color, vp2.color, w0, w1, w2, z0, z1, z2, z);
                    else
                        color = Util.sample(this.difuseMap, uv.x, uv.y);

                    if (calcLight)
                    {
                        const toLight = this.sun.dirVS.mul(-1).normalized();

                        let diffuse = toLight.dot(pixelNormal) * this.sun.intensity;
                        diffuse = Util.clamp(diffuse, this.ambient, 1.0);

                        let specular = 0;

                        // Phong specular reflection
                        if (this.specularIntensity != undefined)
                        {
                            const toView = pixelPos.mul(-1).normalized();

                            let reflection = pixelNormal.mul(2 * toLight.dot(pixelNormal)).sub(toLight).normalized();
                            specular = Math.pow(Math.max(0, toView.dot(reflection)), this.specularIntensity);
                        }

                        color = Util.mulColor(color, diffuse + specular);
                    }
                }
                // Fragment(Pixel) Shader End

                this.renderPixel(new Vector3(x, y, z + depthMin), color);
            }
        }
    }

    drawModel(model, flag)
    {
        if (flag == undefined)
            this.renderFlag |= RENDER_CCW;
        else
            this.renderFlag = flag;

        for (let i = 0; i < model.faces.length; i++)
            this.drawFace(model.faces[i]);

        this.renderFlag = this.defaultRenderFlag;
    }

    // Local space -> World space
    modelTransform(v)
    {
        const newPos = this.transform.mulVector(v.pos, 1);
        const newNor = v.normal != undefined ? this.transform.mulVector(v.normal, 0).normalized() : undefined;
        const newTan = v.tangent != undefined ? this.transform.mulVector(v.tangent, 0).normalized() : undefined;
        const newBiTan = v.biTangent != undefined ? this.transform.mulVector(v.biTangent, 0).normalized() : undefined;

        return new Vertex(newPos, v.color, v.texCoord, newNor, newTan, newBiTan);
    }

    // World space -> Cemera space(view space)
    cameraTransform(v)
    {
        const newPos = this.camera.cameraTransform.mulVector(new Vector3(v.pos.x, v.pos.y, v.pos.z));
        newPos.z *= -1;

        const newNor = v.normal != undefined ? this.camera.cameraTransform.mulVector(v.normal, 0).normalized() : undefined;
        const newTan = v.tangent != undefined ? this.camera.cameraTransform.mulVector(v.tangent, 0).normalized() : undefined;
        const newBiTan = v.biTangent != undefined ? this.camera.cameraTransform.mulVector(v.biTangent, 0).normalized() : undefined;

        return new Vertex(newPos, v.color, v.texCoord, newNor, newTan, newBiTan);
    }

    renderPixel(p, c)
    {
        if (typeof c != "number") c = Util.convertVectorToColorHex(c);

        if (p.z >= this.zBuffer[p.x + (Constants.HEIGHT - 1 - p.y) * Constants.WIDTH]) return;
        if (p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height) return;

        this.pixels[p.x + (Constants.HEIGHT - 1 - p.y) * this.width] = c;
        this.zBuffer[p.x + (Constants.HEIGHT - 1 - p.y) * this.width] = p.z;
    }

    setMaterial(diffuseMap, normalMap, specularIntensity, normalMapFlipY)
    {
        this.difuseMap = diffuseMap;
        this.normalMap = normalMap;
        this.specularIntensity = specularIntensity;

        if (normalMapFlipY) this.renderFlag |= FLIP_NORMALMAP_Y;
    }

    toggleRenderFlag(flag)
    {
        this.defaultRenderFlag = ((this.defaultRenderFlag & flag) == flag) ? this.defaultRenderFlag ^ flag : this.defaultRenderFlag | flag;
    }
}
