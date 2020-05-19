/**
 * Renderer script of the application littel-shutdown-program
 *
 * @summary handles the whole program and user interaction
 * @author AnonymerNiklasistanyonym, undefinedCoding
 */

/* =====  Imports  ====== */

const Dialogs = require('dialogs')
const { ipcRenderer, remote, shell } = require('electron')
const shutdown = require('electron-shutdown-command')
const Hammer = require('hammerjs')
const notifier = require('node-notifier')
const path = require('path')
const { ShutdownTimer } = require('./js/timer')

/* =====  Global objects  ====== */

/**
 * Dialog object - controls popup dialogs
 */
const dialogs = Dialogs()
/**
 * Hammer 'object' - gesture listener
 */
const hammer = new Hammer(document.body)
const pan = new Hammer.Pan()
/**
 * The current window to launch remote commands
 */
const mainWindow = remote.getCurrentWindow()
/**
 * ShutdownTimer object - controls the timer
 */
const shutdownTimer = new ShutdownTimer()

/* =====  Global functions (that use no variables besides require) ====== */

/**
 * Open a given URL externally in the default browser
 * @param {String} url - Web URL
 */
function openLinkExternally (url) {
  shell.openExternal(url)
}

/**
 * Convert milliseconds to human readable time string
 * @param {number} milliseconds - The number of milliseconds
 * @returns {string} Human readable time string
 * @author Dan - https://stackoverflow.com/a/8212878
 */
function millisecondsToStr (milliseconds) {
  const numberEnding = (number) => number > 1 ? 's' : ''
  let temp = Math.floor(milliseconds / 1000)
  const days = Math.floor((temp %= 31536000) / 86400)
  if (days) return days + ' day' + numberEnding(days)
  const hours = Math.floor((temp %= 86400) / 3600)
  if (hours) return hours + ' hour' + numberEnding(hours)
  const minutes = Math.floor((temp %= 3600) / 60)
  if (minutes) return minutes + ' minute' + numberEnding(minutes)
  const seconds = temp % 60
  if (seconds) return seconds + ' second' + numberEnding(seconds)
  return 'less than a second'
}

/**
 * Create fancy slide animation between two elements that are both as wide as the screen
 * @param {HTMLElement} currentElement - HTML element that is shown right now and should slide out
 * @param {HTMLElement} elementToShow - HTML element that should slide in
 * @param {Boolean} directionRight - The direction of the slide
 */
function slideAnimation (currentElement, elementToShow, directionRight = true, rotateElement, rotateBack = undefined, secondRotateElement = undefined, secondRotateBack = undefined) {
  // do only allow one animation at a time
  if (animationPause) return
  else animationPause = true
  // display both elements
  currentElement.classList.remove('hide')
  elementToShow.classList.remove('hide')
  // move them without any transition to their specified place
  currentElement.style.transition = ''
  elementToShow.style.transition = ''
  currentElement.style.transform = ''
  elementToShow.style.transform = `translateX(${directionRight ? '+' : '-'}100vw)`
  // add transition animation for effect
  currentElement.style.transition = 'transform .4s ease-in-out'
  elementToShow.style.transition = 'transform .4s ease-in-out'
  // then move them both to their new place
  setTimeout(() => {
    currentElement.style.transform = `translateX(${directionRight ? '-' : '+'}100vw)`
    elementToShow.style.transform = ''
    // rotate object if it is not undefined
    if (rotateElement !== undefined) rotateIcon(rotateElement, rotateBack)
    if (secondRotateElement !== undefined) rotateIcon(secondRotateElement, secondRotateBack)
  }, 10)
  // after only one element is visible hide the other one and allow a new animation
  setTimeout(() => {
    currentElement.classList.add('hide')
    animationPause = false
    // to be sure if anything goes wrong set both elements agan to their place
    // currentElement.style.transform = `translateX(${directionRight ? '-' : '+'}100vw)`
    // elementToShow.style.transform = ''
  }, 440)
}

function rotateIcon (elementToRotate, rotateBack = false) {
  if (rotateBack) {
    elementToRotate.classList.remove('rotate')
  } else {
    elementToRotate.classList.add('rotate')
  }
}

