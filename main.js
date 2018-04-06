// Import modules
const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  net,
  shell,
  Tray
} = require('electron')
const path = require('path')
const url = require('url')
const settings = require('./js/settings')

// Global variables
var mainWindow = null
var alreadyCheckingForUpdates = false
const appName = app.getName()
const appVersion = app.getVersion()

// Singelton implementation: check for another running instance of this program
if (
  app.makeSingleInstance(() => {
    // if an initalized main window (!== null) was found (restore +) focus it
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
) { app.quit() }

// setup of the settings with file name and default values
settings.setup({
  configName: 'user-preferences',
  defaults: {
    checkForNewVersionOnStartup: true,
    nativeTitleBar: false,
    newTag: 'v' + appVersion,
    shutdown: true,
    spotify: true,
    tag: 'v' + appVersion,
    timeInput: { d: '', h: '', m: '', s: '' },
    tray: false,
    windowBounds: { width: 600, height: 600, x: 0, y: 0 }
  }
})

// interprocess communication listeners
ipcMain
  .on('get-settings', (event, arg) => {
    event.returnValue = settings.get(arg)
  })
  .on('set-settings', (event, arg) => {
    settings.set(arg.name, arg.value)
  })
  .on('get-name', event => {
    event.returnValue = appName
  })
  .on('check-for-update', checkForNewVersion)
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
  if (!alreadyCheckingForUpdates) {
    alreadyCheckingForUpdates = true
    // make a request to the github api over tags of the repository
    var buffers = []
    net.request('https://api.github.com/repos/undefinedCoding/little-shutdown-program/releases/latest'
    ).on('response', response => {
      // DEBUG: Log status code
      // console.log(`STATUS: ${response.statusCode}`)
      response.on('data', chunk => {
        // push gotten data into the buffer
        buffers.push(chunk)
      }).on('end', () => {
        // no more response data, everything was collected in the buffer - parse to JSON
        const jsonObjectString = Buffer.concat(buffers).toString()
        // DEBUG: Log response data
        // console.log(`BODY: ${jsonObjectString}`)
        // try to convert the gotten data into an object
        try {
          const latestRelease = JSON.parse(jsonObjectString)
          // DEBUG:
          // console.log(latestRelease)
          // save old and current tag in constant variables
          const newestTag = latestRelease.tag_name
          const currentTag = settings.get('tag')
          // if they are different
          if (newestTag !== currentTag) {
          // change newest tag in the settings and send message to render process
            settings.set('newTag', newestTag)
            mainWindow.webContents.send(
              'newVersionDetected',
              {
                latestTag: newestTag,
                url: latestRelease.html_url
              }
            )
            // show a message box that says that a new version is aviable if settings say so
            dialog.showMessageBox(
              mainWindow,
              {
                type: 'info',
                title: 'New version avaible',
                message: 'Do you want to install the new version?',
                buttons: ['OK', 'NO', 'DISABLE NOTIFICATION'],
                detail: `Installed: ${currentTag}, Latest: ${newestTag}`
              },
              buttonId => {
                switch (buttonId) {
                  case 0:
                    shell.openExternal(latestRelease.html_url)
                    break
                  case 2:
                    settings.set('checkForNewVersionOnStartup', false)
                    mainWindow.webContents.send('auto-updates-disabled')
                }
              }
            )
          }
        } catch (e) {
          console.log(`ERROR: [PARSE JSON] ${JSON.stringify(e)}`)
        }
      }).on('error', error => {
        console.log(`ERROR: [RESPONSE] ${JSON.stringify(error)}`)
      })
    }).on('error', error => {
      console.log(`ERROR: [REQUEST] ${JSON.stringify(error)}`)
    }).on('finish', () => {
      // DEBUG:
      // console.log('Emitted just after the last chunk of the requests data has been written into the request object.')
    }).on('close', () => {
      // DEBUG:
      // console.log('Emitted as the last event in the HTTP request-response transaction. The close event indicates that no more events will be emitted on either the request or response objects.')
      alreadyCheckingForUpdates = false
    }).end()
  }
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
    title: appName,
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

    // create left click menu for the tray icon
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
    // create text that will be shown on hover of the tray icon
    tray.setToolTip('Click to hide or show the app')

    // highlight icon if window currently shown and do the opposite if not
    mainWindow
      .on('show', () => {
        tray.setHighlightMode('always')
      })
      .on('hide', () => {
        tray.setHighlightMode('never')
      })
  }

  // DEBUG: Open dev tools from start
  // mainWindow.webContents.openDevTools()

  // The renderer process has rendered the page for the first time
  mainWindow
    .on('ready-to-show', () => {
      // show window
      mainWindow.show()
      // focus window
      mainWindow.focus()
      // if settings say so check if a new version is available
      if (settings.get('checkForNewVersionOnStartup')) checkForNewVersion()
    })
    .on('minimize', () => {
      // if tray activated hide window from taskbar
      if (settingsTray) mainWindow.hide()
    })
    .on('close', saveSettings)
    .on('closed', () => {
      // Dereference the window object
      mainWindow = null
    })
}

/**
 * Save current settings (+ window size/position) in preferences file
 */
function saveSettings () {
  settings.set('windowBounds', mainWindow.getBounds()).save()
}

// app listeners (ready = electron is loaded)
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
