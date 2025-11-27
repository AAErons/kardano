import { useEffect, useState } from 'react'
import Header from './components/Header.js'
import LandingPage from './components/LandingPage.js'
import TutorsSection from './components/TutorsSection.js'
import CalendarSection from './components/CalendarSection.js'
import Footer from './components/Footer.js'
import ProfileSection from './components/ProfileSection.js'
import LessonsSection from './components/LessonsSection.js'
import HelpWidget from './components/HelpWidget.js'

function App() {
	const [activeSection, setActiveSection] = useState<'home' | 'lessons' | 'tutors' | 'calendar' | 'profile'>('home')
	const [openRegisterOnProfile, setOpenRegisterOnProfile] = useState(false)
	const [calendarTeacherPref, setCalendarTeacherPref] = useState<string>('')
	const [calendarLessonTypeFilter, setCalendarLessonTypeFilter] = useState<'individual' | 'group' | ''>('')
	const [verificationMessage, setVerificationMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
	const [isVerifying, setIsVerifying] = useState(false)

	useEffect(() => {
		try {
			const params = new URLSearchParams(window.location.search)
			const open = params.get('open')
			const verifyToken = params.get('verify')
			
			// Handle email verification
			if (verifyToken) {
				setActiveSection('profile')
				setIsVerifying(true)
				
				fetch('/api/verify-email', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ token: verifyToken })
				})
				.then(r => r.json())
				.then(data => {
					if (data.success) {
						setVerificationMessage({ type: 'success', message: data.message })
					} else {
						setVerificationMessage({ type: 'error', message: data.error || 'Verification failed' })
					}
				})
				.catch(() => {
					setVerificationMessage({ type: 'error', message: 'Neizdevās verificēt e-pastu. Lūdzu mēģiniet vēlreiz.' })
				})
				.finally(() => {
					setIsVerifying(false)
					// Clean URL
					window.history.replaceState({}, '', '/?open=login')
				})
				return
			}
			
		if (open === 'calendar') {
			const t = params.get('teacher')
			if (t) setCalendarTeacherPref(t)
			setActiveSection('calendar')
		} else if (open === 'login' || open === 'register') {
			setActiveSection('profile')
			if (open === 'register') setOpenRegisterOnProfile(true)
		}
		} catch {}
	}, [])

	const handleBookingClick = (lessonType: 'individual' | 'group') => {
		setCalendarLessonTypeFilter(lessonType)
		setActiveSection('calendar')
	}

	return (
		<div className="min-h-screen bg-white">
			<Header activeSection={activeSection} setActiveSection={setActiveSection} />
			
		{activeSection === 'home' && <LandingPage go={(section: 'home' | 'lessons' | 'tutors' | 'calendar' | 'profile') => setActiveSection(section)} />}
		{activeSection === 'lessons' && <LessonsSection onBookingClick={handleBookingClick} />}
		{activeSection === 'tutors' && <TutorsSection />}
		{activeSection === 'calendar' && <CalendarSection initialTeacherId={calendarTeacherPref} initialLessonTypeFilter={calendarLessonTypeFilter} />}
		{activeSection === 'profile' && (
				<ProfileSection 
					openRegisterFromUrl={openRegisterOnProfile}
					onConsumedOpenRegister={() => setOpenRegisterOnProfile(false)}
					verificationMessage={verificationMessage}
					isVerifying={isVerifying}
					onClearVerificationMessage={() => setVerificationMessage(null)}
				/>
			)}
		
		<Footer />
		
		{/* Floating Help Widget - visible on all pages */}
		<HelpWidget />
	</div>
)
}

export default App
