//通过getElementById()方法获取canvas画布
let canvas = document.getElementById('webgl');
//通过方法getContext()获取WebGL上下文
const gl = canvas.getContext('webgl');

let vertice = new Float32Array([
    -0.2, -0.2, 0.2,//三角形顶点1坐标
    -0.2, 0.2, 0.0,//三角形顶点2坐标
    0.2, -0.2, 0.0//三角形顶点3坐标
])
//顶点着色器源码
const vertexShaderSource =`
    attribute vec4 a_position;
    uniform vec4 trans;
    uniform float r_sin;
    uniform float r_cos;
    void main(){
        //顶点位置，位于坐标原点
        gl_Position = a_position + trans;
        //旋转变换方式
        gl_Position.x = gl_Position.x * r_sin - gl_Position.y * r_cos;
        gl_Position.y = gl_Position.x * r_cos + gl_Position.y * r_sin;
        gl_Position.z = gl_Position.z;
        gl_Position.w = 1.0;
    }`
    

//片元着色器源码
const fragShaderSource =  `
    void main(){
        //定义片元颜色
        gl_FragColor = vec4(1.0,0.0,0.0,1.0);
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
const a_position = gl.getAttribLocation(program, "a_position");

// 平移
const trans = gl.getUniformLocation(program, "trans");
gl.uniform4f(trans, -0.2, 0, 0, 0);

// 旋转
const r_sin = gl.getUniformLocation(program, 'r_sin');
const r_cos = gl.getUniformLocation(program, 'r_cos');
//计算变换值
const tAngle = 90;//角度制
const tRadian = tAngle * Math.PI / 180;//弧度制

// 设置uniform变量的值
gl.uniform1f(r_sin, Math.sin(tRadian));
gl.uniform1f(r_cos, Math.cos(tRadian));

// 创建buff对象
const vertexBuffer = gl.createBuffer();
// 绑定对象到缓冲区指针(顶点数据)上
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
// 写入数据到缓冲区
gl.bufferData(gl.ARRAY_BUFFER, vertice, gl.STATIC_DRAW);
// 指定attribute变量解析规则==从a_position获取数据，3个为一组，浮点型，
gl.vertexAttribPointer(a_position, 3, gl.FLOAT, false, 0, 0);
// 启用attribute变量 => 即链接缓冲区到attribute变量上
gl.enableVertexAttribArray(a_position);

//开始绘制，显示器显示结果TRIANGLES
gl.drawArrays(gl.TRIANGLES, 0, 3);