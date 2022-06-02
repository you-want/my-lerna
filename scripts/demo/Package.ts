// Package.ts
import fs from 'fs'
import path from 'path'
// import chalk from 'chalk'
import { exec } from 'child_process'

interface IPkgJson {
  name: string
  version: [number, number, number]
  main: string
  dependencies: {
    [dep: string]: string
  }
  devDependencies: {
    [dep: string]: string
  }
  youWant?: {
    type: "service" | "app" | "lib" | "cli",
    port?: number,
    devLinks?: string[],
  },
}

// 软件包
export class Package {

  private dir: string
  // 需要关心的 json 数据
  private json: IPkgJson

  // 只需要知道软件包目录 dir 到底在哪里？
  constructor(dir: string) {
    // 获取目录下的 package.json 的绝对路径
    const pkgJsonFilePath = path.resolve(dir, 'package.json')
    // 读出所有 json
    const _json = this.parseJson(fs.readFileSync(pkgJsonFilePath, 'utf-8'))
    // 把 dir 保存
    this.dir = dir
    // 把 json 存下来
    this.json = _json
    // 转换一下 version 格式
    this.json.version = _json.version?.split('.').map((v: string) => parseInt(v))
  }

  // 解析 json
  private parseJson(str: string) {
    try {
      return JSON.parse(str)
    } catch (err) {
      console.error('parse json error:' + err)
      throw err
    }
  }

  // 执行命令的方法
  public async exec(cmd: string) {
    return new Promise<void>((resolve, reject) => {
      const proc = exec(cmd, {
        // 当前工作路径
        cwd: this.dir
      })
      // 标准输出流
      proc?.stdout?.on('data', (data) => {
        console.log('stdout on', data)
      })
      // 标准错误流
      proc?.stderr?.on('data', (data) => {
        console.log('stderr on', data)
      })

      // 进程被关闭 resolve
      proc?.on('close', () => {
        resolve()
      })
    })

  }

  // 安装依赖 
  public async npmInstall() {
    // console.log(chalk.bold(chalk.green('pnpm install' + this.getName())))
    await this.exec('pnpm install')
  }

  public getName() {
    return this.json.name
  }

  public async link(){
    await this.exec('pnpm link')
  }

  public getDevLinks(): string[]{
    return this.json.youWant?.devLinks || []
  }

  public async linkDevs(link: string){
    await this.exec('pnpm link' + link)
  }

  public async buildTS(){

		await this.exec("tsc")
	}
}