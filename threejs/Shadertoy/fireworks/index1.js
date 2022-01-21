import * as THREE from '../../three/build/three.module.js'
window.onload = function() {

    // 定义场景
    let scene = new THREE.Scene()
    scene.fog = new THREE.Fog('#fff', 0, 10000);

    // 定义渲染器
    let renderer = new THREE.WebGLRenderer({
        antialias: true
    })
    renderer.setSize(window.innerWidth,window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    // 渲染到页面
    document.body.appendChild(renderer.domElement)

    // 定义相机
    let camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight,0.1,10000)
    camera.position.set(0,100,300)
    camera.lookAt(new THREE.Vector3(0,0,0))


    // 添加灯光
    let ambient = new THREE.AmbientLight('#fff')
    scene.add(ambient)


    // 创建自定义着色器
    let geo = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight)

    // 传递给着色器的uniform参数
    var uniforms = {
        iTime: { value: 1.0 },
        iResolution: { value: new THREE.Vector2(window.innerWidth * 1.0, window.innerHeight * 1.0)},
        iMouse: { value: new THREE.Vector2(0.0, 0.0) }
    }
    let mat = new THREE.ShaderMaterial({
        uniforms:uniforms,
        
        // 顶点着色器文本内容
        vertexShader: `
        void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
          }
        `,
        fragmentShader:`
        uniform float iTime;
        uniform vec2 iResolution;
        uniform vec2 iMouse;
        
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        #define TWOPI 6.28318530718

        #define T_SPEED 0.2
        #define FIREWORK_SCALE 10.
        #define GRAVITY 0.33
        #define RING_STEP 0.5

        #define START_SEED 0.8
        // 烟花粒子数量
        #define NUM_PARTICLES 200.
        #define SKY_GLOW 2.
        #define FRONT_HILL_GLOW 1.85
        #define BACK_HILL_DENSITY 0.003
        #define BACK_HILL_GLOW 0.6
        #define STAR_GLOW 0.9
        #define CITY_GLOW 0.7

        struct Firework {
          float sparkleScale;
          float rMin;
          float rMax;
          float rPow;
          float dirYScale;
          // 亮度比
          float brightnessScale;
          // 颜色变化
          float colorShift;
          // 重力大小
          float gravityScale;
          // 花瓣
          float nPetals;
          // 圆环、轮
          float rRound;
          // 破裂率
          float burstRate;
        };

        const Firework fireworks[4] = Firework[4](
          Firework(0., 0.1, 1., 0., 1., 1., 0., 1., 0., 0., 25.),
          Firework(1., 0.01, 1., 1., 0.3, 1., 0., 1., 0., 0., 25.),
          Firework(0.5, 0.3, 0.6, 0., 1., 1., 1., 2., 2., 0., 22.),
          Firework(1., RING_STEP, 1.5 * RING_STEP, 0., 1., 0.6, 0.5, 0.2, 0., 1., 6.)
        );

        const float iRingStep = 1. / RING_STEP;

        float sigmoid(float x, float c, float m) {
          return clamp(0.5 + m * (x - c), 0., 1.);
        }
        

        float Hash11(float t) {
          return fract(sin(t*34.1674));
        }

        vec2 Hash12(float t) {
          return fract(sin(t * vec2(553.2379, 670.3438)));
        }

        vec3 Hash13(float t) {
          return fract(sin(t * vec3(483.9812, 691.3455, 549.7206)));
        }

        vec2 RandDirection(float seed, float rMin, float rMax, float rPow, float nPetals, float doRound) {
          vec3 xyt = Hash13(seed);
          float rScale = xyt.x * (1. - rPow) + xyt.x * xyt.x * rPow;
          float r = mix(rMin, rMax, rScale);
          r = mix(r, float(int(r * iRingStep)) * RING_STEP, doRound);
          float theta = TWOPI * (xyt.y + xyt.z);
          r *= mix(1., 1.+ cos(nPetals*theta), nPetals > 0.);
          return vec2(r*cos(theta), r*sin(theta));
        }

        vec3 hsv2rgb(vec3 c) {
            const vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }


        void main() {
          // 视图分辨率
          vec2 inverseResolution = 1. / iResolution.xy;

          float tt = T_SPEED * 0.8 * iTime;
          float tCycle = 1. + floor(mod(tt, 99999.));
          float u = fract(tt);

          float imx = min(inverseResolution.x, inverseResolution.y);
          vec2 xy = gl_FragCoord.xy * imx;
          float yMax = iResolution.y * imx;

          float sx = sin(xy.x);
          float hill1Mask = sigmoid(xy.y, yMax * (0.21 + 0.1 * sx), 150.);
          float hill2Mask = sigmoid(xy.y, yMax * (0.33 + 0.08 * cos(5.5 * min(xy.x, 0.7))), 50.);

          float yp = gl_FragCoord.y * inverseResolution.y;
          float dColor = (0.25 + SKY_GLOW * (1. - yp * yp));
          vec3 color = vec3(0.025*dColor, 0., 0.075*dColor);
          color *= 0.2 + 0.8*hill2Mask;
          float hy = Hash11(0.141*gl_FragCoord.y);
          float starFactor = Hash11(gl_FragCoord.x + 18.2*hy);
          float starColor = 0.2 + 0.7 * starFactor * starFactor * starFactor;
          float starFlicker = (0.89 + 0.11 * cos(6. * iTime + 7.9 * hy));
          color += STAR_GLOW * hill2Mask * starColor * starFlicker * float(fract(31.163*xy.x*(hy+0.1)) < 0.02 && fract(51.853 * xy.y * starColor) < 0.02);

          float dHouse2 = 0.1 + 0.5*float(fract(31.163*xy.x*starColor) + sin(0.0001 * iTime + 51.853 * xy.y * (hy+0.2)));
          color += max(vec3(0),(1. - hill2Mask) * BACK_HILL_GLOW * min(vec3(1.,1.,1.), vec3(1., 0.7, 0.)* BACK_HILL_DENSITY / dHouse2));
          vec3 hsf = Hash13(START_SEED + 0.7132 * tCycle);
          float h = hsf.x;
          float s = 0.3 + 0.7 * hsf.y;
          float launchDist = (1. + 2. * hsf.z*hsf.z*hsf.z);
          float finalScale = launchDist * FIREWORK_SCALE;
          float launchFactor = (launchDist - 1.) * 0.5;

          vec3 rand1 = Hash13(0.131 * tCycle * 1.674 + START_SEED);
          vec2 center = vec2(0.2 + 0.6*rand1.x, 0.5-0.133*launchFactor+(0.35-0.1*launchFactor)*rand1.y);
          vec2 start = vec2(0.3 + 0.4 * rand1.z, 0.);

          if (u < 0.2) {
            float t = 5. * u;
            vec2 p = t * center + (1. - t) * start;
            vec2 uv = finalScale * (gl_FragCoord.xy-p*iResolution.xy) * imx;
            vec3 cStart = hsv2rgb(vec3(h, 0.5*s, 0.6));
            float d = length(uv);
            color += 0.033 * cStart /d;

          } else {

          float t = 1.25 * (u-0.2);

          vec3 rand2 = Hash13(START_SEED + tCycle * 0.1185);

          int idx = int(4. * rand2.x);
          Firework firework = fireworks[idx];

          vec2 uv = finalScale * (gl_FragCoord.xy-center*iResolution.xy) * imx ;

          float tRamp = min(1., 10. * (1. - t));
          vec3 cBase = hsv2rgb(vec3(h, s, tRamp));

          float sizeBase = 0.2 + 0.8 * rand2.y;

          float rAddOn = float(idx == 3) * rand2.z * 2.;

          float nPetalsFinal = firework.nPetals + float(firework.nPetals > 0.) * round(3. * rand2.z);

          for (float i = 0.; i < NUM_PARTICLES; i++) {

            float size = sizeBase * mix(1., tRamp * (1.5 + 1.5 * sin(t * i)), firework.sparkleScale);

            vec2 dir = RandDirection(
              i + fract(0.17835497 * tCycle),
              firework.rMin,
              firework.rMax + RING_STEP*rAddOn,
              firework.rPow,
              nPetalsFinal,
              firework.rRound);
            dir.y *= firework.dirYScale;
            dir.y -= (1. + firework.gravityScale*t*t*t)*GRAVITY * sizeBase * sizeBase * t;

            float tRate = 0.916291 + log(0.4 + (firework.burstRate + 5. * float(idx == 3) * float(2 - int(rAddOn))) * t);

            float at = abs(t - 0.015);
            float bump = 0.012 / (1. + 40000. * at*at);
            float t3 = (t+0.2)*(t+0.2)*(t+0.2);
            float t6 = t3*t3;
            float t24 = t6*t6*t6*t6;

            float brightness = sqrt(size)*firework.brightnessScale*0.0013/(1.+ 2. * t24);
            float hNew = mod(i*0.1618033988, 1.);
            vec3 cNew = hsv2rgb(vec3(hNew, s, tRamp));
            vec3 particleColor = mix(cBase, cNew, firework.colorShift);
            float d = 0.0004 + length(uv - dir * tRate);
            color += hill1Mask *  (bump + brightness * particleColor) / (d * d);
          }
          }
          color *= 0.75 + 0.25*hill2Mask;
          color *= hill1Mask;

          color += (1. - hill1Mask) * FRONT_HILL_GLOW * vec3(0.008, 0.06, 0) * (1. - 4. * yp - 0.3 * sx);
          color += hill1Mask * CITY_GLOW * max(0., (1. - 3.75 * yp + 0.25 * sx)) * vec3(1., 0.7, 0.);

          gl_FragColor = vec4(color, 1.0);
        }

        `
    })
    let fireWork = new THREE.Mesh(geo,mat)
    scene.add(fireWork)

    new THREE.FontLoader().load('./FZYaSongS-R-GB_Regular.json',function(obj){
      let geometry = new THREE.TextBufferGeometry( '国庆快乐', {
        font: obj,
        size: 12,
        height: 1,
        curveSegments: 12,
        bevelEnabled: false,
        bevelThickness: 10,
        bevelSize: 8,
        bevelSegments: 5
      });

      // 创建点
      let pointGeo = new THREE.BufferGeometry()
      pointGeo.setAttribute('position',new THREE.BufferAttribute(geometry.attributes.position.array,3))
      let pointMat = new THREE.PointsMaterial({
        color:'white',
        size:10,
        sizeAttenuation:true,
        transparent:true,
        opacity:1,
      })
      let point = new THREE.Mesh(pointGeo,pointMat)
      scene.add(point)
      console.log(fireWork)
    })
    

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
        uniforms.iTime.value += delta * 5
        renderer.render(scene,camera)
        requestAnimationFrame(render)
    }
    render()
}