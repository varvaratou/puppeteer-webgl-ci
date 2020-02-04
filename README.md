# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This repo created in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |               CircleCI                   |         Settings         |
|-----------------------------------------|------------------------------------------|--------------------------|
| tiny configs                            | gaint configs                            |                          |
| slow                                    | fast                                     |                          |
| 22 FROM 361 SCRENSHOT FAILED            | 22 FROM 361 SCRENSHOT FAILED             | 0.1, 5%, 1500ms, 1000ms  |
| ???                                     | ???                                      | 0.2, 5%, 2500ms, 2000ms  |

### 2do list
- [x] screenshot maker
- [x] ci config for travis/circleci
- [x] deterministic random/timer for screenshot
- [x] procedure that generate screenshots
- [x] procedure that diff screenshots
- [x] try to make robust (hide title and datgui)
- [x] turn off RAF -> 'networkidle2' -> turn on deterministic RAF -> wait until rendering