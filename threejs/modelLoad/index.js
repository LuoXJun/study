import * as THREE from '../three/build/three.module.js'
import { OrbitControls } from '../three/examples/jsm/controls/OrbitControls.js'
import Stats from '../three/examples/jsm/libs/stats.module.js'
window.onload = function() {

    // 定义场景
    let scene = new THREE.Scene()

    // 定义渲染器
    let renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth,window.innerHeight)
    renderer.setClearColor("#a4b0be")
    // 渲染到页面
    document.body.appendChild(renderer.domElement)

    // 定义相机
    let camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight,0.1,10000)
    camera.position.set(0.1,2,30)
    // 添加坐标轴
    let axes = new THREE.AxesHelper(100)
    scene.add(axes)

    let gridHelper = new THREE.GridHelper( 1000, 100,'#2f3542' );
    scene.add( gridHelper );

    let box = new THREE.Mesh(new THREE.BoxGeometry(10,10,10),new THREE.MeshBasicMaterial({color:'red'}))
    scene.add(box)

    // 讲模型场景添加到数组方便进行碰撞检测
    let child = []
    function getChild(obj){
        if (obj.type === 'Group') {
            obj.children.forEach(item => {
                if (item.type === 'Group') getChild(item)
                else child.push(item)
            })
        }   else child.push(obj)          
    }
    child.push(box)


// 函数执行区
    var euler = new THREE.Euler( 0, 0, 0, 'YXZ' );
    var PI_2 = Math.PI / 2;
	var vec = new THREE.Vector3();
    let minPolarAngle = 0; // radians
	let maxPolarAngle = Math.PI; // radians
    function onMouseMove( event ) {
		var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
		var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
		euler.setFromQuaternion( camera.quaternion );
		euler.y -= movementX * 0.002;
		euler.x -= movementY * 0.002;
		euler.x = Math.max( PI_2 - maxPolarAngle, Math.min( PI_2 - minPolarAngle, euler.x ) );
		camera.quaternion.setFromEuler( euler );
	}

    // 鼠标控制方向移动
    document.addEventListener('mousedown',function(event){
        event.preventDefault()
        if (event.button == 0) {
            document.onmousemove = onMouseMove
            document.onmouseup = () => document.onmousemove = null
        }
    })

    function moveForwardFun ( distance ) {
		vec.setFromMatrixColumn( camera.matrix, 0 );
		vec.crossVectors( camera.up, vec );
		camera.position.addScaledVector( vec, distance );
	};

	function moveRightFun ( distance ) {
		vec.setFromMatrixColumn( camera.matrix, 0 );
		camera.position.addScaledVector( vec, distance );
	};
    // 控制方向
    let moveForward = false;
    let moveBackward = false;
    let moveLeft = false;
    let moveRight = false;
    let canJump = true;
    let direction = new THREE.Vector3()
    let velocity = new THREE.Vector3()
    const onKeyDown = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
        }
    };

    const onKeyUp = function ( event ) {
        switch ( event.code ) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };
    document.addEventListener('keydown',onKeyDown)
    document.addEventListener('keyup',onKeyUp)



    let clock = new THREE.Clock()
    function autoFindWay(){
        // 点击右键自动寻路
        let mouse = new THREE.Vector2();
        let targets,pos
        document.addEventListener('contextmenu',function(event){
            event.preventDefault();
            mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera( mouse, camera );
            targets = raycaster.intersectObjects(child)
            if (targets.length>0) {
                pos = targets[0].point.clone()
                pos.y = 2
            }
            if (targets.length>0) {
                new TWEEN.Tween(camera.position).to(pos,1000).easing(TWEEN.Easing.Linear.None).start()  
            }
        })
    }
    autoFindWay()

    function Animation(){
        // 获取时间间隔
        let delta = clock.getDelta()
        // 初始化速度
        velocity.x -= velocity.x * 5 * delta;
        velocity.z -= velocity.z * 5 * delta;
        // 判断移动方向
        direction.z = (+moveForward) - (+moveBackward)
        direction.x = (+moveLeft) - (+moveRight)
        // 向量归一化
        direction.normalize()
        // 前后左右移动
        // 碰撞检测、定义射线
        let dir = camera.getWorldDirection(new THREE.Vector3()).multiply(direction)
        let horiztialaster = new THREE.Raycaster(camera.position,dir,0,10)
        let objs = horiztialaster.intersectObjects(child)
        if (objs.length <= 0 ) {
            moveForwardFun( - velocity.z * delta );
            moveRightFun( velocity.x * delta );
            if ( moveForward || moveBackward ) velocity.z -= direction.z * 40 * delta;
            if ( moveLeft || moveRight ) velocity.x -= direction.x * 50.0 * delta;
        }
    }

    // 窗口大小更改
    function resize(){
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth,window.innerHeight)
    }
    window.addEventListener('resize',resize)

    // 添加状态监听器
    const stats = new Stats()
    const initStats = function() {
        stats.setMode(0)
        stats.domElement.style.position = 'absolute'
        stats.domElement.style.left = '10px';
        stats.domElement.style.top = '10px';
        document.body.appendChild(stats.domElement)
    }
    initStats()

    // 渲染场景
    function render(){
        Animation()
        renderer.render(scene,camera)
        stats.update()
        TWEEN.update();
        requestAnimationFrame(render)
    }
    render()
}