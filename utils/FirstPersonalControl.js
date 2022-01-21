import {

    EventDispatcher,
    Euler,
    Vector3

} from "./three.module.js"

var firstPersonalControl = function(camera,domElEment){

    /**
     * w or ⬆ ：前进
     * s or ⬇ ：后退
     * a or <- ：左移动
     * d or -> ：右移动
     * e or space：上浮
     * q：下浮
     * */ 

    this.camera = camera

    // domElEment.pointerLockElement
    this.dom = domElEment

    // 前进速度
    this.forwardSpeed = 30

    // 前进模式(horizontal:以当前相机方向做水平移动    direction:以当前相机方向为前进方向 )
    this.forwardMode = 'horizontal'

    // 是否显示相机目标中心指针
    this.targetPointer = true

    // 左右移动速度
    this.asideSpeed = 20

    // 上下移动速度
    this.upSpeed = 20

    // 惯性系数
    this.damping = 0.05

    // 是否开启惯性
    this.enableDamping = true

    this.rotationSpeed = 1


    var scope = this

    // 设置欧拉角以及旋转顺序
    var euler = new Euler( 0, 0, 0, 'YXZ' )
    var PI_2 = Math.PI / 2
    var vec = new Vector3()
    var minPolarAngle = 0
    var maxPolarAngle = Math.PI

    var moveForward = false;
    var moveBackward = false;
    var moveLeft = false;
    var moveRight = false;
    var moveUp = false
    var moveDown = false

    // 移动方向
    let velocity = new Vector3()

    var centerPointer

    // 函数执行区

    function onMouseMove( event ) {

        var movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
        var movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
        
        euler.setFromQuaternion( scope.camera.quaternion );

        euler.y -= (movementX / window.innerWidth) * Math.PI / 2 * scope.rotationSpeed;
        euler.x -= (movementY / window.innerHeight) * Math.PI / 2  * scope.rotationSpeed;
        euler.x = Math.max( PI_2 - maxPolarAngle, Math.min( PI_2 - minPolarAngle, euler.x ) );

        scope.camera.quaternion.setFromEuler( euler );

    }

    // 鼠标控制方向移动
    function onMouseDown(event){

        event.preventDefault()

        if (event.button == 0) {

            scope.dom.addEventListener('mousemove', onMouseMove)

            scope.dom.addEventListener('mouseup',onMouseUp)

        }

    }

    function onMouseUp(){

        // 防止鼠标锁定时误触鼠标左键导致清除移动事件
        if(document.pointerLockElement == null) {

            scope.dom.removeEventListener('mousemove', onMouseMove)

        }

    }

    scope.dom.addEventListener('mousedown', onMouseDown)

    // 前后
    function moveForwardFun ( distance ) {

        if ( scope.forwardMode == 'horizontal' ) {

            vec.setFromMatrixColumn( scope.camera.matrix, 0 );

            vec.crossVectors( scope.camera.up, vec );

        } else {

            scope.camera.getWorldDirection(vec)

        }
        

        scope.camera.position.addScaledVector( vec, distance );

    };

    // 左右
    function moveRightFun ( distance ) {

        vec.setFromMatrixColumn( scope.camera.matrix, 0 );

        scope.camera.position.addScaledVector( vec, distance );

    };

    // 按住空格相机上浮
    function up( distance ) {

        // vec.setFromMatrixColumn( scope.camera.matrix, 1 );

        // 相对世界坐标得y轴上升
        vec.set(0,1,0)

        scope.camera.position.addScaledVector( vec, distance );

    }

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

            case 'KeyE':
            case 'Space':
                moveUp = true
                break;

            case 'KeyQ':
                moveDown = true
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

            case 'Space':
            case 'KeyE':
                moveUp = false
                break;

            case 'KeyQ':
                moveDown = false
                break;
        }

    };

    window.addEventListener('keydown',onKeyDown)
    window.addEventListener('keyup',onKeyUp)

    // 点击右键锁定鼠标
    document.addEventListener('contextmenu',function(e){ 
        
        e.preventDefault()

        if( document.pointerLockElement == null ) {

            // 锁定指针
            scope.dom.requestPointerLock()

        }
        
    })

    document.addEventListener('pointerlockchange', function(e){

        if( document.pointerLockElement == null ) {

            scope.dom.removeEventListener('mousemove', onMouseMove)
            scope.dom.addEventListener('mousedown', onMouseDown)

        } else {

            scope.dom.addEventListener('mousemove', onMouseMove)
            scope.dom.removeEventListener('mousedown', onMouseDown)

        }

    })

    this.update = function(){

        let direction = new Vector3()

        if( scope.enableDamping){

            velocity.x -= velocity.x * scope.damping;
            velocity.y -= velocity.y * scope.damping;
            velocity.z -= velocity.z * scope.damping;

        } else {

            velocity.x = 0
            velocity.y = 0
            velocity.z = 0

        }

        // 判断移动方向
        direction.z = Number(moveForward) - Number(moveBackward)
        direction.y = Number(moveUp) - Number(moveDown)
        direction.x = Number(moveLeft) - Number(moveRight)

        // 向量归一化
        direction.normalize()

        if ( moveForward || moveBackward ) {

            velocity.z -= direction.z * scope.forwardSpeed

        } else {

            if( !scope.enableDamping ) {

                velocity.z = 0

            }

        }

        if(scope.enableDamping) moveForwardFun( - velocity.z * scope.damping )
        else moveForwardFun( - velocity.z )

        // 左右
        if ( moveLeft || moveRight ) {

            velocity.x -= direction.x * scope.asideSpeed

        } else {

            if( !scope.enableDamping ) {

                velocity.x = 0

            }

        }

        if(scope.enableDamping) moveRightFun( velocity.x * scope.damping );
        else moveRightFun( velocity.x );

        // 上下
        if( moveUp || moveDown ) {

            velocity.y += direction.y * scope.upSpeed

        } else {

            if( !scope.enableDamping ) {

                velocity.y = 0

            }

        }

        if(scope.enableDamping) up( velocity.y * scope.damping );
        else up( velocity.y );
            
    }
    

}

firstPersonalControl.prototype = Object.create( EventDispatcher.prototype );
firstPersonalControl.prototype.constructor = firstPersonalControl;

export { firstPersonalControl };