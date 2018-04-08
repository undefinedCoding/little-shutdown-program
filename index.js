// imports
const {
  ShutdownTimer
} = require('./js/timer')
const {
  SpotifyHandler
} = require('./js/spotifyHandler')
const {
  ipcRenderer,
  remote,
  shell
} = require('electron')
const dialogs = require('dialogs')()
const Hammer = require('hammerjs')
const notifier = require('node-notifier')
const path = require('path')
const shutdown = require('electron-shutdown-command')

/*
 * Global objects
 */

/**
 * ShutdownTimer object - controls the timer
 */
const shutdownTimer = new ShutdownTimer()
/**
 * SpotifyHandler object - controls Spotify desktop
 */
const spotifyHandler = new SpotifyHandler()

/*
 * Global functions
 */

/**
 * Open a given URL externally in the default browser
 * @param {String} url - Normal URL
 */
function openLinkExternally (url) {
  shell.openExternal(url)
}

/**
 * Convert milliseconds to min sec string
 * @param {number} milliseconds - The number of milliseconds
 * @returns {string} XXmin and XXs formatted string
 * @author Dan - https://stackoverflow.com/a/8212878
 */
function millisecondsToStr (milliseconds) {
  function numberEnding (number) {
    return number > 1 ? 's' : ''
  }
  var temp = Math.floor(milliseconds / 1000)
  const days = Math.floor((temp %= 31536000) / 86400)
  if (days) {
    return days + ' day' + numberEnding(days)
  }
  const hours = Math.floor((temp %= 86400) / 3600)
  if (hours) {
    return hours + ' hour' + numberEnding(hours)
  }
  const minutes = Math.floor((temp %= 3600) / 60)
  if (minutes) {
    return minutes + ' minute' + numberEnding(minutes)
  }
  const seconds = temp % 60
  if (seconds) {
    return seconds + ' second' + numberEnding(seconds)
  }
  return 'less than a second'
}

/**
 * Create fancy slide animation between two elements that are both as wide as the screen
 * @param {HTMLElement} currentElement - HTML element that is shown right now and should slide out
 * @param {HTMLElement} elementToShow - HTML element that should slide in
 * @param {Boolean} directionRight - The direction of the slide
 */
function slideAnimation (currentElement, elementToShow, directionRight = true) {
  if (animationPause) return
  // do not allow another animation
  animationPause = true
  // show both elements
  currentElement.classList.remove('hide')
  elementToShow.classList.remove('hide')
  // move them to their correct place
  currentElement.style.transition = ''
  elementToShow.style.transition = ''
  currentElement.style.transform = ''
  elementToShow.style.transform = `translateX(${directionRight ? '+' : '-'}100vw)`
  // set transition animation
  currentElement.style.transition = 'transform .4s ease-in-out'
  elementToShow.style.transition = 'transform .4s ease-in-out'

  // then move them both to their new place
  setTimeout(() => {
    currentElement.style.transform = `
      translateX(${directionRight ? '-' : '+'}100vw)`
    elementToShow.style.transform = ''
  }, 10)

  // after this hide the current element and show the new element if the user clicks often on the button
  setTimeout(() => {
    currentElement.classList.add('hide')
    currentElement.classList.remove('hide')
    currentElement.style.transition = ''
    elementToShow.style.transition = ''
    currentElement.style.transform = `translateX(${directionRight ? '-' : '+'}100vw)`
    elementToShow.style.transform = ''
    animationPause = false
  }, 440)
}

/*
 * Global variables
 */

// constant settings
const nativeTitleBar = ipcRenderer.sendSync('get-settings', 'nativeTitleBar')

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
// mainContainer >> spotify connection indicator
const spotifySVG = document.getElementById('spotify-logo')
// mainContainer >> the digits of the time display
var digits = document.getElementById('digits')
digits = Array.from(digits.children)
for (let i = 0; i < digits.length; i++) {
  if (digits[i].className === 'dots') {
    digits.splice(i, 1)
    i--
  }
}

// settingsContainer
const settingsContainer = document.getElementById('settings')
// settingsContainer >> setting entry checkboxes
const checkboxShutdown = document.getElementById('checkbox-shutdown')
const checkboxSpotify = document.getElementById('checkbox-spotify')
const checkboxTray = document.getElementById('checkbox-tray')
const checkboxNativeTitleBar = document.getElementById(
  'checkbox-nativeTitleBar'
)
const checkboxNewVersionUpdate = document.getElementById('checkbox-newVersionUpdate')

