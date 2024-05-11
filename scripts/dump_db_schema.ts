#!/usr/bin/env npx tsx

import * as util from "node:util";
import * as child_process from "node:child_process";
const execFile = util.promisify(child_process.execFile);

import { LOCAL_DB_URL } from "./constants";

async function main() {
  const scriptArgs = process.argv.slice(2);
  const args = ['--schema="public"', "--schema-only"];
  if (!scriptArgs.length) {
    args.push(LOCAL_DB_URL);
  } else {
    args.push(...scriptArgs);
  }
  const { stdout, stderr } = await execFile("pg_dump", args);
  if (stdout) {
    console.log(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }
}

main();
