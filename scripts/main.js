let WIDTH = 800;
let HEIGHT = WIDTH / 4 * 3;
let SCALE = 4;

let FOV = HEIGHT / SCALE
let zClipNear = 0.2;

const spriteSheetSize = 512;
let textures =
{
    pepe: ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/pepe.png", [512, 512]],
    dulri: ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/dulri.png", [256, 256]],
    skybox: ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/skybox2.png", [1024, 768]]
};

const resourceReady = Object.keys(textures).length;;
let loadedResources = 0;

let previousTime = 0;
let passedTime = 0;
let msPerFrame = 1000.0 / 60.0;
let timer = 0;
let frameCounter = 0;

let cvs;
let gfx;

let frameCounterElement;

let globalAlpha = 255;

let pause = false
let time = 0;

let view;

let keys = {};
let mouse = { down: false, lastX: 0.0, lastY: 0.0, currX: 0.0, currY: 0.0, dx: 0.0, dy: 0.0 };

let player;

let backFaceCulling = false;

const RENDER_CW = 0;
const RENDER_CCW = 1;
const SET_Z_9999 = 0x10
let renderFlag = 0;

/**
 * Creates a pseudo-random value generator. The seed must be an integer.
 *
 * Uses an optimized version of the Park-Miller PRNG.
 * http://www.firstpr.com.au/dsp/rand31/
 */
function Random(seed)
{
    this._seed = seed % 2147483647;
    if (this._seed <= 0) this._seed += 2147483646;
}

/**
 * Returns a pseudo-random value between 1 and 2^32 - 2.
 */
Random.prototype.next = function ()
{
    return this._seed = this._seed * 16807 % 2147483647;
};

/**
 * Returns a pseudo-random floating point number in range [0, 1).
 */
Random.prototype.nextFloat = function (opt_minOrMax, opt_max)
{
    // We know that result of next() will be 1 to 2147483646 (inclusive).
    return (this.next() - 1) / 2147483646;
};

class Vector2
{
    constructor(x, y)
    {
        this.x = x;
        this.y = y;
    }

    normalize()
    {
        const len = this.getLength();

        this.x /= len;
        this.y /= len;
    }

    getLength()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    dot(v)
    {
        return this.x * v.x + this.y * v.y;
    }

    cross(v)
    {
        return this.y * v.x - this.x * v.y;
    }

    add(v)
    {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    sub(v)
    {
        return new Vector2(this.x - v.x, this.y - v.y);
    }

    div(v)
    {
        return new Vector2(this.x / v, this.y / v);
    }

    mul(v)
    {
        return new Vector2(this.x * v, this.y * v);
    }

    equals(v)
    {
        return this.x == v.x && this.y == v.y;
    }
}

class Vector3
{
    constructor(x, y, z)
    {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    normalize()
    {
        const len = this.getLength();

        this.x /= len;
        this.y /= len;
        this.z /= len;
    }

    getLength()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    dot(v)
    {
        return this.x * v.x + this.y * v.y * this.z * v.z;
    }

    cross(v)
    {
        return Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.z * v.x);
    }

