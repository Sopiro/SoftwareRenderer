# Software Renderer

This is a 3D Software renderer implemented in HTML canvas using vanilla javascript.  
No WebGL, No external library used!

Live Demo: https://sopiro.github.io/SoftwareRenderer/  
Video: https://youtu.be/EGpyw_Su2r0  

## Examples

|Post processing effects|Normal mapping|
|--|--|
|![img1](.github/c5ba1f7.gif)|![img2](.github/0b3e605.gif)|

|Line and triangle| Flat and smooth shaded spheres|
|--|--|
|![img3](.github/1.png) |![img4](.github/2.png)|

|Normal mapped cube 1| Normal mapped cube 2|
|--|--|
|![img5](.github/3.png)|![img6](.github/4.png)|

|Normal mapped barrel| Textured cubes and Blender Suzanne|
|--|--|
|![img7](.github/6.png)|![img8](.github/8.png)|

|Diablo model with normal mapping| Diablo model without normal mapping|
|--|--|
|![img9](.github/diablo_nm.png)|![img10](.github/diablo.png)|

## Features
- Point and line rendering
- Triangle rasterization
  - [Paper](https://dl.acm.org/doi/10.1145/54852.378457) [Scratchapixel](https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/rasterization-stage)
- Perspective-correct vertex attribute interpolation
- Depth buffering
- Clipping for near plane
- Back face culling
- Indexed mesh rendering
- Texture mapping
- OBJ model loading
  - Calculating face normal and tangent vectors
- Vertex and fragment shading
- Perspective projection, viewport transform
- Phong shading model
  - Directional light
- Normal mapping
- Post-processing stage
- Skybox
