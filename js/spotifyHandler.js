// imports
const SpotifyWebHelper = require('spotify-web-helper')

/**
 * Class that controls the SpotifyWebHelper
 */
class SpotifyHandler {
  constructor () {
    // variables
    this.connected = false
    this.spotifyWebHelper = SpotifyWebHelper()
    // functions
    this.errorCallback = () => {}
    this.readyCallback = () => {}
  }

  /**
   * Get if a connection to Spotify exists
   */
  get isConnected () {
    return this.connected
  }

  /**
     * Set callback methods to different events
     * @param {String} event - Event identifier
     * @param {Function} callback - Callback function
     */
  on (event, callback) {
    switch (event) {
      case 'error':
        this.errorCallback = callback
        break
      case 'ready':
        this.readyCallback = callback
        break
      default:
        console.error(new Error('Event does not exist!'))
    }
    return this
  }

  connect () {
    // disconnect and clear old things
    this.disconnect()
    // create new SpotifyWebHelper object
    this.spotifyWebHelper = SpotifyWebHelper()

    // error callback if SpotifyWebHelper encounters an error
    // while connecting/during connection
    this.spotifyWebHelper.player.on('error', err => {
      if (err !== undefined) {
        console.log('Spotify Handler - error detected', err)
        this.errorCallback(err)
        this.connected = false
      }
    }).on('ready', () => {
      this.readyCallback(this.spotifyWebHelper.status)
      this.connected = true
    })
  }

  disconnect () {
    this.spotifyWebHelper = null
    this.connected = false
  }

  pauseMusic () {
    console.log('pause music', this.connected)
    if (!this.connected) return

    // check if music is even playing before pausing
    this.musicWasPlayingBeforePausing =
      this.spotifyWebHelper.status.playing === true

    const e = this.spotifyWebHelper.player.pause()
    if (e !== undefined) {
      e.then(argument => console.log(argument)).catch(err => console.error(err))
    }
  }

  playMusic () {
    if (!this.connected) return

    // check if music was even playing before pausing
    if (!this.musicWasPlayingBeforePausing) return

    const e = this.spotifyWebHelper.player.pause(true)
    if (e !== undefined) {
      e.then(argument => console.log(argument)).catch(err => console.error(err))
    }
  }

  rickroll () {
    if (!this.connected) return

    const e = this.spotifyWebHelper.player.play(
      'spotify:track:4uLU6hMCjMI75M1A2tKUQC'
    )
    if (e !== undefined) {
      e.then(argument => console.log(argument)).catch(err => console.error(err))
    }
  }
}

module.exports = {
  SpotifyHandler
}