    add(v)
    {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    sub(v)
    {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    div(v)
    {
        return new Vector3(this.x / v, this.y / v, this.z / v);
    }

    mul(v)
    {
        return new Vector3(this.x * v, this.y * v, this.z * v);
    }

    equals(v)
    {
        return this.x == v.x && this.y == v.y && this.z == v.z;
    }
}

class Matrix4
{
    constructor()
    {
        this.m00 = 1; this.m01 = 0; this.m02 = 0; this.m03 = 0;
        this.m10 = 0; this.m11 = 1; this.m12 = 0; this.m13 = 0;
        this.m20 = 0; this.m21 = 0; this.m22 = 1; this.m23 = 0;
        this.m30 = 0; this.m31 = 0; this.m32 = 0; this.m33 = 1;
    }

    mulMatrix(right)
    {
        let res = new Matrix4();

        res.m00 = this.m00 * right.m00 + this.m01 * right.m10 + this.m02 * right.m20 + this.m03 * right.m30;
        res.m01 = this.m00 * right.m01 + this.m01 * right.m11 + this.m02 * right.m21 + this.m03 * right.m31;
        res.m02 = this.m00 * right.m02 + this.m01 * right.m12 + this.m02 * right.m22 + this.m03 * right.m32;
        res.m03 = this.m00 * right.m03 + this.m01 * right.m13 + this.m02 * right.m23 + this.m03 * right.m33;

        res.m10 = this.m10 * right.m00 + this.m11 * right.m10 + this.m12 * right.m20 + this.m13 * right.m30;
        res.m11 = this.m10 * right.m01 + this.m11 * right.m11 + this.m12 * right.m21 + this.m13 * right.m31;
        res.m12 = this.m10 * right.m02 + this.m11 * right.m12 + this.m12 * right.m22 + this.m13 * right.m32;
        res.m13 = this.m10 * right.m03 + this.m11 * right.m13 + this.m12 * right.m23 + this.m13 * right.m33;

        res.m20 = this.m20 * right.m00 + this.m21 * right.m10 + this.m22 * right.m20 + this.m23 * right.m30;
        res.m21 = this.m20 * right.m01 + this.m21 * right.m11 + this.m22 * right.m21 + this.m23 * right.m31;
        res.m22 = this.m20 * right.m02 + this.m21 * right.m12 + this.m22 * right.m22 + this.m23 * right.m32;
        res.m23 = this.m20 * right.m03 + this.m21 * right.m13 + this.m22 * right.m23 + this.m23 * right.m33;

        res.m30 = this.m30 * right.m00 + this.m31 * right.m10 + this.m32 * right.m20 + this.m33 * right.m30;
        res.m31 = this.m30 * right.m01 + this.m31 * right.m11 + this.m32 * right.m21 + this.m33 * right.m31;
        res.m32 = this.m30 * right.m02 + this.m31 * right.m12 + this.m32 * right.m22 + this.m33 * right.m32;
        res.m33 = this.m30 * right.m03 + this.m31 * right.m13 + this.m32 * right.m23 + this.m33 * right.m33;

        return res;
    }

    mulVector(right)
    {
        let res = new Vector3(0, 0, 0);

        res.x = this.m00 * right.x + this.m01 * right.y + this.m02 * right.z + this.m03;
        res.y = this.m10 * right.x + this.m11 * right.y + this.m12 * right.z + this.m13;
        res.z = this.m20 * right.x + this.m21 * right.y + this.m22 * right.z + this.m23;

        return res;
    }

    scale(s)
    {
        let scale = new Matrix4();
        scale.m00 = s;
        scale.m11 = s;
        scale.m22 = s;
        scale.m33 = s;

        return this.mulMatrix(scale);
    }

    rotate(x, y, z)
    {
        const sinX = Math.sin(x);
        const cosX = Math.cos(x);
        const sinY = Math.sin(y);
        const cosY = Math.cos(y);
        const sinZ = Math.sin(z);
        const cosZ = Math.cos(z);

        let res = new Matrix4();

        res.m00 = cosY * cosZ; res.m01 = -cosY * sinZ; res.m02 = sinY; res.m03 = 0;
        res.m10 = sinX * sinY * cosZ + cosX * sinZ; res.m11 = -sinX * sinY * sinZ + cosX * cosZ; res.m12 = -sinX * cosY; res.m13 = 0;
        res.m20 = -cosX * sinY * cosZ + sinX * sinZ; res.m21 = cosX * sinY * sinZ + sinX * cosZ; res.m22 = cosX * cosY; res.m23 = 0;
        res.m30 = 0; res.m31 = 0; res.m32 = 0; res.m33 = 1;

        return this.mulMatrix(res);
    }

    translate(x, y, z)
    {
        let res = new Matrix4();

        res.m03 = x;
        res.m13 = y;
        res.m23 = z;

        return this.mulMatrix(res);
    }
}

class Vertex
{
    constructor(pos, color, texCoord)
    {
        this.pos = pos;

        if (typeof color == "number") this.color = new Vector3((color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
        else if (color == undefined) this.color = new Vector3(255, 0, 255);
        else this.color = color;

        if (texCoord == undefined) this.texCoord = new Vector2(0, 0);
        else this.texCoord = texCoord;
    }
}

class Player
{
    constructor()
    {
        this.speed = 3.0;
        this.rotSpeed = 60.0;

        this.pos = new Vector3(0.0, 0.0, 0.0);
        this.rot = new Vector3(0.0, 0.0, 0.0);
        this.cameraTransform = new Matrix4();
    }

    update(delta)
    {
        this.speed = 3.0;

        if (keys.shift) this.speed = 6.0;

        let ax = 0.0;
        let az = 0.0;

        if (keys.left) ax--;
        if (keys.right) ax++;
        if (keys.up) az--;
        if (keys.down) az++;

        this.pos.x += (Math.cos(-this.rot.y * Math.PI / 180.0) * ax + Math.sin(-this.rot.y * Math.PI / 180.0) * az) * this.speed * delta;
        this.pos.z += (-Math.sin(-this.rot.y * Math.PI / 180.0) * ax + Math.cos(-this.rot.y * Math.PI / 180.0) * az) * this.speed * delta;

        if (keys.space) this.pos.y += this.speed * delta;
        if (keys.c) this.pos.y -= this.speed * delta;
        if (keys.q) this.rot.y -= this.rotSpeed * delta;
        if (keys.e) this.rot.y += this.rotSpeed * delta;

        if (mouse.down)
        {
            this.rot.y += mouse.dx * 0.1 * this.rotSpeed * delta;
            this.rot.x += mouse.dy * 0.1 * this.rotSpeed * delta;
        }

        const radRot = this.rot.mul(-Math.PI / 180.0);
        this.cameraTransform = new Matrix4().rotate(radRot.x, radRot.y, radRot.z);
        this.cameraTransform = this.cameraTransform.translate(-this.pos.x, -this.pos.y, this.pos.z);
    }
}

class Bitmap
{
    constructor(width, height)
    {
        this.width = width;
        this.height = height;
        this.pixels = new Uint32Array(width * height);
    }

    render(bitmap, ox, oy)
    {
        for (let y = 0; y < bitmap.height; y++)
        {
            let yy = oy + y;
            if (yy < 0 || yy >= this.height)
                continue;
            for (let x = 0; x < bitmap.width; x++)
            {
                let xx = ox + x;
                if (xx < 0 || xx >= this.width)
                    continue;

                const color = bitmap.pixels[x + y * bitmap.width];

                this.pixels[xx + yy * this.width] = color;
            }
        }
    }

    clear(color)
    {
        for (let i = 0; i < this.pixels.length; i++)
            this.pixels[i] = color;
    }
}

class View extends Bitmap
{
    constructor(width, height)
    {
        super(width, height);

        this.zBuffer = new Float32Array(width * height);
    }

    update(delta)
    {
    }

    renderView()
    {
        for (let i = 0; i < this.zBuffer.length; i++)
            this.zBuffer[i] = 100000;

        const r = new Random(123);

        const s = 30.0;
        let tex;

        let matrix = new Matrix4().rotate(time / 10.0, time / 10.0, time / 10.0);

        // renderFlag = RENDER_CCW;
        for (let i = 0; i < 100; i++)
        {
            if (i % 2 == 0) tex = textures.pepe;
            else tex = textures.dulri;

            const pos = new Vector3(r.nextFloat() * s - s / 2.0, r.nextFloat() * s - s / 2.0, r.nextFloat() * s - s / 2.0);

            // this.drawCube(pos, new Vector3(1, 1, 1), tex, true);
            this.drawCube(pos, new Vector3(1, 1, 1), tex, false, true);
        }
        // renderFlag = 0;

        this.drawPoint(new Vertex(new Vector3(0, 0, 0), 0xff00ff));
        // this.drawLine(new Vertex(new Vector3(-3, -3, -3), 0xff0000), new Vertex(new Vector3(5, 2, -8), 0x00ff00));
        // this.drawCube(new Vector3(0, 0, -3), new Vector3(1, 1, 1), textures.skybox, true);

        this.drawSkyBox(time / 100.0);
    }

    drawPoint(v)
    {
        v.pos = this.playerTransform(v.pos);

        if (v.pos.z < zClipNear) return;

        const sx = int((v.pos.x / v.pos.z * FOV + WIDTH / 2.0));
        const sy = int((v.pos.y / v.pos.z * FOV + HEIGHT / 2.0));

        this.renderPixel(new Vector3(sx, sy, v.pos.z), v.color);
    }

    drawLine(v0, v1)
    {
        let vp0 = this.playerTransform(v0.pos);
        let vp1 = this.playerTransform(v1.pos);

        vp0.color = v0.color;
        vp1.color = v1.color;

        // z-Clipping
        if (vp0.z < zClipNear && vp1.z < zClipNear) return undefined;

        if (vp0.z < zClipNear)
        {
            let per = (zClipNear - vp0.z) / (vp1.z - vp0.z);
            vp0 = vp0.add(vp1.sub(vp0).mul(per));
            vp0.color = lerpVector2(v0.color, v1.color, per);
        }

        if (vp1.z < zClipNear)
        {
            let per = (zClipNear - vp1.z) / (vp0.z - vp1.z);
            vp1 = vp1.add(vp0.sub(vp1).mul(per));
            vp1.color = lerpVector2(v1.color, v0.color, per);
        }

        let p0 = new Vector2(vp0.x / vp0.z * FOV + WIDTH / 2.0 - 0.5, vp0.y / vp0.z * FOV + HEIGHT / 2.0 - 0.5);
        let p1 = new Vector2(vp1.x / vp1.z * FOV + WIDTH / 2.0 - 0.5, vp1.y / vp1.z * FOV + HEIGHT / 2.0 - 0.5);

        // Render Left to Right
        if (p1.x < p0.x)
        {
            let tmp = p0;
            p0 = p1;
            p1 = tmp;

            tmp = vp0;
            vp0 = vp1;
            vp1 = tmp;
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
                let z = 1 / ((1 - per) / vp0.z + per / vp1.z);

                let c = lerp2AttributeVec3(vp0.color, vp1.color, (1 - per), per, vp0.z, vp1.z, z);

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

                tmp = vp0;
                vp0 = vp1;
                vp1 = tmp;
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
                let z = 1 / ((1 - per) / vp0.z + per / vp1.z);

                let c = lerp2AttributeVec3(vp0.color, vp1.color, (1 - per), per, vp0.z, vp1.z, z);
                this.renderPixel(new Vector3(int(x), int(y), z), c);
            }
        }

        return { x0: x0, y0: y0, x1: x1, y1: y1 };
    }

    drawTriangle(v0, v1, v2, tex)
    {
        if (tex == undefined) tex = textures.sample0;

        if ((renderFlag & 0xf) == 1)
        {
            const tmp = v0;
            v0 = v1;
            v1 = tmp;
        }

        v0.pos = this.playerTransform(v0.pos);
        v1.pos = this.playerTransform(v1.pos);
        v2.pos = this.playerTransform(v2.pos);

        if (v0.pos.z < zClipNear && v1.pos.z < zClipNear && v2.pos.z < zClipNear) return;
        else if (v0.pos.z > zClipNear && v1.pos.z > zClipNear && v2.pos.z > zClipNear)
        {
            this.drawTriangleVS(v0, v1, v2, tex);
            return;
        }

        const vps = [v0, v1, v2, v0];
        let drawVertices = [];

        for (let i = 0; i < 3; i++)
        {
            const cv = vps[i];
            const nv = vps[i + 1];

            const cvToNear = cv.pos.z - zClipNear;
            const nvToNear = nv.pos.z - zClipNear;

            if (cvToNear < 0 && nvToNear < 0) continue;

            // If the edge intersects with z-Near plane
            if (cvToNear * nvToNear < 0)
            {
                const per = (zClipNear - cv.pos.z) / (nv.pos.z - cv.pos.z);

                const clippedPos = cv.pos.add(nv.pos.sub(cv.pos).mul(per));
                const clippedCol = cv.color.add(nv.color.sub(cv.color).mul(per));
                const clippedTxC = cv.texCoord.add(nv.texCoord.sub(cv.texCoord).mul(per));

                if (cvToNear > 0) drawVertices.push(cv);
                drawVertices.push(new Vertex(clippedPos, clippedCol, clippedTxC));
            }
            else
            {
                drawVertices.push(cv);
            }
        }

        switch (drawVertices.length)
        {
            case 3:
                this.drawTriangleVS(drawVertices[0], drawVertices[1], drawVertices[2], tex)
                break;
            case 4:
                this.drawTriangleVS(drawVertices[0], drawVertices[1], drawVertices[2], tex)
                this.drawTriangleVS(drawVertices[0], drawVertices[2], drawVertices[3], tex)
                break;
        }
    }

    drawTriangleVS(vp0, vp1, vp2, tex)
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

        if (((renderFlag >> 4) & 0xf) == 1)
        {
            depthMin = 9999;
        }

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

                    const t = lerp3AttributeVec2(vp0.texCoord, vp1.texCoord, vp2.texCoord, w0, w1, w2, z0, z1, z2, z);
                    // let c = lerpAttribute(v0.color, v1.color, v2.color, w0, w1, w2, z0, z1, z2, z);

                    let tx = Math.floor(tex.width * t.x);
                    let ty = Math.floor(tex.height * t.y);

                    if (tx < 0) tx = 0;
                    if (tx >= tex.width) tx = tex.width - 1;
                    if (ty < 0) ty = 0;
                    if (ty >= tex.height) ty = tex.height - 1;

                    const c = tex.pixels[tx + ty * tex.width];

                    this.renderPixel(new Vector3(x, y, z + depthMin), c);
                }
            }
        }
    }

