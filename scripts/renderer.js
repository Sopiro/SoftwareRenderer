import { Vec2, Vec3, Mat4 } from "./math.js";
import { Bitmap } from "./bitmap.js";
import { Vertex } from "./vertex.js";
import * as Resources from "./resources.js";
import * as Util from "./utils.js";
import { Context } from "./context.js";
import { DirectionalLight } from "./light.js";

// Render flags
export const RENDER_CW = 0;
export const RENDER_CCW = 1 << 0;
export const RENDER_BACKGROUND = 1 << 1;
export const RENDER_FACE_NORMAL = 1 << 2;
export const CALC_LIGHT = 1 << 3;
export const RENDER_VERTEX_NORMAL = 1 << 4;
export const RENDER_TANGENT_SPACE = 1 << 5;
export const FLIP_NORMALMAP_Y = 1 << 6;
export const DISABLE_NORMAL_MAPPING = 1 << 7;

const DEBUG_NORMAL_LENGTH = 0.1;

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
            let intensity = 1.1;
            let dir = new Vec3(1.0, 1.0, 0.7).normalized().mul(-1);
            this.sun = new DirectionalLight(intensity, dir);

            this.ambient = 0.25;
            this.specularIntensity = 1000;

            this.transform = new Mat4();
            this.diffuseMap = Resources.textures.sample0;
            this.normalMap = Resources.textures.default_normal;

            // Tangential matrix
            this.tbn = new Mat4();
        }

        this.defaultRenderFlag = RENDER_CW | CALC_LIGHT;
        this.renderFlag = 0;
    }

    clear(clearColor)
    {
        for (let i = 0; i < this.pixels.length; ++i)
        {
            this.pixels[i] = clearColor;
            this.zBuffer[i] = Number.MAX_SAFE_INTEGER;
        }
    }

    // Expect the input vertex to be in the world space
    drawPoint(v)
    {
        v = this.viewTransform(v);

        if (v.pos.z < this.zClipNear) 
        {
            return;
        }

        const sx = Util.int((v.pos.x / v.pos.z * Context.FOV + Context.WIDTH / 2.0));
        const sy = Util.int((v.pos.y / v.pos.z * Context.FOV + Context.HEIGHT / 2.0));

        this.renderPixel(new Vec3(sx, sy, v.pos.z), v.color);
    }

    // Expect the input vertices to be in the world space
    drawLine(v0, v1)
    {
        v0 = this.viewTransform(v0);
        v1 = this.viewTransform(v1);

        // z-Near clipping
        if (v0.pos.z < this.zClipNear && v1.pos.z < this.zClipNear)
        {
            return;
        }

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

        // Transform a vertices in camera space to viewport space at one time (Avoid matrix multiplication)
        // Projection transform + viewport transform
        let p0 = new Vec2(
            v0.pos.x / v0.pos.z * Context.FOV + Context.WIDTH / 2.0 - 0.5,
            v0.pos.y / v0.pos.z * Context.FOV + Context.HEIGHT / 2.0 - 0.5
        );
        let p1 = new Vec2(
            v1.pos.x / v1.pos.z * Context.FOV + Context.WIDTH / 2.0 - 0.5,
            v1.pos.y / v1.pos.z * Context.FOV + Context.HEIGHT / 2.0 - 0.5
        );

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
        if (x1 > Context.WIDTH) x1 = Context.WIDTH;
        if (y0 < 0) y0 = 0;
        if (y1 > Context.HEIGHT) y1 = Context.HEIGHT;

        let dx = p1.x - p0.x;
        let dy = p1.y - p0.y;

        let m = Math.abs(dy / dx);

        if (m <= 1)
        {
            for (let x = x0; x < x1; ++x)
            {
                let per = (x - p0.x) / (p1.x - p0.x);

                let y = p0.y + (p1.y - p0.y) * per;
                let z = 1 / ((1 - per) / v0.pos.z + per / v1.pos.z);

                let c = Util.lerp2AttributeVec3(v0.color, v1.color, (1 - per), per, v0.pos.z, v1.pos.z, z);

                this.renderPixel(new Vec3(Util.int(x), Util.int(y), z), c);
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
            if (x1 > Context.WIDTH) x1 = Context.WIDTH;
            if (y0 < 0) y0 = 0;
            if (y1 > Context.HEIGHT) y1 = Context.HEIGHT;

            for (let y = y0; y < y1; ++y)
            {
                let per = (y - p0.y) / (p1.y - p0.y);

                let x = p0.x + (p1.x - p0.x) * per;
                let z = 1 / ((1 - per) / v0.pos.z + per / v1.pos.z);

                let c = Util.lerp2AttributeVec3(v0.color, v1.color, (1 - per), per, v0.pos.z, v1.pos.z, z);
                this.renderPixel(new Vec3(Util.int(x), Util.int(y), z), c);
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
        if (this.checkFlag(RENDER_CCW))
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

        // Transform vertices from local space to world space
        v0 = this.modelTransform(v0);
        v1 = this.modelTransform(v1);
        v2 = this.modelTransform(v2);

        // Render Face normal
        if (this.checkFlag(RENDER_FACE_NORMAL) && !this.checkFlag(RENDER_TANGENT_SPACE))
        {
            const center = v0.pos.add(v1.pos.add(v2.pos)).div(3.0);
            this.drawLine(new Vertex(center, 0xffffff), new Vertex(center.add(v0.normal.add(v1.normal).add(v2.normal).normalized().mul(DEBUG_NORMAL_LENGTH)), 0xff00ff));
        }

        // Render Vertex normal
        if (this.checkFlag(RENDER_VERTEX_NORMAL))
        {
            const pos = v0.pos;
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.normal.mul(DEBUG_NORMAL_LENGTH)), 0x0000ff));
        }

        // Render Tangent space
        if (this.checkFlag(RENDER_TANGENT_SPACE) && v0.tangent != undefined)
        {
            const pos = v0.pos.add(v1.pos).add(v2.pos).div(3);
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.tangent.mul(DEBUG_NORMAL_LENGTH)), 0xff0000));
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.biTangent.mul(DEBUG_NORMAL_LENGTH)), 0x00ff00));
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.normal.mul(DEBUG_NORMAL_LENGTH)), 0x0000ff));
        }

        v0 = this.viewTransform(v0);
        v1 = this.viewTransform(v1);
        v2 = this.viewTransform(v2);

        // Vertex Shader + Geometry Shader Begin
        {
            if (this.normalMap != undefined)
            {
                // this.tbn = this.tbn.fromAxis(v0.tangent, v0.biTangent, v0.normal.add(v1.normal).add(v2.normal).normalized());
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
            this.drawTriangleViewSpace(v0, v1, v2);
            return;
        }

        const vps = [v0, v1, v2, v0];
        const drawVertices = [];

        for (let i = 0; i < 3; ++i)
        {
            const cv = vps[i];
            const nv = vps[i + 1];

            const cvToNear = cv.pos.z - this.zClipNear;
            const nvToNear = nv.pos.z - this.zClipNear;

            if (cvToNear < 0 && nvToNear < 0) 
            {
                continue;
            }

            // If the edge intersects with z-Near plane
            if (cvToNear * nvToNear < 0)
            {
                const per = (this.zClipNear - cv.pos.z) / (nv.pos.z - cv.pos.z);

                const clippedPos = cv.pos.add(nv.pos.sub(cv.pos).mul(per));
                const clippedCol = cv.color.add(nv.color.sub(cv.color).mul(per));
                const clippedTxC = cv.texCoord.add(nv.texCoord.sub(cv.texCoord).mul(per));

                if (cvToNear > 0) 
                {
                    drawVertices.push(cv);
                }

                drawVertices.push(new Vertex(clippedPos, clippedCol, clippedTxC, cv.normal, cv.tangent, cv.biTangent));
            }
            else
            {
                drawVertices.push(cv);
            }
        }

        switch (drawVertices.length)
        {
            case 3:
                this.drawTriangleViewSpace(drawVertices[0], drawVertices[1], drawVertices[2])
                break;
            case 4:
                this.drawTriangleViewSpace(drawVertices[0], drawVertices[1], drawVertices[2])
                this.drawTriangleViewSpace(drawVertices[0], drawVertices[2], drawVertices[3])
                break;
        }
    }

    // Expect the input vertices to be in the camera space(view space)
    drawTriangleViewSpace(vp0, vp1, vp2)
    {
        const z0 = vp0.pos.z;
        const z1 = vp1.pos.z;
        const z2 = vp2.pos.z;

        // Transform a vertices in camera space to viewport space at one time (Avoid matrix multiplication)
        // Projection transform + viewport transform
        const p0 = new Vec2(
            vp0.pos.x / vp0.pos.z * Context.FOV + Context.WIDTH / 2.0 - 0.5,
            vp0.pos.y / vp0.pos.z * Context.FOV + Context.HEIGHT / 2.0 - 0.5
        );
        const p1 = new Vec2(
            vp1.pos.x / vp1.pos.z * Context.FOV + Context.WIDTH / 2.0 - 0.5,
            vp1.pos.y / vp1.pos.z * Context.FOV + Context.HEIGHT / 2.0 - 0.5
        );
        const p2 = new Vec2(
            vp2.pos.x / vp2.pos.z * Context.FOV + Context.WIDTH / 2.0 - 0.5,
            vp2.pos.y / vp2.pos.z * Context.FOV + Context.HEIGHT / 2.0 - 0.5
        );

        let minX = Math.ceil(Math.min(p0.x, p1.x, p2.x));
        let maxX = Math.ceil(Math.max(p0.x, p1.x, p2.x));
        let minY = Math.ceil(Math.min(p0.y, p1.y, p2.y));
        let maxY = Math.ceil(Math.max(p0.y, p1.y, p2.y));

        if (minX < 0) minX = 0;
        if (minY < 0) minY = 0;
        if (maxX > Context.WIDTH) maxX = Context.WIDTH;
        if (maxY > Context.HEIGHT) maxY = Context.HEIGHT;

        const v10 = new Vec2(p1.x - p0.x, p1.y - p0.y);
        const v21 = new Vec2(p2.x - p1.x, p2.y - p1.y);
        const v02 = new Vec2(p0.x - p2.x, p0.y - p2.y);
        const v20 = new Vec2(p2.x - p0.x, p2.y - p0.y);

        const area = v10.cross(v20);

        // Culling back faces
        if (area < 0)
        {
            return;
        }

        let depthMin = this.checkFlag(RENDER_BACKGROUND) ? 9999 : 0;
        let calcLight = this.checkFlag(CALC_LIGHT);

        for (let y = minY; y < maxY; ++y)
        {
            for (let x = minX; x < maxX; ++x)
            {
                let p = new Vec2(x, y);

                let w0 = v21.cross(p.sub(p1));
                let w1 = v02.cross(p.sub(p2));
                let w2 = v10.cross(p.sub(p0));

                // Render Clock wise
                if (w0 < 0 || w1 < 0 || w2 < 0) 
                {
                    continue;
                }

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

                    let pixelNormal = Util.lerp3AttributeVec3(vp0.normal, vp1.normal, vp2.normal, w0, w1, w2, z0, z1, z2, z);

                    if (this.normalMap != undefined && !this.checkFlag(DISABLE_NORMAL_MAPPING))
                    {
                        // let pixelTangent = Util.lerp3AttributeVec3(vp0.tangent, vp1.tangent, vp2.tangent, w0, w1, w2, z0, z1, z2, z);
                        // let pixelBiTangent = Util.lerp3AttributeVec3(vp0.biTangent, vp1.biTangent, vp2.biTangent, w0, w1, w2, z0, z1, z2, z);

                        // Build orthonormal basis
                        this.tbn = this.tbn.fromAxis(vp0.tangent, vp0.biTangent, pixelNormal);

                        let sampledNormal = Util.sample(this.normalMap, uv.x, uv.y);
                        sampledNormal = Util.convertColorToVectorRange2(sampledNormal).normalized();

                        if (!this.checkFlag(FLIP_NORMALMAP_Y))
                        {
                            sampledNormal.y *= -1;
                        }

                        sampledNormal = this.tbn.mulVector(sampledNormal, 0);
                        pixelNormal = sampledNormal.normalized();
                    }

                    if (this.diffuseMap == undefined)
                    {
                        color = Util.lerp3AttributeVec3(vp0.color, vp1.color, vp2.color, w0, w1, w2, z0, z1, z2, z);
                    }
                    else
                    {
                        color = Util.sample(this.diffuseMap, uv.x, uv.y);
                    }

                    if (calcLight)
                    {
                        const toLight = this.sun.directionVS.mul(-1).normalized();

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

                this.renderPixel(new Vec3(x, y, z + depthMin), color);
            }
        }
    }

    drawMesh(mesh, flag)
    {
        if (flag == undefined)
        {
            this.renderFlag |= RENDER_CCW;
        }
        else
        {
            this.renderFlag = flag;
        }

        for (let i = 0; i < mesh.faces.length; ++i)
        {
            this.drawFace(mesh.faces[i]);
        }

        this.renderFlag = this.defaultRenderFlag;
    }

    // Local space -> World space
    modelTransform(v)
    {
        const newPos = this.transform.mulVector(v.pos, 1.0);
        const newNor = v.normal != undefined ? this.transform.mulVector(v.normal, 0.0).normalized() : undefined;
        const newTan = v.tangent != undefined ? this.transform.mulVector(v.tangent, 0.0).normalized() : undefined;
        const newBiTan = v.biTangent != undefined ? this.transform.mulVector(v.biTangent, 0.0).normalized() : undefined;

        return new Vertex(newPos, v.color, v.texCoord, newNor, newTan, newBiTan);
    }

    // World space -> Cemera space(view space)
    viewTransform(v)
    {
        const newPos = this.camera.cameraTransform.mulVector(new Vec3(v.pos.x, v.pos.y, v.pos.z));
        newPos.z *= -1.0;

        const newNor = v.normal != undefined ? this.camera.cameraTransform.mulVector(v.normal, 0.0).normalized() : undefined;
        const newTan = v.tangent != undefined ? this.camera.cameraTransform.mulVector(v.tangent, 0.0).normalized() : undefined;
        const newBiTan = v.biTangent != undefined ? this.camera.cameraTransform.mulVector(v.biTangent, 0.0).normalized() : undefined;

        return new Vertex(newPos, v.color, v.texCoord, newNor, newTan, newBiTan);
    }

    renderPixel(p, c)
    {
        if (typeof c != "number")
        {
            c = Util.convertVectorToColorHex(c);
        }

        if (p.z >= this.zBuffer[p.x + (Context.HEIGHT - 1 - p.y) * Context.WIDTH])
        {
            return;
        }

        if (p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height)
        {
            return;
        }

        this.pixels[p.x + (Context.HEIGHT - 1 - p.y) * this.width] = c;
        this.zBuffer[p.x + (Context.HEIGHT - 1 - p.y) * this.width] = p.z;
    }

    setMaterial(diffuseMap, normalMap, specularIntensity, normalMapFlipY)
    {
        this.diffuseMap = diffuseMap;
        this.normalMap = normalMap;
        this.specularIntensity = specularIntensity;

        if (normalMapFlipY) 
        {
            this.renderFlag |= FLIP_NORMALMAP_Y;
        }
    }

    checkFlag(flag)
    {
        return (this.renderFlag & flag) == flag;
    }

    toggleFlag(flag)
    {
        if (this.checkFlag(flag))
        {
            this.defaultRenderFlag &= ~flag;
        }
        else
        {
            this.defaultRenderFlag |= flag;
        }
    }
}
