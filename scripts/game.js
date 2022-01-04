import { Vector2, Vector3, Matrix4 } from "./math.js";
import { Vertex } from "./vertex.js";
import * as Resources from "./resources.js";
import * as Util from "./utils.js";
import * as Input from "./input.js";
import { Random } from "./random.js";
import { SET_Z_9999, EFFECT_NO_LIGHT, RENDER_FACE_NORMAL, RENDER_TANGENT_SPACE } from "./renderer.js";

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
        let speed = 3.0;
        let rotSpeed = 60.0;

        if (Input.isKeyDown("Shift")) speed = 6.0;

        let ax = 0.0;
        let az = 0.0;

        if (Input.isKeyDown("a")) ax--;
        if (Input.isKeyDown("d")) ax++;
        if (Input.isKeyDown("w")) az--;
        if (Input.isKeyDown("s")) az++;

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
        if (Input.isKeyDown("q")) this.r.sun.rotation += delta;
        if (Input.isKeyDown("e")) this.r.sun.rotation -= delta;
        if (Input.isKeyDown("i")) this.r.sun.intensity *= 1.1;
        if (Input.isKeyDown("o")) this.r.sun.intensity *= 1 / 1.1;

        let matrix = new Matrix4().rotate(0, this.r.sun.rotation, 0);
        let sunDir = matrix.mulVector(this.r.sun.posRelativeToZero, 0).normalized().mul(-1);
        this.r.sun.dirVS = this.camera.cameraTransform.mulVector(sunDir, 0);

        this.time += delta;

        if (Input.isKeyPressed("n"))
            this.r.defaultRenderFlag = ((this.r.defaultRenderFlag & RENDER_FACE_NORMAL) == RENDER_FACE_NORMAL) ? 0 : this.r.defaultRenderFlag | RENDER_FACE_NORMAL;

        if (Input.isKeyPressed("t"))
            this.r.defaultRenderFlag = ((this.r.defaultRenderFlag & RENDER_TANGENT_SPACE) == RENDER_TANGENT_SPACE) ? 0 : this.r.defaultRenderFlag | RENDER_TANGENT_SPACE;
    }

    render()
    {
        const rand = new Random(123);

        const s = 30.0;

        for (let i = 0; i < 100; i++)
        {
            if (i % 2 == 0)
                this.r.setTexture(Resources.textures.pepe, Resources.textures.brick_normal);
            else
                this.r.setTexture(Resources.textures.dulri, Resources.textures.stone2_normal);

            const pos = new Vector3(rand.nextFloat() * s - s / 2.0, rand.nextFloat() * s - s / 2.0, rand.nextFloat() * s - s / 2.0);
            const rot = new Vector3(this.time / 5 * (i % 3), this.time / 10.0 * (i % 5), this.time / 5 * (i % 7));
            const scale = new Vector3(0.5);
            this.r.transform = Util.createTransformMatrix(pos, rot, scale);

            this.r.drawModel(Resources.models.cube);
        }

        // this.r.drawTriangle(new Vertex(new Vector3(0, 0, -1), 0xfffffff, new Vector2(0, 1)),
        //  new Vertex(new Vector3(0, 0, -2), 0xfffffff, new Vector2(0, 0)),
        //   new Vertex(new Vector3(1, 0, -2), 0xfffffff, new Vector2(1, 0)), Resources.textures.container);

        // this.drawPoint(new Vertex(new Vector3(0, 0, 0), 0xff00ff));

        // this.drawLine(new Vertex(this.sunPosRelativeToZero.mul(3).add(new Vector3(0, 0, -3)), 0xff0000), new Vertex(new Vector3(0, 0, -3), 0x00ff00));

        // this.drawPoint(new Vertex(this.sunPosRelativeToZero.mul(3), 0xffffff));
        // this.drawLine(new Vertex(new Vector3(-3, -3, -3), 0xff0000), new Vertex(new Vector3(5, 2, -8), 0x00ff00));

        this.drawSkyBox(this.time / 100.0);

        this.r.transform = new Matrix4().translate(2, 1, -5);
        // this.r.transform = new Matrix4().translate(2, 1, -5).rotate(time, 0, time);
        this.r.setTexture(Resources.textures.pepe, undefined, 100);
        this.r.drawModel(Resources.models.sphere2);

        // this.r.transform = new Matrix4().translate(-2, 1, -5);
        this.r.transform = new Matrix4().translate(-2, 1, -5);
        // this.r.transform = this.r.transform.rotate(0, time, 0);
        this.r.transform = this.r.transform.scale(1);
        // this.setTexture(Resources.textures.brickwall, Resources.textures.brickwall_normal);
        this.r.setTexture(Resources.textures.stone2, Resources.textures.stone2_normal, 10.0);
        this.r.drawModel(Resources.models.cube);

        this.r.transform = new Matrix4().translate(-2, 0, -10);
        // this.r.transform = this.transform.rotate(0, time, 0);
        this.r.transform = this.r.transform.scale(0.5);
        // this.r.setTexture(Resources.textures.brickwall, Resources.textures.brickwall_normal);
        this.r.setTexture(Resources.textures.white);
        this.r.drawModel(Resources.models.man);

        this.r.transform = new Matrix4().translate(2, 2, -10);
        // this.transform = this.transform.rotate(0, time, 0);
        this.r.transform = this.r.transform.scale(1);
        // this.setTexture(Resources.textures.brickwall, Resources.textures.brickwall_normal);
        this.r.setTexture(Resources.textures.brick, Resources.textures.brick_normal, 10.0);
        this.r.drawModel(Resources.models.cube);

        // this.r.transform = new Matrix4().translate(-1, -1, -2);
        // this.r.transform = this.transform.scale(2);
        // // this.r.transform = this.transform.rotate(0, -time / 10, 0);
        // this.r.setTexture(Resources.textures.brickwall, Resources.textures.brickwall_normal, 0.5);
        // const f = new Face(
        //     new Vertex(new Vector3(0, 0, 0), 0xffffff, new Vector2(0, 0)),
        //     new Vertex(new Vector3(0, 1, 0), 0xffffff, new Vector2(0, 1)),
        //     new Vertex(new Vector3(1, 1, 0), 0xffffff, new Vector2(1, 1)));

        // f.calcNormal();
        // f.calcTangentAndBiTangent();

        // this.drawFace(f);
    }

    drawCube(pos, size, centered)
    {
        if (centered) pos = pos.sub(new Vector3(size.x / 2.0, size.y / 2.0, -size.z / 2.0));

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

        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.r.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11));

        this.r.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p011, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11));

        this.r.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p010, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));

        this.r.drawTriangle(new Vertex(p010, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p010, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p110, 0xffffff, t11));

        this.r.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p101, 0xffffff, t00), new Vertex(p001, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p001, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));
    }

    drawSkyBox(rotation)
    {
        this.r.renderFlag = SET_Z_9999 | EFFECT_NO_LIGHT;

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

        this.r.setTexture(Resources.textures.skybox_front);
        this.r.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p011, 0xffffff, t00), new Vertex(p111, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p001, 0xffffff, t01), new Vertex(p111, 0xffffff, t10), new Vertex(p101, 0xffffff, t11));

        this.r.setTexture(Resources.textures.skybox_right);
        this.r.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p111, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p101, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.r.setTexture(Resources.textures.skybox_left);
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p011, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p011, 0xffffff, t10), new Vertex(p001, 0xffffff, t11));

        this.r.setTexture(Resources.textures.skybox_back);
        this.r.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p110, 0xffffff, t00), new Vertex(p010, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p100, 0xffffff, t01), new Vertex(p010, 0xffffff, t10), new Vertex(p000, 0xffffff, t11));

        this.r.setTexture(Resources.textures.skybox_top);
        this.r.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p010, 0xffffff, t00), new Vertex(p110, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p011, 0xffffff, t01), new Vertex(p110, 0xffffff, t10), new Vertex(p111, 0xffffff, t11));

        this.r.setTexture(Resources.textures.skybox_bottom);
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p001, 0xffffff, t00), new Vertex(p101, 0xffffff, t10));
        this.r.drawTriangle(new Vertex(p000, 0xffffff, t01), new Vertex(p101, 0xffffff, t10), new Vertex(p100, 0xffffff, t11));

        this.r.renderFlag = this.r.defaultRenderFlag;
    }
}