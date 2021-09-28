'use strict'

import { Vector2 } from "./vec2.js";
import { Vector3 } from "./vec3.js";
import { Matrix4 } from "./mat4.js";
import { Face } from "./face.js";
import { Player } from "./player.js";
import { Bitmap } from "./bitmap.js";
import { Vertex } from "./vertex.js";
import { Random } from "./random.js";
import { Model } from "./model.js";
import
{
    addColor,
    clamp,
    clipColorVector,
    convertBitmapToImageData,
    convertColor2VectorRange1,
    convertColor2VectorRange2,
    convertColor2VectorRange255,
    convertImageDataToBitmap,
    convertVector2ColorHex,
    createTransformMatrix,
    int,
    lerp,
    lerp2AttributeVec3,
    lerp3AttributeVec2,
    lerp3AttributeVec3,
    lerpVector2,
    lerpVector3,
    mulColor
} from "./utils.js";
import * as Resources from "./resources.js";

let WIDTH = 800;
let HEIGHT = WIDTH / 4 * 3;

let SCALE_INDEX = 2;
let SCALES = [1, 2, 4, 5, 8, 10, 20];
let SCALE = SCALES[SCALE_INDEX];
let FOV = HEIGHT / SCALE;

let resBtns = [];
let pspBtns = [];

const resourceReady = Object.keys(Resources.textures).length + Object.keys(Resources.models).length;
let loadedResources = 0;

class View extends Bitmap
{
    constructor(width, height, player)
    {
        super(width, height);
        this.player = player;

        this.zClipNear = 0.2;
        this.zBuffer = new Float32Array(width * height);
        this.sunIntensity = 1.2;
        this.sunPosRelativeToZero = new Vector3(1, 0.5, 0.3).normalized();
        this.ambient = 0.2;
        this.specularIntensity = 1000;

        this.transform = new Matrix4();
        this.difuseMap = Resources.textures.sample0;
        this.normalMap = Resources.textures.default_normal;

        this.tbn = new Matrix4();

        this.gaussianBlurKernel = [
            1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
            2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0,
            1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
        ];

        this.sharpenKernel = [
            0.0, -1.0, 0.0,
            -1.0, 5.0, -1.0,
            0.0, -1.0, 0.0,
        ];

        this.edgeKernel = [
            -1.0, -1.0, -1.0,
            -1.0, 8.0, -1.0,
            -1.0, -1.0, -1.0,
        ];

        this.backFaceCulling = false;

        this.RENDER_CW = 0;
        this.RENDER_CCW = 1;
        this.SET_Z_9999 = 2;
        this.RENDER_FACE_NORMAL = 4;
        this.EFFECT_NO_LIGHT = 8;
        this.RENDER_VERTEX_NORMAL = 16;
        this.RENDER_TANGENT_SPACE = 32;
        this.FLIP_NORMALMAP_Y = 64;

        this.renderFlag = 0;
        this.time = 0;
    }

    update(delta)
    {
        let matrix = new Matrix4().rotate(0, delta * 1.5, 0);

        this.sunPosRelativeToZero = matrix.mulVector(this.sunPosRelativeToZero, 0).normalized();
        this.sunDir = this.sunPosRelativeToZero.mul(-1);
        this.sunDirVS = this.player.cameraTransform.mulVector(this.sunDir, 0);

        this.time += delta;
        // console.log(this.playerTransform(new Vertex(new Vector3(0, 0, 0))).pos);
    }

    renderView()
    {
        // this.clear(0xff00ff);

        for (let i = 0; i < this.zBuffer.length; i++)
            this.zBuffer[i] = 100000;

        this.renderScene();
    }

