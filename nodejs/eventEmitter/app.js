let events = require( 'events' ) 
const { addListener } = require('process')

// 事件监听和事件触发功能的封装
let eventEmitter = new events.EventEmitter()

// 监听事件
eventEmitter.on('autoThing',(value1,value2)=>{

    console.log('触发事件' + value1,value2)

})

eventEmitter.on('autoThing',(arg1,arg2)=>{

    console.log('触发事件'+ arg1, arg2)

})

// 事件调用时触发
eventEmitter.emit('autoThing','value1', 'value2')

/**
 * 
 * 	addListener(event, listener):为指定事件添加一个监听器到监听器数组的尾部。
 *  on(event, listener):为指定事件注册一个监听器，接受一个字符串 event 和一个回调函数。
 * 	once(event, listener):为指定事件注册一个单次监听器，即 监听器最多只会触发一次，触发后立刻解除该监听器。
 * 	removeListener(event, listener):移除指定事件的某个监听器，监听器必须是该事件已经注册过的监听器。它接受两个参数，第一个是事件名称，第二个是回调函数名称。
 *  removeAllListeners([event]):移除所有事件的所有监听器， 如果指定事件，则移除指定事件的所有监听器。
 *  setMaxListeners(n):默认情况下， EventEmitters 如果你添加的监听器超过 10 个就会输出警告信息。 setMaxListeners 函数用于改变监听器的默认限制的数量。
 * 	listeners(event):返回指定事件的监听器数组。
 *  emit(event, [arg1], [arg2], [...]):按监听器的顺序执行执行每个监听器，如果事件有注册监听返回 true，否则返回 false。
 *  events.emitter.listenerCount(eventName):返回指定事件的监听器数量
 *  newListener:添加新的监听器时触发
 *  removeListener:从指定监听器数组中删除一个监听器，该操作会改变处于删除监听器之后的监听器的索引
 * 
 * */ 


console.log('以下为事件方法测试\n')

let listener1 = function listener1(){

    console.log('监听器一')

}

let listener2 = function listener2(){

    console.log('监听器二')

}

eventEmitter.addListener('connection',listener1)

eventEmitter.on('connection',listener2)

eventEmitter.emit('connection')

console.log( '监听器监听事件数量' + eventEmitter.listenerCount('connection') )

eventEmitter.removeListener('connection',listener1)
console.log( '监听器监听事件数量' + eventEmitter.listenerCount('connection') )

eventEmitter.emit('connection')


