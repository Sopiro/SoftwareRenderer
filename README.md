# Javascript Software Renderer

3D Software rendering with HTML5 canvas and Javascript.  
Written in vanilla javascript. No WebGL, No library used.

Video: https://youtu.be/EGpyw_Su2r0

## Play
Live Demo: https://sopiro.github.io/Software_Renderer_JS/

## Preview 

Post Processing Enabled  
![image1](.github/c5ba1f7.gif)
  
Normal Mapping  
![image2](.github/0b3e605.gif)

## Implemented Features
- Point drawing
- Line drawing
- Triangle rasterization
  - A Parallel Algorithm for Polygon Rasterization. Juan Pineda. Siggraph 1988.
  - [Explained](https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/rasterization-stage)
- Indexed vertex rendering
- Depth buffering
- Line, Polygon clipping
- Model transform, Camera transform
- Perspective projection
- Back face culling
- Perspective-correct vertex attribute interpolation
- Texture mapping
- Skybox
- OBJ model loading
  - Calculating face normal, tangent vectors
- Vertex, Pixel shading
- Phong shading
- Blinn phong shading
- Normal mapping
- Directional light
- Resolution changer
- Post-processing stage
