import * as Resources from "./resources.js";

export let Constants = {}

Constants.WIDTH = 800;
Constants.HEIGHT = Constants.WIDTH / 4 * 3;
Constants.SCALE_INDEX = 2;
Constants.SCALES = [1, 2, 4, 5, 8, 10, 20];
Constants.SCALE = Constants.SCALES[Constants.SCALE_INDEX];
Constants.FOV = Constants.HEIGHT / Constants.SCALE;
Constants.resourceReady = Object.keys(Resources.textures).length + Object.keys(Resources.models).length;
Constants.loadedResources = 0;
Constants.globalAlpha = 255;
Constants.pause = false;