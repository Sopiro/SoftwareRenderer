import { Vec2, Vec3, Mat4 } from "./math.js";
import { Vertex } from "./vertex.js";
import * as Resources from "./resources.js";
import * as Input from "./input.js";
import { RENDER_BACKGROUND, CALC_LIGHT, RENDER_FACE_NORMAL, RENDER_TANGENT_SPACE, DISABLE_NORMAL_MAPPING } from "./renderer.js";

export class Game
{
    constructor(renderer, camera)
    {
        this.renderer = renderer;
        this.camera = camera;
        this.time = 0.0;

        this.renderSkybox = true;
    }

    update(delta)
    {
        // Handle camera movement
        let speed = 5.0;
        let rotSpeed = 60.0;

        if (Input.isKeyDown("Shift")) speed *= 1.5;

        let mx = 0.0;
        let mz = 0.0;

        if (Input.isKeyDown("a")) --mx;
        if (Input.isKeyDown("d")) ++mx;
        if (Input.isKeyDown("w")) --mz;
        if (Input.isKeyDown("s")) ++mz;

        if (new Vec2(mx, mz).getLength() > 1)
        {
            mx /= 1.414;
            mz /= 1.414;
        }

        this.camera.pos.x += (Math.cos(this.camera.rot.y * Math.PI / 180.0) * mx + Math.sin(this.camera.rot.y * Math.PI / 180.0) * mz) * speed * delta;
        this.camera.pos.z += (-Math.sin(this.camera.rot.y * Math.PI / 180.0) * mx + Math.cos(this.camera.rot.y * Math.PI / 180.0) * mz) * speed * delta;

        if (Input.isKeyDown(" ")) this.camera.pos.y += speed * delta;
        if (Input.isKeyDown("c")) this.camera.pos.y -= speed * delta;

        if (Input.isMouseDown())
        {
            this.camera.rot.y -= Input.mouseAcceleration.x * 0.1 * rotSpeed * delta;
            this.camera.rot.x -= -Input.mouseAcceleration.y * 0.1 * rotSpeed * delta;
        }

        const radRot = this.camera.rot.mul(-Math.PI / 180.0);
        this.camera.cameraTransform = new Mat4().rotate(radRot.x, radRot.y, radRot.z);
        this.camera.cameraTransform = this.camera.cameraTransform.translate(-this.camera.pos.x, -this.camera.pos.y, -this.camera.pos.z);

        // Control directional light
        if (Input.isKeyDown("q")) this.renderer.sun.rotation.y += delta;
        if (Input.isKeyDown("e")) this.renderer.sun.rotation.y -= delta;
        if (Input.isKeyDown("r")) this.renderer.sun.rotation.z += delta;
        if (Input.isKeyDown("f")) this.renderer.sun.rotation.z -= delta;

        // Control sun intensity
        if (Input.isKeyDown("i")) this.renderer.sun.intensity *= 1.1;
        if (Input.isKeyDown("o")) this.renderer.sun.intensity *= 1 / 1.1;

        let matrix = new Mat4().rotate(this.renderer.sun.rotation.x, this.renderer.sun.rotation.y, this.renderer.sun.rotation.z);
        let sunDir = matrix.mulVector(this.renderer.sun.direction, 0).normalized();
        this.renderer.sun.directionVS = this.camera.cameraTransform.mulVector(sunDir, 0);

        this.time += delta;

        // Toggling render flags
        if (Input.isKeyPressed("n")) this.renderer.toggleFlag(RENDER_FACE_NORMAL);
        if (Input.isKeyPressed("t")) this.renderer.toggleFlag(RENDER_TANGENT_SPACE);
        if (Input.isKeyPressed("l")) this.renderer.toggleFlag(CALC_LIGHT);
        if (Input.isKeyPressed("m")) this.renderer.toggleFlag(DISABLE_NORMAL_MAPPING);
        if (Input.isKeyPressed("b")) this.renderSkybox = !this.renderSkybox;
    }

