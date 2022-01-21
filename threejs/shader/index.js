import * as THREE from '../three/build/three.module.js'
import {OrbitControls} from '../three/examples/jsm/controls/OrbitControls.js'
window.onload = function() {

    // 定义场景
    let scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#fff', 0, 10000);

    // 定义渲染器
    let renderer = new THREE.WebGLRenderer()
    renderer.setSize(window.innerWidth,window.innerHeight)
    renderer.setClearColor("#a4b0be")
    // 渲染到页面
    document.body.appendChild(renderer.domElement)

    // 定义相机
    let camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight,0.1,2000)
    camera.position.set(0,0,360)
    camera.lookAt(new THREE.Vector3(0,0,0))

    let gridHelper = new THREE.GridHelper( 1000, 100,'#2f3542' );
    gridHelper.rotateY(Math.PI / 4)
    // scene.add( gridHelper );

    // 添加灯光
    let ambient = new THREE.AmbientLight('#fff')
    scene.add(ambient)

    // 创建球体
    let uniforms = {

        iResolution:{ value:new THREE.Vector2(window.innerWidth * 1.0,window.innerHeight * 1.0) },
        iTime: { value:1.0 }
        
    }


    let planeGeo = new THREE.PlaneGeometry(window.innerWidth,window.innerHeight)
    let planeMat = new THREE.ShaderMaterial({
        uniforms:uniforms,
        vertexShader:document.querySelector('#vertexShader').textContent,
        fragmentShader:document.querySelector('#fragmentShader').textContent
    })


    let plane = new THREE.Mesh(planeGeo,planeMat)
    scene.add(plane)

    // 控制器
    let control = new OrbitControls(camera,renderer.domElement)
    control.enableDamping = true;

    // 窗口大小更改
    function resize(){
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()
        renderer.setSize(window.innerWidth,window.innerHeight)
    }
    window.addEventListener('resize',resize)

    // 渲染场景
    let clock = new THREE.Clock()
    function render(){

        let delta = clock.getDelta()

        uniforms.iTime.value += delta

        control.update()
        renderer.render(scene,camera)
        requestAnimationFrame(render)
    }
    render()
}