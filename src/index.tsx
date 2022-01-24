import * as React from 'react'
// @ts-ignore
import { LGLTracerRenderer } from 'lgl-tracer'
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber'

type Props = {
  children: React.ReactNode
  samples?: number
  renderIndex?: number
}

export function Raytracer({ children, renderIndex = 1, samples = 64, ...props }: Props) {
  const ref = React.useRef<THREE.Scene>(null!)
  const { scene, controls, camera, gl, size, viewport } = useThree()

  const renderer = React.useRef<LGLTracerRenderer>()
  React.useEffect(() => {
    renderer.current = new LGLTracerRenderer({
      // Fake a canvas to trick LGL into using the existing WebGL context
      canvas: { getContext: gl.getContext, getExtension: (gl as any).getExtension },
      // Silence console logs
      loadingCallback: { onProgress: () => null, onComplete: () => null },
    })
    // Use the existing canvas and WebGL context
    renderer.current.canvas = gl.domElement
    renderer.current.gl = gl.getContext()
    // Reuse the default scenes background
    renderer.current.enviromentVisible = !!scene.background
    ref.current.environment = scene.environment
    return () => {
      renderer.current.canvas = null
      renderer.current.gl = null
      renderer.current.pipeline = null
    }
  }, [])

  const update = React.useCallback((render = true) => {
    if (renderer.current) {
      renderer.current.needsUpdate = true
      if (render) renderer.current.render(ref.current, camera)
    }
  }, [])

  React.useEffect(() => {
    Object.assign(renderer.current, props)
    update()
  }, [props])

  React.useEffect(() => {
    renderer.current.buildScene(ref.current, camera).then(() => update(false))
  }, [])

  React.useEffect(() => {
    if (controls) {
      // Update when the camera changes
      controls.addEventListener('start', update)
      return () => controls.removeEventListener('start', update)
    }
  }, [controls])

  React.useEffect(() => {
    // Update on size and pixel-ratio changes
    renderer.current.setSize(size.width, size.height)
    renderer.current.setPixelRatio(viewport.dpr)
    update()
  }, [size, viewport])

  useFrame(() => {
    // Render out, as long as the total number of samples is not reached
    if (renderer.current && renderer.current.getTotalSamples() < samples) renderer.current.render(ref.current, camera)
  }, renderIndex)

  return <scene ref={ref}>{children}</scene>
}
