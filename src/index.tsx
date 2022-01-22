import * as React from 'react'
// @ts-ignore
import { LGLTracerRenderer } from 'lgl-tracer'
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber'

type Props = {
    children: React.ReactNode
    samples?: number
}

export function Raytracer({ children, samples = 64, ...props }: Props) {
  const ref = React.useRef<THREE.Scene>(null!)
  const { scene, controls, camera, gl, size, viewport } = useThree()

  const renderer = React.useRef<LGLTracerRenderer>()
  React.useEffect(() => {
    renderer.current = new LGLTracerRenderer({
      canvas: { getContext: gl.getContext, getExtension: (gl as any).getExtension },
      loadingCallback: { onProgress: () => null, onComplete: () => null }
    })
    renderer.current.canvas = gl.domElement
    renderer.current.gl = gl.getContext()
    renderer.current.enviromentVisible = !!scene.background
    ref.current.environment = scene.environment
    return () => {
      renderer.current.canvas = null
      renderer.current.gl = null
      renderer.current.pipeline = null
    }
  }, [])

  React.useEffect(() => {
    Object.assign(renderer.current, props)
    renderer.current.needsUpdate = true
    renderer.current.pipeline?.reset()
  }, [props])

  React.useEffect(() => {
    renderer.current.buildScene(ref.current, camera).then(() => {
      // ...
    })
  }, [])

  React.useEffect(() => {
    if (controls) {
      const reset = () => renderer.current.pipeline?.reset()
      controls.addEventListener('start', reset)
      return () => {
        controls.removeEventListener('start', reset)
      }
    }
  }, [controls])

  React.useEffect(() => {
    renderer.current.setSize(size.width, size.height)
    renderer.current.setPixelRatio(viewport.dpr)
    renderer.current.pipeline?.reset()
  }, [size, viewport])

  useFrame(() => {
    if (renderer.current && renderer.current.getTotalSamples() < samples) renderer.current.render(ref.current, camera)
  }, 1)

  return <scene ref={ref}>{children}</scene>
}