    drawIndex(vertices, indices)
    {
    }

    drawCube(pos, size, tex, centered)
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

        const t00 = new Vector2(0, 0);
        const t10 = new Vector2(1, 0);
        const t11 = new Vector2(1, 1);
        const t01 = new Vector2(0, 1);

        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11), tex);

        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p111, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11), tex);

        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p011, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11), tex);

        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p010, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11), tex);

        this.drawTriangle(new Vertex(p010, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p010, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p110, 0xffffff, t11), tex);

        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p101, 0xffffff, t00), new Vertex(p001, 0xffffff, t10), tex);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p001, 0xffffff, t10), new Vertex(p000, 0xffffff, t11), tex);
    }

    drawSkyBox(rotation)
    {
        renderFlag = SET_Z_9999;

        let size = new Vector3(1000, 1000, 1000);
        let pos = player.pos.sub(new Vector3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));
        rotation = new Matrix4().rotate(0, rotation, 0);

        const p000 = rotation.mulVector(new Vector3(pos.x, pos.y, pos.z));
        const p100 = rotation.mulVector(new Vector3(pos.x + size.x, pos.y, pos.z));
        const p110 = rotation.mulVector(new Vector3(pos.x + size.x, pos.y + size.y, pos.z));
        const p010 = rotation.mulVector(new Vector3(pos.x, pos.y + size.y, pos.z));

        const p001 = rotation.mulVector(new Vector3(pos.x, pos.y, pos.z - size.z));
        const p101 = rotation.mulVector(new Vector3(pos.x + size.x, pos.y, pos.z - size.z));
        const p111 = rotation.mulVector(new Vector3(pos.x + size.x, pos.y + size.y, pos.z - size.z));
        const p011 = rotation.mulVector(new Vector3(pos.x, pos.y + size.y, pos.z - size.z));

        const t00 = new Vector2(0, 0);
        const t10 = new Vector2(1, 0);
        const t11 = new Vector2(1, 1);
        const t01 = new Vector2(0, 1);

        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10), textures.skybox_front);
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11), textures.skybox_front);

        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p110, 0xffffff, t10), textures.skybox_right);
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11), textures.skybox_right);

        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p011, 0xffffff, t10), textures.skybox_left);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11), textures.skybox_left);

        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p010, 0xffffff, t10), textures.skybox_back);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11), textures.skybox_back);

        this.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10), textures.skybox_top);
        this.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p111, 0xffffff, t11), textures.skybox_top);

        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p001, 0xffffff, t00), new Vertex(p101, 0xffffff, t10), textures.skybox_bottom);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p101, 0xffffff, t10), new Vertex(p100, 0xffffff, t11), textures.skybox_bottom);

        renderFlag = 0;
    }

    playerTransform(pos)
    {
        return player.cameraTransform.mulVector(new Vector3(pos.x, pos.y, -pos.z));
    }

    renderPixel(p, c)
    {
        if (!this.checkOutOfScreen(p) && p.z < this.zBuffer[p.x + (HEIGHT - 1 - p.y) * WIDTH])
        {
            if (typeof c != "number") c = convertColor(c);

            this.pixels[p.x + (HEIGHT - 1 - p.y) * this.width] = c;
            this.zBuffer[p.x + (HEIGHT - 1 - p.y) * this.width] = p.z;
        }
    }

    checkOutOfScreen(p)
    {
        return p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height;
    }

}

