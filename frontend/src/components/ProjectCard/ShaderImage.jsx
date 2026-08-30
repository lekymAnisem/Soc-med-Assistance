import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const FRAG = /* glsl */ `
uniform sampler2D uTexture;
uniform float uTime;
uniform float uHover;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * 0.35;

  float n1 = noise(uv * 6.0 + t);
  float n2 = noise(uv * 12.0 - t * 0.7);
  float n3 = noise(uv * 3.0 + t * 0.5);

  float amp = uHover * (0.012 + n3 * 0.02);
  vec2 offset = vec2(n1 - 0.5, n2 - 0.5) * amp;

  vec2 distorted = uv + offset;

  // chromatic-ish edge shift on hover
  vec2 shift = vec2(uHover * 0.006, 0.0);
  vec3 col;
  col.r = texture2D(uTexture, distorted + shift).r;
  col.g = texture2D(uTexture, distorted).g;
  col.b = texture2D(uTexture, distorted - shift).b;

  float vig = smoothstep(1.0, 0.4, distance(uv, vec2(0.5)));
  col *= 0.75 + vig * 0.35;

  gl_FragColor = vec4(col, 1.0);
}
`

/**
 * WebGL-backed liquid distortion image. Only meaningful on precise
 * pointers — renders its own tiny renderer so it can be paused cheaply.
 */
export default function ShaderImage({ src, active = false, className = '' }) {
  const canvasRef = useRef(null)
  const frameRef = useRef(null)
  const anim = useRef({ time: 0, hover: 0, target: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const tex = new THREE.TextureLoader().load(src)

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      powerPreference: 'low-power',
      depth: false,
      stencil: false,
    })
    renderer.setClearColor(0x000000, 0)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    const geo = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      uTexture: { value: tex },
      uTime: { value: 0 },
      uHover: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    scene.add(new THREE.Mesh(geo, mat))

    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      canvas.width = Math.floor(rect.width * dpr)
      canvas.height = Math.floor(rect.height * dpr)
      renderer.setSize(rect.width, rect.height, false)
      uniforms.uResolution.value.set(rect.width, rect.height)
    }
    resize()

    const loop = () => {
      const a = anim.current
      a.time += 0.016
      a.hover += (a.target - a.hover) * 0.08
      uniforms.uTime.value = a.time
      uniforms.uHover.value = a.hover
      if (a.hover > 0.001 || a.target > 0.001) {
        renderer.render(scene, camera)
      }
      frameRef.current = requestAnimationFrame(loop)
    }
    frameRef.current = requestAnimationFrame(loop)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas.parentElement)

    return () => {
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
      geo.dispose()
      mat.dispose()
      tex.dispose()
      renderer.dispose()
    }
  }, [src])

  useEffect(() => {
    anim.current.target = active ? 1 : 0
  }, [active])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      aria-hidden
    />
  )
}