    renderScene()
    {
        const r = new Random(123);

        const s = 30.0;

        this.renderFlag = 0;
        for (let i = 0; i < 100; i++)
        {
            if (i % 2 == 0) this.setTexture(Resources.textures.pepe, Resources.textures.brick_normal);
            else this.setTexture(Resources.textures.dulri, Resources.textures.stone2_normal);

            const pos = new Vector3(r.nextFloat() * s - s / 2.0, r.nextFloat() * s - s / 2.0, r.nextFloat() * s - s / 2.0);
            const rot = new Vector3(this.time / 5 * (i % 3), this.time / 10.0 * (i % 5), this.time / 5 * (i % 7));
            const scale = new Vector3(0.5);
            this.transform = createTransformMatrix(pos, rot, scale);

            this.drawModel(Resources.models.cube);
        }

        // this.drawTriangle(new Vertex(new Vector3(0, 0, -1), 0xfffffff, new Vector2(0, 1)),
        //  new Vertex(new Vector3(0, 0, -2), 0xfffffff, new Vector2(0, 0)),
        //   new Vertex(new Vector3(1, 0, -2), 0xfffffff, new Vector2(1, 0)), Resources.textures.container);

        // this.drawPoint(new Vertex(new Vector3(0, 0, 0), 0xff00ff));

        // renderFlag = RENDER_FACE_NORMAL;
        // this.drawLine(new Vertex(this.sunPosRelativeToZero.mul(3).add(new Vector3(0, 0, -3)), 0xff0000), new Vertex(new Vector3(0, 0, -3), 0x00ff00));

        // this.drawPoint(new Vertex(this.sunPosRelativeToZero.mul(3), 0xffffff));
        // this.drawLine(new Vertex(new Vector3(-3, -3, -3), 0xff0000), new Vertex(new Vector3(5, 2, -8), 0x00ff00));

        this.drawSkyBox(this.time / 100.0);

        this.renderFlag = 0;
        this.transform = new Matrix4().translate(2, 1, -5);
        // this.transform = new Matrix4().translate(2, 1, -5).rotate(time, 0, time);
        this.setTexture(Resources.textures.pepe, undefined, 100);
        this.drawModel(Resources.models.sphere2);

        // this.transform = new Matrix4().translate(-2, 1, -5);
        this.transform = new Matrix4().translate(-2, 1, -5);
        // this.transform = this.transform.rotate(0, time, 0);
        this.transform = this.transform.scale(1);
        // this.setTexture(Resources.textures.brickwall, Resources.textures.brickwall_normal);
        this.setTexture(Resources.textures.stone2, Resources.textures.stone2_normal, 10.0);
        this.drawModel(Resources.models.cube);

        this.transform = new Matrix4().translate(-2, 0, -10);
        // this.transform = this.transform.rotate(0, time, 0);
        this.transform = this.transform.scale(0.5);
        // this.setTexture(Resources.textures.brickwall, Resources.textures.brickwall_normal);
        this.setTexture(Resources.textures.white);
        this.drawModel(Resources.models.man);

        this.transform = new Matrix4().translate(2, 2, -10);
        // this.transform = this.transform.rotate(0, time, 0);
        this.transform = this.transform.scale(1);
        // this.setTexture(Resources.textures.brickwall, Resources.textures.brickwall_normal);
        this.setTexture(Resources.textures.brick, Resources.textures.brick_normal, 10.0);
        this.drawModel(Resources.models.cube);

        // this.transform = new Matrix4().translate(-1, -1, -2);
        // this.transform = this.transform.scale(2);
        // // this.transform = this.transform.rotate(0, -time / 10, 0);
        // this.setTexture(Resources.textures.brickwall, Resources.textures.brickwall_normal, 0.5);
        // const f = new Face(
        //     new Vertex(new Vector3(0, 0, 0), 0xffffff, new Vector2(0, 0)),
        //     new Vertex(new Vector3(0, 1, 0), 0xffffff, new Vector2(0, 1)),
        //     new Vertex(new Vector3(1, 1, 0), 0xffffff, new Vector2(1, 1)));

        // f.calcNormal();
        // f.calcTangentAndBiTangent();

        // this.drawFace(f);
    }

    postProcess(postprocessEnabled)
    {
        // Sharpen
        if (postprocessEnabled[0])
        {
            let result = new Uint32Array(this.width * this.height);

            for (let i = 0; i < this.pixels.length; i++)
            {
                const x = i % this.width;
                const y = Math.floor(i / this.width);

                const kernelResult = this.kernel(this, this.sharpenKernel, x, y);

                result[i] = kernelResult;
            }

            this.pixels = result;
        }

        // Edge detection
        if (postprocessEnabled[1])
        {
            let result = new Uint32Array(this.width * this.height);

            for (let i = 0; i < this.pixels.length; i++)
            {
                const x = i % this.width;
                const y = Math.floor(i / this.width);

                const kernelResult = this.kernel(this, this.edgeKernel, x, y);

                result[i] = kernelResult;
            }

            this.pixels = result;
        }

        // Vignette & pixel noise
        if (postprocessEnabled[2] || postprocessEnabled[3])
        {
            for (let i = 0; i < this.pixels.length; i++)
            {
                const x = i % this.width;
                const y = Math.floor(i / this.width);

                const p = (x - this.width / 2.0) / (this.width / 5);
                const q = (y - this.height / 2.0) / (this.height / 5.0);

                let z = this.zBuffer[i];
                if (z > 5000) z = 3;

                const vignette = 20 - ((z * 3 * (p * p * 1.1))) - ((z * 3 * (q * q * 1.4)));
                const noise = (x * 5 + (y * 2) & 3) * 16 >> 3 << 3;

                let shade = 0;
                if (postprocessEnabled[2]) shade += vignette;
                if (postprocessEnabled[3]) shade += noise;

                const color = this.pixels[x + y * this.width];

                this.pixels[x + y * this.width] = addColor(color, shade);
            }
        }

        // Gaussian Blur
        if (postprocessEnabled[4])
        {
            let result = new Uint32Array(this.width * this.height);

            for (let i = 0; i < this.pixels.length; i++)
            {
                const x = i % this.width;
                const y = Math.floor(i / this.width);

                const kernelResult = this.kernel(this, this.gaussianBlurKernel, x, y);

                result[i] = kernelResult;
            }

            this.pixels = result;
        }
    }

