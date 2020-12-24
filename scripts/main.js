let WIDTH = 800;
let HEIGHT = 600;
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

let FOV = 70

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

        this.px = 0.0;
        this.py = 0.0;
        this.pz = 0.0;
        this.rotX = 0.0;
        this.rotY = 0.0;
    }

    renderPerspective()
    {
        this.rotX = Math.cos(time) * 30;
        this.rotY = Math.sin(time) * 30;

        for (let i = 0; i < 1000; i++)
        {
            this.renderPoint(Math.random() * 1 - 0.5, Math.random() * 1 - 0.5, 1);
        }

        // this.renderPoint(10, 10, 2);
    }

    renderPoint(ox, oy, oz)
    {
        let sinX = Math.sin(this.rotX * Math.PI / 180.0);
        let cosX = Math.cos(this.rotX * Math.PI / 180.0);
        let sinY = Math.sin(this.rotY * Math.PI / 180.0);
        let cosY = Math.cos(this.rotY * Math.PI / 180.0);

        let x = this.px + ox;
        let y = this.py + oy;
        let z = this.pz + oz;

        x = cosY * x + sinY * z;
        y = sinX * sinY * x + cosX * y - sinX * sinY * z;
        z = -cosX * sinY * x + sinX * y + cosX * cosY * z;

        if (z < 0) return;

        let xx = Math.floor((x * FOV / z + WIDTH / 2.0));
        let yy = Math.floor((y * FOV / z + HEIGHT / 2.0));

        if (xx < 0 || xx >= this.width || yy < 0 || yy >= this.height)
            return;

        this.pixels[xx + yy * this.width] = 0xff00ff;

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

    window.addEventListener("click", function ()
    {
        pause = !pause;
    }, false);

    frameCounterElement = document.getElementById("frame_counter");

    WIDTH = WIDTH / SCALE;
    HEIGHT = HEIGHT / SCALE;

    previousTime = new Date().getTime();

    view = new View(WIDTH, HEIGHT);

    for (let i = 0; i < WIDTH * HEIGHT; i++)
    {
        view.pixels[i] = Math.random() * 0xffffff;
    }
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
            update(passedTime);
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

        passedTime -= msPerFrame;
    }

    requestAnimationFrame(run);
}

function update(delta)
{
    // for (let i = 0; i < view.pixels.length; i++)
    // {
    //     view.pixels[i] = Math.random() * 0xffffff;
    // }
}

function render()
{
    view.clear(0x000000);

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