    render()
    {
        // Line
        this.renderer.transform = new Mat4();
        this.renderer.drawLine(new Vertex(new Vec3(-6, 0, -5), 0xff0000), new Vertex(new Vec3(-5, 1, -7), 0x00ff00));

        // Triangles
        this.renderer.renderFlag = this.renderer.defaultRenderFlag & ~CALC_LIGHT;
        this.renderer.transform = new Mat4().translate(-3.0, 0.0, 0.0);
        this.renderer.setMaterial(undefined, undefined, undefined, undefined);
        this.renderer.drawTriangle(
            new Vertex(new Vec3(-1.0, 0.0, -5.0), 0xff0000),
            new Vertex(new Vec3(0.0, 1.0, -5.0), 0x00ff00),
            new Vertex(new Vec3(1.0, 0.0, -5.0), 0x0000ff)
        );
        this.renderer.renderFlag = this.renderer.defaultRenderFlag;

        let xPos = 0.0;
        let zPos = -5.0;
        let index = 0.0;
        let gap = 4.0;

        // Flat sphere
        this.renderer.transform = new Mat4().translate(xPos + (index++ * gap), 0.0, zPos);
        this.renderer.transform = this.renderer.transform.scale(1);
        this.renderer.setMaterial(Resources.textures.white, undefined, 100.0);
        this.renderer.drawMesh(Resources.meshes.flat_sphere);

        // Smooth sphere
        this.renderer.transform = new Mat4().translate(xPos + (index++ * gap), 0.0, zPos);
        this.renderer.transform = this.renderer.transform.scale(1);
        this.renderer.setMaterial(Resources.textures.white, undefined, 100.0);
        this.renderer.drawMesh(Resources.meshes.smooth_sphere);

        // Brick1
        this.renderer.transform = new Mat4().translate(xPos + (index * gap), -4.0, zPos);
        this.renderer.transform = this.renderer.transform.scale(1);
        this.renderer.setMaterial(Resources.textures.brick, Resources.textures.brick_normal, 10.0);
        this.renderer.drawMesh(Resources.meshes.cube);

        // Brick2
        this.renderer.transform = new Mat4().translate(xPos + (index * gap), 0.0, zPos);
        this.renderer.transform = this.renderer.transform.scale(1);
        this.renderer.setMaterial(Resources.textures.stone2, Resources.textures.stone2_normal, 10.0);
        this.renderer.drawMesh(Resources.meshes.cube);

        // Brick3
        this.renderer.transform = new Mat4().translate(xPos + (index++ * gap), 4.0, zPos);
        this.renderer.transform = this.renderer.transform.scale(1);
        this.renderer.setMaterial(Resources.textures.brickwall, Resources.textures.brickwall_normal, 10.0);
        this.renderer.drawMesh(Resources.meshes.cube);

        // Barrel
        this.renderer.transform = new Mat4().translate(xPos + (index++ * gap), 0.0, zPos);
        this.renderer.transform = this.renderer.transform.scale(0.3);
        this.renderer.setMaterial(Resources.textures.barrel_diffuse, Resources.textures.barrel_normal, 10.0);
        this.renderer.drawMesh(Resources.meshes.barrel);

        // Diablo
        xPos += 2.0;
        this.renderer.transform = new Mat4().translate(xPos + (index++ * gap), 0.0, zPos);
        this.renderer.transform = this.renderer.transform.scale(4.0);
        this.renderer.setMaterial(Resources.textures.diablo_diffuse, Resources.textures.diablo_normal, 10.0);
        this.renderer.drawMesh(Resources.meshes.diablo);
        xPos += 2.0;

        let r = this.time / 2.0;

        // Cube1
        this.renderer.transform = new Mat4().translate(xPos + (index++ * gap), 0.0, zPos).rotate(0.0, r, r);
        this.renderer.transform = this.renderer.transform.scale(1);
        this.renderer.setMaterial(Resources.textures.pepe, undefined, 30.0);
        this.renderer.drawMesh(Resources.meshes.cube);

        // Cube2
        this.renderer.transform = new Mat4().translate(xPos + (index++ * gap), 0.0, zPos).rotate(r, r, 0.0);
        this.renderer.transform = this.renderer.transform.scale(1);
        this.renderer.setMaterial(Resources.textures.dulri, undefined, 30.0);
        this.renderer.drawMesh(Resources.meshes.cube);

        // Blender monkey
        this.renderer.transform = new Mat4().translate(xPos + (index++ * gap), 0.0, zPos).rotate(0.0, -r, r);
        this.renderer.transform = this.renderer.transform.scale(1);
        this.renderer.setMaterial(Resources.textures.white, undefined, 30.0);
        this.renderer.drawMesh(Resources.meshes.monkey);

        // Skybox
        if (this.renderSkybox)
        {
            this.drawSkyBox(this.time / 100.0);
        }
    }

    drawSkyBox(rotation)
    {
        this.renderer.renderFlag = RENDER_BACKGROUND | !CALC_LIGHT;

        let size = new Vec3(1000.0, 1000.0, 1000.0);
        let pos = this.camera.pos.sub(new Vec3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));
        this.renderer.transform = new Mat4().rotate(0.0, rotation, 0.0);

        const p000 = new Vec3(pos.x, pos.y, pos.z);
        const p100 = new Vec3(pos.x + size.x, pos.y, pos.z);
        const p110 = new Vec3(pos.x + size.x, pos.y + size.y, pos.z);
        const p010 = new Vec3(pos.x, pos.y + size.y, pos.z);

        const p001 = new Vec3(pos.x, pos.y, pos.z - size.z);
        const p101 = new Vec3(pos.x + size.x, pos.y, pos.z - size.z);
        const p111 = new Vec3(pos.x + size.x, pos.y + size.y, pos.z - size.z);
        const p011 = new Vec3(pos.x, pos.y + size.y, pos.z - size.z);

        const t00 = new Vec2(0.0, 1.0);
        const t10 = new Vec2(1.0, 1.0);
        const t11 = new Vec2(1.0, 0.0);
        const t01 = new Vec2(0.0, 0.0);

        this.renderer.setMaterial(Resources.textures.skybox_front);
        this.renderer.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.renderer.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11));

        this.renderer.setMaterial(Resources.textures.skybox_right);
        this.renderer.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.renderer.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.renderer.setMaterial(Resources.textures.skybox_left);
        this.renderer.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p011, 0xffffff, t10));
        this.renderer.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11));

        this.renderer.setMaterial(Resources.textures.skybox_back);
        this.renderer.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p010, 0xffffff, t10));
        this.renderer.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));

        this.renderer.setMaterial(Resources.textures.skybox_top);
        this.renderer.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.renderer.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p111, 0xffffff, t11));

        this.renderer.setMaterial(Resources.textures.skybox_bottom);
        this.renderer.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p001, 0xffffff, t00), new Vertex(p101, 0xffffff, t10));
        this.renderer.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p101, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.renderer.renderFlag = this.renderer.defaultRenderFlag;
    }
}