import { motion } from 'framer-motion'
import type { AnimationEvent } from 'react'
import type { IntroContent } from './introContent'

export function Crawl({ content, onComplete }: { content: IntroContent; onComplete: () => void }) {
  const handleAnimationEnd = (e: AnimationEvent<HTMLDivElement>) => {
    if (e.animationName === 'intro-crawl-scroll') onComplete()
  }

  return (
    <div className="absolute inset-0 z-10">
      <motion.p
        className="absolute left-1/2 top-[28%] w-full -translate-x-1/2 px-6 text-center text-lg text-accent sm:text-xl"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 1, 0] }}
        transition={{ duration: 4, times: [0, 0.2, 0.75, 1], ease: 'easeInOut' }}
      >
        {content.openingLine}
      </motion.p>

      <div className="intro-crawl-viewport">
        <div className="intro-crawl" data-testid="intro-crawl" onAnimationEnd={handleAnimationEnd}>
          <h1 className="mb-8 text-center text-4xl font-bold tracking-wide text-accent sm:text-6xl">
            {content.title}
          </h1>
          {content.paragraphs.map((p, i) => (
            <p key={i} className="mb-6 text-justify text-xl leading-relaxed text-accent sm:text-2xl">
              {p}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
