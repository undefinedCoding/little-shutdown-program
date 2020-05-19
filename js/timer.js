/**
 * Class that controls a timer
 */
class ShutdownTimer {
  constructor () {
    // variables
    this.timerId = undefined
    this.inputTime = undefined
    this.remainingTime = undefined
    this.updateRateMs = undefined

    // performance.now
    this.lastExecutedTime = undefined
    /**
     * Indicates if the program is paused:
     * **true** if paused, **false** if not paused, **undefined** if timer not set or already went of
     */
    this.paused = undefined

    // callback methods
    this.alarmCallback = (error, msObject) => {}
    this.countdownCallback = (error, msObject) => {}
    this.startCallback = (error, msObject) => {}
    this.pauseCallback = (error, msObject1, msObject2) => {}
    this.resumeCallback = (error, msObject1, msObject2) => {}
    this.stopCallback = (error, msObject) => {}
    this.resetCallback = (error) => {}
    // special callback method that runs every millisecond the timer runs
    this.timerCallback = () => {
      if (this.timerId === undefined) {
        this.countdownCallback(Error('Callback timer is not defined!'))
      } else if (this.remainingTime === undefined) {
        this.countdownCallback(Error('No remaining time defined!'))
      } else {
        this.remainingTime -= Math.floor(
          window.performance.now() - this.lastExecutedTime
        )
        if (this.remainingTime <= 0) {
          this.alarm()
        } else {
          this.lastExecutedTime = window.performance.now()
          this.countdownCallback(null, this.msToObject(this.remainingTime))
        }
      }
    }
  }

  /**
   * Get if the timer was paused or not
   * @returns {boolean} true if paused, false if currently running, undefined if neither of these actions took place
   */
  get isPaused () {
    return this.paused
  }

  /**
   * Get if the timer was stopped
   * @returns {boolean} true if stopped, false if not
   */
  get isStopped () {
    return this.paused === undefined
  }

  /**
   * Set callback methods to different events
   * @param {String} event - Event identifier
   * @param {Function} callback - Callback function
   * alarmCallback: (err, {msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number}) => {},
   * countdownCallback: (err, {msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number}) => {},
   * startCallback: (err, {msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number}) => {},
   * pauseCallback: (err, {msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number},{msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number}) => {},
   * resumeCallback: (err, {msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number},{msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number}) => {},
   * stopCallback: (err, {msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number}) => {},
   * resetCallback: (err, {msInput:Number,d:Number,h:Number,m:Number,s:Number,ms:Number}) => {},
   */
  on (event, callback) {
    switch (event) {
      case 'alarmCallback':
        this.alarmCallback = callback
        break
      case 'countdownCallback':
        this.countdownCallback = callback
        break
      case 'startCallback':
        this.startCallback = callback
        break
      case 'pauseCallback':
        this.pauseCallback = callback
        break
      case 'resumeCallback':
        this.resumeCallback = callback
        break
      case 'stopCallback':
        this.stopCallback = callback
        break
      case 'resetCallback':
        this.resetCallback = callback
        break
      default:
        console.error(new Error('Event does not exist!'))
    }
    return this
  }

  /**
   * Alarm callback
   */
  alarm () {
    // error catching
    if (this.timerId === undefined) {
      this.alarmCallback(Error('The timer id was undefined!'))
      return
    } else if (this.inputTime === undefined) {
      this.alarmCallback(Error('The input time was undefined!'))
      return
    }

    // clear interval
    clearInterval(this.timerId)

    // set paused and remainingTime to undefined
    this.paused = undefined
    this.remainingTime = undefined

    // callback function with input time
    this.alarmCallback(null, this.inputTime)
  }

  start (milliseconds, updateRateMs = 100) {
    // error catching
    if (milliseconds === undefined) {
      if (this.inputTime === undefined) {
        this.startCallback(Error('No milliseconds/saved-input-time found!'))
        return
      } else if (this.inputTime.msInput === undefined) {
        this.startCallback(Error('Saved input time was not defined!'))
        return
      } else {
        milliseconds = this.inputTime.msInput
        console.log(
          'Hint:',
          `Milliseconds were undefined, but inputTime.msInput (${this.inputTime.msInput}) was not`
        )
      }
    } else if (isNaN(milliseconds)) {
      this.startCallback(Error('Given milliseconds is not a number!'))
      return
    } else if (milliseconds < 0) {
      this.startCallback(Error('Given milliseconds cannot be less than 0!'))
      return
    }

    // set update rate
    this.updateRateMs = updateRateMs

    // set new input time if there was an valid input
    this.inputTime = this.msToObject(milliseconds)

    // set remaining time
    this.remainingTime = this.inputTime.msInput

    // save time when interval was stared
    this.lastExecutedTime = window.performance.now()

    // set paused to false
    this.paused = false

    // set interval
    this.timerId = setInterval(this.timerCallback, this.updateRateMs)

    // callback function with input time
    this.startCallback(null, this.inputTime)
  }

  /**
   * Pause timer which means the interval will be killed, the remaining time will be saved and paused will be set to true
   */
  pause () {
    // error catching
    if (this.timerId === undefined) {
      this.pauseCallback(Error('The timer id was undefined'))
      return
    } else if (this.paused === undefined) {
      this.resumeCallback(Error('The timer was not started before'))
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
    this.timerId = setInterval(this.timerCallback, this.updateRateMs)

    // set paused to false
    this.paused = false

    // callback function with input time and current time
    this.resumeCallback(
      null,
      this.inputTime,
      this.msToObject(this.remainingTime)
    )
  }

  /**
   * Stop timer
   */
  stop () {
    // error catching
    if (this.timerId === undefined) {
      // check if a timer was defined
      this.stopCallback(Error('There was no timer defined'))
      return
    } else if (this.inputTime === undefined) {
      // check if there is a saved input time
      this.stopCallback(Error('There was no input time defined'))
      return
    }

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