/* =====  Global variables  ====== */

// titlebar
const titlebar = document.getElementById('titlebar-windows-10')
// titlebar >> action buttons
const titlebarSettings = document.getElementById('titelbar-settings')
const titlebarHelp = document.getElementById('titelbar-help')
const titlebarMinimize = document.getElementById('titelbar-minimize')
const titlebarResize = document.getElementById('titelbar-resize')
const titlebarClose = document.getElementById('titelbar-close')

// mainContainer (start view)
const mainContainer = document.getElementById('main-container')
// mainContainer >> Time inputs
const timerInputDays = document.getElementById('timer_d')
const timerInputHours = document.getElementById('timer_h')
const timerInputMinutes = document.getElementById('timer_m')
const timerInputSeconds = document.getElementById('timer_s')
// mainContainer >> Timer control buttons
const timerButtonPauseResume = document.getElementById('button_pause_resume')
const timerButtonStartStop = document.getElementById('button_start_stop')
const timerButtonClear = document.getElementById('button_clear')
// mainContainer >> the digits of the time display
var digits = Array.from(document.getElementById('digits').children)
for (let i = 0; i < digits.length; i++) {
  if (digits[i].className === 'dots') {
    digits.splice(i, 1)
    i--
  }
}

// settingsContainer
const settingsContainer = document.getElementById('settings')
// settingsContainer >> checkboxes
const checkboxShutdown = document.getElementById('checkbox-shutdown')
const checkboxTray = document.getElementById('checkbox-tray')
const checkboxMenuBar = document.getElementById('checkbox-nativeTitleBar')
const checkboxNewVersionUpdate = document.getElementById('checkbox-newVersionUpdate')
const checkboxTouchGestures = document.getElementById('checkbox-touchGestures')
// settingsContainer >> reset buttons
const resetEverythingButton = document.getElementById('resetEverything')
const resetColorsButton = document.getElementById('resetColors')
const resetSettingsButton = document.getElementById('resetSettings')

// aboutContainer
const aboutContainer = document.getElementById('about')
// aboutContainer >> version number
const versionNumber = document.getElementById('version-number')
// aboutContainer >> version update button
const versionUpdateButton = document.getElementById('newVersionNumber')

const settingsIcon = document.getElementById('settingsIcon')
const aboutIcon = document.getElementById('aboutIcon')

// get and set CSS variables
const html = document.getElementsByTagName('html')[0]
const style = window.getComputedStyle(document.body)

// digit classes for CSS (clock)
const digitClasses = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

// get the time input from the last session
const timeInputLastSession = ipcRenderer.sendSync('get-settings', 'timeInput')

// color settings
const colorSettings = [
  {htmlId: 'backgroundColor', settingsId: 'mainColor', cssId: 'main-color'},
  {htmlId: 'textColor', settingsId: 'mainColorText', cssId: 'main-color-text'},
  {htmlId: 'titleBarColor', settingsId: 'titlebarColorTextIcon', cssId: 'titlebar-color-text-icon'}
]

