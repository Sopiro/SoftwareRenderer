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

let FOV = HEIGHT / SCALE

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

class Player
{
    constructor()
    {
        this.speed = 3.0;
        this.rotSpeed = 60.0;

        this.x = 0.0;
        this.y = 0.0;
        this.z = 0.0;

        this.rotX = 0.0;
        this.rotY = 0.0;
        this.rotZ = 0.0;

        this.sinX = 0.0;
        this.sinY = 0.0;
        this.cosX = 0.0;
        this.cosY = 0.0;
        this.sinZ = 0.0;
        this.cosZ = 0.0;
    }

    update(delta)
    {
        this.sinX = Math.sin(-this.rotX * Math.PI / 180.0);
        this.cosX = Math.cos(-this.rotX * Math.PI / 180.0);
        this.sinY = Math.sin(-this.rotY * Math.PI / 180.0);
        this.cosY = Math.cos(-this.rotY * Math.PI / 180.0);
        this.sinZ = Math.sin(-this.rotZ * Math.PI / 180.0);
        this.cosZ = Math.cos(-this.rotZ * Math.PI / 180.0);

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
            this.rotX -= mouse.dy * 0.1 * this.rotSpeed * delta;
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
    }

    update(delta)
    {

    }

    renderPerspective()
    {
        let r = new Random(123);

        for (let i = 0; i < 1000; i++)
        {
            this.renderPoint(r.nextFloat() * 1 - 0.5, r.nextFloat() * 1 - 0.5, -2, r.nextFloat() * 0xffffff);
        }

        this.renderPoint(3, 0, 3, 0x000000);
        this.renderPoint(-3, 0, 3, 0xff0000);
        this.renderPoint(3, 0, -3, 0x00ff00);
        this.renderPoint(-3, 0, -3, 0x0000ff);
    }

    renderPoint(x, y, z, color)
    {
        if (color == undefined) color = 0xff00ff;

        let ox = x - player.x;
        let oy = y + player.y;
        let oz = -z + player.z;

        // Combined XYZ Rotation
        let xx = ox * (+player.cosY * player.cosZ) + oy * (-player.cosY * player.sinZ) + oz * (+player.sinY);
        let yy = ox * (+player.sinX * player.sinY * player.cosZ + player.cosX * player.sinZ) + oy * (-player.sinX * player.sinY * player.sinZ + player.cosX * player.cosZ) + oz * (-player.sinX * player.cosY);
        let zz = ox * (-player.cosX * player.sinY * player.cosZ + player.sinX * player.sinZ) + oy * (+player.cosX * player.sinY * player.sinZ + player.sinX * player.cosZ) + oz * (+player.cosX * player.cosY);

        if (zz < 0) return;

        let sx = Math.floor((xx * FOV / zz + WIDTH / 2.0));
        let sy = Math.floor((yy * FOV / zz + HEIGHT / 2.0));

        if (sx < 0 || sx >= this.width || sy < 0 || sy >= this.height) return;

        this.pixels[sx + sy * this.width] = color;

        // this.pixels[0] = 0xffffff;
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

window.onload = start;
