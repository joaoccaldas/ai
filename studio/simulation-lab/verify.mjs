#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {inspectRegistry,summary} from './core.mjs';
const file=new URL('./experiments.json',import.meta.url);
const doc=JSON.parse(readFileSync(file,'utf8'));
const report=inspectRegistry(doc);
console.log(JSON.stringify(summary(report),null,2));
if(report.errors.length){console.error(report.errors.join('\n'));process.exitCode=1;}
