let WIDTH = 800;
let HEIGHT = WIDTH / 4 * 3;
let SCALE = 4;

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

let keys = { up: false, down: false, left: false, right: false, q: false, e: false };
let mouse = { down: false, lastX: 0.0, lastY: 0.0, currX: 0.0, currY: 0.0, dx: 0.0, dy: 0.0 };

let player;

const FOV = HEIGHT / SCALE
const zClip = 0.1;
let backFaceCulling = false;

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

class Vertex
{
    constructor(x, y, z, color)
    {
        this.x = x;
        this.y = y;
        this.z = z;
        if (color == undefined) color = 0xff00ff;
        this.color = color;
    }
}

class Pixel
{
    constructor(x, y, color)
    {
        this.x = x;
        this.y = y;
        if (color == undefined) color = 0xff00ff;
        this.color = color;
    }
}

class Player
{
    constructor()
    {
        this.speed = 3.0;
        this.rotSpeed = 60.0;

        this.x = 0.0; this.y = 0.0; this.z = 0.0;

        this.rotX = 0.0; this.rotY = 0.0; this.rotZ = 0.0;

        this.sinX = 0.0; this.cosX = 0.0;
        this.sinY = 0.0; this.cosY = 0.0;
        this.sinZ = 0.0; this.cosZ = 0.0;
    }

