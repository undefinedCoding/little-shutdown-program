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
var globalRemainingSeconds
var globalTimerInterval
var stateSetting
var paused = false
var emergencyStop = false

/**
 * Class that controls a timer
 */
class ShutdownTimer {
  constructor () {
    // variables
    this.timerId = undefined
    this.inputTime = undefined
    this.remainingTime = undefined

/**
 * Function that shuts down the computer
 */
function startBreak () {
  document.getElementsByTagName('audio')[0].play()
  stateSetting = document.getElementById('background-setting')
  stateSetting.classList.add('state-rotate')
  document.getElementById('minutes').value = 'Good night'
  setTimeout(resetPage, 5e3)

  //alert("Just a Joke :D, but if this was real, the Computer would shut down")
  
  const shutdownTimeout = setTimeout(() => {
    // simple system shutdown with default options
    shutdown.shutdown({ force: true })
  }, 15000)

  /*dialogs.confirm(
    'Stop the computer from shutting down? (in 15s this will automatically happen)',
    okWasPressed => {
      if (okWasPressed) clearTimeout(shutdownTimeout)
    }
  )*/
}

function startWarningDialog () {
  //later (windows native notification):
  //https://github.com/felixrieseberg/electron-windows-interactive-notifications 

  dialogs.confirm(
    'Stop the computer from shutting down? (in 15s this will automatically happen)',
    okWasPressed => {
      if (okWasPressed) emergencyStop = true
    }
  )
}

function tick () {
  const e = document.getElementById('time-display')
  var remainingMinutes = Math.floor(globalRemainingSeconds / 60)
  var remainingSeconds = globalRemainingSeconds - 60 * remainingMinutes

  if (remainingMinutes < 10) remainingMinutes = '0' + remainingMinutes //add 0, when there's only one digit
  if (remainingSeconds < 10) remainingSeconds = '0' + remainingSeconds //also adds 0, when there's only one digit

  e.innerHTML = remainingMinutes + ':' + remainingSeconds 

  if (globalRemainingSeconds == 15) {
    startWarningDialog()
  }

  start (milliseconds) {
    // error catching
    if (milliseconds === undefined) {
      if (this.inputTime === undefined) {
        this.startCallback(new Error('No milliseconds/saved-input-time found!'))
        return
      } else if (this.inputTime.msInput === undefined) {
        this.startCallback(new Error('Saved input time was not defined!'))
        return
      } else {
        milliseconds = this.inputTime.msInput
        console.log(
          'Hint:',
          `Milliseconds were undefined, but inputTime.msInput (${this.inputTime.msInput}) was not`
        )
      }
    } else if (isNaN(milliseconds)) {
      this.startCallback(new Error('Given milliseconds is not a number!'))
      return
    } else if (milliseconds < 0) {
      this.startCallback(new Error('Given milliseconds cannot be less than 0!'))
      return
    }

    // set new input time if there was an valid input
    this.inputTime = this.msToObject(milliseconds)

    // set remaining time
    this.remainingTime = this.inputTime.msInput

    // save time when interval was stared
    this.lastExecutedTime = window.performance.now()

    // set paused to false
    this.paused = false

    // set interval
    this.timerId = setInterval(this.timerCallback, 1)

  if (globalRemainingSeconds === 0) {
    console.log("Wow you let the Timer count to 0")
    clearInterval(globalTimerInterval)
    startBreak()
  }
  globalRemainingSeconds--
}

function startTimer () {
  const e = document.getElementById('minutes').value
  globalRemainingSeconds = 60 * e
  if (globalRemainingSeconds < 0 || isNaN(e) || e === '') {
    //Notification if the Input was not accepted
    alert("Interesting Input, but that's not what i expected. Only insert Natural Numbers as Minutes")
    resetTimer()
  } else {
    clearInterval(globalTimerInterval)
    //1e3 = 1E3 = 1 * 10^3 = 1 * 1000 = 1000 (party)
    globalTimerInterval = setInterval(tick, 1e3) //setInterval keeps calling the tick function every 1e3 seconds

  /**
   * Pause timer which means the interval will be killed, the remaining time will be saved and paused will be set to true
   */
  pause () {
    // error catching
    if (this.timerId === undefined) {
      this.pauseCallback('The timer id was undefined')
      return
    } else if (this.paused === undefined) {
      this.resumeCallback(new Error('The timer was not started before'))
      return
    }

    // clear interval
    clearInterval(this.timerId)

    // set last executedTime undefined
    this.lastExecutedTime = undefined

    // set paused to true
    this.paused = true

    // callback function with input time and current time
    this.pauseCallback(
      null,
      this.inputTime,
      this.msToObject(this.remainingTime)
    )
  }

  /**
   * Resume timer
   */
  resume () {
    // error catching
    if (this.inputTime === undefined) {
      this.resumeCallback(new Error('The input time is undefined'))
      return
    } else if (this.remainingTime === undefined) {
      this.resumeCallback(new Error('The remaining time is undefined'))
      return
    } else if (this.paused === undefined) {
      this.resumeCallback(new Error('The timer was not paused before'))
      return
    }

    // set last executedTime to right now
    this.lastExecutedTime = window.performance.now()

    // set new interval
    this.timerId = setInterval(this.timerCallback, 1)

    // set paused to false
    this.paused = false

    // callback function with input time and current time
    this.resumeCallback(
      null,
      this.inputTime,
      this.msToObject(this.remainingTime)
    )
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
      title: 'Whooohooooo',
      message: 'Did you get scared? - I did',
      icon: path.join(__dirname, 'icon/icon.png'), // Absolute path (doesn't work on balloons)
      sound: true, // Only Notification Center or Windows Toasters
      wait: true // Wait with callback, until user action is taken against notification
    },
    (err, response) => {
      if (err) console.error('Error', err)
      // log the response to the notification
      console.log('response', response)

    // clear interval
    clearInterval(this.timerId)

    // set pause to undefined
    this.paused = undefined

    // callback function
    this.stopCallback(null, this.inputTime)
  }

  /**
   * Reset timer
   */
  reset () {
    // stop timer if active
    clearInterval(this.timerId)

    // set all variables to undefined
    this.inputTime = undefined
    this.lastExecutedTime = undefined
    this.paused = undefined
    this.remainingTime = undefined
    this.timerId = undefined

    // callback function
    this.resetCallback(null)
  }

  /**
   * Convert given milliseconds to an object which contains days, hours, minutes, seconds, milliseconds and the original milliseconds number
   * @param {Number} msInput - Number of milliseconds
   * @returns {{msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number}} - Time object
   */
  msToObject (msInput) {
    var d, h, m, s
    const newMs = Math.floor(msInput % 1000)
    s = Math.floor(msInput / 1000)
    m = Math.floor(s / 60)
    s = s % 60
    h = Math.floor(m / 60)
    m = m % 60
    d = Math.floor(h / 24)
    h = h % 24
    return {
      msInput: msInput,
      d: d,
      h: h,
      m: m,
      s: s,
      ms: newMs
    }
  }
}

module.exports = {
  ShutdownTimer
}
