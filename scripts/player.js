import { Vector3 } from "./vec3.js";
import { Matrix4 } from "./mat4.js";

export class Player
{
    constructor(keys, mouse)
    {
        this.keys = keys;
        this.mouse = mouse;

        this.speed = 3.0;
        this.rotSpeed = 60.0;

        this.pos = new Vector3(0.0, 0.0, 0.0);
        this.rot = new Vector3(0.0, 0.0, 0.0);
        this.cameraTransform = new Matrix4();
    }

    update(delta)
    {
        this.speed = 3.0;

        if (this.keys.shift) this.speed = 6.0;

        let ax = 0.0;
        let az = 0.0;

        if (this.keys.left) ax--;
        if (this.keys.right) ax++;
        if (this.keys.up) az--;
        if (this.keys.down) az++;

        this.pos.x += (Math.cos(this.rot.y * Math.PI / 180.0) * ax + Math.sin(this.rot.y * Math.PI / 180.0) * az) * this.speed * delta;
        this.pos.z += (-Math.sin(this.rot.y * Math.PI / 180.0) * ax + Math.cos(this.rot.y * Math.PI / 180.0) * az) * this.speed * delta;

        if (this.keys.space) this.pos.y += this.speed * delta;
        if (this.keys.c) this.pos.y -= this.speed * delta;
        if (this.keys.q) this.rot.y += this.rotSpeed * delta;
        if (this.keys.e) this.rot.y -= this.rotSpeed * delta;

        if (this.mouse.down)
        {
            this.rot.y -= this.mouse.dx * 0.1 * this.rotSpeed * delta;
            this.rot.x -= this.mouse.dy * 0.1 * this.rotSpeed * delta;
        }

        const radRot = this.rot.mul(-Math.PI / 180.0);
        this.cameraTransform = new Matrix4().rotate(radRot.x, radRot.y, radRot.z);
        this.cameraTransform = this.cameraTransform.translate(-this.pos.x, -this.pos.y, -this.pos.z);
    }
}
