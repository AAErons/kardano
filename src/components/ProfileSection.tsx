
import { useState, useEffect } from 'react'
import RegistrationModal from './RegistrationModal.js'
import UserProfile from './UserProfile.js'
import AdminProfile from './AdminProfile.js'
import TeacherProfile from './TeacherProfile.js'

type Role = 'admin' | 'worker' | 'user' | null

interface Review {
	id: number
	studentName: string
	rating: number
	comment: string
	date: string
}

interface Appointment {
	id: number
	workerId: number
	workerName: string
	userName: string
	date: string // YYYY-MM-DD
	time: string // HH:mm
	duration: number
	subject: string
	status: 'scheduled' | 'completed' | 'blocked'
	note?: string
}

interface Worker {
	id: number
	name: string
	subject: string
	description: string
	image: string
	rating: number
	reviews: Review[]
	appointments: Appointment[]
}

// const createInitialWorkers = (): Worker[] => {
	const now = new Date()
	const year = now.getFullYear()
	const month = String(now.getMonth() + 1).padStart(2, '0')
	const mkDate = (d: number) => `${year}-${month}-${String(d).padStart(2, '0')}`
	const workers: Worker[] = [
		{
			id: 2,
			name: 'Mārcis Bajaruns',
			subject: 'Matemātika (1-9. klase)',
			description: 'Eksperts pamatskolas matemātikā. Palīdzu izveidot spēcīgu pamatu un pozitīvu attieksmi pret mācībām.',
			image: '/images/tutors/marcis.jpeg',
			rating: 4.8,
			reviews: [
				{ id: 3, studentName: 'Jānis Liepiņš', rating: 5, comment: 'Meita tagad mīl matemātiku.', date: '2024-02' },
				{ id: 4, studentName: 'Elīna Zvaigzne', rating: 4, comment: 'Daļskaitļi vairs nesagādā grūtības.', date: '2023-11' },
			],
			appointments: [
				{ id: 3, workerId: 2, workerName: 'Mārcis Bajaruns', userName: 'Toms', date: mkDate(8), time: '15:00', duration: 60, subject: 'Daļskaitļi', status: 'scheduled' },
				{ id: 6, workerId: 2, workerName: 'Mārcis Bajaruns', userName: 'Līga', date: mkDate(22), time: '10:00', duration: 60, subject: 'Saskaitīšana', status: 'scheduled' },
				{ id: 9, workerId: 2, workerName: 'Mārcis Bajaruns', userName: 'Renārs', date: mkDate(6), time: '11:00', duration: 60, subject: 'Reizināšana', status: 'completed' },
				{ id: 10, workerId: 2, workerName: 'Mārcis Bajaruns', userName: 'Alise', date: mkDate(15), time: '13:00', duration: 60, subject: 'Dalīšana', status: 'scheduled' },
				// Same-day multi-appointment scenario on day 16 (overlapping with other tutors)
				{ id: 16, workerId: 2, workerName: 'Mārcis Bajaruns', userName: 'Niks', date: mkDate(16), time: '10:00', duration: 60, subject: 'Daļskaitļi', status: 'scheduled' },
				{ id: 17, workerId: 2, workerName: 'Mārcis Bajaruns', userName: 'Dora', date: mkDate(16), time: '14:00', duration: 90, subject: 'Ģeometrija', status: 'scheduled' },
			],
		},
		{
			id: 3,
			name: 'Mārtiņš Mārcis Gailītis',
			subject: 'Iestājeksāmenu sagatavošana',
			description: 'Specializējos iestājeksāmenu sagatavošanā. Strukturēti treniņi un mērķtiecīga pieeja.',
			image: '/images/tutors/martins.jpeg',
			rating: 5.0,
			reviews: [
				{ id: 5, studentName: 'Kristīne Jansone', rating: 5, comment: 'Iestājos RTU IZV!', date: '2024-03' },
				{ id: 6, studentName: 'Roberts Krūmiņš', rating: 5, comment: 'Augsti rezultāti visos eksāmenos.', date: '2023-06' },
			],
			appointments: [
				{ id: 4, workerId: 3, workerName: 'Mārtiņš Mārcis Gailītis', userName: 'Laura', date: mkDate(16), time: '10:00', duration: 90, subject: 'Sagatavošana', status: 'scheduled' },
				{ id: 5, workerId: 3, workerName: 'Mārtiņš Mārcis Gailītis', userName: 'Rihards', date: mkDate(20), time: '14:00', duration: 90, subject: 'Treniņš', status: 'completed' },
				{ id: 11, workerId: 3, workerName: 'Mārtiņš Mārcis Gailītis', userName: 'Eva', date: mkDate(4), time: '08:00', duration: 60, subject: 'Kombinatorika', status: 'scheduled' },
				{ id: 12, workerId: 3, workerName: 'Mārtiņš Mārcis Gailītis', userName: 'Dāvis', date: mkDate(27), time: '11:00', duration: 120, subject: 'Varbūtība', status: 'scheduled' },
				// Additional appointment on same day to enrich the view
				{ id: 18, workerId: 3, workerName: 'Mārtiņš Mārcis Gailītis', userName: 'Marta', date: mkDate(16), time: '12:30', duration: 60, subject: 'Atkārtošana', status: 'scheduled' },
			],
		},
	]

	// Add a blocked (free time) slot per day, avoiding overlaps with existing appointments
	const daysInMonth = new Date(year, now.getMonth() + 1, 0).getDate()
	const times = ['08:00', '09:30', '11:00', '12:30', '14:00', '15:30', '17:00']
	const durations = [30, 60, 90]
	const toMinutes = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
	const overlaps = (startA: number, durA: number, startB: number, durB: number) => {
		const endA = startA + durA
		const endB = startB + durB
		return startA < endB && startB < endA
	}
	for (let day = 1; day <= daysInMonth; day++) {
		const tutorIndex = (day - 1) % workers.length
		const candidateDuration = durations[day % durations.length]
		const date = mkDate(day)
		const worker = workers[tutorIndex]
		const existing = worker.appointments.filter(a => a.date === date)

		let chosenTime: string | null = null
		for (let i = 0; i < times.length; i++) {
			const t = times[(day + i) % times.length]
			const start = toMinutes(t)
			const conflict = existing.some(a => overlaps(start, candidateDuration, toMinutes(a.time), a.duration))
			if (!conflict) { chosenTime = t; break }
		}

		if (!chosenTime) continue

		worker.appointments.push({
			id: 1000 + day,
			workerId: worker.id,
			workerName: worker.name,
			userName: '—',
			date,
			time: chosenTime,
			duration: candidateDuration,
			subject: 'Brīvs/Atvaļinājums',
			status: 'blocked',
			note: 'Mock brīvs'
		})
	}