// checkbox settings
const checkboxSettings = [
  {htmlElement: checkboxShutdown,
    settingsId: 'shutdown',
    onClick: () => {
      console.log('onClick shutdown')
      ipcRenderer.send('set-settings', {
        name: 'shutdown',
        value: checkboxShutdown.checked
      })
    }},
  {htmlElement: checkboxTray,
    settingsId: 'tray',
    restart: true,
    onClick: () => {
      console.log('onClick tray')
      // every time the checkbox is clicked ask for a restart of the program
      // to add/remove the tray
      questionDialog('To change this option you need to restart the program', () => {
        ipcRenderer.send('set-settings', {
          name: 'tray',
          value: checkboxTray.checked
        })
        // relaunch after setting setting entry
        ipcRenderer.send('relaunch')
      }, () => {
        checkboxTray.checked = ipcRenderer.send('get-settings', 'tray')
      })
    }},
  {htmlElement: checkboxMenuBar,
    settingsId: 'nativeTitleBar',
    restart: true,
    onClick: () => {
      console.log('onClick nativeTitleBar')
      // every time the checkbox is clicked ask for a restart of the program
      // to add/remove the tray
      questionDialog('To change this option you need to restart the program', () => {
        ipcRenderer.send('set-settings', {
          name: 'nativeTitleBar',
          value: checkboxMenuBar.checked
        })
        // relaunch after setting setting entry
        ipcRenderer.send('relaunch')
      }, () => {
        checkboxMenuBar.checked = ipcRenderer.send(
          'get-settings',
          'nativeTitleBar'
        )
      })
    }},
  {htmlElement: checkboxNewVersionUpdate,
    settingsId: 'checkForNewVersionOnStartup',
    onClick: () => {
      console.log('onClick checkForNewVersionOnStartup')
      ipcRenderer.send('set-settings', {
        name: 'checkForNewVersionOnStartup',
        value: checkboxNewVersionUpdate.checked
      })
      if (checkboxNewVersionUpdate.checked) ipcRenderer.send('check-for-update')
    }},
  {htmlElement: checkboxTouchGestures,
    settingsId: 'touchGestures',
    onClick: () => {
      console.log('onClick touchGestures')
      ipcRenderer.send('set-settings', {
        name: 'touchGestures',
        value: checkboxTouchGestures.checked
      })
      if (checkboxTouchGestures.checked) activateTouchGestures()
      else hammer.remove(pan)
    }}
]

// indicator if right now an animation is played
var animationPause = false

// save time to not render more than is necessary
var oldT

/* =====  Setup code  ====== */

