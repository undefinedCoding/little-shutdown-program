const shutdown = require('electron-shutdown-command')
const ElectronTitlebarWindows = require('electron-titlebar-windows')
const titlebar = new ElectronTitlebarWindows({
  color: '#ffffff',
  draggable: true
})
const remote = require('electron').remote
const dialogs = require('dialogs')()
const notifier = require('node-notifier')
const path = require('path')

// global variables
var globalRemainingSeconds, globalTimerInterval, stateSetting, paused = false

/**
 * Function that resets the page
 */
function resetPage () {
  stateSetting.classList.remove('state-rotate')
  document.getElementById('minutes').value = ''
}

/**
 * FUnction that shuts down the computer
 */
function startBreak () {
  document.getElementsByTagName('audio')[0].play()
  stateSetting = document.getElementById('background-setting')
  stateSetting.classList.add('state-rotate')
  document.getElementById('minutes').value = 'Good night'
  setTimeout(resetPage, 5e3)

  const shutdownTimeout = setTimeout(() => {
    // simple system shutdown with default options
    shutdown.shutdown({ force: true })
  }, 15000)

  dialogs.confirm(
    'Stop the computer from shutting down? (in 15s this will automatically happen)',
    okWasPressed => {
      if (okWasPressed) clearTimeout(shutdownTimeout)
    }
  )
}

function tick () {
  const e = document.getElementById('time-display')
  var t = Math.floor(globalRemainingSeconds / 60)
  var n = globalRemainingSeconds - 60 * t

  if (t < 10) t = '0' + t
  if (n < 10) n = '0' + n

  e.innerHTML = t + ':' + n

  if (globalRemainingSeconds === 0) {
    clearInterval(globalTimerInterval)
    startBreak()
  }

  globalRemainingSeconds--
}

function startTimer () {
  const e = document.getElementById('minutes').value
  globalRemainingSeconds = 60 * e
  if (globalRemainingSeconds < 0 || isNaN(e) || e === '') {
    resetTimer()
  } else {
    clearInterval(globalTimerInterval)
    globalTimerInterval = setInterval(tick, 1e3)
  }
}

/**
 * Pause timer
 */
function pauseTimer () {
  if (globalRemainingSeconds > 0) {
    if (paused === false) {
      this.value = 'Resume'
      clearInterval(globalTimerInterval)
    } else {
      this.value = 'Pause'
      globalTimerInterval = setInterval(tick, 1e3)
    }
    paused = !paused
  }
}

/**
 * Reset timer
 */
function resetTimer () {
  // clear/reset timer
  clearInterval(globalTimerInterval)
  // reset timer display and minutes value
  document.getElementById('minutes').value = ''
  document.getElementById('time-display').innerHTML = '00:00'
}

// titlebar action listener
titlebar.on('minimize', e => remote.getCurrentWindow().minimize())
titlebar.on('maximize', e => remote.getCurrentWindow().restore())
titlebar.on('fullscreen', e => remote.getCurrentWindow().maximize())
titlebar.on('close', e => remote.getCurrentWindow().close())

window.onload = () => {
  // append windows titlebar to frameless window at the top
  titlebar.appendTo(document.getElementById('electron-titlebar'))

  notifier.notify(
    {
      title: 'My awesome title',
      message: 'Hello from node, Mr. User!',
      icon: path.join(__dirname, 'icon/icon.png'), // Absolute path (doesn't work on balloons)
      sound: true, // Only Notification Center or Windows Toasters
      wait: true // Wait with callback, until user action is taken against notification
    },
    (err, response) => {
      // Response is response from notification
      console.log('response', response)
    }
  )
   
  notifier.on('click', (notifierObject, options) => {
    // Triggers if `wait: true` and user clicks notification
    console.log('click')
  })
   
  notifier.on('timeout', (notifierObject, options) => {
    // Triggers if `wait: true` and notification closes
    console.log('timeout')
  })

  // add event listener to the buttons
  document.getElementById('start').addEventListener('click', startTimer)
  document.getElementById('stop').addEventListener('click', pauseTimer)
  document.getElementById('reset').addEventListener('click', resetTimer)

  // event listen for shortcuts
  document.addEventListener('keydown', e => {
    // F5
    if (e.which === 116) location.reload()
    // F12
    if (e.which === 123) remote.getCurrentWindow().toggleDevTools()
  })


  // if full screen is activated
  remote.getCurrentWindow().on('enter-full-screen', () => {
    document.getElementById('electron-titlebar').style.display = 'none'
    console.log('enter-full-screen')
  })
  remote.getCurrentWindow().on('leave-full-screen', () => {
    const t = document.getElementById('electron-titlebar').style.display = 'block'
    console.log('leave-full-screen')
  })
}
