import { Vector2, Vector3, Matrix4 } from "./math.js";
import { Vertex } from "./vertex.js";
import * as Resources from "./resources.js";
import * as Input from "./input.js";
import { SET_Z_9999, CALC_LIGHT, RENDER_FACE_NORMAL, RENDER_TANGENT_SPACE, DISABLE_NORMAL_MAPPING } from "./renderer.js";

export class Game
{
    constructor(renderer, camera)
    {
        this.r = renderer;
        this.camera = camera;
        this.time = 0;

        this.defaultRenderFlag = 0;
    }

    update(delta)
    {
        // Handle camera movement
        let speed = 5.0;
        let rotSpeed = 60.0;

        if (Input.isKeyDown("Shift")) speed *= 1.5;

        let ax = 0.0;
        let az = 0.0;

        if (Input.isKeyDown("a")) ax--;
        if (Input.isKeyDown("d")) ax++;
        if (Input.isKeyDown("w")) az--;
        if (Input.isKeyDown("s")) az++;

        if (new Vector2(ax, az).getLength() > 1)
        {
            ax /= 1.414;
            az /= 1.414;
        }

        this.camera.pos.x += (Math.cos(this.camera.rot.y * Math.PI / 180.0) * ax + Math.sin(this.camera.rot.y * Math.PI / 180.0) * az) * speed * delta;
        this.camera.pos.z += (-Math.sin(this.camera.rot.y * Math.PI / 180.0) * ax + Math.cos(this.camera.rot.y * Math.PI / 180.0) * az) * speed * delta;

        if (Input.isKeyDown(" ")) this.camera.pos.y += speed * delta;
        if (Input.isKeyDown("c")) this.camera.pos.y -= speed * delta;

        if (Input.isMouseDown())
        {
            this.camera.rot.y -= Input.mouseAcceleration.x * 0.1 * rotSpeed * delta;
            this.camera.rot.x -= -Input.mouseAcceleration.y * 0.1 * rotSpeed * delta;
        }

        const radRot = this.camera.rot.mul(-Math.PI / 180.0);
        this.camera.cameraTransform = new Matrix4().rotate(radRot.x, radRot.y, radRot.z);
        this.camera.cameraTransform = this.camera.cameraTransform.translate(-this.camera.pos.x, -this.camera.pos.y, -this.camera.pos.z);

        // Control directional light
        if (Input.isKeyDown("q")) this.r.sun.rotation.y += delta;
        if (Input.isKeyDown("e")) this.r.sun.rotation.y -= delta;
        if (Input.isKeyDown("r")) this.r.sun.rotation.z += delta;
        if (Input.isKeyDown("f")) this.r.sun.rotation.z -= delta;

        // Control sun intensity
        if (Input.isKeyDown("i")) this.r.sun.intensity *= 1.1;
        if (Input.isKeyDown("o")) this.r.sun.intensity *= 1 / 1.1;

        let matrix = new Matrix4().rotate(this.r.sun.rotation.x, this.r.sun.rotation.y, this.r.sun.rotation.z);
        let sunDir = matrix.mulVector(this.r.sun.posRelativeToZero, 0).normalized().mul(-1);
        this.r.sun.dirVS = this.camera.cameraTransform.mulVector(sunDir, 0);

        this.time += delta;

        // Toggling render flags
        if (Input.isKeyPressed("n")) this.r.toggleRenderFlag(RENDER_FACE_NORMAL);
        if (Input.isKeyPressed("t")) this.r.toggleRenderFlag(RENDER_TANGENT_SPACE);
        if (Input.isKeyPressed("l")) this.r.toggleRenderFlag(CALC_LIGHT);
        if (Input.isKeyPressed("m")) this.r.toggleRenderFlag(DISABLE_NORMAL_MAPPING);
    }

