"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { cn } from "@/lib/utils"

export function WebGLShader({ className, variant = "blue-flow" }) {
  const canvasRef = useRef(null)
  const sceneRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    mesh: null,
    uniforms: null,
    animationId: null,
  })

  useEffect(() => {
    if (!canvasRef.current) return undefined

    const canvas = canvasRef.current
    const refs = sceneRef.current
    const container = canvas.parentElement || canvas

    const vertexShader = `
      attribute vec3 position;
      void main() {
        gl_Position = vec4(position, 1.0);
      }
    `

    const fragmentShader = variant === "rainbow"
      ? `
        precision highp float;
        uniform vec2 resolution;
        uniform float time;
        uniform float xScale;
        uniform float yScale;
        uniform float distortion;

        void main() {
          vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

          float d = length(p) * distortion;

          float rx = p.x * (1.0 + d);
          float gx = p.x;
          float bx = p.x * (1.0 - d);

          float r = 0.05 / abs(p.y + sin((rx + time) * xScale) * yScale);
          float g = 0.05 / abs(p.y + sin((gx + time) * xScale) * yScale);
          float b = 0.05 / abs(p.y + sin((bx + time) * xScale) * yScale);

          gl_FragColor = vec4(r, g, b, 1.0);
        }
      `
      : `
        precision highp float;
        uniform vec2 resolution;
        uniform float time;
        uniform float xScale;
        uniform float yScale;
        uniform float distortion;

        void main() {
          vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

          float d = length(p * vec2(0.85, 1.0)) * distortion;

          float waveA = p.y + sin((p.x + time * 0.38) * xScale) * yScale;
          float waveB = p.y - 0.22 + sin((p.x * 1.25 - time * 0.26) * (xScale * 0.86)) * (yScale * 0.82);
          float waveC = p.y + 0.26 + sin((p.x * 1.72 + time * 0.52) * (xScale * 1.08)) * (yScale * 0.64);

          float bandA = 0.012 / (abs(waveA + d * 0.08) + 0.02);
          float bandB = 0.010 / (abs(waveB - d * 0.05) + 0.018);
          float bandC = 0.009 / (abs(waveC) + 0.022);
          float glow = exp(-length(p * vec2(0.7, 1.2)) * 1.4) * 0.15;

          float intensity = clamp(bandA + bandB + bandC + glow, 0.0, 1.0);

          vec3 deepBlue = vec3(0.10, 0.27, 0.69);
          vec3 midBlue = vec3(0.25, 0.53, 0.90);
          vec3 lightBlue = vec3(0.73, 0.87, 1.0);

          vec3 color = mix(deepBlue, midBlue, clamp(bandA * 2.6, 0.0, 1.0));
          color = mix(color, lightBlue, clamp(bandB * 3.0 + glow * 0.6, 0.0, 1.0));

          float alpha = clamp(intensity * 0.20, 0.0, 0.24);

          gl_FragColor = vec4(color, alpha);
        }
      `

    const handleResize = () => {
      if (!refs.renderer || !refs.uniforms) return

      const rect = container.getBoundingClientRect()
      const width = Math.max(Math.floor(rect.width), 1)
      const height = Math.max(Math.floor(rect.height), 1)

      refs.renderer.setSize(width, height, false)
      refs.uniforms.resolution.value.set(width, height)
    }

    const initScene = () => {
      refs.scene = new THREE.Scene()
      refs.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
      refs.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
      refs.renderer.setClearColor(new THREE.Color(0x000000), 0)

      refs.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, -1)

      refs.uniforms = {
        resolution: { value: new THREE.Vector2(1, 1) },
        time: { value: 0.0 },
        xScale: { value: variant === "rainbow" ? 1.0 : 2.0 },
        yScale: { value: variant === "rainbow" ? 0.5 : 0.16 },
        distortion: { value: variant === "rainbow" ? 0.05 : 0.14 },
      }

      const position = [
        -1.0, -1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0, -1.0, 0.0,
        -1.0,  1.0, 0.0,
         1.0,  1.0, 0.0,
      ]

      const positions = new THREE.BufferAttribute(new Float32Array(position), 3)
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute("position", positions)

      const material = new THREE.RawShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: refs.uniforms,
        side: THREE.DoubleSide,
      })

      refs.mesh = new THREE.Mesh(geometry, material)
      refs.scene.add(refs.mesh)

      handleResize()
    }

    const animate = () => {
      if (refs.uniforms) {
        refs.uniforms.time.value += 0.01
      }

      if (refs.renderer && refs.scene && refs.camera) {
        refs.renderer.render(refs.scene, refs.camera)
      }

      refs.animationId = requestAnimationFrame(animate)
    }

    initScene()
    animate()
    window.addEventListener("resize", handleResize)

    let resizeObserver = null
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(handleResize)
      resizeObserver.observe(container)
    }

    return () => {
      if (refs.animationId) {
        cancelAnimationFrame(refs.animationId)
      }

      window.removeEventListener("resize", handleResize)
      resizeObserver?.disconnect()

      if (refs.mesh) {
        refs.scene?.remove(refs.mesh)
        refs.mesh.geometry.dispose()

        if (refs.mesh.material instanceof THREE.Material) {
          refs.mesh.material.dispose()
        }
      }

      refs.renderer?.dispose()
    }
  }, [variant])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 block h-full w-full",
        className
      )}
    />
  )
}
