import * as THREE from '../lib/@mesh-3d/three/build/three.module.js';
import Stats from '../lib/@mesh-3d/three/examples/jsm/libs/stats.module.js'
import  { VISMLoader } from "../node_modules/@mesh-3d/mesh3d-engine/Source/renderable/model/VISMLoader.js";
import  { OrbitControls } from "../lib/@mesh-3d/three/examples/jsm/controls/OrbitControls.js";
window.THREE = THREE;
window.onload = function() {

    // 定义场景
    let scene = new THREE.Scene()

    // 定义渲染器
    let renderer = new THREE.WebGLRenderer({antialias:true})
    renderer.setSize(window.innerWidth,window.innerHeight)
    renderer.setClearColor("#a4b0be")
    // 渲染到页面
    document.body.appendChild(renderer.domElement)

    // 定义相机
    let camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight,0.1,10000)

    // 添加坐标轴
    let axes = new THREE.AxesHelper(100)
    scene.add(axes)

    let gridHelper = new THREE.GridHelper( 1000, 100,'#2f3542' );
    scene.add( gridHelper );

    let num = 0
    let cancelCam
    function rotationCam() {
        num += 0.02
        cancelCam = requestAnimationFrame(rotationCam)
        camera.rotateY(num)
        if (num > 5) {
            cancelAnimationFrame(cancelCam)
            camera.position.set(3.001969448320733, 2, -6.333833447687258)
            setTimeout(() => {
                camera.quaternion.set(-0.02297210769901612,-0.2891354074623773,-0.006940582422096388,0.9569873702066668)
            }, 1000);
        }
    }
    rotationCam()
    renderer.setFaceCulling(THREE.CullFaceNone)
    renderer.localClippingEnabled = true
    renderer.setScissorTest = false

    // 资源优化
    /*
        './ZGFile/zhanguan_01.vism', './ZGFile/zhanguan_02.vism', './ZGFile/zhanguan_03.vism', 
        './ZGFile/zhanguan_04.vism', './ZGFile/zhanguan_05.vism', './ZGFile/zhanguan_ding.vism', './ZGFile/zhanguan_zx.vism'
    */

    // 讲模型场景添加到数组方便进行碰撞检测
    let child = []
    function getChild(obj){
        if (obj.type === 'Group') {
            obj.children.forEach(item => {
                if (item.type === 'Group') getChild(item)
                else child.push(item)
            })
        } else child.push(obj)          
    }
    let vismLoader = new VISMLoader()
    let isScuess = false;

    const vismList = ['./model/zhanguan_04.vism', './model/zhanguan_ding.vism', './model/zhanguan_zx.vism']
    vismList.forEach((vismUrl, vismUrlIndex) => {
        vismLoader.load(vismUrl, function(Ojb){
        let childrenList = Ojb.scene.children;
        
        childrenList.forEach((item, index) => {
            let map = item.material ? !item.material.aoMap && !item.material.lightMap : false; // 没有lightMap和aoMap属性
            let uv = item.geometry ? item.geometry.attributes.uv : null;
            let uv2 =  item.geometry ? item.geometry.attributes.uv2 : null; // 存在 uv2
            let uv3 = item.geometry ?  item.geometry.attributes.uv3 : null;
            let alphaMap = item.material ? item.material.alphaMap : null;
        
            if (map && uv2) {
            delete item.geometry.attributes.uv2;
            }
        
            if (uv3 && alphaMap === null) {
            delete item.geometry.uv3;
            }
    
        });
        setTimeout(() =>{
            scene.add(Ojb.scene)
        }, 20)
    
        })
        if (vismUrlIndex === vismList.length - 1) {
            isScuess = true;
        }
    })
    var success = setInterval(() => {
        if (isScuess) {
            clearInterval(success)
            getChild(scene)
        }
    }, 500)


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
            targets = raycaster.intersectObjects(child,true)
            if (targets.length>0) {
                pos = targets[0].point.clone()
                pos.y = 2
                new TWEEN.Tween(camera.position).to(pos,1000).easing(TWEEN.Easing.Linear.None).start()
            }
        })
    }
    autoFindWay()

    let rayDirection
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
        rayDirection = camera.getWorldDirection(new THREE.Vector3(0,0,0)).multiply(direction)
        let horiztialaster = new THREE.Raycaster(camera.position,rayDirection,0,2)
        let objs = horiztialaster.intersectObjects(child,true)
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

    // 点击切换相机位置到各个展馆处
    document.querySelector('.theOne').addEventListener('click',function(){
        new TWEEN.Tween(camera.position).to(new THREE.Vector3(3.001969448320733, 2, -6.333833447687258),1000).easing(TWEEN.Easing.Linear.None).start()
        camera.quaternion.set(-0.02297210769901612,-0.2891354074623773,-0.006940582422096388,0.9569873702066668)
    })
    document.querySelector('.theTwo').addEventListener('click',function(){
        let tweenTwoB = new TWEEN.Tween(camera.position).to(new THREE.Vector3(2.348700043314313, 2, -1.9803850742355462,100)).easing(TWEEN.Easing.Linear.None)
        tweenTwoB.start()
        camera.quaternion.set(-0.010342265430300807,-0.7935175081274028,-0.013491097305580128,0.6083099474236288)
    })
    document.querySelector('.theThree').addEventListener('click',function(){
        new TWEEN.Tween(camera.position).to(new THREE.Vector3(-0.09352879652818262, 2, 1.055118343802988),1000).easing(TWEEN.Easing.Linear.None).start()
        camera.quaternion.set(-0.00018119777866074577,-0.9996404198076955,-0.0069975972331154076,0.025884974155337123)
    })
    document.querySelector('.theFour').addEventListener('click',function(){
        new TWEEN.Tween(camera.position).to(new THREE.Vector3(-3.8653664141521427, 2, -1.0796176897825107),1000).easing(TWEEN.Easing.Linear.None).start()
        camera.quaternion.set(-0.010558901239318417,0.8311893330331414,0.01579449797796252,0.5556647695240036)
    })
    document.querySelector('.theFive').addEventListener('click',function(){
        new TWEEN.Tween(camera.position).to(new THREE.Vector3( -1.9820076159769207, 2, -5.870350865776286),1000).easing(TWEEN.Easing.Linear.None).start()
        camera.quaternion.set(-0.020862650837735534,0.31706301921665025,0.0069765120030218335,0.94814931309658)
    })

    console.log(renderer)
    console.log(camera)
    console.log(scene)
    // 渲染场景
    function render(){
        if (camera.position.y != 2) camera.position.y = 2
        Animation()
        renderer.render(scene,camera)
        stats.update()
        TWEEN.update();
        requestAnimationFrame(render)
    }
    render()
}