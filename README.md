# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This repo created in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |            CircleCI                     |         Settings         |
|-----------------------------------------|-----------------------------------------|--------------------------|
| tiny configs                            | gaint configs                           |                          |
| slow in small projects                  | fast in small projects                  |                          |
| 60 from 362 failed, time=21:14          | 54 from 362 failed, time=14:31          | with old RAF             |
| 25 from 361 failed, time=16:22          | 22 from 361 failed, time=15:14          | 0.1, 5%, 1500ms, 1000ms  |
| 18 from 361 failed, time=23:22          | 16 from 361 failed, time=22:15          | 0.2, 5%, 2500ms, 2000ms  |
| 19 from 361 failed, time=22:37          | 16 from 361 failed, time=21:26          | 0.2, 5%, 1900ms, 2000ms  |
| 32=9+5+8+10 failed, time=6:42           | 32=9+5+8+10 failed, time=6:04           | 0.2, 5%, 2500ms, 2000ms  |
| ? failed, time=?                        | ? failed, time=?           | 0.2, 5%, 1900ms, 2000ms  |

### 2do list
- [x] screenshot maker
- [x] ci config for travis/circleci
- [x] deterministic random/timer for screenshot
- [x] procedure that generate screenshots
- [x] procedure that diff screenshots
- [x] try to make robust (hide title and datgui)
- [x] turn off RAF -> 'networkidle0' -> turn on deterministic RAF -> wait until rendering
- [x] 4 parallel ci