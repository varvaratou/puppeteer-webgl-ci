# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This repo created in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |            CircleCI                     |         Settings         |
|-----------------------------------------|-----------------------------------------|--------------------------|
| tiny configs                            | gaint configs                           |                          |
| 60 from 362 failed, time=21:14          | 54 from 362 failed, time=14:31          | old pipeline             |
| 25 from 361 failed, time=16:22          | 22 from 361 failed, time=15:14          | new pipeline             |
| 19=3+2+7+7 failed, time=6:27            | 18=3+2+7+6 failed, time=6:06            | with parallelism         |
| 17=1+2+7+6 failed, time=4:44            | 18=3+2+7+6 failed, time=4:37            | with render promise      |

### 2do list
- [x] screenshot maker
- [x] ci config with parallelism for travis/circleci
- [x] deterministic random/timer for screenshot
- [x] procedure that generate screenshots
- [x] procedure that check screenshots
- [x] try to make robust (hide text, datgui, etc.)
- [x] new pipeline: turn off RAF -> 'networkidle2' -> turn on RAF -> render promise

### Local usage
```shell
# generate one screenshot 
GENERATE=<name> npm run ci

# generate all screenshots
npm run ci:gen

# check all screenshots in console
npm run ci

# choose one quater of all screenshot
CI=<0..3> <any_previous_shell_command>
```