import { useEffect, useRef } from 'react'
import {
  DodecahedronGeometry,
  EdgesGeometry,
  Euler,
  PerspectiveCamera,
  Vector3,
} from 'three'

const boxEdges = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

const boxFaces = [
  [0, 1, 2, 3], [4, 5, 6, 7],
  [0, 1, 5, 4], [2, 3, 7, 6],
  [1, 2, 6, 5], [3, 0, 4, 7],
]

const createBox = (width, height, depth) => {
  const x = width / 2
  const y = height / 2
  const z = depth / 2
  return [
    new Vector3(-x, -y, -z),
    new Vector3(x, -y, -z),
    new Vector3(x, y, -z),
    new Vector3(-x, y, -z),
    new Vector3(-x, -y, z),
    new Vector3(x, -y, z),
    new Vector3(x, y, z),
    new Vector3(-x, y, z),
  ]
}

const frameSegments = [
  [-2.15, 1.55, 0, -1.55, 1.55, 0], [-2.15, 1.55, 0, -2.15, .95, 0],
  [2.15, 1.55, 0, 1.55, 1.55, 0], [2.15, 1.55, 0, 2.15, .95, 0],
  [-2.15, -1.55, 0, -1.55, -1.55, 0], [-2.15, -1.55, 0, -2.15, -.95, 0],
  [2.15, -1.55, 0, 1.55, -1.55, 0], [2.15, -1.55, 0, 2.15, -.95, 0],
].map((segment) => [
  new Vector3(segment[0], segment[1], segment[2]),
  new Vector3(segment[3], segment[4], segment[5]),
])

