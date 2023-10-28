'use strict'

import { Model } from "./model.js";
import * as Resources from "./resources.js";
import { Constants } from "./context.js";
import { Engine } from "./engine.js";

window.onload = () =>
{
    new Engine().start();
}

// Load models, parse OBJ
for (const key in Resources.models)
{
    if (Object.hasOwnProperty.call(Resources.models, key))
    {
        const modelURL = Resources.models[key];

        let xhr = new XMLHttpRequest();
        xhr.open("get", modelURL, true);
        xhr.send(null);

        xhr.onreadystatechange = function ()
        {
            if (xhr.readyState == 4 && xhr.status == 200)
            {
                // Load OBJ file line by line
                const lines = xhr.response.split('\n');

                let positions = [];
                let texCoords = [];
                let normals = [];
                let indices = [];

                for (const line of lines)
                {
                    const tokens = line.split(" ");
                    switch (tokens[0])
                    {
                        case "v":
                            let v = [];
                            for (let i = 0; i < 3; ++i)
                                v.push(parseFloat(tokens[i + 1]))
                            positions.push(v);
                            break;

                        case "vt":
                            let tc = [];
                            for (let i = 0; i < 2; ++i)
                                tc.push(parseFloat(tokens[i + 1]))
                            texCoords.push(tc);
                            break;

                        case "vn":
                            let vn = [];
                            for (let i = 0; i < 3; ++i)
                                vn.push(parseFloat(tokens[i + 1]))
                            normals.push(vn);
                            break;

                        case "f":
                            let f = [];
                            for (let i = 0; i < 3; ++i)
                            {
                                let v = [];
                                for (let j = 0; j < 3; j++)
                                    v.push(parseInt(tokens[i + 1].split("/")[j]))
                                f.push(v);
                            }
                            indices.push(f);
                            break;
                    }
                }

                // console.log(indices);
                ++Constants.LOADED_RESOURCES;

                Resources.models[key] = new Model(positions, texCoords, normals, indices);
            }
        }
    }
}