// Packages.ts
import { Package } from './Package'

export class Packages {

  private packages: Package[]

  constructor(dirs: string[]) {

    this.packages = dirs.map((dir) => {
      return new Package(dir)
    })
  }

  async install() {
    for (let pkg of this.packages) {
      await pkg.npmInstall()
    }
    // 下列方法可能造成电脑cpu运行超载，有点暴利，不建议使用
    // await Promise.all(this.packages.map(pkg => pkg.npmInstall()))
  }

  // 
  async installLink() {
    const links = new Set<string>();
    for (let pkg of this.packages) {
      for (let link of pkg.getDevLinks()) {
        links.add(link)
      }
    }

    for (let link of links) {
      const pkg = this.getPackage(link)
      // link 自己
      await pkg.link()
    }

    // link 别的
    for (let pkg of this.packages) {
      for (let link of pkg.getDevLinks()) {
        await pkg.linkDevs(link)
      }
    }
  }

  private getPackage(name: string) {
    return this.packages.find(pkg => pkg.getName() === name)
  }

  async buildTs() {
    // 已经解决的 包
    const resolved = new Set()

    while (resolved.size !== this.packages.length) {

      let size = resolved.size
      for (let pkg of this.packages) {
        if (resolved.has(pkg.getName())) {
          continue
        }

        if (!pkg.getDevLinks().find(p => !resolved.has(p))) {
          await pkg.buildTS()
          resolved.add(pkg.getName())
        }
      }

      // 环状依赖
      if(resolved.size === size) {
        throw '...'
      }
    }
  }
}