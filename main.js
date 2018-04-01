// Import modules
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  dialog,
  nativeImage,
  ipcMain
} = require('electron')
const path = require('path')
const url = require('url')
const settings = require('./js/settings')
console.log(app.getPath('userData'))

// global variable for the main window
var mainWindow = null

// check if there is already an instance of this program running
const shouldQuit = app.makeSingleInstance(() => {
  // if there is a main window
  if (mainWindow) {
    // restore it if it's minimized
    if (mainWindow.isMinimized()) mainWindow.restore()
    // focus the already opened main window
    mainWindow.focus()
  }
})

// another instance of this program was found running
if (shouldQuit) {
  // quit this instance of the program
  app.quit()
}

// setup of the settings
settings.setup({
  configName: 'user-preferences',
  defaults: {
    tray: false,
    windowBounds: { width: 500, height: 600, x: 0, y: 0 },
    timeInput: { d: 0, h: 0, m: 0, s: 0 },
    shutdown: true,
    spotify: true,
    tray: false
  }
})

ipcMain.on('get-settings', (event, arg) => {
  console.log('ipcMain "get-settings"', arg, settings.get(arg))
  event.returnValue = settings.get(arg)
})

ipcMain.on('set-settings', (event, arg) => {
  console.log('ipcMain "set-settings"', arg)
  settings.set(arg.name, arg.value)
})

ipcMain.on('get-version', event => {
  event.returnValue = app.getVersion()
})

ipcMain.on('get-name', event => {
  event.returnValue = app.getName()
})

ipcMain.on('relaunch', () => {
  settings.save()
  console.log('relaunch app')
  app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
  app.exit(0)
})

/**
 * Create the main window
 */
function createWindow () {
  // get custom window width and height
  let windowBounds = settings.get('windowBounds')

  // Create a BrowserWindow object
  mainWindow = new BrowserWindow({
    title: 'little shutdown program',
    titleBarStyle: 'hidden',
    backgroundColor: '#c9329e',
    minWidth: 500,
    minHeight: 520,
    width: windowBounds.width,
    height: windowBounds.height,
    x: windowBounds.x,
    y: windowBounds.y,
    frame: false,
    fullscreen: false,
    show: false,
    icon: path.join(__dirname, 'icon.ico') // ,
    // alwaysOnTop: true // for debugging, because I am too poor for two monitors
  })

  // Load the 'index.html' file in the window
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  )
  if (settings.get('tray')) {
    let tray = new Tray(path.join(__dirname, 'icon.ico'))
    /*
    const trayMenu = Menu.buildFromTemplate([
      {
        label: 'Show app',
        enabled: false
      },
      {
        label: 'Help',
        click: () => {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    ])

    tray.setContextMenu(trayMenu)
    */
    tray.setToolTip('Click to hide or show the app')

    tray.on('click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    })
    mainWindow.on('show', () => {
      tray.setHighlightMode('always')
    })
    mainWindow.on('hide', () => {
      tray.setHighlightMode('never')
    })
  }

  // Uncomment for instant debugging (from start opened dev tools)
  // mainWindow.webContents.openDevTools()

  // The renderer process has rendered the page for the first time
  mainWindow.on('ready-to-show', () => {
    // show window
    mainWindow.show()
    // focus window
    mainWindow.focus()
  })

  // Window was closed: Dereference the window object
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Window was minimized
  mainWindow.on('minimize', event => {
    if (settings.get('tray')) mainWindow.hide() // for tray
  })

  // Window was closed
  mainWindow.on('close', event => {
    // save window size and position before closing
    settings.set('windowBounds', mainWindow.getBounds())
    // save custom settings
    settings.save()
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
  if (mainWindow === null) createWindow()
})
