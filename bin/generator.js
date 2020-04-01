#!/usr/bin/env node

'use strict'

const Metalsmith = require('metalsmith')
const Handlebars = require('handlebars')
const rm = require('rimraf').sync

module.exports = function (content) {
  const metadata = content.metadata;
  const src = content.downloadTemp
  const dest = './' + content.root;
  if (!src) {
    return Promise.reject(new Error(`无效的source：${src}`))
  }

  return new Promise((resolve, reject) => {
    Metalsmith(process.cwd())
      .metadata(metadata)
      .clean(false)
      .source(src)
      .destination(dest)
      .use((files, metalsmith, done) => {
        const meta = metalsmith.metadata()
        const t = files['package.json'].contents.toString()
        const d = files['deploy.sh'].contents.toString()
        const m = files['micro-config.js'].contents.toString()
        const r = files['README.md'].contents.toString()
        files['package.json'].contents = Buffer.from(Handlebars.compile(t)(meta))
        files['deploy.sh'].contents = Buffer.from(Handlebars.compile(d)(meta))
        files['micro-config.js'].contents = Buffer.from(Handlebars.compile(m)(meta))
        files['README.md'].contents = Buffer.from(Handlebars.compile(r)(meta))
        done()
      }).build(err => {
        rm(src)
        err ? reject(err) : resolve(content)
      })
  })
}

