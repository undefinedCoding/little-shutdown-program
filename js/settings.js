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
  constructor (options) {
    // variables
    this.pathSettingsFile = undefined
    this.defaults = undefined
    this.data = undefined
  }

  /**
   * Loads settings and sets defaults
   * @param {{configName:string,defaults:{}}} options - Name of file and default values
   */
  setup (options) {
    this.pathSettingsFile = path.join(
      app.getPath('userData'),
      options.configName + '.json'
    )
    this.defaults = options.defaults
    this.data = this.load()
  }

  /**
   * Load settings file
   */
  load () {
    try {
      return JSON.parse(fs.readFileSync(this.pathSettingsFile))
    } catch (error) {
      console.error('File does not exist (yet) or another error', error)
      return {}
    }
  }

  /**
   * Get settings data object
   * @param {string} name - String of the name of the desired key, if not found the default value will be returned
   * @returns {*} Returns either the wanted value or undefined if value was not found
   */
  get (name) {
    return this.data[name] === undefined ? this.defaults[name] : this.data[name]
  }

  /**
   * Set a new settings value
   * @param {string} name - Name of the setting
   * @param {*} value - Value of the setting
   */
  set (name, value) {
    this.data[name] = value
    return this
  }

  /**
   * Save the settings object to a local file
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
