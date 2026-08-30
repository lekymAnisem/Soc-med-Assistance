import Hero from '../components/Hero/SplineHero'
import Introduction from '../components/Typography/Introduction'
import Projects from '../components/Projects/Projects'
import ExperimentSection from '../components/Experiment/ExperimentSection'
import Services from '../components/Services/Services'
import AISection from '../components/Typography/AISection'
import AIVisualLab from '../components/AIVisualLab/AIVisualLab'
import DigitalFuturesTwin from '../components/DigitalFuturesTwin/DigitalFuturesTwin'
import DigitalProducts from '../components/DigitalProducts/DigitalProducts'
import ThreeDCreatorStudio from '../components/ThreeDCreatorStudio/ThreeDCreatorStudio'
import MediaUpload from '../components/MediaUpload/MediaUpload'
import About from '../components/About/About'
import Contact from '../components/Contact/Contact'

export default function Home() {
  return (
    <main className="relative">
      <Hero />
      <Introduction />
      <Projects />
      <ExperimentSection />
      <Services />
      <AISection />
      <AIVisualLab />
      <DigitalFuturesTwin />
      <DigitalProducts />
      <ThreeDCreatorStudio />
      <MediaUpload />
      <About />
      <Contact />
    </main>
  )
}
