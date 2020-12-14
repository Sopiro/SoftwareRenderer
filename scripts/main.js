let WIDTH = 800;
let HEIGHT = 600;
let SCALE = 4;

let previousTime = 0;
let passedTime = 0;
let msPerFrame = 1000.0 / 60.0;
let timer = 0;
let frameCounter = 0;

let view;

let cvs;
let gfx;

let frameCounterElement;

let globalAlpha = 255;

let pause = false
let time = 0;


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

                this.pixels[xx + yy * this.width] = bitmap[x + y * bitmap.width];
            }
        }
    }
}

class View extends Bitmap
{

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
    for (let i = 0; i < view.pixels.length; i++)
    {
        view.pixels[i] = Math.random() * 0xffffff;
    }
}

function render()
{
    let b = new Bitmap(10, 10);

    view.render(b, Math.floor(time * 10.0), 10);

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
