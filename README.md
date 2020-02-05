# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This repo created in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |            CircleCI                     |         Settings         |
|-----------------------------------------|-----------------------------------------|--------------------------|
| tiny configs                            | gaint configs                           |                          |
| slow in small projects                  | fast in small projects                  |                          |
| 60 from 362 failed, time=21:14          | 54 from 362 failed, time=14:31          | with old pipeline        |
| 25 from 361 failed, time=16:22          | 22 from 361 failed, time=15:14          | 0.1, 5%, 1500ms, 1000ms  |
| 19=3+2+7+7 failed, time=6:27            | 18=3+2+7+6 failed, time=6:06            | 0.2, 5%, 1900ms, 2000ms  |

### 2do list
- [x] screenshot maker
- [x] ci config for travis/circleci
- [x] deterministic random/timer for screenshot
- [x] procedure that generate screenshots
- [x] procedure that diff screenshots
- [x] try to make robust (hide text and datgui)
- [x] new pipeline: turn off RAF -> 'networkidle2' -> turn on 1 RAF -> wait until rendering
- [x] 4 parallel ci

### Contributing: help me to cover last examples
Clone repository, run following commands and send me .zip file with screenshots
```
cross-env GENERATE=webgl2_multisampled_renderbuffers npm run ci && 
cross-env GENERATE=webgl_loader_draco npm run ci && 
cross-env GENERATE=webgl_loader_gltf npm run ci && 
cross-env GENERATE=webgl_loader_gltf_extensions npm run ci && 
cross-env GENERATE=webgl_materials_blending npm run ci && 
cross-env GENERATE=webgl_materials_blending_custom npm run ci &&
cross-env GENERATE=webgl_materials_envmaps_hdr_nodes npm run ci && 
cross-env GENERATE=webgl_materials_envmaps_pmrem_nodes npm run ci && 
cross-env GENERATE=webgl_materials_texture_anisotropy npm run ci && 
cross-env GENERATE=webgl_postprocessing_procedural npm run ci && 
cross-env GENERATE=webgl_shaders_tonemapping npm run ci && 
cross-env GENERATE=webgl_shadowmap_vsm npm run ci && 
cross-env GENERATE=webgl_simple_gi npm run ci && 
cross-env GENERATE=webgl_video_panorama_equirectangular npm run ci && 
cross-env GENERATE=webvr_multiview npm run ci
```