// set correct version number on the about page
versionNumber.innerText = ipcRenderer.sendSync('get-settings', 'tag')
// check all checkbox settings and add event listener
settingsCheckboxSetup()
for (const checkboxSetting of checkboxSettings) {
  checkboxSetting.htmlElement.addEventListener('change', checkboxSetting.onClick)
}
// setup screen positons
aboutContainer.classList.add('hide')
settingsContainer.classList.add('hide')
aboutContainer.style.transform = 'translateX(-100vw)'
settingsContainer.style.transform = 'translateX(+100vw)'
// get from settings the last time input and set it
timerInputDays.value = timeInputLastSession.d
timerInputHours.value = timeInputLastSession.h
timerInputMinutes.value = timeInputLastSession.m
timerInputSeconds.value = timeInputLastSession.s
setToReadableTime(timeInputLastSession.d, timeInputLastSession.h, timeInputLastSession.m, timeInputLastSession.s)
// titlebar listener for either custom or default titlebar
if (checkboxMenuBar.checked) {
  titlebar.style.display = 'none'
  ipcRenderer.on('toggleSettings', toggleSettings).on('toggleAbout', toggleAbout)
} else {
  mainContainer.classList.add('titlebar-active')
  aboutContainer.classList.add('titlebar-active')
  settingsContainer.classList.add('titlebar-active')
  // titlebar event listeners
  titlebarSettings.addEventListener('click', toggleSettings)
  titlebarHelp.addEventListener('click', toggleAbout)
  titlebarMinimize.addEventListener('click', () => {
    mainWindow.minimize()
  })
  titlebarResize.addEventListener('click', () => {
    mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize()
  })
  titlebarClose.addEventListener('click', () => {
    // if timer is still running ask if the program really should be closed
    if (shutdownTimer.isStopped) mainWindow.close()
    else {
      questionDialog('Do you really want to close the program because there is still a timer running?', () => {
        mainWindow.close()
      })
    }
  })
}
// add input listener to time inputs
timerInputDays.addEventListener('input', saveInput)
timerInputHours.addEventListener('input', saveInput)
timerInputMinutes.addEventListener('input', saveInput)
timerInputSeconds.addEventListener('input', saveInput)
// set new version button if one was found
ipcRenderer.on('newVersionDetected', (event, arg) => {
  versionUpdateButton.style.display = 'inline'
  versionUpdateButton.innerText = `Latest version: ${arg.tag}`
  versionUpdateButton.onclick = () => {
    openLinkExternally(arg.url)
  }
}).on('auto-updates-disabled', () => {
  checkboxNewVersionUpdate.checked = false
})
// shutdownTimer event listener/callbacks
shutdownTimer
  .on('alarmCallback', (err, t) => {
    if (err) return console.error(err)
    // reset button texts
    timerButtonPauseResume.value = 'Pause'
    timerButtonStartStop.value = 'Start'
    // reset time display to 00:00:00:00
    setTime(0, 0, 0, 0)
    // shutdown the computer if wanted
    if (ipcRenderer.sendSync('get-settings', 'shutdown')) {
      // start timeout (20s) for forcefully shutting down the computer
      const shutdownTimeout = setTimeout(() => {
        // simple system shutdown with default options
        shutdown.shutdown({
          force: true
        })
      }, 20000)
      // start dialog to inform that the computer will be shut down in 20s (for preventing it)
      questionDialog('Stop the computer from shutting down? (in 20s this will automatically happen)', () => {
        // stop timeout/shutdown
        clearTimeout(shutdownTimeout)
      }
      )
      // start a notification to inform that the computer will be shut down in 20s (for preventing it)
      notificationDialog('Timer is finished (' + millisecondsToStr(t.msInput) + ')', 'The computer is about to shut down (20s) - click here to stop this from happening!', (response) => {
        if (response == null || response === undefined || response === '') {
          // Catch undefined behaviour
          // TODO Notifier doesn't work on Manjaro Linux!!!
          return;
        }
        // close open dialogs when notification gets clicked
        dialogs.cancel()
        // clear timeout / stop shutdown
        clearTimeout(shutdownTimeout)
        // restore window if it's minimized
        if (mainWindow.isMinimized()) {
          mainWindow.restore()
        }
        // focus the window
        mainWindow.focus()
      })
    } else {
      const dialogTitle = `Timer has finished (after ${millisecondsToStr(t.msInput)})`
      notificationDialog(dialogTitle, ':)', () => {
        // close open dialogs when notification gets clicked
        dialogs.cancel()
        // restore window if it's minimized
        if (mainWindow.isMinimized()) mainWindow.restore()
        // focus the window
        mainWindow.focus()
      })
    }
  }).on('countdownCallback', (err, t) => {
    if (err) return console.error(err)
    // update time display if something is new
    if (t.d !== oldT.d || t.h !== oldT.h || t.m !== oldT.m || t.s !== oldT.s) {
      setTime(t.d, t.h, t.m, t.s)
      oldT = t
    }
  }).on('resumeCallback', err => {
    if (err) return console.error(err)
    // change timerButtonPauseResume value
    timerButtonPauseResume.value = 'Pause'
  }).on('pauseCallback', err => {
    if (err) return console.error(err)
    // change timerButtonPauseResume value
    timerButtonPauseResume.value = 'Resume'
  }).on('startCallback', (err, t) => {
    if (err) return console.error(err)
    // change button values
    timerButtonStartStop.value = 'Stop'
    timerButtonPauseResume.value = 'Pause'
    // set time
    setTime(t.d, t.h, t.m, t.s)
    oldT = t
  }).on('stopCallback', (err, t) => {
    if (err) return console.error(err)
    // change button values
    timerButtonStartStop.value = 'Start'
    timerButtonPauseResume.value = 'Pause'
    // set time
    const currentTime = {
      d: timerInputDays.value,
      h: timerInputHours.value,
      m: timerInputMinutes.value,
      s: timerInputSeconds.value
    }
    setToReadableTime(currentTime.d, currentTime.h, currentTime.m, currentTime.s)
    oldT = currentTime
  }).on('resetCallback', err => {
    if (err) return console.error(err)
    // change button values
    timerButtonStartStop.value = 'Start'
    timerButtonPauseResume.value = 'Pause'
    // clear time input
    timerInputDays.value = ''
    timerInputHours.value = ''
    timerInputMinutes.value = ''
    timerInputSeconds.value = ''
    // reset time
    setTime(0, 0, 0, 0)
  })
