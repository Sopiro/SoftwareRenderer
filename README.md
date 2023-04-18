# Javascript Software Renderer

3D Software renderer implemented in HTML canvas.  
This program is written in vanilla javascript. No WebGL, No external library used.

Video: https://youtu.be/EGpyw_Su2r0  
Live Demo: https://sopiro.github.io/SoftwareRenderer/

## Example

|Post Processing Enabled|Normal Mapping|
|--|--|
|![img1](.github/c5ba1f7.gif)|![img2](.github/0b3e605.gif)|

|Line and triangle| Flat and smooth shaded sphere|
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

## Implemented Features
- Real-time rendering
- Point and line rendering
- Triangle rasterization
  - A Parallel Algorithm for Polygon Rasterization. Juan Pineda. Siggraph 1988.
  - [Explained](https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/rasterization-stage)
- Indexed vertex rendering
- Depth buffering
- Clipping for z-near plane
- Perspective projection, viewport transform
- Back face culling
- Perspective-correct vertex attribute interpolation
- Texture mapping
- Skybox
- OBJ model loading
  - Calculating face normal and tangent vectors
- Vertex, Fragment(Pixel) shading
- Phong shading model
  - Directional light
- Normal mapping
- Resolution changer
- Post-processing stage
