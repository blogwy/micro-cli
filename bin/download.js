#!/usr/bin/env node

'use strict'

const download = require('download-git-repo')
const path = require("path")
const ora = require('ora')

module.exports = function (target) {
  target = path.join(target || '.', '.download-temp')
  return new Promise(function (resolve, reject) {
    const spinner = ora(`Downloading project template...`)
    spinner.start();
    // https://github.com/MuBeiSAMA/micro-template
    download('https://github.com:MuBeiSAMA/micro-template#master', target, { clone: true }, function (err) {
      if (err) {
        spinner.fail()
        reject(err)
      }
      else {
        spinner.succeed()
        resolve(target)
      }
    })
  })
}