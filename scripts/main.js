let WIDTH = 800;
let HEIGHT = 600;
let SCALE = 4;

let previousTime = 0;
let passedTime = 0;
let msPerFrame = 1000.0 / 60.0;

let screen;

let cvs;
let gfx;

let frameTime;

let a = 255;

class Bitmap
{
    constructor(width, height)
    {
        this.width = width;
        this.height = height;
        this.pixels = new Uint32Array(width * height);
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

    cvs.onfocus = function()
    {
        console.log(1);
    }

    cvs.focus();

    frameTime = document.getElementById("frame");

    WIDTH = WIDTH / SCALE;
    HEIGHT = HEIGHT / SCALE;

    previousTime = new Date().getTime();

    screen = new Bitmap(WIDTH, HEIGHT);

    for (let i = 0; i < WIDTH * HEIGHT; i++)
    {
        screen.pixels[i] = Math.random() * 0xffffff;
    }
}

function run(time)
{
    let currentTime = new Date().getTime();
    passedTime += currentTime - previousTime;
    previousTime = currentTime;

    while (passedTime >= msPerFrame)
    {
        update(passedTime);
        render();
        passedTime -= msPerFrame;
    }

    requestAnimationFrame(run);
}

function update(delta)
{
    for (let i = 0; i < screen.pixels.length; i++)
    {
        screen.pixels[i] = Math.random() * 0xffffff;
    }

    frameTime.innerHTML = Math.floor(1000.0 / delta) + "fps";
}

function render()
{
    gfx.putImageData(convert(screen, SCALE), 0, 0);
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
                    res.data[ptr + 3] = a;
                }
            }
        }
    }

    return res;
}

window.onload = start;