// Node.js，Stream 有四种流类型
// Readable - 可读操作。
// Writable - 可写操作。
// Duplex - 可读可写操作.
// Transform - 操作被写入数据，然后读出结果。
// 所有的 Stream 对象都是 EventEmitter 的实例。常用的事件有
// data - 当有数据可读时触发。
// end - 没有更多的数据可读时触发。
// error - 在接收和写入过程中发生错误时触发。
// finish - 所有数据已被写入到底层系统时触发。

let fs = require('fs')
let zlib = require('zlib')

// 接受读取的文件内容
let data = ''

// 创建读取流
let readStream = fs.createReadStream('text.txt')

// 设置读取编码为utf8
readStream.setEncoding('utf8')

// 处理流事件流程
readStream.on('data',(chunk)=>{

    // 读取中
    data+=chunk

})


readStream.on('end',()=>{

    // 处理结束
    let writeData = data + '\n我是使用写入流写入的数据'

    // 创建写入流
    let writeStream = fs.createWriteStream('./text.txt')

    writeStream.write(writeData,'UTF8')

    writeStream.end()

    // 写入流事件
    writeStream.on('finish',()=>{})
    writeStream.on('error',(err)=>{console.log(err)})

})

readStream.on('error',(err)=>{

    // 处理过程错误
    console.log(err)

})


// 管道流:管道提供了一个输出流到输入流的机制。通常我们用于从一个流中获取数据并将数据传递到另外一个流中。

// 创建读取流读取文件
let readPipe = fs.createReadStream('./pipeInt.txt')
let writePipe = fs.createWriteStream('./pipeOut.txt')

// 将读取到的文件数据写入到选择的文件
readPipe.pipe(writePipe)

// 链式流:链式是通过连接输出流到另外一个流并创建多个流操作链的机制。链式流一般用于管道操作。

// 压缩文件：先读取再压缩然后写入
// readPipe.pipe(zlib.createGzip()).pipe(fs.createWriteStream('./pipe.txt.gz'))

// 解压文件
fs.createReadStream('./pipe.txt.gz').pipe(zlib.createGunzip()).pipe(fs.createWriteStream('./gunZip.txt'))