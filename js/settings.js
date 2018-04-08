// imports
const { app } = require('electron')
const path = require('path')
const fs = require('fs')

/**
 * Class that handels the settings
 */
class Settings {
  /**
   * Constructor
   */
  constructor () {
    // class variables
    this.pathSettingsFile = undefined
    this.defaults = undefined
    this.data = undefined
  }

  /**
   * Set settings file name and defaults
   * @param {String} fileName - settings file name
   * @param {{}} defaults - default values
   */
  setup (fileName, defaults) {
    this.pathSettingsFile = path.join(
      app.getPath('userData'),
      fileName + '.json'
    )
    this.defaults = defaults
    this.data = this.load()
  }

  /**
   * Load settings file
   */
  load () {
    try {
      return JSON.parse(fs.readFileSync(this.pathSettingsFile))
    } catch (error) {
      console.log('File does not yet exist or another error', error)
      return {}
    }
  }

  /**
   * Get settings value
   * @param {string} name - name of the desired key/setting
   * @returns {*} either the custom value or if not found default value or if not found undefined
   */
  get (name) {
    return this.data[name] === undefined ? this.defaults[name] : this.data[name]
  }

  /**
   * Set a new settings value (or overwrite an old one)
   * @param {string} name - name of the new key/setting
   * @param {*} value - value of the new key/setting
   */
  set (name, value) {
    this.data[name] = value
  }

  /**
   * Save the settings object to a local settings file
   */
  save () {
    try {
      fs.writeFileSync(this.pathSettingsFile, JSON.stringify(this.data))
    } catch (error) {
      console.error('File could not be written or another error', error)
    }
  }
}

// global object
module.exports = new Settings()
