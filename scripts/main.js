let WIDTH = 800;
let HEIGHT = 600;
let SCALE = 4;

let d = new Date();
let previousTime = 0;
let currentTime = 0;
let passedTime = 0;
let msPerFrame = 1000.0 / 144.0;

let imageData;

let cvs;
let gfx;

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

    WIDTH = WIDTH / SCALE;
    HEIGHT = HEIGHT / SCALE;

    imageData = new ImageData(WIDTH, HEIGHT);

    previousTime = new Date().getTime();
}

function run(time)
{
    let currentTime = new Date().getTime();
    passedTime += currentTime - previousTime;
    previousTime = currentTime;

    while (passedTime >= msPerFrame)
    {
        update(msPerFrame);
        render();
        passedTime -= msPerFrame;
    }

    requestAnimationFrame(run);
}

function update(msPerFrame)
{
    for (let index = 0; index < imageData.data.length; index++)
    {
        imageData.data[index] = Math.random() * 255;
    }
}

function render()
{
    gfx.putImageData(imageData, 0, 0);
}

window.onload = start;