// return workers
// }

const ProfileSection = () => {
	const [role, setRole] = useState<Role>(null)
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [authError, setAuthError] = useState('')
	const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)

	const [userId, setUserId] = useState<string | null>(null)
	const [isWorkerActive, setIsWorkerActive] = useState<boolean | null>(null)

	useEffect(() => {
		// Load persisted auth
		try {
			const raw = localStorage.getItem('auth')
			if (raw) {
				const saved = JSON.parse(raw)
				if (saved && (saved.role === 'admin' || saved.role === 'worker' || saved.role === 'user')) {
					setRole(saved.role)
					if (saved.userId) setUserId(saved.userId)
					if (typeof saved.active === 'boolean') setIsWorkerActive(saved.active)
				}
			}
		} catch {}

		// Prefill login identifier from URL and handle open parameters
		try {
			const params = new URLSearchParams(window.location.search)
			const prefill = params.get('prefill')
			if (prefill) setUsername(prefill)
			
			const open = params.get('open')
			if (open === 'register') {
				setIsRegistrationOpen(true)
			}
		} catch {}
	}, [])

	useEffect(() => {}, [role, userId])


	const handleLogin = async () => {
		try {
			setAuthError('')
			const r = await fetch('/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: username, username, password })
			})
			if (!r.ok) {
				const e = await r.json().catch(() => ({}))
				setAuthError(e.error || 'Neizdevās pieteikties')
				return
			}
			const data = await r.json().catch(() => ({}))
			setRole((data?.role as Role) || 'user')
			setUserId(data?.userId || null)
			if (typeof data?.active === 'boolean') setIsWorkerActive(data.active)
			try { localStorage.setItem('auth', JSON.stringify({ role: (data?.role as Role) || 'user', userId: data?.userId, active: data?.active })) } catch {}
		} catch (e) {
			setAuthError('Neizdevās pieteikties')
		}
	}

	const handleLogout = async () => {
		try { localStorage.removeItem('auth') } catch {}
		setRole(null)
		setUsername('')
		setPassword('')
		setAuthError('')
	}

	const handleRegistrationSuccess = () => {
		setAuthError('')
		alert('Reģistrācija veiksmīga! Tagad varat pieslēgties ar saviem datiem.')
	}


	return (
		<div className="min-h-screen bg-gray-50 py-8 lg:py-16 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="flex items-center justify-between gap-2 mb-6 lg:mb-10">
					<h1 className="text-3xl lg:text-5xl font-bold text-black">
						MANS <span className="bg-yellow-400 px-2 lg:px-4 py-1 lg:py-2 rounded-lg">PROFILS</span>
					</h1>
					{role && (
						<button onClick={handleLogout} className="border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-400 hover:text-black font-bold py-2 px-4 rounded-lg transition-colors">
							Izrakstīties
						</button>
					)}
				</div>

				{/* Worker profile info - removed mock data */}

				{/* User profile info - removed mock data */}

				{!role && (
					<div className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
						<h2 className="text-xl lg:text-2xl font-bold text-black mb-4">Pieslēgties</h2>
						<div className="space-y-3 sm:space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">E-pasts vai lietotājvārds</label>
								<input value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="epasts@example.com vai lietotājvārds" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Parole</label>
								<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="••••••" />
							</div>
							{authError && <div className="text-red-600 text-sm">{authError}</div>}
							<button onClick={handleLogin} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-colors">Pieslēgties</button>
							
							{/* Registration Link */}
							<div className="text-center pt-4 border-t border-gray-200">
								<p className="text-gray-600 text-sm mb-2">Nav konta?</p>
								<button 
									onClick={() => setIsRegistrationOpen(true)}
									className="text-yellow-600 hover:text-yellow-700 font-medium text-sm underline"
								>
									Reģistrēties
								</button>
							</div>
						</div>
					</div>
				)}

				{role === 'admin' && (
					<AdminProfile />
				)}


				{role === 'user' && userId && (
					<UserProfile userId={userId} />
				)}

				{role === 'worker' && userId && (
					<TeacherProfile userId={userId} isActive={Boolean(isWorkerActive)} />
				)}
			</div>

			{/* Registration Modal */}
			<RegistrationModal 
				isOpen={isRegistrationOpen}
				onClose={() => setIsRegistrationOpen(false)}
				onSuccess={handleRegistrationSuccess}
			/>
		</div>
	)
}

export default ProfileSection