function start()
{
    init();
    run();
}

function init()
{
    cvs = document.getElementById("canvas");
    gfx = cvs.getContext("2d");

    for (const key in textures)
    {
        if (Object.hasOwnProperty.call(textures, key))
        {
            const imageURL = textures[key][0];
            const imageWidth = textures[key][1][0];
            const imageHeight = textures[key][1][1];

            let image = new Image();
            image.src = imageURL;
            image.crossOrigin = "Anonymous";
            image.onload = () =>
            {
                cvs.setAttribute("width", imageWidth + "px");
                cvs.setAttribute("height", imageHeight + "px");
                // Loading textures.

                gfx.drawImage(image, 0, 0, imageWidth, imageHeight);

                if (key == "skybox")
                {
                    const size = int(imageWidth / 4);

                    let top = gfx.getImageData(size, 0, size, size);
                    let bottom = gfx.getImageData(size, size * 2, size, size);
                    let front = gfx.getImageData(size, size, size, size);
                    let back = gfx.getImageData(size * 3, size, size, size);
                    let right = gfx.getImageData(size * 2, size, size, size);
                    let left = gfx.getImageData(0, size, size, size);

                    textures["skybox_top"] = convertImageDataToBitmap(top, size, size);
                    textures["skybox_bottom"] = convertImageDataToBitmap(bottom, size, size);
                    textures["skybox_front"] = convertImageDataToBitmap(front, size, size);
                    textures["skybox_back"] = convertImageDataToBitmap(back, size, size);
                    textures["skybox_right"] = convertImageDataToBitmap(right, size, size);
                    textures["skybox_left"] = convertImageDataToBitmap(left, size, size);
                    loadedResources++;
                    return;
                }

                image = gfx.getImageData(0, 0, imageWidth, imageHeight);
                image = convertImageDataToBitmap(image, imageWidth, imageHeight);

                textures[key] = image;
                loadedResources++;
            }
        }
    }

    window.addEventListener("mousedown", (e) =>
    {
        if (e.button != 0) return;

        mouse.down = true;
    }, false);
    window.addEventListener("mouseup", (e) =>
    {
        if (e.button != 0) return;

        mouse.down = false;
    }, false);

    window.addEventListener("keydown", (e) =>
    {
        if (e.key == "Escape") pause = !pause;

        if (e.key == "w" || e.key == "ArrowUp") keys.up = true;
        if (e.key == "a" || e.key == "ArrowLeft") keys.left = true;
        if (e.key == "s" || e.key == "ArrowDown") keys.down = true;
        if (e.key == "d" || e.key == "ArrowRight") keys.right = true;
        if (e.key == " ") keys.space = true;
        if (e.key == "c") keys.c = true;
        if (e.key == "q") keys.q = true;
        if (e.key == "e") keys.e = true;
        if (e.key == "Shift") keys.shift = true;
    });

    window.addEventListener("keyup", (e) =>
    {
        if (e.key == "w" || e.key == "ArrowUp") keys.up = false;
        if (e.key == "a" || e.key == "ArrowLeft") keys.left = false;
        if (e.key == "s" || e.key == "ArrowDown") keys.down = false;
        if (e.key == "d" || e.key == "ArrowRight") keys.right = false;
        if (e.key == " ") keys.space = false;
        if (e.key == "c") keys.c = false;
        if (e.key == "q") keys.q = false;
        if (e.key == "e") keys.e = false;
        if (e.key == "Shift") keys.shift = false;
    });

    window.addEventListener("mousemove", (e) =>
    {
        mouse.currX = e.screenX;
        mouse.currY = e.screenY;
    });

    frameCounterElement = document.getElementById("frame_counter");

    WIDTH = WIDTH / SCALE;
    HEIGHT = HEIGHT / SCALE;

    previousTime = new Date().getTime();

    view = new View(WIDTH, HEIGHT);

    for (let i = 0; i < WIDTH * HEIGHT; i++)
        view.pixels[i] = Math.random() * 0xffffff;

    let sample = new Bitmap(64, 64);
    for (let i = 0; i < 64 * 64; i++)
    {
        const x = i % 64;
        const y = int(i / 64);
        sample.pixels[i] = (((x << 6) % 0xff) << 8) | (y << 6) % 0xff;
    }

    textures["sample0"] = sample;

    sample = new Bitmap(64, 64);
    sample.clear(0xff00ff);

    textures["sample1"] = sample;

    player = new Player();
}

