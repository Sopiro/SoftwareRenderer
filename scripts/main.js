let WIDTH = 800;
let HEIGHT = WIDTH / 4 * 3;
let SCALE = 4;

let FOV = HEIGHT / SCALE
let zClipNear = 0.2;

let textures =
{
    "pepe": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/pepe.png", [512, 512]],
    "dulri": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/dulri.png", [256, 256]],
    "container": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/container2.png", [500, 500]],
    "skybox": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/skybox.png", [1024, 768]],
    "skybox2": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/skybox2.png", [1024, 768]],
    "skybox3": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/skybox3.png", [2048, 1536]],
    "brickwall": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/brickwall.png", [1024, 1024]],
    "brickwall_normal": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/brickwall_normal.png", [1024, 1024]],
    "brick": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/bricks3.png", [1024, 1024]],
    "brick_normal": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/bricks3_normal.png", [1024, 1024]],
    "rock": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/chipped-stonework_albedo.png", [2048, 2048]],
    "rock_normal": ["https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/imgs/chipped-stonework_normal-ogl.png", [2048, 2048]],
};

let models =
{
    "cube": "https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/models/cube.obj",
    "sphere": "https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/models/sphere2.obj",
    "monkey": "https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/models/monkey2.obj",
    "man": "https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/models/man.obj",
    "sharprock": "https://raw.githubusercontent.com/Sopiro/js_bitmap_renderer/master/models/sharprockfree.obj",
};

const resourceReady = Object.keys(textures).length + Object.keys(models).length;
let loadedResources = 0;

const times = [];
let fps;

