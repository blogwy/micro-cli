#!/usr/bin/env node

'use strict'

const program = require('commander')
const path = require('path')
const fs = require('fs')
const glob = require('glob')
const download = require('./download')
const inquirer = require('inquirer')
const generator = require('./generator')
const chalk = require('chalk')
const logSymbols = require('log-symbols')
const shelljs = require('shelljs')

program.usage('<project-name>').parse(process.argv)

// 根据输入，获取项目名称
let projectName = program.args[0]

if (!projectName) {  // project-name 必填
  // 相当于执行命令的--help选项，显示help信息，这是commander内置的一个命令选项
  program.help()
  return
}

const list = glob.sync('*')  // 遍历当前目录
let next = undefined
let rootName = path.basename(process.cwd())
if (list.length) {  // 如果当前目录不为空
  if (list.filter(name => {
    const fileName = path.resolve(process.cwd(), path.join('.', name))
    let isDir = false;
    fs.stat(fileName, (_, stats) => {
      isDir = stats.isDirectory()
    })
    return name.indexOf(projectName) !== -1 && isDir
  }).length !== 0) {
    console.log(logSymbols.error, chalk.red(`${projectName}已经存在`))
    return
  }
  rootName = projectName
  next = Promise.resolve(projectName)
} else if (rootName === projectName) {
  next = inquirer.prompt([
    {
      name: 'buildInCurrent',
      message: '当前目录为空，且目录名称和项目名称相同，是否直接在当前目录下创建新项目？',
      type: 'confirm',
      default: true
    }
  ]).then(answer => {
    return Promise.resolve(answer.buildInCurrent ? '.' : projectName)
  }).catch(() => {
    console.log('未知错误')
    shelljs.exit()
  })
} else {
  next = Promise.resolve(projectName)
}

next && go()

function go() {
  next.then(projectRoot => {
    if (projectRoot !== '.') {
      fs.mkdirSync(projectRoot)
    }
    return download(projectRoot).then(target => {
      return {
        name: projectRoot,
        root: projectRoot,
        downloadTemp: target
      }
    })
  }).then(context => {
    return inquirer.prompt([
      {
        name: 'projectAuthor',
        message: 'author:'
      }, {
        name: 'projectDescription',
        message: 'description:',
        default: `A aiot sub project ${context.name}`
      }
    ]).then(answers => {
      answers.projectName = context.name
      return generator({
        ...context,
        metadata: {
          ...answers
        }
      })
    }).catch(err => {
      console.log('未知错误', `错误信息：${err}`)
      shelljs.exit()
    })
  }).then(context => {
    shelljs.exec(`cd ${path.join(process.cwd(), context.root)} && yarn`, { async: true, encoding: 'utf-8' }, (code, stdout, stderr) => {
      console.log('Exit code:', code);
      console.log('Program output:', stdout);
      console.log('Program stderr:', stderr);
      if (code === 0) {
        console.log(`🎉  Successfully created project ${chalk.yellow(context.name)}.`)
        const dl = chalk.gray('$')
        console.log(chalk.cyan(`${dl} cd ${context.root}\n${dl} yarn dev`))
      } else {
        console.log(logSymbols.error, chalk.red('Installation dependency error, please install manually'))
      }
    })

  }).catch(error => {
    console.log(logSymbols.error, chalk.red(`创建失败：${error.message}`))
  })
}

