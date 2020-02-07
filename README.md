# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This is not a library but real world exapmle in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |            CircleCI                     |         Settings         |
|-----------------------------------------|-----------------------------------------|--------------------------|
| tiny configs                            | gaint configs                           |                          |
| 60 from 362 failed, time=21:14          | 54 from 362 failed, time=14:31          | old pipeline             |
| 25 from 361 failed, time=16:22          | 22 from 361 failed, time=15:14          | new pipeline             |
| 19=3+2+7+7 failed, time=6:27            | 18=3+2+7+6 failed, time=6:06            | with parallelism         |
| 12=1+1+7+3 failed, time=4:26            | 9=1+1+4+3 failed, time=4:14             | with render promise      |
| 6=1+1+2+2 failed, time=4:30             | 5=1+1+2+1 failed, time=3:59             | with network tax         |

### 2do list
- [x] screenshot maker
- [x] deterministic random/timer for screenshot
- [x] procedure that generate screenshots
- [x] procedure that check screenshots
- [x] try to make robust (hide text, datgui, etc.)
- [x] ci config with parallelism for travis/circleci
- [x] pipeline: turn off RAF -> 'networkidle0' -> networkTax -> turn on deterministic RAF -> render promise

### Local usage
```shell
# generate one scrcreenshot
npx cross-env FILE=<name> npm run ci:gen

# check one file
npx cross-env FILE=<name> npm run ci

# check all screenshots in browser
npm run ci:vis

# check some part of screenshots
npx cross-env CI=<0..3> npm run ci
```