// aboutContainer
const aboutContainer = document.getElementById('about')
// version number
const versionNumber = document.getElementById('version-number')
// version update
const versionUpdate = document.getElementById('newVersionNumber')

// spotify startup setting
const spotifyStateOnStart = ipcRenderer.sendSync('get-settings', 'spotify')

// indicator if right now an animation is played
var animationPause = false

// save time to not render more than is necessary
var oldT

// measure how long spotify needs to connect (after update not rly necessary :)
var spotifyWebHelperStarted

/*
 * Setup >> Text/Styles
 */

// try on load to connect to spotify if setting is true
if (spotifyStateOnStart) {
  spotifyHandler.connect()
  spotifyWebHelperStarted = window.performance.now()
}

// set correct version number on the about page
versionNumber.innerText = ipcRenderer.sendSync('get-settings', 'tag')

// set checkboxes in the settings to their correct position
checkboxShutdown.checked = ipcRenderer.sendSync('get-settings', 'shutdown')
checkboxSpotify.checked = spotifyStateOnStart
checkboxTray.checked = ipcRenderer.sendSync('get-settings', 'tray')
checkboxNativeTitleBar.checked = ipcRenderer.sendSync(
  'get-settings',
  'nativeTitleBar'
)
checkboxNewVersionUpdate.checked = ipcRenderer.sendSync('get-settings', 'checkForNewVersionOnStartup')

// move the containers to their correct place
aboutContainer.classList.add('hide')
settingsContainer.classList.add('hide')
aboutContainer.style.transform = 'translateX(-100vw)'
settingsContainer.style.transform = 'translateX(+100vw)'

// digit classes for CSS
const digitClasses = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine'
]

// get from settings the last time input and set it
const timeInputLastTime = ipcRenderer.sendSync('get-settings', 'timeInput')
timerInputDays.value = timeInputLastTime.d
timerInputHours.value = timeInputLastTime.h
timerInputMinutes.value = timeInputLastTime.m
timerInputSeconds.value = timeInputLastTime.s
setToReadableTime(timeInputLastTime.d, timeInputLastTime.h, timeInputLastTime.m, timeInputLastTime.s)

// set new version button if one was found
ipcRenderer.on('newVersionDetected', (event, arg) => {
  versionUpdate.style.display = 'inline'
  versionUpdate.innerText = `Latest version: ${arg.tag}`
  versionUpdate.onclick = () => {
    openLinkExternally(arg.url)
  }
}).on('auto-updates-disabled', () => {
  checkboxNewVersionUpdate.checked = false
})

/*
 * Setup >> Event listener
 */

/**
 * Toggle the settings container
 */
function toggleSettings () {
  if (aboutContainer.style.transform === '') {
    slideAnimation(aboutContainer, settingsContainer, true)
  } else if (mainContainer.style.transform === '') {
    slideAnimation(mainContainer, settingsContainer, true)
  } else slideAnimation(settingsContainer, mainContainer, false)
}

/**
 * Toggle the about container
 */
function toggleAbout () {
  if (settingsContainer.style.transform === '') {
    slideAnimation(settingsContainer, aboutContainer, false)
  } else if (mainContainer.style.transform === '') {
    slideAnimation(mainContainer, aboutContainer, false)
  } else slideAnimation(aboutContainer, mainContainer, true)
}

function leftAnimation () {
  if (settingsContainer.style.transform === '') {
    slideAnimation(settingsContainer, mainContainer, false)
  } else if (mainContainer.style.transform === '') {
    slideAnimation(mainContainer, aboutContainer, false)
  }
}

function rightAnimation () {
  if (aboutContainer.style.transform === '') {
    slideAnimation(aboutContainer, mainContainer, true)
  } else if (mainContainer.style.transform === '') {
    slideAnimation(mainContainer, settingsContainer, true)
  }
}

// touch gesture listener
new Hammer(document.body).on('panright', leftAnimation).on('panleft', rightAnimation)

