// imports
const { ShutdownTimer } = require('./js/timer')
const shutdown = require('electron-shutdown-command')
const ElectronTitlebarWindows = require('electron-titlebar-windows')
const remote = require('electron').remote
const dialogs = require('dialogs')()
const notifier = require('node-notifier')
const path = require('path')
const SpotifyWebHelper = require('spotify-web-helper')
const helper = SpotifyWebHelper()

// global objects
const shutdownTimer = new ShutdownTimer()
const titlebar = new ElectronTitlebarWindows({
  color: '#ffffff',
  draggable: true
})

/**
 * Add leading zeroes
 * @param {number} num - The number
 * @param {number} size - The desired size
 */
function pad (num, size) {
  const s = '000' + num
  return s.substr(s.length - size)
}

// set titlebar callbacks
titlebar.on('minimize', e => remote.getCurrentWindow().minimize())
titlebar.on('maximize', e => remote.getCurrentWindow().restore())
titlebar.on('fullscreen', e => remote.getCurrentWindow().maximize())
titlebar.on('close', e => remote.getCurrentWindow().close())

// if html document is loaded run this
window.onload = () => {
  // append windows titlebar to frameless window at the top
  const electronTitlebar = document.getElementById('electron-titlebar')
  titlebar.appendTo(electronTitlebar)

  // rotating image
  const rotatingImage = document.getElementById('background-setting')

  // clickable buttons
  const startButton = document.getElementById('start')
  const pauseResumeButton = document.getElementById('pause-resume')
  const resetButton = document.getElementById('reset')
  const stopButton = document.getElementById('stop')

  // setup buttons tyles
  pauseResumeButton.classList.add('button-deactivated')
  stopButton.classList.add('button-deactivated')

  // add event listener to the buttons
  startButton.addEventListener('click', () => {
    const minutesvalue = document.getElementById('minutes').value
    if (minutesvalue !== '' && !isNaN(minutesvalue)) {
      shutdownTimer.start(minutesvalue * 60 * 1000)
    }
  })
  pauseResumeButton.addEventListener('click', () => {
    if (shutdownTimer.isPaused) shutdownTimer.resume()
    else shutdownTimer.pause()
  })
  resetButton.addEventListener('click', () => {
    shutdownTimer.reset()
  })
  stopButton.addEventListener('click', () => {
    shutdownTimer.stop()
  })

  // div which contains the time
  const timeDisplay = document.getElementById('time-display')

  // shutdownTimer callback methods
  shutdownTimer.on('alarmCallback', (err, t) => {
    if (err) {
      console.error(err)
      return
    }

    // change button values and styles
    timeDisplay.textContent = '00:00:000'
    startButton.value = 'Start'
    pauseResumeButton.value = 'Pause'
    pauseResumeButton.classList.add('button-deactivated')
    stopButton.classList.add('button-deactivated')

    // rotate image
    rotatingImage.classList.add('state-rotate')

    // stop music
    helper.player.pause()

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
        if (!okWasPressed) {
          // play music again
          helper.player.play()
          return
        }
        clearTimeout(shutdownTimeout)
        rotatingImage.classList.remove('state-rotate')
      }
    )

    notifier.notify(
      {
        title: 'Timer is finished (' + t.msInput / 1000 / 60 + 'min)',
        message: 'The computer is about to shut down (20s) - click here to stop this from happening!',
        icon: path.join(__dirname, 'icon/icon.png'),
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
        helper.player.play()

        // rotate image
        rotatingImage.classList.remove('state-rotate')

        // restore window if it's minimized
        if (remote.getCurrentWindow().isMinimized()) { remote.getCurrentWindow().restore() }
        // focus the window
        remote.getCurrentWindow().focus()
      }
    )
  })
  shutdownTimer.on('countdownCallback', (err, t) => {
    if (err) {
      console.error(err)
      return
    }
    // set time display content
    if (t.d !== 0) {
      timeDisplay.textContent =
        pad(t.d, 2) +
        ':' +
        pad(t.h, 2) +
        ':' +
        pad(t.m, 2) +
        ':' +
        pad(t.s, 2) +
        ':' +
        pad(t.ms, 3)
    } else if (t.h !== 0) {
      timeDisplay.textContent =
        pad(t.h, 2) + ':' + pad(t.m, 2) + ':' + pad(t.s, 2) + ':' + pad(t.ms, 3)
    } else {
      timeDisplay.textContent =
        pad(t.m, 2) + ':' + pad(t.s, 2) + ':' + pad(t.ms, 3)
    }
  })
  shutdownTimer.on('resumeCallback', err => {
    if (err) {
      console.error(err)
      return
    }
    // change button values and styles
    pauseResumeButton.value = 'Pause'
  })
  shutdownTimer.on('pauseCallback', err => {
    if (err) {
      console.error(err)
      return
    }
    // change button values and styles
    pauseResumeButton.value = 'Resume'
  })
  shutdownTimer.on('startCallback', err => {
    if (err) {
      console.error(err)
      return
    }
    // change button values and styles
    startButton.value = 'Restart'
    pauseResumeButton.value = 'Pause'
    pauseResumeButton.classList.remove('button-deactivated')
    stopButton.classList.remove('button-deactivated')
  })
  shutdownTimer.on('stopCallback', (err, t) => {
    if (err) {
      console.error(err)
      return
    }
    // change button values and styles
    timeDisplay.textContent = '00:00:000'
    startButton.value = 'Start'
    pauseResumeButton.value = 'Pause'
    pauseResumeButton.classList.add('button-deactivated')
    stopButton.classList.add('button-deactivated')
  })
  shutdownTimer.on('resetCallback', err => {
    if (err) {
      console.error(err)
      return
    }
    // change button values and styles
    timeDisplay.textContent = '00:00:000'
    startButton.value = 'Start'
    pauseResumeButton.value = 'Pause'
    pauseResumeButton.classList.add('button-deactivated')
    stopButton.classList.add('button-deactivated')
    // clear time input
    document.getElementById('minutes').value = ''
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
      case 122: // F11
        remote
          .getCurrentWindow()
          .setFullScreen(!remote.getCurrentWindow().isFullScreen())
        break
    }
  })

  // if full screen is activated hide windows title bar and otherwise
  remote.getCurrentWindow().on('enter-full-screen', () => {
    electronTitlebar.style.display = 'none'
  })
  remote.getCurrentWindow().on('leave-full-screen', () => {
    electronTitlebar.style.display = 'block'
  })

  console.log(helper)
  console.log(helper.player)
  console.log(helper.player.pause())

  const spotifyWebhelperStarted = window.performance.now()

  function millisToMinutesAndSeconds(millis) {
    var minutes = Math.floor(millis / 60000)
    var seconds = ((millis % 60000) / 1000).toFixed(0)
    return minutes + 'min ' + (seconds < 10 ? '0' : '') + seconds + 's'
  }

  helper.player.on('error', err => {
    console.error('Spotify web helper error', err)
    if (error.message.match(/No user logged in/)) {
      console.error('No user logged in or spotify was closed')
    } else {
      console.error('Spotify not installed or another error')
    }
  })
  helper.player.on('ready', () => {
    // dialog to inform spotify helper is ready
    dialogs.alert('Spotify helper is ready (' + millisToMinutesAndSeconds(window.performance.now() - spotifyWebhelperStarted) + ')')
    // show notification to inform that spotify helper is ready
    notifier.notify(
      {
        title: 'Spotify web helper is ready',
        message: 'Whohooooo (' + millisToMinutesAndSeconds(window.performance.now() - spotifyWebhelperStarted) + ')',
        icon: path.join(__dirname, 'icon/icon.png'),
        sound: true,
        wait: true
      },
      (err, response) => {
        if (err) console.error(err)
        // close open dialogs - not important if the user clicked
        dialogs.cancel()
      }
    )
  })
}
