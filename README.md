# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This is not a library but real world exapmle in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |            CircleCI                     |               Attempts               |
|-----------------------------------------|-----------------------------------------|--------------------------------------|
| easy configs, slower and less robust    | gaint configs, faster and more robust   |                                      |
| not support colors in terminal          | support colors in terminal              |                                      |
| 61 from 362 failed, time=21:14          | 55 from 362 failed, time=14:31          | old pipeline                         |
| 26 from 362 failed, time=16:22          | 23 from 362 failed, time=15:14          | new pipeline                         |
| 13=1+1+7+4 failed, time=4:26            | 10=1+1+4+4 failed, time=4:14            | with parallelism and render promise  |
| 4=0+0+2+2 failed, time=5:13             | 3=0+0+1+2 failed, time=5:22             | with network tax and other settings  |
| 4=0+0+2+2 failed, time=3:26             | 3=0+0+1+2 failed, time=3:21             | for robustness: progressive attempts |

### How it works
- ci configs with parallelism
- deterministic random/timer/rAF/video for screenshots
- increased robustness with hided text, datgui, different flags and timeouts.
- pipeline: turn off rAF -> 'networkidle0' -> networkTax -> turn on rAF -> render promise
- added 3 progressive attempts for robustness

### Status
98% of 363 examples are covered with tests. Robustness +-3% on different machines. For example in Windows webgl_effects_ascii example fails or on integrated GPU have additional artifacts: webgl2_multisampled_renderbuffers, webgl_materials_texture_anisotropy, webgl_postprocessing_procedural, webgl_shaders_tonemapping.

### Probably wrong screenshots
webgl_simple_gi, webgl_postprocessing_dof2, webgl_loader_texture_pvrtc

### Local usage
```shell
# generate one scrcreenshot
npx cross-env FILE=<name,...,nameN> npm run ci:gen

# check one example
npx cross-env FILE=<name,...,nameN> npm run ci

# generate all scrcreenshots
npm run ci:gen

# check all examples in browser
npm run ci:vis

# check last half of examples
npx cross-env CI=23 npm run ci:vis
```

### Contribution
You can help to simplify this script by suggesting example with HeadlessExperimental.beginFrame API
