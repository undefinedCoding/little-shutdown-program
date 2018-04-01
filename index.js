// imports
const { ShutdownTimer } = require('./js/timer')
const { SpotifyHandler } = require('./js/spotifyHandler')
const settings = require('./js/settings')
const {
  app,
  globalShortcut,
  shell,
  remote,
  ipcRenderer,
  dialog
} = require('electron')
const shutdown = require('electron-shutdown-command')
const dialogs = require('dialogs')()
const notifier = require('node-notifier')
const path = require('path')

// global objects/variables
const shutdownTimer = new ShutdownTimer()
const spotifyHandler = new SpotifyHandler()

function openLinkExternally (url) {
  shell.openExternal(url)
}

/**
 * Convert milliseconds to min sec string
 * @param {number} milliseconds - The number of milliseconds
 * @returns {string} XXmin and XXs formatted string
 */
function millisecondsToStr (milliseconds) {
  function numberEnding (number) {
    return number > 1 ? 's' : ''
  }

  var temp = Math.floor(milliseconds / 1000)
  var years = Math.floor(temp / 31536000)
  if (years) {
    return years + ' year' + numberEnding(years)
  }
  // TODO: Months! Maybe weeks?
  var days = Math.floor((temp %= 31536000) / 86400)
  if (days) {
    return days + ' day' + numberEnding(days)
  }
  var hours = Math.floor((temp %= 86400) / 3600)
  if (hours) {
    return hours + ' hour' + numberEnding(hours)
  }
  var minutes = Math.floor((temp %= 3600) / 60)
  if (minutes) {
    return minutes + ' minute' + numberEnding(minutes)
  }
  var seconds = temp % 60
  if (seconds) {
    return seconds + ' second' + numberEnding(seconds)
  }
  return 'less than a second' // 'just now' //or other string you like;
}

const titlebar = document.getElementById('titlebar-windows-10')

const titlebarSettings = document.getElementById('titelbar-settings')
const titlebarHelp = document.getElementById('titelbar-help')
const titlebarMinimize = document.getElementById('titelbar-minimize')
const titlebarResize = document.getElementById('titelbar-resize')
const titlebarClose = document.getElementById('titelbar-close')

const mainContainer = document.getElementById('main-container')
const settingsContainer = document.getElementById('settings')
const aboutContainer = document.getElementById('about')

const timerButtonPauseResume = document.getElementById('button_pause_resume')
const timerButtonStartStop = document.getElementById('button_start_stop')
const timerButtonClear = document.getElementById('button_clear')

const timerInputDays = document.getElementById('timer_d')
const timerInputHours = document.getElementById('timer_h')
const timerInputMinutes = document.getElementById('timer_m')
const timerInputSeconds = document.getElementById('timer_s')

const spotifySVG = document.getElementById('spotify-logo')

const digits = document.getElementById('digits')
const children = []
const c = digits.children

for (let i = 0; i < c.length; i++) {
  if (c[i].className !== 'dots') children.push(c[i])
}

const versionNumber = document.getElementById('version-number')

const checkboxShutdown = document.getElementById('checkbox-shutdown')
const checkboxSpotify = document.getElementById('checkbox-spotify')
const checkboxTray = document.getElementById('checkbox-tray')

versionNumber.innerText = ipcRenderer.sendSync('get-version')

// try on load to connect to spotify
if (ipcRenderer.sendSync('get-settings', 'spotify')) spotifyHandler.connect()

var animationPause = false

function slideAnimation (currentElement, elementToShow, directionRight = true) {
  if (animationPause) return
  // do not allow another animation
  animationPause = true
  // show both elements
  currentElement.style.display = 'block'
  elementToShow.style.display = 'block'
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
    currentElement.style.display = 'none'
    elementToShow.style.display = 'block'
    currentElement.style.transition = ''
    elementToShow.style.transition = ''
    currentElement.style.transform = `translateX(${directionRight ? '-' : '+'}100vw)`
    elementToShow.style.transform = ''
    animationPause = false
  }, 440)
}

aboutContainer.style.transform = 'translateX(-100vw)'
settingsContainer.style.transform = 'translateX(-100vw)'
mainContainer.style.transform = ''
aboutContainer.style.display = 'none'
settingsContainer.style.display = 'none'
mainContainer.style.display = 'block'

