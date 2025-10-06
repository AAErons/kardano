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
	const [openRegisterOnProfile, setOpenRegisterOnProfile] = useState(false)
	const [calendarTeacherPref, setCalendarTeacherPref] = useState<string>('')

	useEffect(() => {
		try {
			const params = new URLSearchParams(window.location.search)
			const open = params.get('open')
			if (open === 'calendar') {
				const t = params.get('teacher')
				if (t) setCalendarTeacherPref(t)
				setActiveSection('calendar')
			} else if (open === 'login' || open === 'register' || params.has('invite')) {
				setActiveSection('profile')
				if (open === 'register' || params.has('invite')) setOpenRegisterOnProfile(true)
			}
		} catch {}
	}, [])

	return (
		<div className="min-h-screen bg-white">
			<Header activeSection={activeSection} setActiveSection={setActiveSection} />
			
			{activeSection === 'home' && <LandingPage go={(section: 'home' | 'lessons' | 'tutors' | 'calendar' | 'profile') => setActiveSection(section)} />}
			{activeSection === 'lessons' && <LessonsSection />}
			{activeSection === 'tutors' && <TutorsSection />}
			{activeSection === 'calendar' && <CalendarSection initialTeacherId={calendarTeacherPref} />}
			{activeSection === 'profile' && (
				<ProfileSection 
					openRegisterFromUrl={openRegisterOnProfile}
					onConsumedOpenRegister={() => setOpenRegisterOnProfile(false)}
				/>
			)}
			
			<Footer />
		</div>
	)
}

export default App
