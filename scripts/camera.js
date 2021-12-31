import { Vector3, Matrix4 } from "./math.js";
import * as Input from "./input.js";

export class Camera
{
    constructor()
    {
        this.speed = 3.0;
        this.rotSpeed = 60.0;

        this.pos = new Vector3(0.0, 0.0, 0.0);
        this.rot = new Vector3(0.0, 0.0, 0.0);
        this.cameraTransform = new Matrix4();
    }

    // Handle camera movement
    update(delta)
    {
        this.speed = 3.0;

        if (Input.isKeyDown("Shift")) this.speed = 6.0;

        let ax = 0.0;
        let az = 0.0;

        if (Input.isKeyDown("a")) ax--;
        if (Input.isKeyDown("d")) ax++;
        if (Input.isKeyDown("w")) az--;
        if (Input.isKeyDown("s")) az++;

        this.pos.x += (Math.cos(this.rot.y * Math.PI / 180.0) * ax + Math.sin(this.rot.y * Math.PI / 180.0) * az) * this.speed * delta;
        this.pos.z += (-Math.sin(this.rot.y * Math.PI / 180.0) * ax + Math.cos(this.rot.y * Math.PI / 180.0) * az) * this.speed * delta;

        if (Input.isKeyDown(" ")) this.pos.y += this.speed * delta;
        if (Input.isKeyDown("c")) this.pos.y -= this.speed * delta;

        if (Input.isMouseDown())
        {
            this.rot.y -= Input.mouseAcceleration.x * 0.1 * this.rotSpeed * delta;
            this.rot.x -= -Input.mouseAcceleration.y * 0.1 * this.rotSpeed * delta;
        }

        const radRot = this.rot.mul(-Math.PI / 180.0);
        this.cameraTransform = new Matrix4().rotate(radRot.x, radRot.y, radRot.z);
        this.cameraTransform = this.cameraTransform.translate(-this.pos.x, -this.pos.y, -this.pos.z);
    }
}