    render()
    {
        // Line
        this.r.transform = new Matrix4();
        this.r.drawLine(new Vertex(new Vector3(-6, 0, -5), 0xff0000), new Vertex(new Vector3(-5, 1, -7), 0x00ff00));

        // Trianglesa
        this.r.renderFlag = this.r.defaultRenderFlag & ~CALC_LIGHT;
        this.r.transform = new Matrix4().translate(-3, 0, 0);
        this.r.setMaterial(undefined, undefined, undefined, undefined);
        this.r.drawTriangle(
            new Vertex(new Vector3(-1, 0, -5), 0xff0000),
            new Vertex(new Vector3(0, 1, -5), 0x00ff00),
            new Vertex(new Vector3(1, 0, -5), 0x0000ff)
        );
        this.r.renderFlag = this.r.defaultRenderFlag;

        let xPos = 0;
        let zPos = -5;
        let index = 0;
        let gap = 4;

        // Flat sphere
        this.r.transform = new Matrix4().translate(xPos + (index++ * gap), 0, zPos);
        this.r.transform = this.r.transform.scale(1);
        this.r.setMaterial(Resources.textures.white, undefined, 100);
        this.r.drawModel(Resources.models.flat_sphere);

        // Smooth sphere
        this.r.transform = new Matrix4().translate(xPos + (index++ * gap), 0, zPos);
        this.r.transform = this.r.transform.scale(1);
        this.r.setMaterial(Resources.textures.white, undefined, 100);
        this.r.drawModel(Resources.models.smooth_sphere);

        // Brick1
        this.r.transform = new Matrix4().translate(xPos + (index * gap), -4, zPos);
        this.r.transform = this.r.transform.scale(1);
        this.r.setMaterial(Resources.textures.brick, Resources.textures.brick_normal, 10);
        this.r.drawModel(Resources.models.cube);

        // Brick2
        this.r.transform = new Matrix4().translate(xPos + (index * gap), 0, zPos);
        this.r.transform = this.r.transform.scale(1);
        this.r.setMaterial(Resources.textures.stone2, Resources.textures.stone2_normal, 10);
        this.r.drawModel(Resources.models.cube);

        // Brick3
        this.r.transform = new Matrix4().translate(xPos + (index++ * gap), 4, zPos);
        this.r.transform = this.r.transform.scale(1);
        this.r.setMaterial(Resources.textures.brickwall, Resources.textures.brickwall_normal, 10);
        this.r.drawModel(Resources.models.cube);

        // Barrel
        this.r.transform = new Matrix4().translate(xPos + (index++ * gap), 0, zPos);
        this.r.transform = this.r.transform.scale(0.3);
        this.r.setMaterial(Resources.textures.barrel_diffuse, Resources.textures.barrel_normal, 10);
        this.r.drawModel(Resources.models.barrel);

        // Diablo
        xPos += 2;
        this.r.transform = new Matrix4().translate(xPos + (index++ * gap), 0, zPos);
        this.r.transform = this.r.transform.scale(4);
        this.r.setMaterial(Resources.textures.diablo_diffuse, Resources.textures.diablo_normal, 10);
        this.r.drawModel(Resources.models.diablo);
        xPos += 2;

        let r = this.time / 2.0;

        // Cube1
        this.r.transform = new Matrix4().translate(xPos + (index++ * gap), 0, zPos).rotate(0, r, r);
        this.r.transform = this.r.transform.scale(1);
        this.r.setMaterial(Resources.textures.pepe, undefined, 30);
        this.r.drawModel(Resources.models.cube);

        // Cube2
        this.r.transform = new Matrix4().translate(xPos + (index++ * gap), 0, zPos).rotate(r, r, 0);
        this.r.transform = this.r.transform.scale(1);
        this.r.setMaterial(Resources.textures.dulri, undefined, 30);
        this.r.drawModel(Resources.models.cube);

        // Blender monkey
        this.r.transform = new Matrix4().translate(xPos + (index++ * gap), 0, zPos).rotate(0, -r, r);
        this.r.transform = this.r.transform.scale(1);
        this.r.setMaterial(Resources.textures.white, undefined, 30);
        this.r.drawModel(Resources.models.monkey);

        // Skybox
        this.drawSkyBox(this.time / 100.0);
    }

    drawSkyBox(rotation)
    {
        this.r.renderFlag = SET_Z_9999 | !CALC_LIGHT;

        let size = new Vector3(1000, 1000, 1000);
        let pos = this.camera.pos.sub(new Vector3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));
        this.r.transform = new Matrix4().rotate(0, rotation, 0);

        const p000 = new Vector3(pos.x, pos.y, pos.z);
        const p100 = new Vector3(pos.x + size.x, pos.y, pos.z);
        const p110 = new Vector3(pos.x + size.x, pos.y + size.y, pos.z);
        const p010 = new Vector3(pos.x, pos.y + size.y, pos.z);

        const p001 = new Vector3(pos.x, pos.y, pos.z - size.z);
        const p101 = new Vector3(pos.x + size.x, pos.y, pos.z - size.z);
        const p111 = new Vector3(pos.x + size.x, pos.y + size.y, pos.z - size.z);
        const p011 = new Vector3(pos.x, pos.y + size.y, pos.z - size.z);

        const t00 = new Vector2(0, 1);
        const t10 = new Vector2(1, 1);
        const t11 = new Vector2(1, 0);
        const t01 = new Vector2(0, 0);

        this.r.setMaterial(Resources.textures.skybox_front);
        this.r.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11));

        this.r.setMaterial(Resources.textures.skybox_right);
        this.r.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.r.setMaterial(Resources.textures.skybox_left);
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p011, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11));

        this.r.setMaterial(Resources.textures.skybox_back);
        this.r.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p010, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));

        this.r.setMaterial(Resources.textures.skybox_top);
        this.r.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p111, 0xffffff, t11));

        this.r.setMaterial(Resources.textures.skybox_bottom);
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p001, 0xffffff, t00), new Vertex(p101, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p101, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.r.renderFlag = this.r.defaultRenderFlag;
    }
}