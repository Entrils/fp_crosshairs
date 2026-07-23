import { useEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function MotionEffects({ galleryReady, cardCount }) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const context = gsap.context(() => {
      gsap.from('.site-header', { y: -72, opacity: 0, duration: 0.65, ease: 'power3.out' })
      gsap.from('.hero__copy > *:not(.hero-button)', {
        y: 28,
        opacity: 0,
        duration: 0.75,
        stagger: 0.09,
        delay: 0.16,
        ease: 'power3.out',
      })
      gsap.from('.hero-three', {
        scale: 0.88,
        opacity: 0,
        duration: 1.2,
        delay: 0.3,
        ease: 'expo.out',
      })
      gsap.to('.hero-three', {
        yPercent: 8,
        ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.7 },
      })

      document.querySelectorAll('.section-heading, .install-copy').forEach((element) => {
        gsap.from(element, {
          y: 34,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { trigger: element, start: 'top 84%', once: true },
        })
      })

      gsap.from('.steps > div', {
        y: 35,
        opacity: 0,
        duration: 0.62,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.steps', start: 'top 84%', once: true },
      })
    })

    return () => context.revert()
  }, [])

  useEffect(() => {
    if (!galleryReady || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const cards = gsap.utils.toArray('.cards-grid .card')
    gsap.set(cards, { opacity: 0, y: 28 })
    const triggers = ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (batch) => gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.07,
        ease: 'power3.out',
        overwrite: true,
      }),
    })
    ScrollTrigger.refresh()
    return () => {
      triggers.forEach((trigger) => trigger.kill())
      gsap.set(cards, { clearProps: 'opacity,transform' })
    }
  }, [galleryReady, cardCount])

  return null
}
