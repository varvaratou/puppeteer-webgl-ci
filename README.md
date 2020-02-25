# puppeteer-webgl-ci
[![Travis](https://travis-ci.org/munrocket/puppeteer-webgl-ci.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-webgl-ci)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-webgl-ci.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-webgl-ci)

This is not a library but real world exapmle in order to add WebGL automated testing with CI and puppeteer in Three.js.

|           Travis                        |            CircleCI                     |                Attempts                |
|-----------------------------------------|-----------------------------------------|----------------------------------------|
| 61 from 362 failed, time=21:14          | 55 from 362 failed, time=14:31          | networkidle0 timeout                   |
| 26 from 362 failed, time=16:22          | 23 from 362 failed, time=15:14          | with rAF hook                          |
| 13=1+1+7+4 failed, time=4:26            | 10=1+1+4+4 failed, time=4:14            | with parallelism and render promise    |
| 4=0+0+2+2 failed, time=3:26             | 3=0+0+1+2 failed, time=3:21             | with size tax and progressive attempts |
| 1=0+0+1+0 failed, time=4:25             | 1=0+0+1+0 failed, time=4:01             | for simplicity: beginFrame API         |

### How it works
- ci configs with parallelism
- deterministic random/timer/rAF/video for screenshots
- hided dat.gui, stats.js and text
- 3 progressive attempts for robustness
- beginFrame [HeadlessExperimental API](https://chromedevtools.github.io/devtools-protocol/tot/HeadlessExperimental)
- pipeline: 'load' with loadTimeout -> 1 rAF -> domTimout -> sizeTimeout -> beginFrame

### Local usage
```shell
# generate several scrcreenshots
npm run gen <example_name> ... <example_name_N>

# check several examples
npm run e2e <example_name> ... <example_name_N>

# generate all scrcreenshots
npm run gen

# check last half of examples
npx cross-env CI=23 npm run e2e
```

### Status
98% examples are covered with tests. Random robusness in CI >90%. Robustness on different machines ~97%

### Wrong on integrated GPU
webgl_shaders_tonemapping, webgl_materials_texture_anisotropy, webgl_postprocessing_procedural

### Wrong screenshots but ok for CI
webgl_loader_bvh, webgl_loader_texture_pvrtc, webgl_physics_volume