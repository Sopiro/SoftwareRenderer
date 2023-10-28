export class Bitmap
{
    constructor(width, height)
    {
        this.width = width;
        this.height = height;
        this.pixels = new Uint32Array(width * height);
    }

    // Render image onto this bitmap with offset
    render(other, ox, oy)
    {
        for (let y = 0; y < other.height; ++y)
        {
            let yy = oy + y;
            if (yy < 0 || yy >= this.height)
            {
                continue;
            }

            for (let x = 0; x < other.width; ++x)
            {
                let xx = ox + x;
                if (xx < 0 || xx >= this.width) 
                {
                    continue;
                }

                const color = other.pixels[x + y * other.width];

                this.pixels[xx + yy * this.width] = color;
            }
        }
    }

    clear(color)
    {
        for (let i = 0; i < this.pixels.length; ++i)
        {
            this.pixels[i] = color;
        }
    }
}
