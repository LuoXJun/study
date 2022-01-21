import * as THREE from '../three/build/three.module.js'
import {OrbitControls} from '../three/examples/jsm/controls/OrbitControls.js'
import {Rhino3dmLoader} from  '../three/examples/jsm/loaders/3DMLoader.js'

// 定义场景
let scene = new THREE.Scene()
// 定义环境贴图
let cubeLoader = new THREE.CubeTextureLoader()
cubeLoader.setPath('./images/')
let type = '.jpg'
let cubeTexture = cubeLoader.load([
    'posx' + type,'negx' + type,
    'posy' + type,'negy' + type,
    'posz' + type,'negz' + type,
])
scene.background = cubeTexture
console.log(scene)

let loader = new Rhino3dmLoader()
loader.load(
    './3d66.com_1067026.max',
    function(texture){
        let house = new THREE.Mesh(texture, new THREE.MeshNormalMaterial())
    }
)

// 定义坐标轴
// let axes = new THREE.AxesHelper(1000)
// scene.add(axes)

// 创建窗子
let planeGeo = new THREE.PlaneGeometry(20,100)
let WindowPlaneMat = new THREE.MeshBasicMaterial({color:'red',side:THREE.DoubleSide})
let windowPlane = new THREE.Mesh(planeGeo,WindowPlaneMat)
// scene.add(windowPlane)

// 创建门
let doorPlane = new THREE.PlaneGeometry(40,100,100,100)
let doorTexture = new THREE.TextureLoader().load('./images/door.jpg')
let doorMat = new THREE.MeshBasicMaterial({map:doorTexture})
let Door = new THREE.Mesh(doorPlane,doorMat)
Door.position.set(1000,0,0)
// scene.add(Door)

// 定义渲染器
let renderer = new THREE.WebGLRenderer()
renderer.setClearColor('#fff')
renderer.setSize(window.innerWidth,window.innerHeight)

// 定义相机
let camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight, 0.1, 20000)
camera.lookAt(scene.position)
camera.position.set(100,100,100)

// 定义环境光
let ambient = new THREE.AmbientLight('#fff')
scene.add(ambient)

// 将场景放进页面
document.body.appendChild(renderer.domElement)

// 定义控制器
let control = new OrbitControls(camera,renderer.domElement)


// 渲染页面
function render () {
    renderer.render(scene,camera)
    requestAnimationFrame(render)
}
render()