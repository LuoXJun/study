## cesium 按需加载实体(entity)
我们在使用``cesium``时，常常会有需要加载中国各地区名称的需求，然而``cesium``中能够添加的``entity``的数量是有上限的，当加载到一定数量时就会出现卡顿甚至是浏览器崩溃的情况，这时候就需要按需加载我们的实体类，接下来就给大家介绍一种按需加载的方式，在鼠标移动结束后根据当前地图层级判断是否显示或者删除实体``entity``

### 1、创建一个地球
```javaScript
// 默认看向中国
Cesium.Camera.DEFAULT_VIEW_RECTANGLE = Cesium.Rectangle.fromDegrees(90,-20,110,90)


// 定义场景、标签位置数组、实体数组
let viewer,labelArr = [],entities = []

// 创建地球
viewer = new Cesium.Viewer('cesiumContainer')

// 默认的显示地球纹理
viewer.baseLayerPicker.viewModel.selectedImagery= viewer.baseLayerPicker.viewModel.imageryProviderViewModels[3];

// 添加显示层级网格线
viewer.imageryLayers.addImageryProvider(new Cesium.TileCoordinatesImageryProvider())

// 是否应预加载渲染图块的祖先。将此设置为true可优化缩小体验，并在平移时新暴露的区域。缺点是需要加载更多的图块。
viewer.scene.globe.preloadAncestors = false

// 关闭鼠标操作惯性
var CesiumViewerSceneController = viewer.scene.screenSpaceCameraController;
CesiumViewerSceneController.inertiaSpin = 0;
CesiumViewerSceneController.inertiaTranslate = 0;
CesiumViewerSceneController.inertiaZoom = 0;
```
生成地球以后是这样的，外面的黄色的线就是层级网格线
![avatar](https://pic.imgdb.cn/item/61d7ae3e2ab3f51d91c81b80.png)

### 2、加载数据
接下来我们加载将要作为示例的区域数据，我们打印一下可以发现，当前数据量达到了13w，远远超过了``cesium``所能容纳的实体数量
![avatar](https://pic.imgdb.cn/item/61d7af882ab3f51d91c919b9.png)
```javaScript
// 加载json文件
fetch('./AANP自然地名.geojson').then((res)=>{

    return res.json()

})
.then(json=>{
    for(const item of json.features){

        // 取出数据中各区域的位置
        let obj = [item.geometry.coordinates[0],item.geometry.coordinates[1]]
        labelArr.push(obj)

        // 创建实体
        let entity = new Cesium.Entity({

            position:new Cesium.Cartesian3.fromDegrees(item.geometry.coordinates[0],item.geometry.coordinates[1]),
            
            label:{

                text:item.properties.NAME,
                fillColor:Cesium.Color.fromCssColorString ('red'),
                font:'20pt monospace',
                heightReference:Cesium.CLAMP_TO_GROUND

            }

        })

        // 使用数组保存实体，方便后续检索删除
        entities.push(entity)
        
    }

    console.log(entities.length)
```
此次加载的json数据格式
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [
          112.27967881000006,
          3.9707323300000894
        ]
      },
      "properties": {
        "CLASS": "JH",
        "NAME": "曾母暗沙",
        "PINYIN": "Zengmu Ansha"
      }
    },
```
### 3、实现按需加载
```javaScript
// 获取当前正在渲染的瓦片集合
    const tilesToRender =viewer.scene.globe._surface._tilesToRender

    /**
     * 添加相机移动结束事件，也就是鼠标移动结束事件
     * 由于相机自身有惯性，所以提前关闭惯性会有更好的体验
     * 但是这本身并不影响该功能
     * */
    viewer.camera.moveEnd.addEventListener(()=>{

        // 当前正在渲染的瓦片求并集为一个大的rectangle
        let renderRectangle = new Cesium.Rectangle()
        
        if( tilesToRender.length > 0 ) {

            // 初始化总的渲染的矩形瓦片
            Cesium.Rectangle.clone(tilesToRender[0].rectangle,renderRectangle)

            let num = 0

            tilesToRender.forEach(item => {

                /**
                 * 获取当前层级大于等于12级的瓦片，该处可自定，具体层级可根据加载的实体多少决定
                 * 一般情况下由于相机视角的不同，我们能看见的瓦片数量也不同，所以尽量考虑瓦片数量
                 * 最多的情况下每块瓦片上的显示数量
                */
                if( item.level >= 12 ) {

                    // 用来判断当前是否有符合条件的瓦片正在渲染
                    num += 1

                    // 所有大于12级的瓦片求交集
                    Cesium.Rectangle.union(item.rectangle, renderRectangle, renderRectangle)

                }

            })

            if( num > 0 ){

                // 判断点是否在所需渲染的瓦片内
                for( let i = 0; i < entities.length; i++ ) {

                    // 将度转为弧度
                    let cartographic = Cesium.Cartographic.fromDegrees(labelArr[i][0], labelArr[i][1])

                    // 判断点是否在矩形内
                    if(Cesium.Rectangle.contains(renderRectangle,cartographic)){

                        // 判断当前实体是否已经被加载，有则跳过，无则加载
                        if(viewer.entities.contains(entities[i])) continue

                        viewer.entities.add(entities[i])

                    } else {

                        // 不在点内，则判断是否被加载，有则删除
                        if(viewer.entities.contains(entities[i])){

                            viewer.entities.remove(entities[i])

                        }

                    }

                }

            } else{

                for( let i = 0; i < entities.length; i++ ){

                    /**
                     *  当前可视范围内没有符合条件的瓦片加载，删除掉所欲瓦片
                     * 不能使用removeAll,我们只需要管理我们自己加载的部分即可
                    */
                    if(viewer.entities.contains(entities[i])){

                        viewer.entities.remove(entities[i])

                    }

                }

            }
        }
    })
```
### 4、总结
实现方法和实现的思路都在注释中详细的讲解了，这肯定不是唯一的一种实现方式，也不是最好的一种实现方式，但我觉得这是最容易理解和上手的方法，不需要对``cesium``有非常的高的熟练度也能看懂并且能直接使用。
#### 关键点
+ 加载json数据，创建实体，控制加载实体的瓦片层级
+ 获取当前被渲染的瓦片构成的集合，通过求并集拼成一个大的矩形(也许称为范围可能更合适，但是毕竟使用的是矩形方法)
+ 根据矩形方法判断点是否在矩形中，如果在，则加载当前实体，否则删除当前实体