export default function HeroScene() {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d', { alpha: true })
    if (!context) return undefined
    host.appendChild(canvas)

    const camera = new PerspectiveCamera(38, 1, .1, 40)
    camera.position.set(0, 0, 7.2)
    camera.lookAt(0, 0, 0)

    const coreGeometry = new DodecahedronGeometry(.68, 0)
    const coreEdgesGeometry = new EdgesGeometry(coreGeometry)
    const corePositions = coreGeometry.attributes.position
    const edgePositions = coreEdgesGeometry.attributes.position
    const coreTriangles = []
    const coreEdges = []

    for (let index = 0; index < corePositions.count; index += 3) {
      coreTriangles.push([
        new Vector3().fromBufferAttribute(corePositions, index),
        new Vector3().fromBufferAttribute(corePositions, index + 1),
        new Vector3().fromBufferAttribute(corePositions, index + 2),
      ])
    }
    for (let index = 0; index < edgePositions.count; index += 2) {
      coreEdges.push([
        new Vector3().fromBufferAttribute(edgePositions, index),
        new Vector3().fromBufferAttribute(edgePositions, index + 1),
      ])
    }

    const arms = [
      { vertices: createBox(.72, .11, .14), position: new Vector3(1.25, 0, 0), light: true, phase: 0 },
      { vertices: createBox(.72, .11, .14), position: new Vector3(-1.25, 0, 0), light: false, phase: Math.PI * .5 },
      { vertices: createBox(.11, .72, .14), position: new Vector3(0, 1.25, 0), light: false, phase: Math.PI },
      { vertices: createBox(.11, .72, .14), position: new Vector3(0, -1.25, 0), light: true, phase: Math.PI * 1.5 },
    ]

    const gridSegments = []
    for (let step = -5; step <= 5; step += 1) {
      gridSegments.push([new Vector3(-5, step, -2.4), new Vector3(5, step, -2.4)])
      gridSegments.push([new Vector3(step, -5, -2.4), new Vector3(step, 5, -2.4)])
    }

    const particles = Array.from({ length: 42 }, () => new Vector3(
      (Math.random() - .5) * 8,
      (Math.random() - .5) * 5,
      (Math.random() - .5) * 3 - .8,
    ))

    const rotation = new Euler()
    const particleRotation = new Euler()
    const centerPoint = new Vector3(0, 0, .72)
    const worldA = new Vector3()
    const worldB = new Vector3()
    const screenA = { x: 0, y: 0, z: 0 }
    const screenB = { x: 0, y: 0, z: 0 }
    const projectedFace = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]
    let width = 1
    let height = 1
    let pointerX = 0
    let pointerY = 0
    let frameId = 0
    let isVisible = true
    let startTime = performance.now()

    const project = (point, target, offset, scale = 1, customRotation = rotation) => {
      worldA.copy(point).multiplyScalar(scale)
      if (offset) worldA.add(offset)
      worldA.applyEuler(customRotation).project(camera)
      target.x = (worldA.x * .5 + .5) * width
      target.y = (-worldA.y * .5 + .5) * height
      target.z = worldA.z
      return target
    }

    const drawSegment = (first, second, color, lineWidth = 1, offset, scale = 1, customRotation) => {
      project(first, screenA, offset, scale, customRotation)
      project(second, screenB, offset, scale, customRotation)
      context.beginPath()
      context.moveTo(screenA.x, screenA.y)
      context.lineTo(screenB.x, screenB.y)
      context.strokeStyle = color
      context.lineWidth = lineWidth
      context.stroke()
    }

    const drawBox = (arm, time) => {
      const distance = 1 + Math.sin(time * .72 + arm.phase) * .035
      const offset = worldB.copy(arm.position).multiplyScalar(distance)
      for (const face of boxFaces) {
        face.forEach((vertexIndex, index) => {
          project(arm.vertices[vertexIndex], projectedFace[index], offset)
        })
        context.beginPath()
        context.moveTo(projectedFace[0].x, projectedFace[0].y)
        for (let index = 1; index < face.length; index += 1) {
          context.lineTo(projectedFace[index].x, projectedFace[index].y)
        }
        context.closePath()
        context.fillStyle = arm.light ? 'rgba(205,205,205,.64)' : 'rgba(42,42,42,.82)'
        context.fill()
      }
      boxEdges.forEach(([first, second]) => {
        drawSegment(arm.vertices[first], arm.vertices[second], arm.light ? 'rgba(255,255,255,.5)' : 'rgba(225,225,225,.42)', .8, offset)
      })
    }

    const resize = () => {
      const bounds = host.getBoundingClientRect()
      width = Math.max(bounds.width, 1)
      height = Math.max(bounds.height, 1)
      const pixelRatio = Math.min(window.devicePixelRatio, 1.25)
      canvas.width = Math.round(width * pixelRatio)
      canvas.height = Math.round(height * pixelRatio)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const move = (event) => {
      pointerX = (event.clientX / window.innerWidth - .5) * .24
      pointerY = (event.clientY / window.innerHeight - .5) * .18
    }

    const animate = (timestamp) => {
      if (!isVisible) return
      const time = (timestamp - startTime) / 1000
      rotation.set(
        -pointerY - .08 + Math.sin(time * .31) * .025,
        pointerX + Math.sin(time * .22) * .09,
        Math.sin(time * .18) * .018,
      )
      particleRotation.set(0, time * .008, 0)
      context.clearRect(0, 0, width, height)

      gridSegments.forEach(([first, second]) => {
        drawSegment(first, second, 'rgba(130,130,130,.08)', .6, undefined, 1, particleRotation)
      })
      particles.forEach((particle) => {
        project(particle, screenA, undefined, 1, particleRotation)
        context.beginPath()
        context.arc(screenA.x, screenA.y, .8, 0, Math.PI * 2)
        context.fillStyle = 'rgba(210,210,210,.3)'
        context.fill()
      })
      frameSegments.forEach(([first, second]) => {
        drawSegment(first, second, 'rgba(195,195,195,.3)', .8)
      })
      arms.forEach((arm) => drawBox(arm, time))

      coreTriangles.forEach((triangle) => {
        triangle.forEach((point, index) => project(point, projectedFace[index]))
        context.beginPath()
        context.moveTo(projectedFace[0].x, projectedFace[0].y)
        context.lineTo(projectedFace[1].x, projectedFace[1].y)
        context.lineTo(projectedFace[2].x, projectedFace[2].y)
        context.closePath()
        context.fillStyle = 'rgba(17,17,17,.92)'
        context.fill()
      })
      coreEdges.forEach(([first, second]) => {
        drawSegment(first, second, 'rgba(245,245,245,.64)', 1)
      })

      project(centerPoint, screenA)
      context.beginPath()
      context.arc(screenA.x, screenA.y, 3.1, 0, Math.PI * 2)
      context.fillStyle = '#fff'
      context.shadowColor = 'rgba(255,255,255,.7)'
      context.shadowBlur = 7
      context.fill()
      context.shadowBlur = 0

      frameId = window.requestAnimationFrame(animate)
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting && !document.hidden
      window.cancelAnimationFrame(frameId)
      if (isVisible) {
        startTime = performance.now()
        frameId = window.requestAnimationFrame(animate)
      }
    }, { threshold: .01 })
    const resizeObserver = new ResizeObserver(resize)
    const onVisibilityChange = () => {
      isVisible = !document.hidden && host.getBoundingClientRect().bottom > 0
      window.cancelAnimationFrame(frameId)
      if (isVisible) {
        startTime = performance.now()
        frameId = window.requestAnimationFrame(animate)
      }
    }

    resize()
    visibilityObserver.observe(host)
    resizeObserver.observe(host)
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    frameId = window.requestAnimationFrame(animate)

    return () => {
      isVisible = false
      window.cancelAnimationFrame(frameId)
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      coreGeometry.dispose()
      coreEdgesGeometry.dispose()
      canvas.remove()
    }
  }, [])

  return <div className="hero-three" ref={hostRef} aria-hidden="true" />
}
