import { Vector2, Vector3, Matrix4 } from "./math.js";
import { Bitmap } from "./bitmap.js";
import { Constants } from "./constants.js";

export function convertImageDataToBitmap(imageData, width, height)
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

export function convertBitmapToImageData(bitmap, scale = 1)
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

            if (scale == 1)
            {
                const ptr = ((x * scale) + ((y * scale)) * res.width) * 4;

                res.data[ptr] = r;
                res.data[ptr + 1] = g;
                res.data[ptr + 2] = b;
                res.data[ptr + 3] = Constants.globalAlpha;
                continue;
            }

            for (let ys = 0; ys < scale; ys++)
            {
                for (let xs = 0; xs < scale; xs++)
                {
                    const ptr = ((x * scale) + xs + ((y * scale) + ys) * res.width) * 4;

                    res.data[ptr] = r;
                    res.data[ptr + 1] = g;
                    res.data[ptr + 2] = b;
                    res.data[ptr + 3] = Constants.globalAlpha;
                }
            }
        }
    }

    return res;
}

export function int(a)
{
    return Math.ceil(a);
}

export function clamp(v, min, max)
{
    return (v < min) ? min : (max < v) ? max : v;
}

export function lerp(a, b, per)
{
    return a * (1.0 - per) + b * per;
}

export function lerpVector2(a, b, per)
{
    return a.mul(1 - per).add(b.mul(per));
}

export function lerpVector3(a, b, c, w0, w1, w2)
{
    const wa = a.mul(w0);
    const wb = b.mul(w1);
    const wc = c.mul(w2);

    return new Vector3(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y, wa.z + wb.z + wc.z);
}

export function lerp2AttributeVec3(a, b, w0, w1, z0, z1, z)
{
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);

    return new Vector3(wa.x + wb.x, wa.y + wb.y, wa.z + wb.z);
}

export function lerp3AttributeVec2(a, b, c, w0, w1, w2, z0, z1, z2, z)
{
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);
    const wc = c.mul(w2 / z2 * z);

    return new Vector2(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y);
}

export function lerp3AttributeVec3(a, b, c, w0, w1, w2, z0, z1, z2, z)
{
    const wa = a.mul(w0 / z0 * z);
    const wb = b.mul(w1 / z1 * z);
    const wc = c.mul(w2 / z2 * z);

    return new Vector3(wa.x + wb.x + wc.x, wa.y + wb.y + wc.y, wa.z + wb.z + wc.z);
}

export function convertColor2VectorRange1(hex)
{
    const r = ((hex >> 16) & 0xff) / 255.0;
    const g = ((hex >> 8) & 0xff) / 255.0;
    const b = (hex & 0xff) / 255.0;

    return new Vector3(r, g, b);
}

export function convertColor2VectorRange2(hex)
{
    const r = ((hex >> 16) & 0xff) / 127.5 - 1.0;
    const g = ((hex >> 8) & 0xff) / 127.5 - 1.0;
    const b = (hex & 0xff) / 127.5 - 1.0;

    return new Vector3(r, g, b);
}

export function convertColor2VectorRange255(hex)
{
    const r = ((hex >> 16) & 0xff);
    const g = ((hex >> 8) & 0xff);
    const b = (hex & 0xff);

    return new Vector3(r, g, b);
}

export function convertVector2ColorHex(vec3)
{
    return (vec3.x << 16) | (vec3.y << 8) | vec3.z;
}

export function clipColorVector(vec3)
{
    const nr = clamp(vec3.x, 0, 255);
    const ng = clamp(vec3.y, 0, 255);
    const nb = clamp(vec3.z, 0, 255);

    return new Vector3(nr, ng, nb);
}

export function mulColor(hex, per)
{
    const r = clamp(((hex >> 16) & 0xff) * per, 0, 255);
    const g = clamp(((hex >> 8) & 0xff) * per, 0, 255);
    const b = clamp((hex & 0xff) * per, 0, 255);

    return int((r << 16)) | int(g << 8) | int(b);
}

export function addColor(hex, val)
{
    const r = clamp(((hex >> 16) & 0xff) + val, 0, 255);
    const g = clamp(((hex >> 8) & 0xff) + val, 0, 255);
    const b = clamp((hex & 0xff) + val, 0, 255);

    return int((r << 16)) | int(g << 8) | int(b);
}

export function createTransformMatrix(pos, rot, scale)
{
    return new Matrix4().translate(pos.x, pos.y, pos.z).rotate(rot.x, rot.y, rot.z).scale(scale.x, scale.y, scale.z);
}