    kernel(texture, kernel, xp, yp)
    {
        const kernelSize = Math.sqrt(kernel.length);

        let res = new Vector3(0, 0, 0);

        for (let y = 0; y < kernelSize; y++)
        {
            for (let x = 0; x < kernelSize; x++)
            {
                let xx = xp - Math.floor(kernelSize / 2) + x;
                let yy = yp - Math.floor(kernelSize / 2) + y;

                if (xx < 0) xx = 0;
                if (xx >= texture.width) xx = texture.width - 1;
                if (yy < 0) yy = 0;
                if (yy >= texture.height) yy = texture.height - 1;

                const sample = convertColor2VectorRange1(texture.pixels[xx + yy * texture.width]);

                const kernelValue = kernel[x + y * kernelSize];

                res = res.add(sample.mul(kernelValue));
            }
        }

        res = clipColorVector(res.mul(255));

        res = convertVector2ColorHex(res);

        return res;
    }

    drawPoint(v)
    {
        v = this.playerTransform(v);

        v0 = this.projectionTransform(v0);

        if (v.pos.z < this.zClipNear) return;

        const sx = int((v.pos.x / v.pos.z * FOV + WIDTH / 2.0));
        const sy = int((v.pos.y / v.pos.z * FOV + HEIGHT / 2.0));

        this.renderPixel(new Vector3(sx, sy, v.pos.z), v.color);
    }

    drawLine(v0, v1)
    {
        v0 = this.playerTransform(v0);
        v1 = this.playerTransform(v1);

        v0 = this.projectionTransform(v0);
        v1 = this.projectionTransform(v1);

        // z-Clipping
        if (v0.pos.z < this.zClipNear && v1.pos.z < this.zClipNear) return undefined;

        if (v0.pos.z < this.zClipNear)
        {
            let per = (this.zClipNear - v0.pos.z) / (v1.pos.z - v0.pos.z);
            v0.pos = v0.pos.add(v1.pos.sub(v0.pos).mul(per));
            v0.color = lerpVector2(v0.color, v1.color, per);
        }

        if (v1.pos.z < this.zClipNear)
        {
            let per = (this.zClipNear - v1.pos.z) / (v0.pos.z - v1.pos.z);
            v1.pos = v1.pos.add(v0.pos.sub(v1.pos).mul(per));
            v1.color = lerpVector2(v1.color, v0.color, per);
        }

        let p0 = new Vector2(v0.pos.x / v0.pos.z * FOV + WIDTH / 2.0 - 0.5, v0.pos.y / v0.pos.z * FOV + HEIGHT / 2.0 - 0.5);
        let p1 = new Vector2(v1.pos.x / v1.pos.z * FOV + WIDTH / 2.0 - 0.5, v1.pos.y / v1.pos.z * FOV + HEIGHT / 2.0 - 0.5);

        // Render Left to Right
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
        if (x1 > WIDTH) x1 = WIDTH;
        if (y0 < 0) y0 = 0;
        if (y1 > HEIGHT) y1 = HEIGHT;

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

                let c = lerp2AttributeVec3(v0.color, v1.color, (1 - per), per, v0.pos.z, v1.pos.z, z);

                this.renderPixel(new Vector3(int(x), int(y), z), c);
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
            if (x1 > WIDTH) x1 = WIDTH;
            if (y0 < 0) y0 = 0;
            if (y1 > HEIGHT) y1 = HEIGHT;

            for (let y = y0; y < y1; y++)
            {
                let per = (y - p0.y) / (p1.y - p0.y);

                let x = p0.x + (p1.x - p0.x) * per;
                let z = 1 / ((1 - per) / v0.pos.z + per / v1.pos.z);

                let c = lerp2AttributeVec3(v0.color, v1.color, (1 - per), per, v0.pos.z, v1.pos.z, z);
                this.renderPixel(new Vector3(int(x), int(y), z), c);
            }
        }