// event listener for dev shortcuts
document.addEventListener('keydown', e => {
  switch (e.which) {
    case 116: // F5 - reload app
      mainWindow.reload()
      break
    case 122: // F11 - Fullscreen
      mainWindow.setFullScreen(!mainWindow.isFullScreen())
      break
    case 123: // F12 - dev tools
      mainWindow.webContents.toggleDevTools()
      break
    case 37: // <-  - Screen switch left
      leftAnimation()
      break
    case 39: // -> - Screen switch right
      rightAnimation()
      break
    case 13: // Enter - Start/Stop
      startstopTimer()
      break
    case 32: // Space bar - Resume/Pause
      shutdownTimer.isPaused ? shutdownTimer.resume() : shutdownTimer.pause()
      break
  }
})
// if custom titlebar is selected
if (!checkboxMenuBar.checked) {
  mainWindow
    .on('enter-full-screen', () => {
    // hide the custom title bar and make container bigger
      titlebar.classList.add('hide')
      mainContainer.classList.remove('titlebar-active')
      aboutContainer.classList.remove('titlebar-active')
      settingsContainer.classList.remove('titlebar-active')
    })
    .on('leave-full-screen', () => {
    // show the custom title bar and make container smaller
      titlebar.classList.remove('hide')
      mainContainer.classList.add('titlebar-active')
      aboutContainer.classList.add('titlebar-active')
      settingsContainer.classList.add('titlebar-active')
    })
    .on('maximize', () => {
    // if window is maximized add class to titlebar to show restore icon and hide maximize icon
      titlebar.classList.add('fullscreen')
    })
    .on('unmaximize', () => {
    // if window is maximized add class to titlebar to hide restore icon and show maximize icon
      titlebar.classList.remove('fullscreen')
    })
}
for (const colorSetting of colorSettings) {
  settingsColorPickerSetup(colorSetting.htmlId, colorSetting.settingsId, colorSetting.cssId)
}
resetColorsButton.addEventListener('click', () => {
  for (const colorSetting of colorSettings) {
    ipcRenderer.sendSync('reset-settings', colorSetting.settingsId)
    settingsColorPickerUpdate(colorSetting.htmlId, colorSetting.settingsId, colorSetting.cssId)
  }
})
resetSettingsButton.addEventListener('click', () => {
  let restartDialog = false
  for (const checkboxSetting of checkboxSettings) {
    if (checkboxSetting.restart === true) {
      const defaultSetting = ipcRenderer.sendSync('get-settings-default', checkboxSetting.settingsId)
      const currentSetting = checkboxSetting.htmlElement.checked
      if (defaultSetting !== currentSetting) restartDialog = true
    }
  }
  if (restartDialog) {
    questionDialog('To reset the checkboxes the program needs to restart', () => {
      for (const checkboxSetting of checkboxSettings) {
        ipcRenderer.sendSync('reset-settings', checkboxSetting.settingsId)
      }
      ipcRenderer.send('relaunch')
    })
  } else {
    for (const checkboxSetting of checkboxSettings) {
      ipcRenderer.sendSync('reset-settings', checkboxSetting.settingsId)
    }
    settingsCheckboxReset()
  }
})
resetEverythingButton.addEventListener('click', () => {
  questionDialog('To reset everything the program will restart, do you really want to reset everything back to default?', () => {
    ipcRenderer.sendSync('reset-settings-all')
    ipcRenderer.send('relaunch')
  })
})
// timer pause/resume button - resume timer or pause if running
timerButtonPauseResume.addEventListener('click', () => {
  shutdownTimer.isPaused ? shutdownTimer.resume() : shutdownTimer.pause()
})
// timer start/resume button - start timer if no timer is running else stop it
timerButtonStartStop.addEventListener('click', startstopTimer)
// timer clear button - reset timer
timerButtonClear.addEventListener('click', () => {
  shutdownTimer.reset()
})

/* =====  Global functions  ====== */

/**
 * Dialog with OK and CANCEL button
 * @param {String} message - Message of the dialog
 * @param {Function} okCallback - Function that will be executed on OK press
 * @param {Function} cancelCallback - Function that will be executed on CANCEL press
 */
function questionDialog (message, okCallback = () => {}, cancelCallback = () => {}) {
  dialogs.confirm(message, okWasPressed => {
    okWasPressed ? okCallback() : cancelCallback()
  })
}

/**
 * Notification with click and timeout listener
 * @param {String} title - Title text
 * @param {String} message - Message text
 * @param {Function} clickCallback - Function that will be executed on click
 * @param {Function} timeoutCallback - Function that will be executed on timeout
 */
