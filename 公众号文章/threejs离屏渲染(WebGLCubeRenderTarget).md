### threejs离屏渲染(屏幕后加载)
离屏渲染也可以叫屏幕后渲染，简单来说就是在渲染时，不直接将渲染结果显示在canvas中，而是保存在自定义缓冲区中，
同时我们可以使用里面的数据，而WebGLRenderTarget就是自定义缓存区的一个封装。
我们在讨论离屏渲染时一般都是使用的``WebGLRenderTarget``,但是今天我们讨论``WebGLCubeRenderTarget``。
WebGLCubeRenderTarget继承自WebGLRenderTarget，需要和cubeCamera捆绑使用,下面我们就一点一点来走进它们。
+ cubeCamera
既然WebGLCubeRenderTarget是和cubeCamera一起使用，那我们就先来看看cubeCamera
```javaScript
function CubeCamera( near, far, renderTarget ) {

	Object3D.call( this );

	this.type = 'CubeCamera';

	if ( renderTarget.isWebGLCubeRenderTarget !== true ) {

		console.error( 'THREE.CubeCamera: The constructor now expects an instance of WebGLCubeRenderTarget as third parameter.' );
		return;

	}

	this.renderTarget = renderTarget;

	const cameraPX = new PerspectiveCamera( fov, aspect, near, far );
	cameraPX.layers = this.layers;
	cameraPX.up.set( 0, - 1, 0 );
	cameraPX.lookAt( new Vector3( 1, 0, 0 ) );
	this.add( cameraPX );

	const cameraNX = new PerspectiveCamera( fov, aspect, near, far );
	cameraNX.layers = this.layers;
	cameraNX.up.set( 0, - 1, 0 );
	cameraNX.lookAt( new Vector3( - 1, 0, 0 ) );
	this.add( cameraNX );

	const cameraPY = new PerspectiveCamera( fov, aspect, near, far );
	cameraPY.layers = this.layers;
	cameraPY.up.set( 0, 0, 1 );
	cameraPY.lookAt( new Vector3( 0, 1, 0 ) );
	this.add( cameraPY );

	const cameraNY = new PerspectiveCamera( fov, aspect, near, far );
	cameraNY.layers = this.layers;
	cameraNY.up.set( 0, 0, - 1 );
	cameraNY.lookAt( new Vector3( 0, - 1, 0 ) );
	this.add( cameraNY );

	const cameraPZ = new PerspectiveCamera( fov, aspect, near, far );
	cameraPZ.layers = this.layers;
	cameraPZ.up.set( 0, - 1, 0 );
	cameraPZ.lookAt( new Vector3( 0, 0, 1 ) );
	this.add( cameraPZ );

	const cameraNZ = new PerspectiveCamera( fov, aspect, near, far );
	cameraNZ.layers = this.layers;
	cameraNZ.up.set( 0, - 1, 0 );
	cameraNZ.lookAt( new Vector3( 0, 0, - 1 ) );
	this.add( cameraNZ );

	this.update = function ( renderer, scene ) {

		if ( this.parent === null ) this.updateMatrixWorld();

		const currentXrEnabled = renderer.xr.enabled;
		const currentRenderTarget = renderer.getRenderTarget();

		renderer.xr.enabled = false;

		const generateMipmaps = renderTarget.texture.generateMipmaps;

		renderTarget.texture.generateMipmaps = false;

		renderer.setRenderTarget( renderTarget, 0 );
		renderer.render( scene, cameraPX );

		renderer.setRenderTarget( renderTarget, 1 );
		renderer.render( scene, cameraNX );

		renderer.setRenderTarget( renderTarget, 2 );
		renderer.render( scene, cameraPY );

		renderer.setRenderTarget( renderTarget, 3 );
		renderer.render( scene, cameraNY );

		renderer.setRenderTarget( renderTarget, 4 );
		renderer.render( scene, cameraPZ );

		renderTarget.texture.generateMipmaps = generateMipmaps;

		renderer.setRenderTarget( renderTarget, 5 );
		renderer.render( scene, cameraNZ );

		renderer.setRenderTarget( currentRenderTarget );

		renderer.xr.enabled = currentXrEnabled;

	};

}
```
可以看见cubeCamera源码中，创建了6个透视相机，并加入当前cubeCamera相机，六个相机分别看向坐标轴的正/负半轴，同时
改变其up轴(ps:相机自身带有坐标系，同时相机可视方向由坐标原点看向自身坐标系z轴负半轴，但是仅有一个方向不能确定相机当前观察对象的位置状态，所以加入up轴指定当前相机摆放的正方向)


<---- ------
      |