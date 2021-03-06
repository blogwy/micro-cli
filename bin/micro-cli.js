#!/usr/bin/env node

'use strict'

const program = require('commander');
const pag = require('../package.json')
program.version(pag.version)
	.usage('<command> [project name]')
	.command('create', 'create a new project')
	.parse(process.argv)