function notificationDialog (title, message, clickCallback, timeoutCallback = () => {}) {
  notifier.notify({
    title: title,
    message: message,
    icon: path.join(__dirname, 'icon', 'icon.png'),
    sound: true,
    wait: true
  },
  (err, response) => {
    if (err) return console.error(err)
    if (response === 'the toast has timed out') timeoutCallback()
    else clickCallback(response)
  })
}

/**
 * Setup settings checkboxes (setup toggle elements)
 */
function settingsCheckboxSetup () {
  for (const checkboxSetting of checkboxSettings) {
    checkboxSetting.htmlElement.checked = ipcRenderer.sendSync('get-settings', checkboxSetting.settingsId)
  }
}

/**
 * Reset settings checkboxes to their default values and execute on click functions
 */
function settingsCheckboxReset () {
  const oldValues = []
  const newValues = []
  for (let i = 0; i < checkboxSettings.length; i++) {
    oldValues[i] = checkboxSettings[i].htmlElement.checked
  }
  settingsCheckboxSetup()
  for (let i = 0; i < checkboxSettings.length; i++) {
    newValues[i] = checkboxSettings[i].htmlElement.checked
  }
  // do something if values are now different
  for (let i = 0; i < checkboxSettings.length; i++) {
    if (oldValues[i] !== newValues[i]) checkboxSettings[i].onClick()
  }
}

/**
 * Toggle the settings container
 */
function toggleSettings () {
  if (aboutContainer.style.transform === '') {
    slideAnimation(aboutContainer, settingsContainer, true, settingsIcon, false, aboutIcon, true)
  } else if (mainContainer.style.transform === '') {
    slideAnimation(mainContainer, settingsContainer, true, settingsIcon)
  } else slideAnimation(settingsContainer, mainContainer, false, settingsIcon, true)
}

/**
 * Toggle the about container
 */
function toggleAbout () {
  if (settingsContainer.style.transform === '') {
    slideAnimation(settingsContainer, aboutContainer, false, aboutIcon, false, settingsIcon, true)
  } else if (mainContainer.style.transform === '') {
    slideAnimation(mainContainer, aboutContainer, false, aboutIcon)
  } else slideAnimation(aboutContainer, mainContainer, true, aboutIcon, true)
}

/**
 * Move to the screen to the left
 */
function leftAnimation () {
  if (settingsContainer.style.transform === '') toggleSettings()
  else if (mainContainer.style.transform === '') toggleAbout()
}

/**
 * Move to the screen to the right
 */
function rightAnimation () {
  if (aboutContainer.style.transform === '') toggleAbout()
  else if (mainContainer.style.transform === '') toggleSettings()
}

/**
 * Activate touch gesture support
 */
function activateTouchGestures () {
  console.log('activate touch')
  hammer.on('panright', leftAnimation)
  hammer.on('panleft', rightAnimation)
  hammer.add(pan)
}

/**
 * Start timer with the inputted time or stop it if it's running
 */