titlebarSettings.addEventListener('click', () => {
  if (aboutContainer.style.transform === '') {
    slideAnimation(aboutContainer, settingsContainer, true)
  } else if (mainContainer.style.transform === '') {
    slideAnimation(mainContainer, settingsContainer, true)
  } else {
    slideAnimation(settingsContainer, mainContainer, false)
  }
})
titlebarHelp.addEventListener('click', () => {
  if (settingsContainer.style.transform === '') {
    slideAnimation(settingsContainer, aboutContainer, false)
  } else if (mainContainer.style.transform === '') {
    slideAnimation(mainContainer, aboutContainer, false)
  } else {
    slideAnimation(aboutContainer, mainContainer, true)
  }
})
titlebarMinimize.addEventListener('click', () => {
  remote.getCurrentWindow().minimize()
})
titlebarResize.addEventListener('click', () => {
  if (remote.getCurrentWindow().isMaximized()) {
    remote.getCurrentWindow().restore()
  } else {
    remote.getCurrentWindow().maximize()
  }
})
titlebarClose.addEventListener('click', () => {
  // if timer is still running
  shutdownTimer.state
  if (shutdownTimer.isPaused !== undefined) {
    dialogs.confirm(
      'Do you really want to close the program because there is still a timer running?',
      okWasPressed => {
        if (okWasPressed) remote.getCurrentWindow().close()
      }
    )
  } else {
    remote.getCurrentWindow().close()
  }
})

checkboxShutdown.addEventListener('click', () => {
  console.log('ipcRenderer "set-settings"', {
    name: 'shutdown',
    value: checkboxShutdown.checked
  })
  ipcRenderer.send('set-settings', {
    name: 'shutdown',
    value: checkboxShutdown.checked
  })
})
checkboxSpotify.addEventListener('click', () => {
  console.log('ipcRenderer "set-settings"', {
    name: 'spotify',
    value: checkboxSpotify.checked
  })
  ipcRenderer.send('set-settings', {
    name: 'spotify',
    value: checkboxSpotify.checked
  })

  if (!checkboxSpotify.checked) {
    spotifyHandler.disconnect()
    spotifySVG.src = 'data/spotify_logo_by_wikimedia_disabled.svg'
  } else {
    spotifyHandler.connect()
  }
})
checkboxTray.addEventListener('click', () => {
  dialogs.confirm(
    'To change this option you need to restart the program',
    okWasPressed => {
      if (okWasPressed) {
        console.log('ipcRenderer "set-settings"', {
          name: 'tray',
          value: checkboxTray.checked
        })
        ipcRenderer.send('set-settings', {
          name: 'tray',
          value: checkboxTray.checked
        })
        ipcRenderer.send('relaunch')
      } else return
    }
  )
})

checkboxShutdown.checked = ipcRenderer.sendSync('get-settings', 'shutdown')
checkboxSpotify.checked = ipcRenderer.sendSync('get-settings', 'spotify')
checkboxTray.checked = ipcRenderer.sendSync('get-settings', 'tray')

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
        } else return
      }
    )
  }

  // try to (re-)connect
  spotifyHandler.connect()
  // disable active spotify picture
  spotifySVG.src = 'data/spotify_logo_by_wikimedia_disabled.svg'
})

// setup timer buttons
timerButtonPauseResume.classList.add('button-deactivated')
timerButtonStartStop.classList.add('button-deactivated')

timerButtonPauseResume.addEventListener('click', () => {
  // resume timer or pause if running
  if (shutdownTimer.isPaused) shutdownTimer.resume()
  else shutdownTimer.pause()
})
timerButtonStartStop.addEventListener('click', () => {
  // start timer or stop if running
  if (!shutdownTimer.isStopped) shutdownTimer.stop()
  else {
    const seconds =
      timerInputDays.value * 24 * 60 * 60 +
      timerInputHours.value * 60 * 60 +
      timerInputMinutes.value * 60 +
      timerInputSeconds.value
    shutdownTimer.start(seconds * 1000)
  }
})
timerButtonClear.addEventListener('click', () => {
  shutdownTimer.reset()
  timerInputDays.value = ''
  timerInputHours.value = ''
  timerInputMinutes.value = ''
  timerInputSeconds.value = ''
})

