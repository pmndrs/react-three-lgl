A React abstraction for the [LGL-Raytracer](http://lgltracer.com/). This is for photorealistic 

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
