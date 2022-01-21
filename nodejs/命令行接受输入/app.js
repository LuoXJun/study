let readline = require('readline')

// 创建接口
readline = readline.createInterface({
    input:process.stdin,
    output:process.stdout
})

readline.question(`你叫什么名字？`, name => {
    console.log(`你好${name}`)
    readline.close()
    // process.exit(0)
})