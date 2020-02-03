# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This repo created in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |               CircleCI                   |
|-----------------------------------------|------------------------------------------|
| tiny configs                            | gaint configs                            |
| slow                                    | fast                                     |
| not headless with WebGL (or need fix)   | headless                                 |
| pass: 68 from 79 and terminated         | pass: 309 from 362 with <5% diff         |

### 2do list
- [x] screenshot maker
- [x] ci config for travis/circleci
- [x] deterministic time for screenshot
- [x] procedure that generate screenshots
- [x] deterministic random for screenshot
- [x] procedure that diff screenshots
- [ ] make more robust (canvas.zIndex=10000, fix bug with non deterministic RAF)
- [ ] optimize (get rid of setTimeout)