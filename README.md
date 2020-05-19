# little shutdown program

Just a little program, that shuts down a (Windows 10) computer after a, from the user set, countdown is finished. The program is using [Electron](https://electronjs.org/).

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://opensource.org/licenses/MIT)

## How does it look like

### Main screen

![main-screen-screenshot](/pictures/main-screen-screenshot.png)

From here you can set the time of the timer and start/stop, pause/resume it and also clear your input and the current timer.

### Settings and About screen

You can get to the settings screen by clicking the settings icon in the title bar (first icon from the left).
If you click the `i` you get to the about screen.
To get back home simply press either of the icons again.

Also there is the option to minimize the window to the system tray or dis-/enable a native window title bar and menu if you do not like the default custom title bar.

## Installation

Just go to the [GitHub Release Site](https://github.com/undefinedCoding/little-shutdown-program/releases) from this project and download the latest release.

### Installation > Windows

Then double-click the File `little-shutdown-program Setup X.Y.Z.exe`.
Follow the instructions of the installer to install the program.
Then you can start it like any other program on your (Windows) computer.

## Authors

- [AnonymerNiklasistanonym](https://github.com/AnonymerNiklasistanonym)
- [undefinedCoding](https://github.com/undefinedCoding)

## Inspirations/Sources

- The Windows 10 like titlebar is based on the npm module [electron-titlebar-windows](https://www.npmjs.com/package/electron-titlebar-windows)
- The code of the timer at the start of the project: [CodePen by Dylan Macnab](https://codepen.io/DylanMacnab/pen/EVBPzK?q=Javascript+Timer&limit=all&type=type-pens)
- The actual clock design: [CodePen by Bubba Smith](https://codepen.io/bsmith/pen/drElg?q=digital%20clock&order=popularity&depth=everything&show_forks=false)
- The Windows 10 like checkboxes are based on: [CodePen by Chris Awesome](https://codepen.io/ChrisAwesome/pen/yNdMEP?q=windows%2010&order=popularity&depth=everything&show_forks=false)
- The used dependcies can be found in the [package.json](package.json) file

## Start/Run/Edit/Build it yourself

To build/run/edit the program you need to install [Node.js](https://nodejs.org/en/).

Then you need to open this directory in your console and run the follwing command to isntall all dependencies:

``` bash
npm install
```

### Start/Run

``` bash
npm start
```

### Build Executable

**Windows:**

``` bash
npm run build-win
# or
npx electron-builder . --win
```

### Edit

We used [Visual Studio Code](https://code.visualstudio.com/) for editing/creating this project because of the many helping plugins for linting and auto formatting our code and the integrated console.

#### Code style

To enforce the code style run:

```bash
npm run lint
```

## Disclaimer

This program is not perfect and was not written by professionals.

## Questions/Problems/Ideas

If you still have any kind of questions, problems or great ideas open an issue or make a pull-request.

Have fun using this program!

😃
