import * as React from 'react'
// @ts-ignore
import { LGLTracerRenderer } from 'lgl-tracer'
import { useThree, useFrame, ThreeEvent } from '@react-three/fiber'

export type RaytracerProps = {
  children: React.ReactNode
  /** Number of samples until rendering stops. Default: 64 */
  samples?: number
  /** useFrame render index. Default: 1 */
  renderIndex?: number
  /** The number of times the light bounces per path, at least 2 times and at most 8 times. Default: 2 */
  bounces?: number
  /** Set the intensity of the environment lighting. Default: 1 */
  envMapIntensity?: number
  /** Whether to display the enviroment background (does not affect the lighting of scene objects). Default: true */
  enviromentVisible?: boolean
  /** Whether to enable the SVGF(Spatiotemporal Variance-Guided Filter) denoise pass. SVGF pass include temporal and spatial part, controlled by two independent switches. Default: false */
  enableDenoise?: boolean
  /** Whether to enable the temporal part denoise. temporal denoise will turn on the reprojection pass, reuse effective information in historical pixels for denoise, and pass the variance factor to spatial denoise. Default: true */
  enableTemporalDenoise?: boolean
  /** Whether to enable the spatial part denoise. spatial denoise will turn on the A-Tours filter pass. Default: true */
  enableSpatialDenoise?: boolean
  /** The callback method after the complete sampling of a frame is rendered, for example, to ensure that the screenshot from the canvas is successful. */
  fullSampleCallback?: () => void
  /** Whether to downsample during camera movement (to maintain frame rate). Default: false */
  movingDownsampling?: boolean
  /** Whether to keep sampling when canvas element off focus. Default: true */
  renderWhenOffFocus?: boolean
  /** Set the method used in ToneMapping pass. including several methods built-in support in threejs. Default: THREE.LinearToneMapping */
  toneMapping?: number
  /** Whether to use tile rendering, if enabled, the screen space will be divided according to the frame rate and then rendered block by block. Default: false */
  useTileRender?: boolean
  /** Set svgf reproject pass's color blend factor, the factor is used to determine the weight of mixing the current frame and the history frame. Default: 0.2 */
  denoiseColorBlendFactor?: number
  /** Set svgf reproject pass's moment variance blend factor, the factor is used to determine the weight of mixing the current frame and the history frame. Default: 0.2 */
  denoiseMomentBlendFactor?: number
  /** Set svgf a-tours filter pass's color threshold value. Default: 0.5 */
  denoiseColorFactor?: number
  /** Set svgf a-tours filter pass's position threshold value. Default: 0.35 */
  denoisePositionFactor?: number
}

const Raytracer = React.forwardRef(
  ({ children, renderIndex = 1, samples = 64, ...props }: RaytracerProps, forwardRef) => {
    const ref = React.useRef<THREE.Scene>(null!)
    const renderer = React.useRef<LGLTracerRenderer>()
    const { scene, controls, camera, gl, size, viewport } = useThree()

    // Set up the renderer
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

    // Update function for refreshing the renderer
    const update = React.useCallback(() => {
      if (renderer.current) {
        renderer.current.needsUpdate = true
        if (renderer.current.pipeline) renderer.current.render(ref.current, camera)
      }
    }, [])

    // Update when props are assigned to the renderer
    React.useEffect(() => {
      const {
        denoiseColorBlendFactor,
        denoiseMomentBlendFactor,
        denoiseColorFactor,
        denoisePositionFactor,
        ...parameters
      } = props
      Object.assign(renderer.current, parameters)
      if (denoiseColorBlendFactor !== undefined) renderer.current.setDenoiseColorBlendFactor(denoiseColorBlendFactor)
      if (denoiseMomentBlendFactor !== undefined) renderer.current.setDenoiseMomentBlendFactor(denoiseMomentBlendFactor)
      if (denoiseColorFactor !== undefined) renderer.current.setDenoiseColorFactor(denoiseColorFactor)
      if (denoisePositionFactor !== undefined) renderer.current.setDenoisePositionFactor(denoisePositionFactor)
      update()
    }, [props])

    // Update when the camera is being dragged/controlled
    React.useEffect(() => {
      if (controls) {
        controls.addEventListener('start', update)
        return () => controls.removeEventListener('start', update)
      }
    }, [controls])

    // Update on size and pixel-ratio changes
    React.useEffect(() => {
      renderer.current.setSize(size.width, size.height)
      renderer.current.setPixelRatio(viewport.dpr)
      update()
    }, [size, viewport])

    // Let it build the scene
    React.useEffect(() => void renderer.current.buildScene(ref.current, camera).then(update), [])

    // Allow user land to access the renderer as a ref
    React.useImperativeHandle(forwardRef, () => renderer.current, [])

    // Render out, as long as the total number of samples is not reached
    useFrame(() => {
      if (renderer.current && renderer.current.pipeline && renderer.current.getTotalSamples() < samples)
        renderer.current.render(ref.current, camera)
    }, renderIndex)

    return <scene ref={ref}>{children}</scene>
  }
)

export { Raytracer }