        return { x0: x0, y0: y0, x1: x1, y1: y1 };
    }

    drawFace(f)
    {
        this.drawTriangle(f.v0, f.v1, f.v2);
    }

    drawTriangle(v0, v1, v2)
    {
        // Render CCW
        if ((this.renderFlag & 1) == 1)
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

        const center = v0.pos.add(v1.pos.add(v2.pos)).div(3.0);
        // Render Face normal
        if (((this.renderFlag >> 2) & 1) == 1)
        {
            this.drawLine(new Vertex(center, 0xffffff), new Vertex(center.add(v0.normal.add(v1.normal).add(v2.normal).normalized().mul(0.2)), 0xff00ff));
        }

        // Render Vertex normal
        if (((this.renderFlag >> 4) & 1) == 1)
        {
            const pos = v0.pos;
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.normal.mul(0.2)), 0x0000ff));
        }

        // Render Tangent space
        if (((this.renderFlag >> 5) & 1) == 1 && v0.tangent != undefined)
        {
            const pos = v0.pos;
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.tangent.mul(0.2)), 0xff0000));
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.biTangent.mul(0.2)), 0x00ff00));
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.normal.mul(0.2)), 0x0000ff));
        }

        v0 = this.playerTransform(v0);
        v1 = this.playerTransform(v1);
        v2 = this.playerTransform(v2);

        v0 = this.projectionTransform(v0);
        v1 = this.projectionTransform(v1);
        v2 = this.projectionTransform(v2);

        if (this.normalMap != undefined)
        {
            this.tbn = this.tbn.fromAxis(v0.tangent, v0.biTangent, v0.normal.add(v1.normal).add(v2.normal).normalized());
            // console.log(this.tbn);
            // throw "asd";
        }

        if (v0.pos.z < this.zClipNear && v1.pos.z < this.zClipNear && v2.pos.z < this.zClipNear) return;
        else if (v0.pos.z > this.zClipNear && v1.pos.z > this.zClipNear && v2.pos.z > this.zClipNear)
        {
            this.drawTriangleVS(v0, v1, v2);
            return;
        }

        const vps = [v0, v1, v2, v0];
        let drawVertices = [];

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

    drawTriangleVS(vp0, vp1, vp2)
    {
        const z0 = vp0.pos.z;
        const z1 = vp1.pos.z;
        const z2 = vp2.pos.z;

        const p0 = new Vector2(vp0.pos.x / vp0.pos.z * FOV + WIDTH / 2.0 - 0.5, vp0.pos.y / vp0.pos.z * FOV + HEIGHT / 2.0 - 0.5);
        const p1 = new Vector2(vp1.pos.x / vp1.pos.z * FOV + WIDTH / 2.0 - 0.5, vp1.pos.y / vp1.pos.z * FOV + HEIGHT / 2.0 - 0.5);
        const p2 = new Vector2(vp2.pos.x / vp2.pos.z * FOV + WIDTH / 2.0 - 0.5, vp2.pos.y / vp2.pos.z * FOV + HEIGHT / 2.0 - 0.5);

        let minX = Math.ceil(Math.min(p0.x, p1.x, p2.x));
        let maxX = Math.ceil(Math.max(p0.x, p1.x, p2.x));
        let minY = Math.ceil(Math.min(p0.y, p1.y, p2.y));
        let maxY = Math.ceil(Math.max(p0.y, p1.y, p2.y));

        if (minX < 0) minX = 0;
        if (minY < 0) minY = 0;
        if (maxX > WIDTH) maxX = WIDTH;
        if (maxY > HEIGHT) maxY = HEIGHT;

        const v10 = new Vector2(p1.x - p0.x, p1.y - p0.y);
        const v21 = new Vector2(p2.x - p1.x, p2.y - p1.y);
        const v02 = new Vector2(p0.x - p2.x, p0.y - p2.y);
        const v20 = new Vector2(p2.x - p0.x, p2.y - p0.y);

        const area = v10.cross(v20);

        // Culling back faces
        if (area < 0) return;

        let depthMin = 0;
        let calcLight = true;

        if (((this.renderFlag >> 1) & 1) == 1) depthMin = 9999;
        if (((this.renderFlag >> 3) & 1) == 1) calcLight = false;

        let a = false;
        for (let y = minY; y < maxY; y++)
        {
            for (let x = minX; x < maxX; x++)
            {
                let p = new Vector3(x, y);

                let w0 = v21.cross(p.sub(p1));
                let w1 = v02.cross(p.sub(p2));
                let w2 = v10.cross(p.sub(p0));

                // Render Clock wise
                if (w0 >= 0 && w1 >= 0 && w2 >= 0)
                {
                    w0 /= area;
                    w1 /= area;
                    w2 /= area;

                    const z = 1.0 / (w0 / z0 + w1 / z1 + w2 / z2);

                    const uv = lerp3AttributeVec2(vp0.texCoord, vp1.texCoord, vp2.texCoord, w0, w1, w2, z0, z1, z2, z);
                    const pixelPos = vp0.pos.mul(w0).add(vp1.pos.mul(w1)).add(vp2.pos.mul(w2)).mulXYZ(1, 1, -1);
                    // let c = lerp3AttributeVec3(v0.color, v1.color, v2.color, w0, w1, w2, z0, z1, z2, z);
                    let pixelNormal = lerp3AttributeVec3(vp0.normal, vp1.normal, vp2.normal, w0, w1, w2, z0, z1, z2, z);

                    if (this.normalMap != undefined)
                    {
                        let sampledNormal = this.sample(this.normalMap, uv.x, uv.y);
                        sampledNormal = convertColor2VectorRange2(sampledNormal).normalized();
                        if (((this.renderFlag >> 6) & 1) != 1) sampledNormal.y *= -1;
                        sampledNormal = this.tbn.mulVector(sampledNormal, 0);
                        pixelNormal = sampledNormal.normalized();
                    }

                    let color = this.sample(this.difuseMap, uv.x, uv.y);

                    if (calcLight)
                    {
                        const toLight = this.sunDirVS.mul(-1).normalized();

                        let diffuse = toLight.dot(pixelNormal) * this.sunIntensity;
                        diffuse = clamp(diffuse, this.ambient, 1.0);

                        if (this.specularIntensity != undefined)
                        {
                            const toView = pixelPos.mul(-1).normalized();
                            const halfway = toLight.add(toView).normalized();
                            let specular = Math.pow(Math.max(pixelNormal.dot(halfway), 0), this.specularIntensity);
                            diffuse += specular;
                        }

                        color = mulColor(color, diffuse);
                    }

                    this.renderPixel(new Vector3(x, y, z + depthMin), color);
                }
            }
        }
    }

    sample(texture, u, v)
    {
        let tx = Math.floor(texture.width * u);
        let ty = Math.floor(texture.height * (1 - v));

        if (tx < 0) tx = 0;
        if (tx >= texture.width) tx = texture.width - 1;
        if (ty < 0) ty = 0;
        if (ty >= texture.height) ty = texture.height - 1;

        return texture.pixels[tx + ty * texture.width];
    }

    drawModel(model, flag)
    {
        if (flag == undefined)
            this.renderFlag |= this.RENDER_CCW;
        else
            this.renderFlag = flag;

        for (let i = 0; i < model.faces.length; i++)
            this.drawFace(model.faces[i]);

        this.renderFlag = 0;
    }

    drawCube(pos, size, centered)
    {
        if (centered == true) pos = pos.sub(new Vector3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));

        const p000 = new Vector3(pos.x, pos.y, pos.z);
        const p100 = new Vector3(pos.x + size.x, pos.y, pos.z);
        const p110 = new Vector3(pos.x + size.x, pos.y + size.y, pos.z);
        const p010 = new Vector3(pos.x, pos.y + size.y, pos.z);

        const p001 = new Vector3(pos.x, pos.y, pos.z - size.z);
        const p101 = new Vector3(pos.x + size.x, pos.y, pos.z - size.z);
        const p111 = new Vector3(pos.x + size.x, pos.y + size.y, pos.z - size.z);
        const p011 = new Vector3(pos.x, pos.y + size.y, pos.z - size.z);

        const t00 = new Vector2(0, 1);
        const t10 = new Vector2(1, 1);
        const t11 = new Vector2(1, 0);
        const t01 = new Vector2(0, 0);

        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11));

        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p011, 0xffffff, t10));
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11));

        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p010, 0xffffff, t10));
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));

        this.drawTriangle(new Vertex(p010, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.drawTriangle(new Vertex(p010, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p110, 0xffffff, t11));

        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p101, 0xffffff, t00), new Vertex(p001, 0xffffff, t10));
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p001, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));
    }

    drawSkyBox(rotation)
    {
        this.renderFlag = this.SET_Z_9999 | this.EFFECT_NO_LIGHT;

        let size = new Vector3(1000, 1000, 1000);
        let pos = this.player.pos.sub(new Vector3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));
        this.transform = new Matrix4().rotate(0, rotation, 0);

        const p000 = new Vector3(pos.x, pos.y, pos.z);
        const p100 = new Vector3(pos.x + size.x, pos.y, pos.z);
        const p110 = new Vector3(pos.x + size.x, pos.y + size.y, pos.z);
        const p010 = new Vector3(pos.x, pos.y + size.y, pos.z);

        const p001 = new Vector3(pos.x, pos.y, pos.z - size.z);
        const p101 = new Vector3(pos.x + size.x, pos.y, pos.z - size.z);
        const p111 = new Vector3(pos.x + size.x, pos.y + size.y, pos.z - size.z);
        const p011 = new Vector3(pos.x, pos.y + size.y, pos.z - size.z);

        const t00 = new Vector2(0, 1);
        const t10 = new Vector2(1, 1);
        const t11 = new Vector2(1, 0);
        const t01 = new Vector2(0, 0);

        this.setTexture(Resources.textures.skybox_front);
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11));

        this.setTexture(Resources.textures.skybox_right);
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.setTexture(Resources.textures.skybox_left);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p011, 0xffffff, t10));
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11));

        this.setTexture(Resources.textures.skybox_back);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p010, 0xffffff, t10));
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));

        this.setTexture(Resources.textures.skybox_top);
        this.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p111, 0xffffff, t11));

        this.setTexture(Resources.textures.skybox_bottom);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p001, 0xffffff, t00), new Vertex(p101, 0xffffff, t10));
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p101, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.renderFlag = 0;
    }

    projectionTransform(v)
    {
        return new Vertex(v.pos.mulXYZ(1, 1, -1), v.color, v.texCoord, v.normal, v.tangent, v.biTangent);
    }

    playerTransform(v)
    {
        const newPos = this.player.cameraTransform.mulVector(new Vector3(v.pos.x, v.pos.y, v.pos.z));
        let newNor = undefined;
        if (v.normal != undefined) newNor = this.player.cameraTransform.mulVector(v.normal, 0).normalized();
        let newTan = undefined;
        if (v.tangent != undefined) newTan = this.player.cameraTransform.mulVector(v.tangent, 0).normalized();
        let newBiTan = undefined;
        if (v.biTangent != undefined) newBiTan = this.player.cameraTransform.mulVector(v.biTangent, 0).normalized();

        return new Vertex(newPos, v.color, v.texCoord, newNor, newTan, newBiTan);
    }

    modelTransform(v)
    {
        const newPos = this.transform.mulVector(v.pos, 1);
        let newNor = undefined;
        if (v.normal != undefined) newNor = this.transform.mulVector(v.normal, 0).normalized();
        let newTan = undefined;
        if (v.tangent != undefined) newTan = this.transform.mulVector(v.tangent, 0).normalized();
        let newBiTan = undefined;
        if (v.biTangent != undefined) newBiTan = this.transform.mulVector(v.biTangent, 0).normalized();

        return new Vertex(newPos, v.color, v.texCoord, newNor, newTan, newBiTan);
    }

    renderPixel(p, c)
    {
        if (!this.checkOutOfScreen(p) && p.z < this.zBuffer[p.x + (HEIGHT - 1 - p.y) * WIDTH])
        {
            if (typeof c != "number") c = convertVector2ColorHex(c);

            this.pixels[p.x + (HEIGHT - 1 - p.y) * this.width] = c;
            this.zBuffer[p.x + (HEIGHT - 1 - p.y) * this.width] = p.z;
        }
    }

    checkOutOfScreen(p)
    {
        return p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height;
    }

    setTexture(diffuseMap, normalMap, specularIntensity, normalMapFlipY)
    {
        this.difuseMap = diffuseMap;
        this.normalMap = normalMap;
        this.specularIntensity = specularIntensity;
        if (normalMapFlipY == true) this.renderFlag = this.FLIP_NORMALMAP_Y;
    }
}

