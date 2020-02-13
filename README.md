# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This is not a library but real world exapmle in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |            CircleCI                     |               Attempts               |
|-----------------------------------------|-----------------------------------------|--------------------------------------|
| tiny configs                            | gaint configs                           |                                      |
| 60 from 362 failed, time=21:14          | 54 from 362 failed, time=14:31          | old pipeline                         |
| 25 from 361 failed, time=16:22          | 22 from 361 failed, time=15:14          | new pipeline                         |
| 12=1+1+7+3 failed, time=4:26            | 9=1+1+4+3 failed, time=4:14             | with parallelism and render promise  |
| 3=0+0+2+1 failed, time=5:36             | 2=0+0+1+1 failed, time=4:48             | with network tax and other stuff     |

### How it works
- ci configs with parallelism
- deterministic random/timer/rAF/video for screenshots
- increased robustness with hided text, datgui, different flags and timeouts.
- pipeline: turn off rAF -> 'networkidle0' -> networkTax -> turn on rAF -> render promise

### Status
98% of 363 examples are covered with tests. Robustness +-2% on different machines. For example on integrated GPU additional artifacts in this examples: webgl2_multisampled_renderbuffers, webgl_materials_texture_anisotropy, webgl_postprocessing_procedural, webgl_shaders_tonemapping. Also this screenshots probably wrong: webgl_simple_gi, webgl_postprocessing_dof2.

### Local usage
```shell
# generate one scrcreenshot
npx cross-env FILE=<name> npm run ci:gen

# check one example
npx cross-env FILE=<name> npm run ci

# generate all scrcreenshots
npm run ci:gen

# check all examples in browser
npm run ci:vis

# check last half of examples
npx cross-env CI=23 npm run ci:vis
```

### Contribution
You can help to simplify this script by suggesting example with HeadlessExperimental.beginFrame API

### External modifications
Examples that need modification: misc_animation_authoring with class .lbl (for example), webgl_performance_nodes button with id=startButton