function saveInput () {
  console.log('ipcRenderer "set-settings"', {
    name: 'timeInput',
    value: {
      d: timerInputDays.value,
      h: timerInputHours.value,
      m: timerInputMinutes.value,
      s: timerInputSeconds.value
    }
  })
  ipcRenderer.send('set-settings', {
    name: 'timeInput',
    value: {
      d: timerInputDays.value,
      h: timerInputHours.value,
      m: timerInputMinutes.value,
      s: timerInputSeconds.value
    }
  })
}

// save the input time in the settings
timerInputDays.addEventListener('change', saveInput)
timerInputHours.addEventListener('change', saveInput)
timerInputMinutes.addEventListener('change', saveInput)
timerInputSeconds.addEventListener('change', saveInput)

// div which contains the time
const timeDisplay = document.getElementById('time-display')

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

function setTime (days, hours, minutes, seconds) {
  const day = days.toString().split('')
  const hour = hours.toString().split('')
  const minute = minutes.toString().split('')
  const second = seconds.toString().split('')

  if (day.length > 1) {
    children[0].className = digitClasses[Number(day[0])]
    children[1].className = digitClasses[Number(day[1])]
  } else {
    children[0].className = digitClasses[0]
    children[1].className = digitClasses[Number(day[0])]
  }
  if (hour.length > 1) {
    children[2].className = digitClasses[Number(hour[0])]
    children[3].className = digitClasses[Number(hour[1])]
  } else {
    children[2].className = digitClasses[0]
    children[3].className = digitClasses[Number(hour[0])]
  }
  if (minute.length > 1) {
    children[4].className = digitClasses[Number(minute[0])]
    children[5].className = digitClasses[Number(minute[1])]
  } else {
    children[4].className = digitClasses[0]
    children[5].className = digitClasses[Number(minute[0])]
  }
  if (second.length > 1) {
    children[6].className = digitClasses[Number(second[0])]
    children[7].className = digitClasses[Number(second[1])]
  } else {
    children[6].className = digitClasses[0]
    children[7].className = digitClasses[Number(second[0])]
  }
}

// let lastTimeInput = settings.get('timeInput')
// setTime(lastTimeInput.d, lastTimeInput.h, lastTimeInput.m, lastTimeInput.s)
console.log('ipcRenderer "get-settings"', 'timeInput')
const timeInputLastTime = ipcRenderer.sendSync('get-settings', 'timeInput')
timerInputDays.value = timeInputLastTime.d
timerInputHours.value = timeInputLastTime.h
timerInputMinutes.value = timeInputLastTime.m
timerInputSeconds.value = timeInputLastTime.s

setTime(0, 0, 0, 0)