let started = false;

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
const SET_Z_9999 = 2;
const RENDER_FACE_NORMAL = 4;
const EFFECT_NO_LIGHT = 8;
const RENDER_VERTEX_NORMAL = 16;
const RENDER_TANGENT_SPACE = 32;
const FLIP_NORMALMAP_Y = 64;

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

    normalized()
    {
        return this.div(this.getLength());
    }

    getLength()
    {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    dot(v)
    {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    cross(v)
    {
        return new Vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
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

    divElement(v)
    {
        return new Vector3(this.x / v.x, this.y / v.y, this.z / v.z);
    }

    mul(v)
    {
        return new Vector3(this.x * v, this.y * v, this.z * v);
    }

    mulElement(v)
    {
        return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z);
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

    fromAxis(vx, vy, vz)
    {
        let res = new Matrix4();

        res.m00 = vx.x; res.m01 = vy.x; res.m02 = vz.x;
        res.m10 = vx.y; res.m11 = vy.y; res.m12 = vz.y;
        res.m20 = vx.z; res.m21 = vy.z; res.m22 = vz.z;

        return res;
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

    mulVector(right, w)
    {
        let res = new Vector3(0, 0, 0);

        if (w == undefined) w = 1;

        res.x = this.m00 * right.x + this.m01 * right.y + this.m02 * right.z + this.m03 * w;
        res.y = this.m10 * right.x + this.m11 * right.y + this.m12 * right.z + this.m13 * w;
        res.z = this.m20 * right.x + this.m21 * right.y + this.m22 * right.z + this.m23 * w;

        return res;
    }

    scale(x, y, z)
    {
        if (y == undefined && z == undefined)
        {
            y = x;
            z = x;
        }

        let scale = new Matrix4();
        scale.m00 = x;
        scale.m11 = y;
        scale.m22 = z;

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

class Face
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

class Model
{
    constructor(vPositions, vTexCoords, vNormals, indices)
    {
        this.vPositions = vPositions;
        this.vTexCoords = vTexCoords;
        this.vNormals = vNormals;
        this.indices = indices;
        this.faces = [];

        for (let i = 0; i < this.indices.length; i++)
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
        return new Vector3(this.vPositions[pos][0], this.vPositions[pos][1], this.vPositions[pos][2]);
    }

    getTexCoord(tex)
    {
        return new Vector2(this.vTexCoords[tex][0], this.vTexCoords[tex][1]);
    }

    getNormal(nor)
    {
        return new Vector3(this.vNormals[nor][0], this.vNormals[nor][1], this.vNormals[nor][2]);
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
        this.sunIntensity = 1.3;
        this.sunPosRelativeToZero = new Vector3(1, 0.4, 0.3).normalized();
        this.ambient = 0.2;

        this.transform = new Matrix4();
        this.difuseMap = textures.sample0;
        this.normalMap = textures.default_normal;

        this.tbn = new Matrix4();
    }

    update(delta)
    {
        let matrix = new Matrix4().rotate(0, delta, 0);

        this.sunPosRelativeToZero = matrix.mulVector(this.sunPosRelativeToZero, 0);
        this.sunDirVS = player.cameraTransform.mulVector(this.sunPosRelativeToZero.mul(-1), 0);
    }

    renderView()
    {
        for (let i = 0; i < this.zBuffer.length; i++)
            this.zBuffer[i] = 100000;

        const r = new Random(123);

        const s = 30.0;

        renderFlag = 0;
        for (let i = 0; i < 100; i++)
        {
            if (i % 2 == 0) this.setTexture(textures.pepe);
            else this.setTexture(textures.container);

            const pos = new Vector3(r.nextFloat() * s - s / 2.0, r.nextFloat() * s - s / 2.0, r.nextFloat() * s - s / 2.0);
            const rot = new Vector3(time / 5 * (i % 3), time / 10.0 * (i % 5), time / 5 * (i % 7));
            const scale = new Vector3(1, 1, 1);
            this.transform = createTransformMatrix(pos, rot, scale);

            this.drawCube(new Vector3(0, 0, 0), new Vector3(1, 1, 1), true);
        }

        // this.drawTriangle(new Vertex(new Vector3(0, 0, -1), 0xfffffff, new Vector2(0, 1)),
        //  new Vertex(new Vector3(0, 0, -2), 0xfffffff, new Vector2(0, 0)),
        //   new Vertex(new Vector3(1, 0, -2), 0xfffffff, new Vector2(1, 0)), textures.container);

        // this.drawPoint(new Vertex(new Vector3(0, 0, 0), 0xff00ff));

        renderFlag = RENDER_FACE_NORMAL;
        // this.drawLine(new Vertex(this.sunPosRelativeToZero.mul(3).add(new Vector3(0, 0, -3)), 0xff0000), new Vertex(new Vector3(0, 0, -3), 0x00ff00));

        // this.drawPoint(new Vertex(this.sunPosRelativeToZero.mul(3), 0xffffff));
        // this.drawLine(new Vertex(new Vector3(-3, -3, -3), 0xff0000), new Vertex(new Vector3(5, 2, -8), 0x00ff00));


        renderFlag = 0;
        this.transform = new Matrix4().translate(2, 1, -5);
        // this.transform = new Matrix4().translate(2, 1, -5).rotate(time, 0, time);
        this.setTexture(textures.pepe);
        this.drawModel(models.sphere);

        // this.transform = new Matrix4().translate(-2, 1, -5);
        this.transform = new Matrix4().translate(-2, 1, -5);
        // this.transform = this.transform.rotate(0, time, 0);
        this.transform = this.transform.scale(1);
        // this.setTexture(textures.brickwall, textures.brickwall_normal);
        this.setTexture(textures.rock, textures.rock_normal, true);
        this.drawModel(models.sharprock, FLIP_NORMALMAP_Y | RENDER_CCW);

        this.drawSkyBox(time / 100.0);

        renderFlag = RENDER_TANGENT_SPACE;
        this.transform = new Matrix4().translate(0, 0, -2);
        this.transform = this.transform.rotate(0, 0, 0);
        this.transform = this.transform.scale(2, 2, 2);
        this.setTexture(textures.brickwall, textures.brickwall_normal);
        let f = new Face(new Vertex(new Vector3(-1, 0, 0), 0xffffff, new Vector2(0, 0)),
            new Vertex(new Vector3(0, 1, 0), 0xffffff, new Vector2(0.5, 1)),
            new Vertex(new Vector3(1, 0, 0), 0xffffff, new Vector2(1, 0)));
        f.calcNormal();
        f.calcTangentAndBiTangent();
        this.drawFace(f);
    }

    drawPoint(v)
    {
        v = this.playerTransform(v);

        if (v.pos.z < zClipNear) return;

        const sx = int((v.pos.x / v.pos.z * FOV + WIDTH / 2.0));
        const sy = int((v.pos.y / v.pos.z * FOV + HEIGHT / 2.0));

        this.renderPixel(new Vector3(sx, sy, v.pos.z), v.color);
    }

    drawLine(v0, v1)
    {
        v0 = this.playerTransform(v0);
        v1 = this.playerTransform(v1);

        // z-Clipping
        if (v0.pos.z < zClipNear && v1.pos.z < zClipNear) return undefined;

        if (v0.pos.z < zClipNear)
        {
            let per = (zClipNear - v0.pos.z) / (v1.pos.z - v0.pos.z);
            v0.pos = v0.pos.add(v1.pos.sub(v0.pos).mul(per));
            v0.color = lerpVector2(v0.color, v1.color, per);
        }

        if (v1.pos.z < zClipNear)
        {
            let per = (zClipNear - v1.pos.z) / (v0.pos.z - v1.pos.z);
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
        if ((renderFlag & 1) == 1)
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
        if (((renderFlag >> 2) & 1) == 1)
        {
            this.drawLine(new Vertex(center, 0xffffff), new Vertex(center.add(v0.normal.add(v1.normal).add(v2.normal).normalized().mul(0.2)), 0xff00ff));
        }

        // Render Vertex normal
        if (((renderFlag >> 4) & 1) == 1)
        {
            const pos = v0.pos;
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.normal.mul(0.2)), 0x0000ff));
        }

        // Render Tangent space
        if (((renderFlag >> 5) & 1) == 1 && v0.tangent != undefined)
        {
            const pos = v0.pos;
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.tangent.mul(0.2)), 0xff0000));
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.biTangent.mul(0.2)), 0x00ff00));
            this.drawLine(new Vertex(pos, 0xffffff), new Vertex(pos.add(v0.normal.mul(0.2)), 0x0000ff));
        }

        v0 = this.playerTransform(v0);
        v1 = this.playerTransform(v1);
        v2 = this.playerTransform(v2);

        if (this.normalMap != undefined)
        {
            this.tbn = this.tbn.fromAxis(v0.tangent, v0.biTangent, v0.normal.add(v1.normal).add(v2.normal).normalized());
            // console.log(this.tbn);
            // throw "asd";
        }

        if (v0.pos.z < zClipNear && v1.pos.z < zClipNear && v2.pos.z < zClipNear) return;
        else if (v0.pos.z > zClipNear && v1.pos.z > zClipNear && v2.pos.z > zClipNear)
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
        let lightCalc = true;

        if (((renderFlag >> 1) & 1) == 1) depthMin = 9999;
        if (((renderFlag >> 3) & 1) == 1) lightCalc = false;

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
                    // let c = lerp3AttributeVec3(v0.color, v1.color, v2.color, w0, w1, w2, z0, z1, z2, z);
                    let n = lerp3AttributeVec3(vp0.normal, vp1.normal, vp2.normal, w0, w1, w2, z0, z1, z2, z);

                    if (this.normalMap != undefined)
                    {
                        let sampledNormal = this.sample(this.normalMap, uv.x, uv.y);
                        sampledNormal = convertColor2Vector(sampledNormal).normalized();
                        if (((renderFlag >> 6) & 1) == 1)
                            sampledNormal.y *= -1;
                        sampledNormal = this.tbn.mulVector(sampledNormal, 0);
                        n = sampledNormal;
                    }

                    let color = this.sample(this.difuseMap, uv.x, uv.y);

                    if (lightCalc)
                    {
                        let diffuse = this.sunDirVS.mul(-1).dot(n) * this.sunIntensity;
                        diffuse = clamp(diffuse, this.ambient, 1.0);

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
            renderFlag |= RENDER_CCW;
        else
            renderFlag = flag;

        for (let i = 0; i < model.faces.length; i++)
            this.drawFace(model.faces[i]);

        renderFlag = 0;
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
        renderFlag = SET_Z_9999 | EFFECT_NO_LIGHT;

        let size = new Vector3(1000, 1000, 1000);
        let pos = player.pos.sub(new Vector3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));
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

        this.setTexture(textures.skybox_front);
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11));

        this.setTexture(textures.skybox_right);
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.setTexture(textures.skybox_left);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p011, 0xffffff, t10));
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11));

        this.setTexture(textures.skybox_back);
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p010, 0xffffff, t10));
        this.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));

        this.setTexture(textures.skybox_top);
        this.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p111, 0xffffff, t11));

        this.setTexture(textures.skybox_bottom);
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p001, 0xffffff, t00), new Vertex(p101, 0xffffff, t10));
        this.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p101, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        renderFlag = 0;
    }

    playerTransform(v)
    {
        const newPos = player.cameraTransform.mulVector(new Vector3(v.pos.x, v.pos.y, -v.pos.z));
        let newNor = undefined;
        if (v.normal != undefined) newNor = player.cameraTransform.mulVector(v.normal, 0).normalized();
        let newTan = undefined;
        if (v.tangent != undefined) newTan = player.cameraTransform.mulVector(v.tangent, 0).normalized();
        let newBiTan = undefined;
        if (v.biTangent != undefined) newBiTan = player.cameraTransform.mulVector(v.biTangent, 0).normalized();

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
            if (typeof c != "number") c = convertVector2Color(c);

            this.pixels[p.x + (HEIGHT - 1 - p.y) * this.width] = c;
            this.zBuffer[p.x + (HEIGHT - 1 - p.y) * this.width] = p.z;
        }
    }

    checkOutOfScreen(p)
    {
        return p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height;
    }

    setTexture(diffuseMap, normalMap, normalMapFlipY)
    {
        this.difuseMap = diffuseMap;
        this.normalMap = normalMap;
        this.normalMapFlipY = normalMapFlipY;
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

    sample = new Bitmap(64, 64);
    sample.clear(0xffffff);
    textures["white"] = sample;

    sample = new Bitmap(64, 64);
    sample.clear(0x8080ff);
    textures["default_normal"] = sample;

    player = new Player();
}

