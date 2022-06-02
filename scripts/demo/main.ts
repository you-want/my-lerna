// main.ts
import path from 'path'
import yargs from 'yargs-parser'
import { Packages } from './Packages'
import { scan } from './scan'

const result = yargs(process.argv)
console.log(111, result)

const cmd = result._[2]
console.log(222, cmd)

run()

async function run() {

  const dirs = [
    ...scan(
      path.resolve(__dirname, '../'),
      /package\.json$/,
      /node_modules|\.git/
    )
  ].map(d => d[1])

  const pkg = new Packages(dirs)

  console.log(333, cmd)
  switch (cmd) {
    case "install":
      await pkg.install()
      console.log("want install...")
      break;
    case "start":
      console.log("want start...")
      break;
  }
}