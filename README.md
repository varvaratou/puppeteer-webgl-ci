# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This is not a library but real world exapmle in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |            CircleCI                     |         Settings         |
|-----------------------------------------|-----------------------------------------|--------------------------|
| tiny configs                            | gaint configs                           |                          |
| 60 from 362 failed, time=21:14          | 54 from 362 failed, time=14:31          | old pipeline             |
| 25 from 361 failed, time=16:22          | 22 from 361 failed, time=15:14          | new pipeline             |
| 19=3+2+7+7 failed,  time=6:27           | 18=3+2+7+6 failed,  time=6:06            | with parallelism         |
| 11=1+1+7+2 failed,  time=4:07           | 9 =1+1+6+2 failed,  time=4:12            | with render promise      |

### 2do list
- [x] screenshot maker
- [x] deterministic random/timer for screenshot
- [x] procedure that generate screenshots
- [x] procedure that check screenshots
- [x] try to make robust (hide text, datgui, etc.)
- [x] ci config with parallelism for travis/circleci
- [x] pipeline: turn off RAF -> 'networkidle2' -> turn on RAF -> render promise

### Local usage
```shell
# generate one screenshot
npx cross-env FILE=<name> npm run ci:gen

# generate all screenshots
npm run ci:gen

# check all screenshots in console
npm run ci

# prefix for one screenshot
npx cross-env FILE=<name> <shell_command>

# prefix for one quater of all screenshots
npx cross-env CI=<0/1/2/3> <shell_command>
```