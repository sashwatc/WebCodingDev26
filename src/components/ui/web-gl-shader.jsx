"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"
import { cn } from "@/lib/utils"

export function WebGLShader({ className, variant = "blue-flow", theme = "light" }) {
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
        uniform float alphaScale;
        uniform float brightness;
        uniform float lineThickness;

        void main() {
          vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);
          p.x *= 1.04;

          vec3 deepBlue = vec3(0.005, 0.025, 0.09);
          vec3 midBlue = vec3(0.015, 0.055, 0.17);
          vec3 lightBlue = vec3(0.05, 0.12, 0.28);

          vec3 color = vec3(0.0);
          float alpha = 0.0;

          for (int i = 0; i < 5; i++) {
            float fi = float(i);
            float offset = -0.12 + (fi - 2.0) * 0.095;
            float frequency = xScale * mix(0.82, 1.06, fract(fi * 0.37));
            float amplitude = yScale * mix(0.9, 1.14, fract(fi * 0.29));
            float speed = mix(0.07, 0.15, fract(fi * 0.23));
            float phase = fi * 0.88;

            float y =
              sin((p.x * frequency) + phase + time * speed) * amplitude +
              sin((p.x * (frequency * 0.54)) - phase * 1.1 - time * (speed * 0.58)) * (amplitude * 0.18) +
              offset;

            float dist = abs(p.y - y);
            float thickness = lineThickness * mix(0.9, 1.14, fract(fi * 0.41));
            float line = smoothstep(thickness * 1.9, thickness * 0.38, dist);

            float bendFade = smoothstep(1.95, 0.24, abs(p.x)) * (1.0 - smoothstep(1.82, 2.08, abs(p.x)));
            line *= bendFade;

            vec3 strandColor = mix(deepBlue, midBlue, fract(fi * 0.37));
            strandColor = mix(strandColor, lightBlue, fract(fi * 0.19) * 0.4);

            color += strandColor * (line * 0.88);
            alpha += line * alphaScale;
          }

          color *= brightness;
          alpha = clamp(alpha, 0.0, alphaScale * 2.15);

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
        xScale: { value: variant === "rainbow" ? 1.0 : 1.75 },
        yScale: { value: variant === "rainbow" ? 0.5 : 0.16 },
        distortion: { value: variant === "rainbow" ? 0.05 : 0.14 },
        alphaScale: { value: variant === "rainbow" ? 0.08 : theme === "dark" ? 0.034 : 0.082 },
        brightness: { value: variant === "rainbow" ? 1.0 : theme === "dark" ? 0.76 : 1.18 },
        lineThickness: { value: variant === "rainbow" ? 0.016 : theme === "dark" ? 0.026 : 0.022 },
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
        refs.uniforms.time.value += variant === "rainbow" ? 0.02 : 0.026
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
  }, [theme, variant])

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
