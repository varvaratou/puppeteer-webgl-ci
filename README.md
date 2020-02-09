# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This is not a library but real world exapmle in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |            CircleCI                     |         Attempts           |
|-----------------------------------------|-----------------------------------------|----------------------------|
| tiny configs                            | gaint configs                           |                            |
| 60 from 362 failed, time=21:14          | 54 from 362 failed, time=14:31          | old pipeline               |
| 25 from 361 failed, time=16:22          | 22 from 361 failed, time=15:14          | new pipeline               |
| 19=3+2+7+7 failed, time=6:27            | 18=3+2+7+6 failed, time=6:06            | with parallelism           |
| 12=1+1+7+3 failed, time=4:26            | 9=1+1+4+3 failed, time=4:14             | with render promise        |
| 4=0+1+2+1 failed, time=3:50             | 3=0+1+1+1 failed, time=4:15             | with network tax           |

### How it works
- ci configs with parallelism
- deterministic random/timer/rAF for screenshot
- increased robustness with hided text, datgui, etc.
- pipeline: turn off rAF -> 'networkidle0' -> networkTax -> turn on rAF -> render promise

### Status
98% of 363 examples are covered with tests, last 6 in exception list.

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