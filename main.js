// Import modules
const {
  app,
  dialog,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  net,
  shell
} = require('electron')
const path = require('path')
const url = require('url')
const settings = require('./js/settings')

// global variable for the main window
var mainWindow = null

const nameOfApp = app.getName()
const versionOfApp = app.getVersion()

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

// another instance of this program was found running so quit this instance of the program
if (shouldQuit) app.quit()

// setup of the settings with file name and defaults
settings.setup({
  configName: 'user-preferences',
  defaults: {
    windowBounds: { width: 600, height: 600, x: 0, y: 0 },
    timeInput: { d: '', h: '', m: '', s: '' },
    shutdown: true,
    spotify: true,
    tray: false,
    nativeTitleBar: false,
    tag: 'v' + versionOfApp,
    newTag: 'v' + versionOfApp
  }
})

// IPC communication interfaces
ipcMain
  .on('get-settings', (event, arg) => {
    event.returnValue = settings.get(arg)
  })
  .on('set-settings', (event, arg) => {
    settings.set(arg.name, arg.value)
  })
  .on('get-version', event => {
    event.returnValue = versionOfApp
  })
  .on('get-name', event => {
    event.returnValue = nameOfApp
  })
  .on('relaunch', () => {
    // save settings before closing the app
    saveSettings()
    // close and reopen the app
    app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) })
    app.exit(0)
  })

/**
 * Check for a new version
 */
function checkForNewVersion () {
  // make a request to the github api over tags of the repository
  net
    .request(
      'https://api.github.com/repos/undefinedCoding/little-shutdown-program/tags'
    )
    .on('response', response => {
      // if the response is ok
      if (response.statusCode === 200) {
        // get the requested data
        response
          .on('data', jsonData => {
            // try to convert the data into an object
            try {
              const releaseArray = JSON.parse(jsonData)
              if (
                releaseArray !== undefined &&
                releaseArray[0] !== undefined &&
                releaseArray[0].name !== undefined
              ) {
                const newestTag = releaseArray[0].name
                const currentTag = settings.get('tag')
                console.log('newestTag: ', newestTag, ' currentTag: ', currentTag)

                if (newestTag !== currentTag) {
                  settings.set('newTag', newestTag)
                  mainWindow.webContents.send('newVersionDetected')
                  dialog.showMessageBox(
                    mainWindow,
                    {
                      type: 'info',
                      title: 'New version avaible',
                      message: 'Do you want to install the new version?',
                      buttons: ['OK', 'NO'],
                      detail: 'Installed: ' +
                        settings.get('tag') +
                        ', New: ' +
                        releaseArray[0].name
                    },
                    response => {
                      if (response === 0) {
                        shell.openExternal(
                          'https://github.com/undefinedCoding/little-shutdown-program/releases/tag/' +
                            releaseArray[0].name
                        )
                      }
                    }
                  )
                }
              }
            } catch (e) {
              console.error(e)
            }
          }).on('end', () => {
            console.log('No more data in response.')
          })
      }
    })
    .on('error', error => {
      console.log('connection could not be established', error)
    })
    .end()
}

/**
 * Create the main window
 */
function createWindow () {
  // get settings
  const settingsWindowBounds = settings.get('windowBounds')
  const settingsNativeTitleBar = settings.get('nativeTitleBar')
  const settingsTray = settings.get('tray')

  // Create a BrowserWindow object
  mainWindow = new BrowserWindow({
    title: nameOfApp,
    titleBarStyle: 'hidden',
    backgroundColor: '#c9329e',
    minWidth: 600,
    minHeight: 600,
    width: settingsWindowBounds.width,
    height: settingsWindowBounds.height,
    x: settingsWindowBounds.x,
    y: settingsWindowBounds.y,
    frame: settingsNativeTitleBar,
    show: false, // do not show the window before content is loaded
    icon: path.join(__dirname, 'icon', 'icon.ico'),
    center: settingsWindowBounds.x === 0 && settingsWindowBounds.y === 0
  })

  // Load the 'index.html' file in the window
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  )

  // if a native title bar is wanted add a menu bar with two buttons instead of the custom title bar icons
  if (settingsNativeTitleBar) {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        {
          label: 'Settings',
          click () {
            mainWindow.webContents.send('toggleSettings')
          }
        },
        {
          label: 'About',
          click () {
            mainWindow.webContents.send('toggleAbout')
          }
        }
      ])
    )
  }

  // create tray icon if settings say so
  if (settingsTray) {
    // create tray icon
    const tray = new Tray(
      path.join(__dirname, 'icon', 'icon.ico')
    ).on('click', () => {
      // if tray icon is clicked the window will either be hidden or shown
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    })

    // create menu for left click on tray icon
    tray.setContextMenu(
      Menu.buildFromTemplate([
        {
          label: 'Exit',
          click: () => {
            mainWindow.close()
          }
        }
      ])
    )
    tray.setToolTip('Click to hide or show the app')

    // highlight icon if window currently shown and do the opposite if not
    mainWindow.on('show', () => {
      tray.setHighlightMode('always')
    }).on('hide', () => {
      tray.setHighlightMode('never')
    })
  }

  // Uncomment for instant debugging (from start open dev tools)
  // mainWindow.webContents.openDevTools()

  // The renderer process has rendered the page for the first time
  mainWindow.on('ready-to-show', () => {
    // show window
    mainWindow.show()
    // focus window
    mainWindow.focus()
    // check if a new version is available
    checkForNewVersion()
  }).on('closed', () => {
    // Dereference the window object
    mainWindow = null
  }).on('minimize', () => {
    // if tray activated hide window from taskbar
    if (settingsTray) mainWindow.hide()
  }).on('close', saveSettings)
}

function saveSettings () {
  // save window size and position before closing in settings
  settings.set('windowBounds', mainWindow.getBounds()).save()
}

// Electron is finished initializing and ready to create browser windows
app
  .on('ready', createWindow)
  .on('window-all-closed', () => {
    // Quit when all windows are closed.
    // macOS: Applications keep their menu bar until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
  })
  .on('activate', () => {
    // macOS: Re-create a window in the app when the dock icon is clicked and there are no other open windows
    if (mainWindow === null) createWindow()
  })