class Game
{
    constructor()
    {
        this.times = [];
        this.fps;

        this.started = false;

        this.cvs;
        this.tmpCvs;
        this.gfx;
        this.tmpGfx;

        this.frameCounterElement;

        this.pause = false
        this.time = 0;

        this.view;

        this.keys = {};
        this.mouse = { down: false, lastX: 0.0, lastY: 0.0, currX: 0.0, currY: 0.0, dx: 0.0, dy: 0.0 };

        this.postprocessEnabled = [false, false, true, false, false];
    }

    start()
    {
        this.init();
        this.run();
    }

    init()
    {
        this.cvs = document.getElementById("canvas");
        this.gfx = this.cvs.getContext("2d");

        this.tmpCvs = document.createElement("canvas");
        this.tmpGfx = this.tmpCvs.getContext("2d");

        resBtns.push(document.getElementById("res1"));
        resBtns.push(document.getElementById("res2"));
        resBtns.push(document.getElementById("res4"));
        resBtns.push(document.getElementById("res5"));
        resBtns.push(document.getElementById("res8"));
        resBtns.push(document.getElementById("res10"));
        resBtns.push(document.getElementById("res20"));

        function reloadView(index)
        {
            if (index == SCALES[index]) return;

            const newWidth = WIDTH * SCALE / SCALES[index];
            const newHeight = HEIGHT * SCALE / SCALES[index];
            this.view = new View(newWidth, newHeight, this.player);

            WIDTH = newWidth;
            HEIGHT = newHeight;
            SCALE = SCALES[index];
            FOV = HEIGHT;

            this.tmpCvs.width = WIDTH;
            this.tmpCvs.height = HEIGHT;

            for (const btn of resBtns) btn.style.backgroundColor = "white";
            resBtns[index].style.backgroundColor = "black";
        }

        for (let i = 0; i < resBtns.length; i++)
        {
            const btn = resBtns[i];
            btn.onclick = () => reloadView.bind(this)(i);
        }

        resBtns[SCALE_INDEX].style.backgroundColor = "black";

        pspBtns.push(document.getElementById("psp1"));
        pspBtns.push(document.getElementById("psp2"));
        pspBtns.push(document.getElementById("psp3"));
        pspBtns.push(document.getElementById("psp4"));
        pspBtns.push(document.getElementById("psp5"));

        function setPostProcess(index)
        {
            this.postprocessEnabled[index] = !this.postprocessEnabled[index];
            pspBtns[index].style.backgroundColor = this.postprocessEnabled[index] ? "black" : "white";
        }

        for (let i = 0; i < pspBtns.length; i++)
        {
            const btn = pspBtns[i];
            btn.onclick = () => setPostProcess.bind(this)(i);
            if (this.postprocessEnabled[i]) btn.style.backgroundColor = "black";
        }

        for (const key in Resources.textures)
        {
            if (Object.hasOwnProperty.call(Resources.textures, key))
            {
                const imageURL = Resources.textures[key][0];
                const imageWidth = Resources.textures[key][1][0];
                const imageHeight = Resources.textures[key][1][1];

                let image = new Image();
                image.src = imageURL;
                image.crossOrigin = "Anonymous";
                image.onload = () =>
                {
                    this.cvs.setAttribute("width", imageWidth + "px");
                    this.cvs.setAttribute("height", imageHeight + "px");
                    // Loading Resources.textures.

                    this.gfx.drawImage(image, 0, 0, imageWidth, imageHeight);

                    if (key == "skybox")
                    {
                        const size = int(imageWidth / 4);

                        let top = this.gfx.getImageData(size, 0, size, size);
                        let bottom = this.gfx.getImageData(size, size * 2, size, size);
                        let front = this.gfx.getImageData(size, size, size, size);
                        let back = this.gfx.getImageData(size * 3, size, size, size);
                        let right = this.gfx.getImageData(size * 2, size, size, size);
                        let left = this.gfx.getImageData(0, size, size, size);

                        Resources.textures["skybox_top"] = convertImageDataToBitmap(top, size, size);
                        Resources.textures["skybox_bottom"] = convertImageDataToBitmap(bottom, size, size);
                        Resources.textures["skybox_front"] = convertImageDataToBitmap(front, size, size);
                        Resources.textures["skybox_back"] = convertImageDataToBitmap(back, size, size);
                        Resources.textures["skybox_right"] = convertImageDataToBitmap(right, size, size);
                        Resources.textures["skybox_left"] = convertImageDataToBitmap(left, size, size);
                        loadedResources++;
                        return;
                    }

                    image = this.gfx.getImageData(0, 0, imageWidth, imageHeight);
                    image = convertImageDataToBitmap(image, imageWidth, imageHeight);

                    Resources.textures[key] = image;
                    loadedResources++;
                }
            }
        }

        window.addEventListener("mousedown", (e) =>
        {
            if (e.button != 0) return;

            this.mouse.down = true;
        }, false);
        window.addEventListener("mouseup", (e) =>
        {
            if (e.button != 0) return;

            this.mouse.down = false;
        }, false);

        window.addEventListener("keydown", (e) =>
        {
            if (e.key == "Escape") this.pause = !this.pause;

            if (e.key == "w" || e.key == "ArrowUp") this.keys.up = true;
            if (e.key == "a" || e.key == "ArrowLeft") this.keys.left = true;
            if (e.key == "s" || e.key == "ArrowDown") this.keys.down = true;
            if (e.key == "d" || e.key == "ArrowRight") this.keys.right = true;
            if (e.key == " ") this.keys.space = true;
            if (e.key == "c") this.keys.c = true;
            if (e.key == "q") this.keys.q = true;
            if (e.key == "e") this.keys.e = true;
            if (e.key == "Shift") this.keys.shift = true;
        });

        window.addEventListener("keyup", (e) =>
        {
            if (e.key == "w" || e.key == "ArrowUp") this.keys.up = false;
            if (e.key == "a" || e.key == "ArrowLeft") this.keys.left = false;
            if (e.key == "s" || e.key == "ArrowDown") this.keys.down = false;
            if (e.key == "d" || e.key == "ArrowRight") this.keys.right = false;
            if (e.key == " ") this.keys.space = false;
            if (e.key == "c") this.keys.c = false;
            if (e.key == "q") this.keys.q = false;
            if (e.key == "e") this.keys.e = false;
            if (e.key == "Shift") this.keys.shift = false;
        });

        window.addEventListener("mousemove", (e) =>
        {
            this.mouse.currX = e.screenX;
            this.mouse.currY = e.screenY;
        });

        this.frameCounterElement = document.getElementById("frame_counter");

        WIDTH = WIDTH / SCALE;
        HEIGHT = HEIGHT / SCALE;

        this.player = new Player(this.keys, this.mouse);
        this.view = new View(WIDTH, HEIGHT, this.player);

        let sample = new Bitmap(64, 64);
        for (let i = 0; i < 64 * 64; i++)
        {
            const x = i % 64;
            const y = int(i / 64);
            sample.pixels[i] = (((x << 6) % 0xff) << 8) | (y << 6) % 0xff;
        }
        Resources.textures["sample0"] = sample;

        sample = new Bitmap(64, 64);
        sample.clear(0xff00ff);
        Resources.textures["sample1"] = sample;

        sample = new Bitmap(64, 64);
        sample.clear(0xffffff);
        Resources.textures["white"] = sample;

        sample = new Bitmap(64, 64);
        sample.clear(0x8080ff);
        Resources.textures["default_normal"] = sample;
    }

