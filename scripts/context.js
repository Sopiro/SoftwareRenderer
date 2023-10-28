import * as Resources from "./resources.js";

// Application context
export let Context = {}

Context.PAUSE = false;

Context.WIDTH = 960;
Context.HEIGHT = 540;

Context.SCALE_INDEX = 2;
Context.SCALES = [1, 2, 4, 6, 10, 12, 20];
Context.SCALE = Context.SCALES[Context.SCALE_INDEX];
Context.FOV = Context.HEIGHT / Context.SCALE;

Context.RESOURCE_READY = Object.keys(Resources.textures).length + Object.keys(Resources.meshes).length;
Context.LOADED_RESOURCES = 0;

Context.GLOBAL_ALPHA = 255;