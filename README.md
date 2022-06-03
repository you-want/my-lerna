# my-lerna

## 背景

前段时间听到一个资讯 **Lerna 官宣停止维护**，就引发了下边这些事情，在事情接近尾声之际，最近几天又得到一个资讯 **Lerna 复活，Nrwl 将接管 Lerna**，Lerna 复活了，他将接力棒传给了 Nrwl。Nrwl 是同样作为 Monorepo 管理工具 **Nx** 背后的公司。

在实际工作中，难免遇到项目多，多项目协作问题。那么此时就需要协作工具了，目前行业内的标杆主要就是 [Lerna](https://www.lernajs.cn/)（但是维护似乎暂时并不稳定）。

Lerna 是一个管理工具，用于管理包含多个软件包（package）的 JavaScript 项目（看下图，头是真多呀...）。

![lerna-hero.svg](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/fce145e361b34270bdbe2df164d6d31e~tplv-k3u1fbpfcp-watermark.image?)

- Commands
  - [`lerna publish`](https://github.com/lerna/lerna/tree/main/commands/publish#readme)
  - [`lerna version`](https://github.com/lerna/lerna/tree/main/commands/version#readme)
  - [`lerna bootstrap`](https://github.com/lerna/lerna/tree/main/commands/bootstrap#readme)
  - [`lerna list`](https://github.com/lerna/lerna/tree/main/commands/list#readme)
  - [`lerna changed`](https://github.com/lerna/lerna/tree/main/commands/changed#readme)
  - [`lerna diff`](https://github.com/lerna/lerna/tree/main/commands/diff#readme)
  - [`lerna exec`](https://github.com/lerna/lerna/tree/main/commands/exec#readme)
  - [`lerna run`](https://github.com/lerna/lerna/tree/main/commands/run#readme)
  - [`lerna init`](https://github.com/lerna/lerna/tree/main/commands/init#readme)
  - [`lerna add`](https://github.com/lerna/lerna/tree/main/commands/add#readme)
  - [`lerna clean`](https://github.com/lerna/lerna/tree/main/commands/clean#readme)
  - [`lerna import`](https://github.com/lerna/lerna/tree/main/commands/import#readme)
  - [`lerna link`](https://github.com/lerna/lerna/tree/main/commands/link#readme)
  - [`lerna create`](https://github.com/lerna/lerna/tree/main/commands/create#readme)
  - [`lerna info`](https://github.com/lerna/lerna/tree/main/commands/info#readme)
  
上述可见其主要的一些功能作用，及其强大！但是，事物都会有两面性，比如：我们熟知的 Vue、React团队那么多项目也没有使用 Lerna。（此处并非不建议使用，根据自身情况自定即可）。

为什么不用 Lerna 呢？不满足实际项目中灵活多变的场景（集中式、隔离式、跨团队、git子项目...），上述是官话，实话是阻挡了我造轮子的机会（造轮子是架构师必备的能力，其阻碍了我的成长快乐... 😄 对不起，让一让，挡道了... 😂）。

## 设计方案

![仿 lerna 设计方案.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/747b39a5eb42479d95c9f034c66b6483~tplv-k3u1fbpfcp-watermark.image?)

看上图，开发工程师在输入指令 cmd...，用 yargs-parser 做解析，获取 CMDS，前边这些就是用户的操作，知道了用户的意图，再转发给 Manager，让它去触发用户的行为。而 Manager 内部最核心的就是需要知道有哪些包，比如一个项目里有 package.json，那么它就是一个软件包，既然是软件包，那就设计一个类 class，和这个软件包对应上，并且拥有这个软件包的所有行为。最后再把这些行为反映给开发工程师。                                      

[yargs-parser](https://github.com/yargs/yargs-parser/) 这个工具比较好用，在此推荐一波！其实在设计程序时候，你会发现最好用的反而是这种中间状态下的工具，它帮你做一小段事情。

yargs-parser 简单使用如下：

```ts
// demo.ts
import yargs from 'yargs-parser'

const result = yargs(process.argv)
console.log(111, result)

const cmd = result._[2]
console.log(222, cmd)

run()

async function run(){
    console.log(333, cmd)
    switch(cmd){
        case "install": 
            console.log("want install...")
            break;
        case "start":
            console.log("want start...")
            break;
    }
}
```

控制台输入如下命令及会输出的结果：

```sh
ts-node demo.ts install --yml a.ts

// 输出
111 {
  _: [
    '/usr/local/bin/ts-node',
    '/Users/xxx/Desktop/xxx/you-want-lerna/demo.ts',
    'install'
  ],
  yml: 'a.ts'
}
222 install
333 install
want install...
```

接下来正式开工，我们先创建一个软件包：

```ts
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
}
```

至此，我们就实现了一个基础的安装依赖的功能。接下来我们去实现一个扫描所有项目、查看所有项目的一个功能。

```ts
// scan.ts
import fs from 'fs'
import path from 'path'

// 遍历所有的目录，就需要递归，
// 递归，那么生成器函数就是最好用的
// 不用去刻意的收集值，遇到目标值就返回
/* 
  dir 工作目录
  pattern 要找的文件
  exclude 不找的文件
 */
export function* scan(dir: string, pattern: RegExp, exclude: RegExp): Generator<[string, string]> {

  // 同步读取给定目录的内容。该方法返回一个数组，其中包含目录中的所有文件名或对象
  const files = fs.readdirSync(dir)

  console.log('files', files)

  for (let file of files) {
    const fullPath = path.resolve(dir, file)

    if (fullPath.match(exclude)) {
      continue
    }
    if (fullPath.match(pattern)) {
      yield [file, dir]
    }

    // 当前文件的信息状态 是不是 目录
    if (fs.statSync(fullPath).isDirectory()) {
      yield* scan(fullPath, pattern, exclude)
    }
  }
}

// // test 返回一个迭代器
// const res = scan(path.resolve(__dirname, '../'), /package\.json$/, /node_modules|\.git/)

// console.log('res', [...res])
```

上述这一步完成之后，就相当于我们找到了所有的包，接下来我们就需要把这些包管理起来。

```ts
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
}
```

紧接着就是需要把一开始用户的操作行为收集起来去执行。

```ts
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
```

紧接着在 package.json 文件中 scripts 下添加执行命令：

```json
"scripts": {
    "test-install": "ts-node ./scripts/demo/main.ts -- install",
}
```

至此，一个简易的版本就出现了，但是还缺少一些其他功能，这样所造的轮子岂不是太不圆了，哈哈。所以做事不能做一半，我们还可以继续往下。

其实依赖收集也是个大功能，在很多项目中，都可能会出现互相依赖，所以接下来我们处理一下该问题。

收集依赖一般先想到的就是扫描文件，看看都使用了哪些依赖，但是这么做就需要扫描完，再过滤出哪些是包管理的依赖，这样就需要把每个包弄得的明明白白的，这样问题就比较复杂化了，所以不建议这么去做。

那既然这样，那不如我们自定义规则，自己去解析自己的规则，这样岂不是更方便。

那就可以直接在每个包的 package.json 里边去定义：

```json
"youWant": {
    "type": "cli",
    "devLinks": [
      "@you-want/xxx",
      "@you-want/xxx"
    ]
  }
```

在 Package.ts 中 `interface IPkgJson` 下加：

```ts
// Package.ts
interface IPkgJson {
  ...
  youWant?: {
    type: "service" | "app" | "lib" | "cli",
    port?: number,
    devLinks?: string[],
  },
}
```

![link.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/0ca0b17424474b749d68daec2ad156c6~tplv-k3u1fbpfcp-watermark.image?)

如上图，A 依赖 B，B 依赖 C，而 A 又依赖 D，D 也依赖 C。那么 A link B，就必须等 B 先 link 完 C，以此类推，那么 要想 link A，就需要等 link 完 C，在 link 完 B、D。

```ts
// Package.ts

...

public async link(){
    await this.exec('pnpm link')
}

public getDevLinks(): string[]{
    return this.json.youWant?.devLinks || []
}

public async linkDevs(link: string){
    await this.exec('pnpm link' + link)
}
```

```ts
// Packages.ts

...

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
```

link 完自身和 其他后，link 的功能也就基本到此结束。接下来尝试去做一下编译的事情。

```ts
// Packages.ts

...

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
```

```ts
// Package.ts

...

public async buildTS(){
    await this.exec("tsc")
}
```

编译也基本做了，其实剩下还有很多功能需要一一去做，由于篇幅和时间原因，就先到这里，后续如果有机会会接着继续分享的。但是有兴趣的、着急的小伙伴可以自己尝试继续做下去...