function run()
{
    const now = performance.now();
    while (times.length > 0 && times[0] <= now - 1000) times.shift();

    const delta = (now - times[times.length - 1]) / 1000.0;
    // console.log(delta / 1000.0);

    times.push(now);
    fps = times.length;
    frameCounterElement.innerHTML = fps + "fps";

    if (!started && loadedResources == resourceReady)
    {
        started = true;
        cvs.setAttribute("width", WIDTH * SCALE + "px");
        cvs.setAttribute("height", HEIGHT * SCALE + "px");
        gfx.font = "48px verdana";
    }

    if (started && !pause)
    {
        update(delta);
        render();
        time += delta;
    }
    else if (pause)
    {
        gfx.fillText("PAUSE", 4, 40);
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

            for (let ys = 0; ys < scale; ys++)
            {
                for (let xs = 0; xs < scale; xs++)
                {
                    const ptr = ((x * scale) + xs + ((y * scale) + ys) * res.width) * 4;

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

function clamp(v, min, max)
{
    return (v < min) ? min : (max < v) ? max : v;
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

function convertColor2Vector(hex)
{
    const r = ((hex >> 16) & 0xff) / 127.5 - 1.0;
    const g = ((hex >> 8) & 0xff) / 127.5 - 1.0;
    const b = (hex & 0xff) / 127.5 - 1.0;

    return new Vector3(r, g, b);
}

function convertVector2Color(vec3)
{
    return (vec3.x << 16) | (vec3.y << 8) | vec3.z;
}

function mulColor(hex, per)
{
    const r = clamp(((hex >> 16) & 0xff) * per, 0, 255);
    const g = clamp(((hex >> 8) & 0xff) * per, 0, 255);
    const b = clamp((hex & 0xff) * per, 0, 255);

    return int((r << 16)) | int(g << 8) | int(b);
}

function createTransformMatrix(pos, rot, scale)
{
    return new Matrix4().translate(pos.x, pos.y, pos.z).rotate(rot.x, rot.y, rot.z).scale(scale.x, scale.y, scale.z);
}

window.onload = start;

// Load models
for (const key in models)
{
    if (Object.hasOwnProperty.call(models, key))
    {
        const modelURL = models[key];

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

                models[key] = new Model(positions, texCoords, normals, indices);
            }
        }
    }
}