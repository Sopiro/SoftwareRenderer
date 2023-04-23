import * as Resources from "./resources.js";

export let Constants = {}

Constants.PAUSE = false;

Constants.WIDTH = 960;
Constants.HEIGHT = 540;

Constants.SCALE_INDEX = 2;
Constants.SCALES = [1, 2, 4, 6, 10, 12, 20];
Constants.SCALE = Constants.SCALES[Constants.SCALE_INDEX];
Constants.FOV = Constants.HEIGHT / Constants.SCALE;

Constants.RESOURCE_READY = Object.keys(Resources.textures).length + Object.keys(Resources.models).length;
Constants.LOADED_RESOURCES = 0;

Constants.GLOBAL_ALPHA = 255;