    run()
    {
        const now = performance.now();
        while (this.times.length > 0 && this.times[0] <= now - 1000) this.times.shift();

        const delta = (now - this.times[this.times.length - 1]) / 1000.0;
        // console.log("frame time:", delta * 1000.0);

        this.times.push(now);
        this.fps = this.times.length;
        this.frameCounterElement.innerHTML = this.fps + "fps";

        if (!this.started && loadedResources == resourceReady)
        {
            this.started = true;
            this.cvs.setAttribute("width", WIDTH * SCALE + "px");
            this.cvs.setAttribute("height", HEIGHT * SCALE + "px");
            this.tmpCvs.setAttribute("width", WIDTH * SCALE + "px");
            this.tmpCvs.setAttribute("height", HEIGHT * SCALE + "px");
            this.gfx.font = "48px verdana";
        }

        if (this.started && !this.pause)
        {
            this.update(delta);
            this.render();
            this.time += delta;
        }
        else if (this.pause)
        {
            this.gfx.fillText("PAUSE", 4, 40);
        }

        requestAnimationFrame(this.run.bind(this));
    }

    update(delta)
    {
        this.mouse.dx = this.mouse.currX - this.mouse.lastX;
        this.mouse.dy = this.mouse.currY - this.mouse.lastY;
        this.mouse.lastX = this.mouse.currX;
        this.mouse.lastY = this.mouse.currY;

        this.player.update(delta);
        this.view.update(delta);
    }