function run()
{
    const currentTime = new Date().getTime();
    passedTime += currentTime - previousTime;
    previousTime = currentTime;

    if (loadedResources == resourceReady && time == 0)
    {
        cvs.setAttribute("width", WIDTH * SCALE + "px");
        cvs.setAttribute("height", HEIGHT * SCALE + "px");
        gfx.font = "48px verdana";
    }

    while (passedTime >= msPerFrame)
    {
        if (loadedResources == resourceReady && !pause)
        {
            update(passedTime / 1000.0);
            render();
            time += passedTime / 1000.0;

            timer += passedTime;
            frameCounter++;

            if (timer >= 1000)
            {
                frameCounterElement.innerHTML = frameCounter + "fps";
                timer = 0;
                frameCounter = 0;
            }
        }
        else if (pause)
        {
            gfx.fillText("PAUSE", 4, 40);
        }

        passedTime -= msPerFrame;
    }

    requestAnimationFrame(run);
}

function update(delta)
{
    mouse.dx = mouse.currX - mouse.lastX;
    mouse.dy = mouse.currY - mouse.lastY;
    mouse.lastX = mouse.currX;
    mouse.lastY = mouse.currY;

    player.update(delta);
    view.update(delta);
}

function render()
{
    view.clear(0x808080);

    view.renderView();

    gfx.putImageData(convertBitmapToImageData(view, SCALE), 0, 0);
}

