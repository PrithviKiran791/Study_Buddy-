import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  MessageSquare,
  FileText,
  Search,
  Image,
  Calendar,
  ArrowRight,
  Github,
  Brain,
  Layers,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { Button } from '@/components/ui/button'
import AnimatedButton from '@/components/ui/animated-button'
import FoldText from '@/components/ui/FoldText'
import BorderGlow from '@/components/ui/BorderGlow'
import { LoaderOne } from '@/components/ui/loader'
import { useState, useEffect } from 'react'

export default function Home() {
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 600)
    return () => clearTimeout(timer)
  }, [])

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center font-google-sans">
        <LoaderOne className="scale-150" />
        <span className="mt-6 text-xs font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
          Loading Study Assistant...
        </span>
      </div>
    )
  }

  const features = [
    {
      icon: MessageSquare,
      title: 'AI Tutor',
      description: 'Get instant answers to your questions with conversational AI',
      to: '/chatbot',
    },
    {
      icon: FileText,
      title: 'PDF Chat',
      description: 'Upload PDFs and chat with your documents using RAG technology',
      to: '/pdf-chat',
    },
    {
      icon: BookOpen,
      title: 'Smart Summarizer',
      description: 'Summarize text, URLs, and documents instantly',
      to: '/summarizer',
    },
    {
      icon: Search,
      title: 'Research Assistant',
      description: 'Generate comprehensive research reports on any topic',
      to: '/research',
    },
    {
      icon: Layers,
      title: 'Flashcards',
      description: 'Generate interactive flashcards for better memorization',
      to: '/flashcards',
    },
    {
      icon: Image,
      title: 'Visual QA',
      description: 'Ask questions about images, diagrams, and charts',
      to: '/visual-qa',
    },
    {
      icon: Calendar,
      title: 'Study Planner',
      description: 'Create personalized study plans with AI guidance',
      to: '/study-planner',
    },
  ]

  return (
    <div className="min-h-screen bg-background/80 backdrop-blur-[2px] relative">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="hero-glow" />

        <div className="relative mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mb-4 flex justify-center">
              <FoldText
                text="Knowledge unfolds"
                splitBy="char"
                hinge="top"
                trigger="mount"
                duration={0.65}
                stagger={0.045}
                ease="power3.out"
                perspective={700}
                creaseShading={0.55}
                fontSize={typeof window !== 'undefined' && window.innerWidth < 640 ? 44 : 64}
                fontWeight={800}
                color="currentColor"
                className="text-foreground tracking-tight"
              />
            </div>

            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
              Your Intelligent Study Assistant
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-lg font-light text-muted-foreground md:text-xl">
              AI-powered tools to help you learn faster, analyze textbooks, and ace your exams.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/chatbot">
                <AnimatedButton className="h-11 px-8 text-sm font-semibold shadow-md">
                  <span className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </AnimatedButton>
              </Link>
              <Button variant="outline" size="lg" asChild>
                <a href="#features">Explore Features</a>
              </Button>
            </div>

            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'AI Features', value: '7+' },
                { label: 'Instant Answers', value: '24/7' },
                { label: 'Languages', value: '100+' },
                { label: 'Free to Use', value: '100%' },
              ].map((stat) => (
                <BorderGlow
                  key={stat.label}
                  borderRadius={16}
                  glowRadius={30}
                  edgeSensitivity={25}
                  className="glass-card p-4"
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    {stat.label}
                  </div>
                </BorderGlow>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold tracking-tight">
            <FoldText
              text="Powerful AI Features"
              splitBy="char"
              hinge="top"
              trigger="scroll"
              duration={0.65}
              stagger={0.035}
              ease="power3.out"
              perspective={700}
              creaseShading={0.55}
              fontSize="inherit"
              fontWeight={700}
              color="currentColor"
              className="text-foreground"
            />
          </h2>
          <p className="text-muted-foreground">
            Everything you need to supercharge your learning journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.to}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
            >
              <Link to={feature.to} className="group block h-full">
                <BorderGlow
                  borderRadius={18}
                  glowRadius={36}
                  edgeSensitivity={28}
                  className="glass-card-hover flex h-full flex-col p-6"
                >
                  <div className="mb-4 rounded-xl bg-muted p-3 transition-transform group-hover:scale-105 w-fit">
                    <feature.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                  <p className="mb-6 flex-1 text-sm text-muted-foreground">{feature.description}</p>
                  <span className="flex items-center text-[10px] font-semibold uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-foreground">
                    Launch Tool
                    <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </BorderGlow>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <BorderGlow
            borderRadius={24}
            glowRadius={44}
            edgeSensitivity={30}
            className="glass-card p-8 text-center md:p-12"
          >
            <Brain className="mx-auto mb-6 h-12 w-12 text-foreground" />
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">Ready to Start Learning?</h2>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
              No sign up required. Start using Study Assistant right now and transform your learning experience.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/chatbot">
                <AnimatedButton className="h-11 px-8 text-sm font-semibold shadow-md">
                  <span className="flex items-center gap-2">
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </AnimatedButton>
              </Link>
              <Button variant="outline" size="lg" asChild>
                <Link to="/pdf-chat">Upload PDF</Link>
              </Button>
            </div>
          </BorderGlow>
        </motion.div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              © 2024 Study Assistant. All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