    render()
    {
        this.view.clear(0x808080);
        this.view.renderView();
        this.view.postProcess(this.postprocessEnabled);

        if (true)
        {
            this.tmpGfx.putImageData(convertBitmapToImageData(this.view), 0, 0);
            this.gfx.save();
            this.gfx.imageSmoothingEnabled = false;
            this.gfx.scale(SCALE, SCALE);
            this.gfx.drawImage(this.tmpCvs, 0, 0);
            this.gfx.restore();
        } else
        {
            this.gfx.putImageData(convertBitmapToImageData(this.view, SCALE), 0, 0)
        }
    }
}

window.onload = () =>
{
    new Game().start();
}

// Load models
for (const key in Resources.models)
{
    if (Object.hasOwnProperty.call(Resources.models, key))
    {
        const modelURL = Resources.models[key];

        let xhr = new XMLHttpRequest();
        xhr.open("get", modelURL, true);
        xhr.send(null);

        xhr.onreadystatechange = function ()
        {
            if (xhr.readyState == 4 && xhr.status == 200)
            {
                // Load OBJ file line by line
                const lines = xhr.response.split('\n');

                let positions = [];
                let texCoords = [];
                let normals = [];
                let indices = [];

                for (const line of lines)
                {
                    const tokens = line.split(" ");
                    switch (tokens[0])
                    {
                        case "v":
                            let v = [];
                            for (let i = 0; i < 3; i++)
                                v.push(parseFloat(tokens[i + 1]))
                            positions.push(v);
                            break;

                        case "vt":
                            let tc = [];
                            for (let i = 0; i < 2; i++)
                                tc.push(parseFloat(tokens[i + 1]))
                            texCoords.push(tc);
                            break;

                        case "vn":
                            let vn = [];
                            for (let i = 0; i < 3; i++)
                                vn.push(parseFloat(tokens[i + 1]))
                            normals.push(vn);
                            break;

                        case "f":
                            let f = [];
                            for (let i = 0; i < 3; i++)
                            {
                                let v = [];
                                for (let j = 0; j < 3; j++)
                                    v.push(parseInt(tokens[i + 1].split("/")[j]))
                                f.push(v);
                            }
                            indices.push(f);
                            break;
                    }
                }

                // console.log(indices);

                loadedResources++;

                Resources.models[key] = new Model(positions, texCoords, normals, indices);
            }
        }
    }
}