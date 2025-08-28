import { useState } from 'react'
import Header from './components/Header'
import LandingPage from './components/LandingPage'
import TutorsSection from './components/TutorsSection'
import CalendarSection from './components/CalendarSection'
import Footer from './components/Footer'
import ProfileSection from './components/ProfileSection'
import LessonsSection from './components/LessonsSection'

function App() {
	const [activeSection, setActiveSection] = useState('home')

	return (
		<div className="min-h-screen bg-white">
			<Header activeSection={activeSection} setActiveSection={setActiveSection} />
			
			{activeSection === 'home' && <LandingPage go={(section) => setActiveSection(section)} />}
			{activeSection === 'lessons' && <LessonsSection />}
			{activeSection === 'tutors' && <TutorsSection />}
			{activeSection === 'calendar' && <CalendarSection />}
			{activeSection === 'profile' && <ProfileSection />}
			
			<Footer />
		</div>
	)
}

export default App
