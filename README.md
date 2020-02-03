# puppeteer-three
[![Travis](https://travis-ci.org/munrocket/puppeteer-three.svg?branch=master)](https://travis-ci.org/munrocket/puppeteer-three)
[![CircleCI](https://circleci.com/gh/munrocket/puppeteer-three.svg?style=svg)](https://circleci.com/gh/munrocket/puppeteer-three)

This repo created in order to add WebGL automated testing with puppeteer in Three.js.

|           Travis                        |               CircleCI                   |
|-----------------------------------------|------------------------------------------|
| tiny configs                            | gaint configs                            |
| slow                                    | fast                                     |
| pass: 302 from 362 with <5% diff        | pass: 310 from 362 with <5% diff         |

### 2do list
- [x] screenshot maker
- [x] ci config for travis/circleci
- [x] deterministic time & random for screenshot
- [x] procedure that generate screenshots
- [x] procedure that diff screenshots
- [x] try to fix non deterministic RAF
- [x] try to optimize (get rid of setTimeout)
- [x] try to make robust (hide title and datgui)