function convertImageDataToBitmap(imageData, width, height)
{
    const res = new Bitmap(width, height);

    for (let y = 0; y < height; y++)
    {
        for (let x = 0; x < width; x++)
        {
            const r = imageData.data[(x + y * width) * 4];
            const g = imageData.data[(x + y * width) * 4 + 1];
            const b = imageData.data[(x + y * width) * 4 + 2];

            res.pixels[x + y * width] = (r << 16) | (g << 8) | b;
        }
    }

    return res;
}

function convertBitmapToImageData(bitmap, scale)
{
    const res = new ImageData(bitmap.width * scale, bitmap.height * scale);

    for (let y = 0; y < bitmap.height; y++)
    {
        for (let x = 0; x < bitmap.width; x++)
        {
            const bitmapPixel = bitmap.pixels[x + y * bitmap.width]

            const r = (bitmapPixel >> 16) & 0xff;
            const g = (bitmapPixel >> 8) & 0xff;
            const b = bitmapPixel & 0xff;

            for (let ys = 0; ys < SCALE; ys++)
            {
                for (let xs = 0; xs < SCALE; xs++)
                {
                    const ptr = ((x * SCALE) + xs + ((y * SCALE) + ys) * res.width) * 4;

                    res.data[ptr] = r;
                    res.data[ptr + 1] = g;
                    res.data[ptr + 2] = b;
                    res.data[ptr + 3] = globalAlpha;
                }
            }
        }
    }

    return res;
}

function int(a)
{
    return Math.ceil(a);
}

function lerp(a, b, per)
{
    return a * (1.0 - per) + b * per;
}

function lerpVector2(a, b, per)
{
    return a.mul(1 - per).add(b.mul(per));
}

function lerpVector3(a, b, c, w0, w1, w2)
{
    const wa = a.mul(w0);
    const wb = b.mul(w1);
    const wc = c.mul(w2);

    return new Vector3(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y, wa.z + wb.z + wc.z);
}

function lerp2AttributeVec3(a, b, w0, w1, z0, z1, z)
{
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);

    return new Vector3(wa.x + wb.x, wa.y + wb.y, wa.z + wb.z);
}

function lerp3AttributeVec2(a, b, c, w0, w1, w2, z0, z1, z2, z)
{
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);
    const wc = c.mul(w2 / z2 * z);

    return new Vector2(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y);
}

function lerp3AttributeVec3(a, b, c, w0, w1, w2, z0, z1, z2, z)
{
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);
    const wc = c.mul(w2 / z2 * z);

    return new Vector3(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y, wa.z + wb.z + wc.z);
}

function convertColor(v)
{
    return (v.x << 16) | (v.y << 8) | v.z;
}

window.onload = start;
