let fs = require( 'fs' )

// 非阻塞调用(异步调用)
fs.readFile('text.txt',(err, data)=>{

    if( err ) return console.log( err.toString() )

    console.log( data.toString() )

})

console.log( '这里是异步和同步之间' )

// 阻塞调用(同步调用)
let data = fs.readFileSync('./text.txt')

console.log(data.toString())