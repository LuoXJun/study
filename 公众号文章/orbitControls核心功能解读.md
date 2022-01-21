## THREEJS OrbitControls核心功能解读
OrbitControls是THREEJS中最常用的一个控制器，可以帮助我们实现以目标为焦点的旋转缩放，同时平移相机观察场景的操作，看上去是物体在进行变换，实际上所有的变化都是相机的相对位置在发生改变。今天就给大家讲解该空间实现的核心源码以及实现原理。
ps：以下代码非完整代码段，仅为关键实现代码

### 如何设置焦点
```javaScript
  // 我们在创建控制器时，会将相机以及dom传入该控件，而相机的lookAt也正是控件的target

  // 在创建实例时会被重新定义为坐标轴原点（0，0，0），同时相机的lookAt也会被覆盖。

  this.object = object;

  this.target = new Vector3();
```
### 以焦点作为中心旋转
```javaScript
    // 获取相机位置
    var position = scope.object.position;

    // 用当前相机位置减去焦点位置，获得向量
    offset.copy( position ).sub( scope.target );

    // 通过获得的向量建立球坐标系
    spherical.setFromVector3( offset );

    // 对球坐标系做旋转,可以理解相机位置所对应的球上的点在运动
    spherical.theta += sphericalDelta.theta;
    spherical.phi += sphericalDelta.phi;

    // 控制球坐标系极坐标上下限，避免变换到phi的极点
    spherical.makeSafe();

    // 再将球坐标转换为向量
    offset.setFromSpherical( spherical );

    // 相机的位置也就是焦点位置加上球坐标的偏移量
    position.copy( scope.target ).add( offset );

    // 保证焦点始终不变
    scope.object.lookAt( scope.target );
```
#### 这里先把旋转思路整理一下
相机围绕目标y轴以及x轴旋转，其运动轨迹所构成的其实就是一个球，而目标点则是其球心，焦点到相机自身的距离则为球的半径。
所以我们可以以 ``target`` （焦点）作为球心， ``offset`` 作为半径，通过 ``setFromVector3()`` 构建一个球坐标系，构成球坐标时的 ``theta`` 和 ``phi`` 也就是相机在球上的位置。
接下来所有的变换只需要在球坐标上完成，再通过 ``setFromSpherical()`` 转换为世界坐标，如此反复，就实现了以焦点为中心的旋转。
而旋转的操作自然是通过鼠标在屏幕上的移动距离来改变球坐标中的 ``theta`` 和 ``phi`` 。
```javaScript
    function rotateLeft( angle ) {

		sphericalDelta.theta -= angle;

	}

    // 获取鼠标移动时的位置
    rotateEnd.set( event.clientX, event.clientY );

    // 获取鼠标相对于上一个鼠标位置的向量
    rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );

    var element = scope.domElement;

    // 定义每一次旋转的角度
    // 左右旋转为甚不除以宽度达到归一化，因为透视相机的高度是固定的，所以使用高度
    // 事实上无论除什么都是可以的，只是为了归一化方便控制旋转范围而已
    rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

    rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

    // 控制旋转匀速，避免因鼠标移动距离是的旋转速度越来越快
    rotateStart.copy( rotateEnd );
```
大家在阅读源码的时候会发现，在构建球坐标系时还有这么几句代码
```javaScript
    // so camera.up is the orbit axis
    // 同步相机up轴与世界坐标系的y轴
    var quat = new Quaternion().setFromUnitVectors( object.up, new Vector3( 0, 1, 0 ) );
    var quatInverse = quat.clone().invert();

    // rotate offset to "y-axis-is-up" space
    offset.applyQuaternion( quat );

    // rotate offset back to "camera-up-vector-is-up" space
    // 复原相机本身坐标系变换
    offset.applyQuaternion( quatInverse );
```
这是因为在 ``threejs``中，相机默认的 ``up`` 轴是 ``y`` 轴，所以其实去掉该代码也不影响实际的使用，但是当你改变相机的 ``up`` 轴时，就需要获取他们之间的变换量。``setFromUnitVectors()`` 方法能够获取两个向量之间的四元数变换，也即是无论相机 ``up`` 轴是否为 ``y`` 轴，该方法都能获取它们之间的变换并应用，以达到同步世界坐标 ``y`` 轴的目的。
### 缩放功能
大家都知道，``PerspectiveCamera`` 和 ``OrthographicCamera`` 具有不同的投影属性，所以在进行缩放的时候，``PerspectiveCamera`` 通过控制相机的距离的远近是更好的做法，当然 ``OrthographicCamera`` 相机就没有这个顾虑，可以直接使用 ``zoom`` ，通过控制 ``zoom`` 的大小来控制相机缩放。
```javaScript
    function dollyIn( dollyScale ) {

        if ( scope.object.isPerspectiveCamera ) {

            // 缩放比例
            scale *= dollyScale;

        } else if ( scope.object.isOrthographicCamera ) {

            scope.object.zoom = Math.max( scope.minZoom, Math.min( scope.maxZoom, scope.object.zoom / dollyScale ) );
            scope.object.updateProjectionMatrix();
            zoomChanged = true;

        } else {

            console.warn( 'WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled.' );
            scope.enableZoom = false;

        }

	}

    function getZoomScale() {

		return Math.pow( 0.95, scope.zoomSpeed );

	}

    function handleMouseMoveDolly( event ) {

		dollyEnd.set( event.clientX, event.clientY );

		dollyDelta.subVectors( dollyEnd, dollyStart );

		if ( dollyDelta.y > 0 ) {

			dollyOut( getZoomScale() );

		} else if ( dollyDelta.y < 0 ) {

			dollyIn( getZoomScale() );

		}

		dollyStart.copy( dollyEnd );

		scope.update();

	}

    // update函数中
    spherical.radius *= scale;

    scale = 1;
```
整个代码都是很简单的缩放论滚，同步相机 ``zoom`` 或者距离，其中值得注意的点是``update``函数中更新的两句代码

`spherical.radius *= scale;`

`scale = 1;`

刚才我们说了构建球坐标系，改变半径就是控制相机的远近，自然可以理解，但是将缩放系数变为1，会不会使得缩放滚轮时控制失效呢，答案是肯定不会啦，我们在每次缩放滚轮时进行的变换，都是根据当前的状态来进行，而不是以一开始的状态来进行，也就是说无论什么时候，滚轮缩放了多少次，当前的状态永远可以看作单位一来进行计算。
### 移动操作
```javaScript
    // 相机焦点同步偏移（update中）
    scope.target.add( panOffset );

	var panUp = function () {

		var v = new Vector3();

		return function panUp( distance, objectMatrix ) {

            // screenSpacePanning定义camera平移时的移动方式
            // true: 以屏幕空间为主，false: 在与camera的up轴相交的平面中移动
			if ( scope.screenSpacePanning === true ) {

                // 矩阵列的xyz对应索引为0，1，2
                // y轴分量
				v.setFromMatrixColumn( objectMatrix, 1 );

			} else {

				v.setFromMatrixColumn( objectMatrix, 0 );

                // 获取与相机x轴以及up轴垂直的平面
				v.crossVectors( scope.object.up, v );

			}

            // 变化幅度
			v.multiplyScalar( distance );

			panOffset.add( v );

		};

	}();
```
移动操作中偏移量的计算方法和旋转操作上的计算方法整体上来说是一致的，这里就不再赘述。