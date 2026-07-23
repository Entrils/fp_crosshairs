import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const addEdges = (mesh, color = 0xffffff, opacity = 0.5) => {
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(mesh.geometry),
    new THREE.LineBasicMaterial({ color, transparent: true, opacity }),
  )
  mesh.add(edges)
}

export default function HeroScene() {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40)
    camera.position.set(0, 0, 7.2)

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6))
    renderer.setClearColor(0x000000, 0)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9
    host.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xffffff, 1.1))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
    keyLight.position.set(4, 5, 7)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0x888888, 1.2)
    rimLight.position.set(-4, -2, 3)
    scene.add(rimLight)

    const assembly = new THREE.Group()
    assembly.rotation.x = -0.08
    scene.add(assembly)

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: 0x111111,
      roughness: 0.68,
      metalness: 0.28,
    })
    const core = new THREE.Mesh(new THREE.DodecahedronGeometry(0.68, 0), coreMaterial)
    addEdges(core, 0xf4f4f4, 0.62)
    assembly.add(core)

    const center = new THREE.Mesh(
      new THREE.SphereGeometry(0.075, 20, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    )
    center.position.z = 0.72
    assembly.add(center)

    const armGeometryHorizontal = new THREE.BoxGeometry(0.72, 0.11, 0.14)
    const armGeometryVertical = new THREE.BoxGeometry(0.11, 0.72, 0.14)
    const lightArmMaterial = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.75, metalness: 0.08 })
    const darkArmMaterial = new THREE.MeshStandardMaterial({ color: 0x303030, roughness: 0.7, metalness: 0.2 })
    const armSpecs = [
      { geometry: armGeometryHorizontal, position: [1.25, 0, 0], material: lightArmMaterial },
      { geometry: armGeometryHorizontal, position: [-1.25, 0, 0], material: darkArmMaterial },
      { geometry: armGeometryVertical, position: [0, 1.25, 0], material: darkArmMaterial },
      { geometry: armGeometryVertical, position: [0, -1.25, 0], material: lightArmMaterial },
    ]
    const arms = armSpecs.map((spec, index) => {
      const arm = new THREE.Mesh(spec.geometry, spec.material)
      arm.position.set(...spec.position)
      arm.userData.base = new THREE.Vector3(...spec.position)
      arm.userData.phase = index * Math.PI * 0.5
      addEdges(arm, 0xffffff, spec.material === lightArmMaterial ? 0.3 : 0.55)
      assembly.add(arm)
      return arm
    })

    const framePositions = [
      -2.15, 1.55, 0, -1.55, 1.55, 0, -2.15, 1.55, 0, -2.15, 0.95, 0,
      2.15, 1.55, 0, 1.55, 1.55, 0, 2.15, 1.55, 0, 2.15, 0.95, 0,
      -2.15, -1.55, 0, -1.55, -1.55, 0, -2.15, -1.55, 0, -2.15, -0.95, 0,
      2.15, -1.55, 0, 1.55, -1.55, 0, 2.15, -1.55, 0, 2.15, -0.95, 0,
    ]
    const frameGeometry = new THREE.BufferGeometry()
    frameGeometry.setAttribute('position', new THREE.Float32BufferAttribute(framePositions, 3))
    const frame = new THREE.LineSegments(
      frameGeometry,
      new THREE.LineBasicMaterial({ color: 0xbcbcbc, transparent: true, opacity: 0.28 }),
    )
    assembly.add(frame)

    const backGrid = new THREE.GridHelper(12, 24, 0x444444, 0x222222)
    backGrid.rotation.x = Math.PI / 2
    backGrid.position.z = -2.7
    backGrid.material.transparent = true
    backGrid.material.opacity = 0.32
    scene.add(backGrid)

    const particleCount = window.innerWidth < 700 ? 45 : 90
    const positions = new Float32Array(particleCount * 3)
    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3
      positions[offset] = (Math.random() - 0.5) * 9
      positions[offset + 1] = (Math.random() - 0.5) * 6
      positions[offset + 2] = (Math.random() - 0.5) * 4 - 0.8
    }
    const particleGeometry = new THREE.BufferGeometry()
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xaaaaaa,
      size: 0.014,
      transparent: true,
      opacity: 0.36,
      sizeAttenuation: true,
    })
    const particles = new THREE.Points(particleGeometry, particleMaterial)
    scene.add(particles)

    let pointerX = 0
    let pointerY = 0
    let frameId = 0
    let isVisible = true
    const clock = new THREE.Clock()

    const resize = () => {
      const { width, height } = host.getBoundingClientRect()
      renderer.setSize(width, height, false)
      camera.aspect = width / Math.max(height, 1)
      camera.updateProjectionMatrix()
    }
    const move = (event) => {
      pointerX = (event.clientX / window.innerWidth - 0.5) * 0.24
      pointerY = (event.clientY / window.innerHeight - 0.5) * 0.18
    }
    const animate = () => {
      if (!isVisible) return
      const time = clock.getElapsedTime()
      assembly.rotation.y += (pointerX + Math.sin(time * 0.22) * 0.09 - assembly.rotation.y) * 0.025
      assembly.rotation.x += (-pointerY - 0.08 - assembly.rotation.x) * 0.025
      assembly.position.y = Math.sin(time * 0.55) * 0.055
      core.rotation.x = time * 0.07
      core.rotation.y = time * -0.09
      frame.scale.setScalar(1 + Math.sin(time * 0.48) * 0.008)
      arms.forEach((arm) => {
        const distance = 1 + Math.sin(time * 0.72 + arm.userData.phase) * 0.035
        arm.position.copy(arm.userData.base).multiplyScalar(distance)
      })
      particles.rotation.y = time * 0.008
      camera.position.x += (pointerX * 0.6 - camera.position.x) * 0.018
      camera.position.y += (-pointerY * 0.45 - camera.position.y) * 0.018
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting && !document.hidden
      window.cancelAnimationFrame(frameId)
      if (isVisible) animate()
    }, { threshold: 0.01 })
    const resizeObserver = new ResizeObserver(resize)
    const onVisibilityChange = () => {
      isVisible = !document.hidden && host.getBoundingClientRect().bottom > 0
      window.cancelAnimationFrame(frameId)
      if (isVisible) animate()
    }

    resize()
    visibilityObserver.observe(host)
    resizeObserver.observe(host)
    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('visibilitychange', onVisibilityChange)
    animate()

    return () => {
      isVisible = false
      window.cancelAnimationFrame(frameId)
      visibilityObserver.disconnect()
      resizeObserver.disconnect()
      window.removeEventListener('pointermove', move)
      document.removeEventListener('visibilitychange', onVisibilityChange)
      scene.traverse((object) => {
        object.geometry?.dispose()
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose())
        else object.material?.dispose()
      })
      armGeometryHorizontal.dispose()
      armGeometryVertical.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [])

  return <div className="hero-three" ref={hostRef} aria-hidden="true" />
}
