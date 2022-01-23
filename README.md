![](/examples.jpg)

A React(-[three-fiber](https://github.com/pmndrs/react-three-fiber)) abstraction for the [LGL-Raytracer](http://lgltracer.com/).

It does its best to remove all unwanted complexity, you can build your scenes as you always would. Although it can move along and has some options that make movement faster (downsampling etc), this is mostly for photorealistic still-images that can take a while to process but will look absolutely stunning. It is side-effect free, when you unmount it goes back to default WebGLRenderer.

Demo: https://codesandbox.io/s/basic-demo-forked-rnuve

```shell
npm install @react-three/lgl
```

```jsx
import { Canvas } from '@react-three/fiber'
import { Raytracer } from '@react-three/lgl'

function App() {
  return (
    <Canvas>
      <Raytracer>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMateral />
        </mesh>
        <directionalLight position={[10, 10, 10]} />
      </Raytracer>
    </Canvas>
  )
}
```

### Options

- `samples`, How many frames it takes to complete a still-image, `64` by default. Set this to something higher if you want to wait for high-quality images. 

Otherwise `<Raytracer>` takes all the LGL raytracer's options: https://lgltracer.com/docs/index.html#/api/LGLTracerRenderer

### Lights

LGL ignores threejs lights, it wants to use its own. But in three-fiber you can simply extend, and now the JSX natives will refer to LGL.

```jsx
import { extend } from '@react-three/fiber'
import { PointLight, RectAreaLight } from 'lgl-tracer'

extend({ PointLight, RectAreaLight })

<rectAreaLight width={2} height={2} position={[3, 3, 3]} />
<pointLight position={[-3, 3, -10]} />
```

If you plan to switch between renderers you can make lights opt in.

```jsx
extend({ LglPointLight: PointLight, LglRectAreaLight: RectAreaLight })

<lglPointLight />
<lglRectAreaLight />
```

### Environmental lighting

Simply drop the `<Environment>` component from drei into your scene, it knows how to work with that ootb, just make sure both the raytracer and the environment are under the same suspense boundary so that they are in sync.

```jsx
import { Environment } from '@react-three/drei'

<Canvas>
  <Suspense fallback={null}>
    <Rayctracer>
      <Scene />
    </Raytracer>
    <Environment preset="city" />
```

### Movement

Your scene has to be static, it will ignore moving parts. This will never be fast enough for runtime usage but you can get away with some camera movement by lowering your resolution (and your expectations). Do not forget to mark your controls as `makeDefault` so that the raycaster can react to it. Try something like this for example:

```jsx
import { OrbitControls } from '@react-three/drei'

<Canvas dpr={1}>
  <Raytracer
    samples={32}
    bounces={3}
    enableTemporalDenoise
    enableSpatialDenoise
    movingDownsampling>
    ...
  </Raytracer>
  <OrbitControls makeDefault />
```

### Screenshots

In order to obtain a screenshot the drawing-buffer has to be preserved, this is a setting in Threejs.

```jsx
import { Canvas, useThree } from '@react-three/fiber'

<Canvas gl={{ preserveDrawingBuffer: true }}>
  <Raycaster>
    </Scene>
    
...
const gl = useThree(state => state.gl)
...
const link = document.createElement('a')
link.setAttribute('download', 'canvas.png')
link.setAttribute('href', gl.domElement.toDataURL('image/png').replace('image/png', 'image/octet-stream'))
link.click()
```