if (nativeTitleBar) {
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
    remote.getCurrentWindow().minimize()
  })
  titlebarResize.addEventListener('click', () => {
    if (remote.getCurrentWindow().isMaximized()) {
      remote.getCurrentWindow().restore()
    } else remote.getCurrentWindow().maximize()
  })
  titlebarClose.addEventListener('click', () => {
    // if timer is still running ask if the program really should be closed
    if (!shutdownTimer.isStopped) {
      dialogs.confirm(
        'Do you really want to close the program because there is still a timer running?',
        okWasPressed => {
          if (okWasPressed) remote.getCurrentWindow().close()
        }
      )
    } else remote.getCurrentWindow().close()
  })
}

// settings checkbox event listener
checkboxShutdown.addEventListener('click', () => {
  ipcRenderer.send('set-settings', {
    name: 'shutdown',
    value: checkboxShutdown.checked
  })
})
checkboxSpotify.addEventListener('click', () => {
  ipcRenderer.send('set-settings', {
    name: 'spotify',
    value: checkboxSpotify.checked
  })
  // if checkbox gets checked (re-)connect to Spotify
  if (checkboxSpotify.checked) {
    spotifyHandler.connect()
    spotifyWebHelperStarted = window.performance.now()
  } else {
    // else disconnect and then change the picture
    spotifyHandler.disconnect()
    spotifySVG.classList.add('disabled')
  }
})
checkboxTray.addEventListener('click', () => {
  // every time the checkbox is clicked ask for a restart of the program
  // to add/remove the tray
  dialogs.confirm(
    'To change this option you need to restart the program',
    okWasPressed => {
      if (okWasPressed) {
        ipcRenderer.send('set-settings', {
          name: 'tray',
          value: checkboxTray.checked
        })
        // relaunch after setting setting entry
        ipcRenderer.send('relaunch')
      } else checkboxTray.checked = ipcRenderer.send('get-settings', 'tray')
    }
  )
})
checkboxNativeTitleBar.addEventListener('click', () => {
  // every time the checkbox is clicked ask for a restart of the program
  // to add/remove the tray
  dialogs.confirm(
    'To change this option you need to restart the program',
    okWasPressed => {
      if (okWasPressed) {
        ipcRenderer.send('set-settings', {
          name: 'nativeTitleBar',
          value: checkboxNativeTitleBar.checked
        })
        // relaunch after setting setting entry
        ipcRenderer.send('relaunch')
      } else {
        checkboxNativeTitleBar.checked = ipcRenderer.send(
          'get-settings',
          'nativeTitleBar'
        )
      }
    }
  )
})
checkboxNewVersionUpdate.addEventListener('click', () => {
  ipcRenderer.send('set-settings', {
    name: 'checkForNewVersionOnStartup',
    value: checkboxNewVersionUpdate.checked
  })
  if (checkboxNewVersionUpdate.checked) ipcRenderer.send('check-for-update')
})

// onclick listener for the spotify picture
spotifySVG.addEventListener('click', () => {
  if (!ipcRenderer.sendSync('get-settings', 'spotify')) {
    dialogs.confirm(
      'Spoitfy support is deactivated - do you want to enable the support for Spotify again?',
      okWasPressed => {
        if (okWasPressed) {
          checkboxSpotify.checked = true
          console.log('ipcRenderer "set-settings"', {
            name: 'spotify',
            value: true
          })
        }
      }
    )
  }

  // try to (re-)connect
  spotifyHandler.connect()
  spotifyWebHelperStarted = window.performance.now()
  // disable active spotify picture
  spotifySVG.classList.add('disabled')
})

/**
 * Start stimer with the inputted time or stop it if it's running
 */