function startstopTimer () {
  // if timer is running stop it
  if (!shutdownTimer.isStopped) return shutdownTimer.stop()
  // else start it
  const days = (timerInputDays.value === '') ? 0 : Number(timerInputDays.value)
  const hours = (timerInputHours.value === '') ? 0 : Number(timerInputHours.value)
  const minutes = (timerInputMinutes.value === '') ? 0 : Number(timerInputMinutes.value)
  const seconds = (timerInputSeconds.value === '') ? 0 : Number(timerInputSeconds.value)
  const allSeconds = (days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000
  shutdownTimer.start(allSeconds)
}

/**
 * Saves current inputted time in the settings and displays it on the timer if it is stopped
 */
function saveInput () {
  const input = {
    d: timerInputDays.value,
    h: timerInputHours.value,
    m: timerInputMinutes.value,
    s: timerInputSeconds.value
  }
  ipcRenderer.send('set-settings', {
    name: 'timeInput',
    value: input
  })
  if (shutdownTimer.isStopped) setToReadableTime(input.d, input.h, input.m, input.s)
}

/**
 * Convert time input into the correct DD:HH:MM:SS format and then set the time on the timer
 * @param {String} daysInput - Day input value
 * @param {String} hoursInput - Hour input value
 * @param {String} minutesInput - Minute input value
 * @param {String} secondsInput - Second input value
 */
function setToReadableTime (daysInput, hoursInput, minutesInput, secondsInput) {
  let days = (daysInput === '') ? 0 : Number(daysInput)
  let hours = (hoursInput === '') ? 0 : Number(hoursInput)
  let minutes = (minutesInput === '') ? 0 : Number(minutesInput)
  let seconds = (secondsInput === '') ? 0 : Number(secondsInput)
  seconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds
  minutes = Math.floor(seconds / 60)
  seconds = seconds % 60
  hours = Math.floor(minutes / 60)
  minutes = minutes % 60
  days = Math.floor(hours / 24)
  hours = hours % 24
  setTime(days, hours, minutes, seconds)
}

/**
 * Sets given time on display
 * @param {Number|String} daysInput - Number of days
 * @param {Number|String} hoursInput - Number of hours
 * @param {Number|String} minutesInput - Number of minutes
 * @param {Number|String} secondsInput - Number of seconds
 */
function setTime (daysInput, hoursInput, minutesInput, secondsInput) {
  let days = (daysInput === '') ? 0 : Number(daysInput)
  let hours = (hoursInput === '') ? 0 : Number(hoursInput)
  let minutes = (minutesInput === '') ? 0 : Number(minutesInput)
  let seconds = (secondsInput === '') ? 0 : Number(secondsInput)

  // save all chars in an array
  const timeArray = [
    days.toString().split(''),
    hours.toString().split(''),
    minutes.toString().split(''),
    seconds.toString().split('')
  ]
  // add for every time thing two numbers
  for (
    let index = 0, index2 = 0; index < timeArray.length; index++, (index2 += 2)
  ) {
    if (timeArray[index].length > 1) {
      digits[index2].className = digitClasses[Number(timeArray[index][0])]
      digits[index2 + 1].className = digitClasses[Number(timeArray[index][1])]
    } else {
      digits[index2].className = digitClasses[0]
      digits[index2 + 1].className = digitClasses[Number(timeArray[index][0])]
    }
  }
}

/**
 * Color picker preview and listener setup
 * @param {String} htmlIdWithoutPrefix - Id of colorpicker html element without the 'colorPicker-' at the beginning
 * @param {String} settingId - Name of the color setting entry in the settings file
 * @param {String} cssVariableName - Name of the CSS variable
 */
function settingsColorPickerSetup (htmlIdWithoutPrefix, settingId, cssVariableName) {
  const colorPickerInput = document.getElementById('colorPicker-' + htmlIdWithoutPrefix)
  const colorPreview = document.getElementById('preview-' + htmlIdWithoutPrefix)
  colorPickerInput.addEventListener('input', () => {
    html.style.setProperty('--' + cssVariableName, colorPickerInput.value)
    colorPreview.style.backgroundColor = colorPickerInput.value
    ipcRenderer.send('set-settings', {name: settingId, value: colorPickerInput.value})
  })
  settingsColorPickerUpdate(htmlIdWithoutPrefix, settingId, cssVariableName)
}

/**
 * Update a color preview and
 * @param {String} htmlIdWithoutPrefix - Id of colorpicker html element without the 'colorPicker-' at the beginning
 * @param {String} settingId - Name of the color setting entry in the settings file
 * @param {String} cssVariableName - Name of the CSS variable
 */
function settingsColorPickerUpdate (htmlIdWithoutPrefix, settingId, cssVariableName) {
  html.style.setProperty('--' + cssVariableName, ipcRenderer.sendSync('get-settings', settingId))
  const colorPickerInput = document.getElementById('colorPicker-' + htmlIdWithoutPrefix)
  const colorPreview = document.getElementById('preview-' + htmlIdWithoutPrefix)
  colorPickerInput.value = style.getPropertyValue('--' + cssVariableName)
  colorPreview.style.backgroundColor = style.getPropertyValue('--' + cssVariableName)
}

// TODO: Set to a place where it belongs - just a bugfix that was fixed for now
if (checkboxTouchGestures.checked) activateTouchGestures()
