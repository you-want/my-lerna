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