    update(delta)
    {
        this.sinX = Math.sin(-this.rotX * Math.PI / 180.0); this.cosX = Math.cos(-this.rotX * Math.PI / 180.0);
        this.sinY = Math.sin(-this.rotY * Math.PI / 180.0); this.cosY = Math.cos(-this.rotY * Math.PI / 180.0);
        this.sinZ = Math.sin(-this.rotZ * Math.PI / 180.0); this.cosZ = Math.cos(-this.rotZ * Math.PI / 180.0);

        // Right hand coordinate system

        let ax = 0.0;
        let az = 0.0;

        if (keys.left) ax--;
        if (keys.right) ax++;
        if (keys.up) az--;
        if (keys.down) az++;

        this.x += (this.cosY * ax + this.sinY * az) * this.speed * delta;
        this.z += (-this.sinY * ax + this.cosY * az) * this.speed * delta;

        if (keys.space) this.y += this.speed * delta;
        if (keys.ctrl) this.y -= this.speed * delta;
        if (keys.q) this.rotY -= this.rotSpeed * delta;
        if (keys.e) this.rotY += this.rotSpeed * delta;

        if (mouse.down)
        {
            this.rotY += mouse.dx * 0.1 * this.rotSpeed * delta;
            this.rotX += mouse.dy * 0.1 * this.rotSpeed * delta;
        }
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

                let color = bitmap.pixels[x + y * bitmap.width];

                this.pixels[xx + yy * this.width] = color;
            }
        }
    }

    clear(color)
    {
        for (let i = 0; i < this.pixels.length; i++)
        {
            this.pixels[i] = color;
        }
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

    renderPerspective()
    {
        for (let i = 0; i < this.zBuffer.length; i++)
            this.zBuffer[i] = 10000;

        let r = new Random(123);

        for (let i = 0; i < 2000; i++)
        {
            this.drawPoint(new Vertex(r.nextFloat() * 1 - 0.5, r.nextFloat() * 1 - 0.5, 0, 0xffffff));
        }

        for (let i = 0; i < 2000; i++)
        {
            this.drawPoint(new Vertex(r.nextFloat() * 1 - 0.5, r.nextFloat() * 1 - 0.5, -3.5, 0x8080ff));
        }

        for (let i = 0; i < 2000; i++)
        {
            this.drawPoint(new Vertex(r.nextFloat() * 1 - 0.5, r.nextFloat() * 1 - 0.5, -5, 0xf080f0));
        }

        for (let i = 0; i < 2000; i++)
        {
            this.drawPoint(new Vertex(r.nextFloat() * 1 - 0.5, -1, r.nextFloat() * 1 - 0.5 - 1, 0x404040));
        }


        // this.drawPoint(new Vertex(3, 0, 3));
        // this.drawPoint(new Vertex(-3, 0, 3));
        // this.drawPoint(new Vertex(3, 0, -3));
        // this.drawPoint(new Vertex(-3, 0, -3));

        this.drawLine(new Vertex(-3, 0, -1, 0xff0000), new Vertex(2, 0.5, -2, 0x00ff00));

        this.drawLine(new Vertex(-3, 0, 1, 0x000000), new Vertex(2, 0.5, 2, 0xffffff));
    }

    drawPoint(v)
    {
        let vp = this.playerTransform(v);
        let sp = this.convertIntoScreenSpace(vp);

        if (sp != undefined) this.renderPixel(sp, vp.z);
    }

    drawLine(v0, v1)
    {
        let vp0 = this.playerTransform(v0);
        let vp1 = this.playerTransform(v1);

        // z-Clipping
        if (vp0.z < zClip && vp1.z < zClip) return;

        if (vp0.z < zClip)
        {
            let zp = (zClip - vp0.z) / (vp1.z - vp0.z);
            vp0.z = vp0.z + (vp1.z - vp0.z) * zp;
            vp0.x = vp0.x + (vp1.x - vp0.x) * zp;
            vp0.y = vp0.y + (vp1.y - vp0.y) * zp;
        }

        if (vp1.z < zClip)
        {
            let zp = (zClip - vp1.z) / (vp0.z - vp1.z);
            vp1.z = vp1.z + (vp0.z - vp1.z) * zp;
            vp1.x = vp1.x + (vp0.x - vp1.x) * zp;
            vp1.y = vp1.y + (vp0.y - vp1.y) * zp;
        }

        let p0 = new Pixel(vp0.x / vp0.z * FOV + WIDTH / 2.0, vp0.y / vp0.z * FOV + HEIGHT / 2.0, vp0.color);
        let p1 = new Pixel(vp1.x / vp1.z * FOV + WIDTH / 2.0, vp1.y / vp1.z * FOV + HEIGHT / 2.0, vp1.color);

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

        // if (p0.x < 0)
        // {
        //     p0.x = 0;
        // }
        // if (p0.y < 0)
        // {
        //     p0.y = 0;
        // }
        // if (p1.x > WIDTH)
        // {
        //     p1.x = WIDTH;
        // }
        // if (p1.y > HEIGHT)
        // {
        //     p1.y = HEIGHT;
        // }

        let dx = p1.x - p0.x;
        let dy = p1.y - p0.y;

        let m = Math.abs(dy / dx);

        if (m <= 1)
        {
            for (let x = Math.ceil(p0.x); x < Math.ceil(p1.x); x++)
            {
                let per = (x - p0.x) / (p1.x - p0.x);

                let y = p0.y + (p1.y - p0.y) * per;
                let z = vp0.z + (vp1.z - vp0.z) * per;

                let c = lerpColor(p0.color, p1.color, per);
                this.renderPixel(new Pixel(int(x), int(y), c), z);
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

            for (let y = Math.ceil(p0.y); y < Math.ceil(p1.y); y++)
            {
                let per = (y - p0.y) / (p1.y - p0.y);

                let x = p0.x + (p1.x - p0.x) * per;
                let z = vp0.z + (vp1.z - vp0.z) * per;

                let c = lerpColor(p0.color, p1.color, per);
                this.renderPixel(new Pixel(int(x), int(y), c), z);
            }
        }
    }

    playerTransform(p)
    {
        // Right-hand coordinate system
        let ox = p.x - player.x;
        let oy = p.y - player.y;
        let oz = -p.z + player.z;

        // Combined XYZ Rotation
        let xx = ox * (+player.cosY * player.cosZ) + oy * (-player.cosY * player.sinZ) + oz * (+player.sinY);
        let yy = ox * (+player.sinX * player.sinY * player.cosZ + player.cosX * player.sinZ) + oy * (-player.sinX * player.sinY * player.sinZ + player.cosX * player.cosZ) + oz * (-player.sinX * player.cosY);
        let zz = ox * (-player.cosX * player.sinY * player.cosZ + player.sinX * player.sinZ) + oy * (+player.cosX * player.sinY * player.sinZ + player.sinX * player.cosZ) + oz * (+player.cosX * player.cosY);

        return new Vertex(xx, yy, zz, p.color);
    }

    convertIntoScreenSpace(p)
    {
        if (p.z < 0) return undefined;

        let sx = int((p.x / p.z * FOV + WIDTH / 2.0));
        let sy = int((p.y / p.z * FOV + HEIGHT / 2.0));

        return new Pixel(sx, sy, p.color);
    }

    renderPixel(p, z)
    {
        if (!this.checkOutOfScreen(p) && z < this.zBuffer[p.x + (HEIGHT - 1 - p.y) * WIDTH])
        {
            this.pixels[p.x + (HEIGHT - 1 - p.y) * this.width] = p.color;
            this.zBuffer[p.x + (HEIGHT - 1 - p.y) * this.width] = z;
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
    cvs.setAttribute("width", WIDTH + "px");
    cvs.setAttribute("height", HEIGHT + "px");
    gfx = cvs.getContext("2d");
    gfx.font = "48px verdana";

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
        if (e.key == "Escape")
            pause = !pause;

        if (e.key == "w" || e.key == "ArrowUp") keys.up = true;
        if (e.key == "a" || e.key == "ArrowLeft") keys.left = true;
        if (e.key == "s" || e.key == "ArrowDown") keys.down = true;
        if (e.key == "d" || e.key == "ArrowRight") keys.right = true;
        if (e.key == " ") keys.space = true;
        if (e.key == "Control") keys.ctrl = true;
        if (e.key == "q") keys.q = true;
        if (e.key == "e") keys.e = true;
    });

    window.addEventListener("keyup", (e) =>
    {
        if (e.key == "w" || e.key == "ArrowUp") keys.up = false;
        if (e.key == "a" || e.key == "ArrowLeft") keys.left = false;
        if (e.key == "s" || e.key == "ArrowDown") keys.down = false;
        if (e.key == "d" || e.key == "ArrowRight") keys.right = false;
        if (e.key == " ") keys.space = false;
        if (e.key == "Control") keys.ctrl = false;
        if (e.key == "q") keys.q = false;
        if (e.key == "e") keys.e = false;
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

    player = new Player();
}

function run()
{
    let currentTime = new Date().getTime();
    passedTime += currentTime - previousTime;
    previousTime = currentTime;

    while (passedTime >= msPerFrame)
    {
        if (!pause)
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
        else
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

    view.renderPerspective();

    gfx.putImageData(convert(view, SCALE), 0, 0);
}

function convert(bitmap, scale)
{
    let res = new ImageData(bitmap.width * scale, bitmap.height * scale);

    for (let y = 0; y < bitmap.height; y++)
    {
        for (let x = 0; x < bitmap.width; x++)
        {
            let bitmapPixel = bitmap.pixels[x + y * bitmap.width]

            let r = (bitmapPixel >> 16) & 0xff;
            let g = (bitmapPixel >> 8) & 0xff;
            let b = bitmapPixel & 0xff;

            for (let ys = 0; ys < SCALE; ys++)
            {
                for (let xs = 0; xs < SCALE; xs++)
                {
                    let ptr = ((x * SCALE) + xs + ((y * SCALE) + ys) * res.width) * 4;

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
    return Math.floor(a);
}

function lerp(a, b, per)
{
    return a * (1.0 - per) + b * per;
}

function lerpColor(a, b, per)
{
    let ar = (a >> 16) & 0xff;
    let ag = (a >> 8) & 0xff;
    let ab = a & 0xff;

    let br = (b >> 16) & 0xff;
    let bg = (b >> 8) & 0xff;
    let bb = b & 0xff;

    let lerpR = lerp(ar, br, per);
    let lerpG = lerp(ag, bg, per);
    let lerpB = lerp(ab, bb, per);

    return (lerpR << 16) | (lerpG << 8) | lerpB;
}

window.onload = start;
