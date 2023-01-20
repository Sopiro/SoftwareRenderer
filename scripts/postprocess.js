
import { Vector3 } from "./math.js";
import * as Util from "./utils.js";

const gaussianBlurKernel = [
    1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
    2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0,
    1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0,
];

const sharpenKernel = [
    0.0, -1.0, 0.0,
    -1.0, 5.0, -1.0,
    0.0, -1.0, 0.0,
];

const edgeKernel = [
    -1.0, -1.0, -1.0,
    -1.0, 8.0, -1.0,
    -1.0, -1.0, -1.0,
];

export function postProcess(bitmap, postprocessEnabled)
{
    // Sharpen
    if (postprocessEnabled[0])
    {
        let result = new Uint32Array(bitmap.width * bitmap.height);

        for (let i = 0; i < bitmap.pixels.length; ++i)
        {
            const x = i % bitmap.width;
            const y = Math.floor(i / bitmap.width);

            const kernelResult = kernel(bitmap, sharpenKernel, x, y);

            result[i] = kernelResult;
        }

        bitmap.pixels = result;
    }

    // Edge detection
    if (postprocessEnabled[1])
    {
        let result = new Uint32Array(bitmap.width * bitmap.height);

        for (let i = 0; i < bitmap.pixels.length; ++i)
        {
            const x = i % bitmap.width;
            const y = Math.floor(i / bitmap.width);

            const kernelResult = kernel(bitmap, edgeKernel, x, y);

            result[i] = kernelResult;
        }

        bitmap.pixels = result;
    }

    // Vignette & pixel noise
    if (postprocessEnabled[2] || postprocessEnabled[3])
    {
        for (let i = 0; i < bitmap.pixels.length; ++i)
        {
            const x = i % bitmap.width;
            const y = Math.floor(i / bitmap.width);

            const p = (x - bitmap.width / 2.0) / (bitmap.width / 5);
            const q = (y - bitmap.height / 2.0) / (bitmap.height / 5.0);

            let z = bitmap.zBuffer[i];
            if (z > 5000) z = 3;

            const vignette = 20 - ((z * 3 * (p * p * 1.1))) - ((z * 3 * (q * q * 1.4)));
            const noise = (x * 5 + (y * 2) & 3) * 16 >> 3 << 3;

            let shade = 0;
            if (postprocessEnabled[2]) shade += vignette;
            if (postprocessEnabled[3]) shade += noise;

            const color = bitmap.pixels[x + y * bitmap.width];

            bitmap.pixels[x + y * bitmap.width] = Util.addColor(color, shade);
        }
    }

    // Gaussian Blur
    if (postprocessEnabled[4])
    {
        let result = new Uint32Array(bitmap.width * bitmap.height);

        for (let i = 0; i < bitmap.pixels.length; ++i)
        {
            const x = i % bitmap.width;
            const y = Math.floor(i / bitmap.width);

            const kernelResult = kernel(bitmap, gaussianBlurKernel, x, y);

            result[i] = kernelResult;
        }

        bitmap.pixels = result;
    }
}

function kernel(texture, kernel, xp, yp)
{
    const kernelSize = Math.sqrt(kernel.length);

    let res = new Vector3(0, 0, 0);

    for (let y = 0; y < kernelSize; ++y)
    {
        for (let x = 0; x < kernelSize; ++x)
        {
            let xx = xp - Math.floor(kernelSize / 2) + x;
            let yy = yp - Math.floor(kernelSize / 2) + y;

            if (xx < 0) xx = 0;
            if (xx >= texture.width) xx = texture.width - 1;
            if (yy < 0) yy = 0;
            if (yy >= texture.height) yy = texture.height - 1;

            const sample = Util.convertColorToVectorRange1(texture.pixels[xx + yy * texture.width]);

            const kernelValue = kernel[x + y * kernelSize];

            res = res.add(sample.mul(kernelValue));
        }
    }

    res = Util.clipColorVector(res.mul(255));
    res = Util.convertVectorToColorHex(res);

    return res;
}