// shutdownTimer callba ck methods
shutdownTimer.on('alarmCallback', (err, t) => {
  if (err) {
    console.error(err)
    return
  }

  timerButtonStartStop.value = 'Start'

  // change button values and styles
  setTime(0, 0, 0, 0)

  // pause music
  if (ipcRenderer.sendSync('get-settings', 'spotify')) {
    spotifyHandler.pauseMusic()
  }

  if (ipcRenderer.sendSync('get-settings', 'shutdown')) {
    // start timeout (20s) for forcefully shutting down the computer
    const shutdownTimeout = setTimeout(() => {
      // simple system shutdown with default options
      shutdown.shutdown({
        force: true
      })
    }, 20000)

    // start dialog to inform, that the computer will be shut down in 20s
    dialogs.confirm(
      'Stop the computer from shutting down? (in 20s this will automatically happen)',
      okWasPressed => {
        if (!okWasPressed) return

        // stop timeout/shutdown
        clearTimeout(shutdownTimeout)

        // play music again
        if (ipcRenderer.sendSync('get-settings', 'spotify')) {
          spotifyHandler.playMusic()
        }
      }
    )

    notifier.notify(
      {
        title: 'Timer is finished (' + millisecondsToStr(t.msInput) + ')',
        message: 'The computer is about to shut down (20s) - click here to stop this from happening!',
        icon: path.join(__dirname, 'icon', 'icon.png'),
        sound: true,
        wait: true
      },
      (err, response) => {
        if (err) console.error(err)
        if (response === 'the toast has timed out') return

        // close open dialogs
        dialogs.cancel()

        // clear timeout / stop shutdown
        clearTimeout(shutdownTimeout)

        // play music again
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
    notifier.notify(
      {
        title: 'Timer is finished (' + millisecondsToStr(t.msInput) + ')',
        message: ':)',
        icon: path.join(__dirname, 'icon', 'icon.png'),
        sound: true,
        wait: true
      },
      (err, response) => {
        if (response === 'the toast has timed out') return
        // restore window if it's minimized
        if (remote.getCurrentWindow().isMinimized()) {
          remote.getCurrentWindow().restore()
        }
        // focus the window
        remote.getCurrentWindow().focus()
      }
    )
    dialogs.alert(
      'Timer is finished (' + millisecondsToStr(t.msInput) + ')',
      okWasPressed => {
        // play music again
        if (ipcRenderer.sendSync('get-settings', 'spotify')) {
          spotifyHandler.playMusic()
        }
      }
    )
  }
})
shutdownTimer.on('countdownCallback', (err, t) => {
  if (err) {
    console.error(err)
    return
  }
  setTime(t.d, t.h, t.m, t.s)
})
shutdownTimer.on('resumeCallback', err => {
  if (err) {
    console.error(err)
    return
  }
  // change button values and styles
  timerButtonPauseResume.value = 'Pause'
})
shutdownTimer.on('pauseCallback', err => {
  if (err) {
    console.error(err)
    return
  }
  // change button values and styles
  timerButtonPauseResume.value = 'Resume'
})
shutdownTimer.on('startCallback', err => {
  if (err) {
    console.error(err)
    return
  }
  // change button values and styles
  timerButtonStartStop.value = 'Stop'
  timerButtonPauseResume.value = 'Pause'
})
shutdownTimer.on('stopCallback', (err, t) => {
  if (err) {
    console.error(err)
    return
  }
  // change button values and styles
  setTime(0, 0, 0, 0)
  timerButtonStartStop.value = 'Start'
  timerButtonPauseResume.value = 'Pause'
})
shutdownTimer.on('resetCallback', err => {
  if (err) {
    console.error(err)
    return
  }
  // change button values and styles
  setTime(0, 0, 0, 0)
  timerButtonStartStop.value = 'Start'
  timerButtonPauseResume.value = 'Pause'
  // clear time input
  timerInputDays.value = ''
  timerInputHours.value = ''
  timerInputMinutes.value = ''
  timerInputSeconds.value = ''
})

// event listen for shortcuts
document.addEventListener('keydown', e => {
  switch (e.which) {
    case 116: // F5
      remote.getCurrentWindow().reload()
      break
    case 123: // F12
      remote.getCurrentWindow().toggleDevTools()
  }
})

// event listen for click shortcuts
document.addEventListener('keyup', e => {
  switch (e.which) {
    case 32: // space bar
      if (shutdownTimer.isPaused) shutdownTimer.resume()
      else shutdownTimer.pause()
      break
    case 82: // r
      spotifyHandler.rickroll()
      break
    case 122: // F11
      remote
        .getCurrentWindow()
        .setFullScreen(!remote.getCurrentWindow().isFullScreen())
      break
  }
})

// if full screen is activated hide windows title bar and otherwise
remote.getCurrentWindow().on('enter-full-screen', () => {
  titlebar.style.display = 'none'
  mainContainer.style.top = '0px'
})
remote.getCurrentWindow().on('leave-full-screen', () => {
  titlebar.style.display = 'block'
  mainContainer.style.top = '42px'
})

remote.getCurrentWindow().on('maximize', () => {
  titlebar.classList.add('fullscreen')
})
remote.getCurrentWindow().on('unmaximize', () => {
  titlebar.classList.remove('fullscreen')
})

const spotifyWebHelperStarted = window.performance.now()

spotifyHandler.on('error', () => {
  console.log('Connection to Spotify could not be established or was killed')
})
spotifyHandler.on('ready', status => {
  // dialog to inform spotify helper is ready
  const currentlyPlayingString =
    'Have fun listening to ' +
    status.track.track_resource.name +
    ' by ' +
    status.track.artist_resource.name +
    ' from ' +
    status.track.album_resource.name
  const timeString =
    'Spotify helper is ready after ' +
    millisecondsToStr(window.performance.now() - spotifyWebHelperStarted)

  console.log(currentlyPlayingString, timeString)

  spotifySVG.src = 'data/spotify_logo_by_wikimedia.svg'
})