function startstopTimer () {
  if (!shutdownTimer.isStopped) shutdownTimer.stop()
  else {
    const days = (timerInputDays.value === '') ? 0 : Number(timerInputDays.value)
    const hours = (timerInputHours.value === '') ? 0 : Number(timerInputHours.value)
    const minutes = (timerInputMinutes.value === '') ? 0 : Number(timerInputMinutes.value)
    const seconds = (timerInputSeconds.value === '') ? 0 : Number(timerInputSeconds.value)
    shutdownTimer.start((days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000)
  }
}

// timer control buttons
timerButtonPauseResume.addEventListener('click', () => {
  // resume timer or pause if running
  if (shutdownTimer.isPaused) shutdownTimer.resume()
  else shutdownTimer.pause()
})
timerButtonStartStop.addEventListener('click', startstopTimer)
timerButtonClear.addEventListener('click', () => {
  shutdownTimer.reset()
})

// save the input time in the settings
/**
 * Saves current inputted time in the settings
 */
function saveInput () {
  const currentTime = {
    d: timerInputDays.value,
    h: timerInputHours.value,
    m: timerInputMinutes.value,
    s: timerInputSeconds.value
  }
  ipcRenderer.send('set-settings', {
    name: 'timeInput',
    value: currentTime
  })
  console.log('saveInput')
  if (shutdownTimer.isStopped) {
    setToReadableTime(currentTime.d, currentTime.h, currentTime.m, currentTime.s)
  }
}
timerInputDays.addEventListener('change', saveInput)
timerInputHours.addEventListener('change', saveInput)
timerInputMinutes.addEventListener('change', saveInput)
timerInputSeconds.addEventListener('change', saveInput)
timerInputDays.addEventListener('click', saveInput)
timerInputHours.addEventListener('click', saveInput)
timerInputMinutes.addEventListener('click', saveInput)
timerInputSeconds.addEventListener('click', saveInput)
timerInputDays.addEventListener('keyup', saveInput)
timerInputHours.addEventListener('keyup', saveInput)
timerInputMinutes.addEventListener('keyup', saveInput)
timerInputSeconds.addEventListener('keyup', saveInput)

function setToReadableTime (days, hours, minutes, seconds) {
  days = (days === '') ? 0 : Number(days)
  hours = (hours === '') ? 0 : Number(hours)
  minutes = (minutes === '') ? 0 : Number(minutes)
  seconds = (seconds === '') ? 0 : Number(seconds)
  const allSeconds = days * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds
  seconds = Math.floor(allSeconds)
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
 * @param {Number} days - Number of days
 * @param {Number} hours - Number of hours
 * @param {Number} minutes - Number of minutes
 * @param {Number} seconds - Number of seconds
 */
function setTime (days, hours, minutes, seconds) {
  days = (days === '') ? 0 : Number(days)
  hours = (hours === '') ? 0 : Number(hours)
  minutes = (minutes === '') ? 0 : Number(minutes)
  seconds = (seconds === '') ? 0 : Number(seconds)

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

// shutdownTimer event listener/callbacks
shutdownTimer
  .on('alarmCallback', (err, t) => {
    // gets called when the timer has finished
    if (err) {
      console.error(err)
      return
    }

    // reset button texts
    timerButtonPauseResume.value = 'Pause'
    timerButtonStartStop.value = 'Start'

    // reset time display to 00:00:00:00
    setTime(0, 0, 0, 0)

    // pause music if wanted
    if (ipcRenderer.sendSync('get-settings', 'spotify')) {
      spotifyHandler.pauseMusic()
    }

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
      dialogs.confirm(
        'Stop the computer from shutting down? (in 20s this will automatically happen)',
        okWasPressed => {
          if (!okWasPressed) return

          // stop timeout/shutdown
          clearTimeout(shutdownTimeout)

          // play music again if wanted (and if it was played before the alarm went off)
          if (ipcRenderer.sendSync('get-settings', 'spotify')) {
            spotifyHandler.playMusic()
          }
        }
      )
      // start a notification to inform that the computer will be shut down in 20s (for preventing it)
      notifier.notify({
        title: 'Timer is finished (' + millisecondsToStr(t.msInput) + ')',
        message: 'The computer is about to shut down (20s) - click here to stop this from happening!',
        icon: path.join(__dirname, 'icon', 'icon.png'),
        sound: true,
        wait: true
      },
      (err, response) => {
        if (err) console.error(err)
        if (response === 'the toast has timed out') return

        // close open dialogs when notification gets clicked
        dialogs.cancel()

        // clear timeout / stop shutdown
        clearTimeout(shutdownTimeout)

        // play music again if wanted and it was played before
        if (ipcRenderer.sendSync('get-settings', 'spotify')) {
          spotifyHandler.playMusic()
        }

        // restore window if it's minimized
        if (remote.getCurrentWindow().isMinimized()) {
          remote.getCurrentWindow().restore()
        }
        // focus the window
        remote.getCurrentWindow().focus()
      }
      )
    } else {
      // if no shutdown is wished just prompt that the timer has finished and the time
      dialogs.alert(
        'Timer has finished (after ' + millisecondsToStr(t.msInput) + ')',
        okWasPressed => {
          // play music again
          if (ipcRenderer.sendSync('get-settings', 'spotify')) {
            spotifyHandler.playMusic()
          }
        }
      )
      notifier.notify({
        title: 'Timer has finished (after ' +
            millisecondsToStr(t.msInput) +
            ')',
        message: ':)',
        icon: path.join(__dirname, 'icon', 'icon.png'),
        sound: true,
        wait: true
      },
      (err, response) => {
        if (err) console.error(err)
        if (response === 'the toast has timed out') return

        // close open dialogs when notification gets clicked
        dialogs.cancel()

        // restore window if it's minimized
        if (remote.getCurrentWindow().isMinimized()) {
          remote.getCurrentWindow().restore()
        }
        // focus the window
        remote.getCurrentWindow().focus()
      }
      )
    }
  }).on('countdownCallback', (err, t) => {
    if (err) {
      console.error(err)
      return
    }
    // update time display if something is new
    if (t.d !== oldT.d || t.h !== oldT.h || t.m !== oldT.m || t.s !== oldT.s) {
      setTime(t.d, t.h, t.m, t.s)
      oldT = t
    }
  }).on('resumeCallback', err => {
    if (err) {
      console.error(err)
      return
    }
    // change timerButtonPauseResume value
    timerButtonPauseResume.value = 'Pause'
  }).on('pauseCallback', err => {
    if (err) {
      console.error(err)
      return
    }
    // change timerButtonPauseResume value
    timerButtonPauseResume.value = 'Resume'
  }).on('startCallback', (err, t) => {
    if (err) {
      console.error(err)
      return
    }
    // change button values
    timerButtonStartStop.value = 'Stop'
    timerButtonPauseResume.value = 'Pause'
    // set time
    setTime(t.d, t.h, t.m, t.s)
    oldT = t
  }).on('stopCallback', (err, t) => {
    if (err) {
      console.error(err)
      return
    }
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
    if (err) {
      console.error(err)
      return
    }
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
      remote.getCurrentWindow().reload()
      break
    case 122: // F11 - Fullscreen
      remote
        .getCurrentWindow()
        .setFullScreen(!remote.getCurrentWindow().isFullScreen())
      break
    case 123: // F12 - dev tools
      remote.getCurrentWindow().toggleDevTools()
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
      if (shutdownTimer.isPaused) shutdownTimer.resume()
      else shutdownTimer.pause()
      break
    case 82: // r - ickroll
      spotifyHandler.rickroll()
      break
  }
})

// if full screen is activated hide windows title bar and otherwise
remote
  .getCurrentWindow()
  .on('enter-full-screen', () => {
    if (!nativeTitleBar) {
      titlebar.classList.add('hide')
      mainContainer.classList.remove('titlebar-active')
      aboutContainer.classList.remove('titlebar-active')
      settingsContainer.classList.remove('titlebar-active')
    }
  })
  .on('leave-full-screen', () => {
    if (!nativeTitleBar) {
      titlebar.classList.remove('hide')
      mainContainer.classList.add('titlebar-active')
      aboutContainer.classList.add('titlebar-active')
      settingsContainer.classList.add('titlebar-active')
    }
  })
  .on('maximize', () => {
    // if window is maximized add class to titlebar for new icon and otherwise
    if (!nativeTitleBar) titlebar.classList.add('fullscreen')
  })
  .on('unmaximize', () => {
    if (!nativeTitleBar) titlebar.classList.remove('fullscreen')
  })

// spotify handler callbacks if an error comes up or a connection is initiated
spotifyHandler
  .on('error', () => {
    console.log('Connection to Spotify could not be established or was killed')
  })
  .on('ready', status => {
    // log successful spotify connection
    const currentlyPlayingString = `Have fun listening to "${status.track.track_resource.name}" by "${status.track.artist_resource.name}" from "${status.track.album_resource.name}" after ${millisecondsToStr(window.performance.now() - spotifyWebHelperStarted)}`
    console.log(currentlyPlayingString)
    // change spotify logo to a white on
    spotifySVG.classList.remove('disabled')
  })
