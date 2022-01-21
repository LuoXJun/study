//通过getElementById()方法获取canvas画布======
let canvas = document.getElementById('webgl');
//通过方法getContext()获取WebGL上下文
const gl = canvas.getContext('webgl');

// 自定义数组
const vertices = new Float32Array([0.5,0.5,-0.5,0.5,-0.5,-0.5,0.5,-0.5])

//顶点着色器源码
const vertexShaderSource =`
    attribute vec4 apos;
    void main(){
        //顶点位置，位于坐标原点
        gl_Position = apos;
    }`
    
//片元着色器源码
const fragShaderSource =  `
    void main(){
        //定义片元颜色
        gl_FragColor = vec4(1.0,1.0,0.0,1.0);
    }`

//创建顶点着色器对象
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
//创建片元着色器对象
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
//引入顶点、片元着色器源代码
gl.shaderSource(vertexShader, vertexShaderSource);
gl.shaderSource(fragmentShader, fragShaderSource);
//编译顶点、片元着色器
gl.compileShader(vertexShader);
gl.compileShader(fragmentShader);

//创建程序对象program
const program = gl.createProgram();
//附着顶点着色器和片元着色器到program
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
//链接program
gl.linkProgram(program);
//使用program
gl.useProgram(program);

// 获取变量位置
const apos = gl.getAttribLocation(program, "apos");

// 创建buff对象
const vertexBuffer = gl.createBuffer();
// 绑定对象到缓冲区指针(顶点数据)上
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
// 写入数据到缓冲区
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
// 指定attribute变量解析规则==从apos获取数据，2个为一组，浮点型，
gl.vertexAttribPointer(apos, 2, gl.FLOAT, false, 0, 0);
// 启用attribute变量 => 即链接缓冲区到attribute变量上
gl.enableVertexAttribArray(apos);


//开始绘制，显示器显示结果LINES、LINE_STRIP、TRIANGLES
// 第一个参数表示从第几个点开始画，第二个参数表示画几个点
gl.drawArrays(gl.LINE_LOOP,0,4);
