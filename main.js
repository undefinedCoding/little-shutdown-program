// Import modules
const {app, BrowserWindow} = require('electron')
const path = require('path')
const url = require('url')


// Global variable for the window
let win

function createWindow () {
  // Create a window
  win = new BrowserWindow({width: 1200, height: 720, frame: false, fullscreen: true})

  // Load in the window the 'index.html' file
  win.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Window gets closed
  win.on('closed', () => {
    // Dereference the window object
    win = null
  })
}

// Electron is finished initializing and ready to create browser windows
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // macOS: Applications keep their menu bar until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  // macOS: Re-create a window in the app when the dock icon is clicked and there are no other open windows
  if (win === null) createWindow()
})
