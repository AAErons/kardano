import { useEffect, useState } from 'react'
import Header from './components/Header.js'
import LandingPage from './components/LandingPage.js'
import TutorsSection from './components/TutorsSection.js'
import CalendarSection from './components/CalendarSection.js'
import Footer from './components/Footer.js'
import ProfileSection from './components/ProfileSection.js'
import LessonsSection from './components/LessonsSection.js'

function App() {
	const [activeSection, setActiveSection] = useState<'home' | 'lessons' | 'tutors' | 'calendar' | 'profile'>('home')

	useEffect(() => {
		try {
			const params = new URLSearchParams(window.location.search)
			const open = params.get('open')
			if (open === 'login' || open === 'register' || params.has('invite')) {
				setActiveSection('profile')
			}
		} catch {}
	}, [])

	return (
		<div className="min-h-screen bg-white">
			<Header activeSection={activeSection} setActiveSection={setActiveSection} />
			
			{activeSection === 'home' && <LandingPage go={(section: 'home' | 'lessons' | 'tutors' | 'calendar' | 'profile') => setActiveSection(section)} />}
			{activeSection === 'lessons' && <LessonsSection />}
			{activeSection === 'tutors' && <TutorsSection />}
			{activeSection === 'calendar' && <CalendarSection />}
			{activeSection === 'profile' && <ProfileSection />}
			
			<Footer />
		</div>
	)
}

export default App
