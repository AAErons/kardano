import { useMemo, useState, useEffect } from 'react'
import RegistrationModal from './RegistrationModal.js'

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

const createInitialWorkers = (): Worker[] => {
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

	return workers
}

const initialWorkersData: Worker[] = createInitialWorkers()

const createMockUserAppointments = (workers: Worker[]): Appointment[] => {
	const now = new Date()
	const format = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
	const addDays = (days: number) => {
		const d = new Date(now)
		d.setDate(d.getDate() + days)
		return d
	}
	const w1 = workers[0]
	const w2 = workers[1] || workers[0]
	return [
		{ id: 2001, workerId: w1.id, workerName: w1.name, userName: 'Es', date: format(addDays(2)), time: '15:00', duration: 60, subject: 'Algebra', status: 'scheduled' },
		{ id: 2002, workerId: w2.id, workerName: w2.name, userName: 'Es', date: format(addDays(5)), time: '11:30', duration: 90, subject: 'Ģeometrija', status: 'scheduled' },
		{ id: 2003, workerId: w1.id, workerName: w1.name, userName: 'Es', date: format(addDays(-3)), time: '10:00', duration: 60, subject: 'Trijstūri', status: 'completed' },
		{ id: 2004, workerId: w2.id, workerName: w2.name, userName: 'Es', date: format(addDays(-10)), time: '14:00', duration: 60, subject: 'Daļskaitļi', status: 'completed' },
	]
}

let nextAppointmentId = 100

const ProfileSection = () => {
	const [role, setRole] = useState<Role>(null)
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [authError, setAuthError] = useState('')
	const [isRegistrationOpen, setIsRegistrationOpen] = useState(false)

	const [workers, setWorkers] = useState<Worker[]>(initialWorkersData)
	const [loggedInWorkerId, setLoggedInWorkerId] = useState<number | null>(null)
	const [userAppointments, setUserAppointments] = useState<Appointment[]>(createMockUserAppointments(initialWorkersData))
	const [userId, setUserId] = useState<string | null>(null)
	const [isWorkerActive, setIsWorkerActive] = useState<boolean | null>(null)
	const [teacherProfile, setTeacherProfile] = useState<any | null>(null)
	const [isLoadingProfile, setIsLoadingProfile] = useState(false)
	const [isEditingProfile, setIsEditingProfile] = useState(false)
	const [teacherName, setTeacherName] = useState<string | null>(null)

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

	useEffect(() => {
		// Reset profile state when auth context changes
		setTeacherProfile(null)
		setTeacherName(null)
		setIsLoadingProfile(false)
		// For workers, check if teacher profile exists
		if (role === 'worker' && userId) {
			setIsLoadingProfile(true)
			fetch(`/api/teacher-profile?userId=${encodeURIComponent(userId)}`).then(r => r.json()).then(d => {
				if (d && d.profile) setTeacherProfile(d.profile)
				else setTeacherProfile(null)
				setIsLoadingProfile(false)
			}).catch(() => {
				setTeacherProfile(null)
				setIsLoadingProfile(false)
			})
			// fetch teacher display name from users list
			fetch('/api/teachers').then(r => r.json()).then(d => {
				if (d && Array.isArray(d.items)) {
					const me = d.items.find((t: any) => t.id === userId)
					if (me && me.name) setTeacherName(me.name)
				}
			}).catch(() => {})
		}
	}, [role, userId])

	const loggedInWorker = useMemo(() => {
		return workers.find(w => w.id === loggedInWorkerId) || null
	}, [workers, loggedInWorkerId])

	// Worker stats for quick profile summary
	const workerScheduledCount = useMemo(() => {
		if (!loggedInWorker) return 0
		return loggedInWorker.appointments.filter(a => a.status === 'scheduled').length
	}, [loggedInWorker])

	const workerCompletedCount = useMemo(() => {
		if (!loggedInWorker) return 0
		return loggedInWorker.appointments.filter(a => a.status === 'completed').length
	}, [loggedInWorker])

	// User upcoming info for quick profile summary
	const userUpcomingAppointments = useMemo(() => {
		const nowTs = Date.now()
		return userAppointments
			.filter(a => a.status !== 'completed' && new Date(`${a.date}T${a.time}:00`).getTime() >= nowTs)
			.sort((a, b) => new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime())
	}, [userAppointments])

	const userUpcomingCount = userUpcomingAppointments.length
	const nextUserAppointment = userUpcomingAppointments[0] || null

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
			setLoggedInWorkerId(null)
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

	const bookAppointment = (data: { workerId: number; userName: string; date: string; time: string; duration: number; subject: string }) => {
		const worker = workers.find(w => w.id === data.workerId)
		if (!worker) return
		const appointment: Appointment = {
			id: nextAppointmentId++,
			workerId: worker.id,
			workerName: worker.name,
			userName: data.userName,
			date: data.date,
			time: data.time,
			duration: data.duration,
			subject: data.subject,
			status: 'scheduled',
		}
		setWorkers(prev => prev.map(w => (w.id === worker.id ? { ...w, appointments: [...w.appointments, appointment] } : w)))
		setUserAppointments(prev => [...prev, appointment])
	}

	const addReview = (data: { workerId: number; studentName: string; rating: number; comment: string }) => {
		const now = new Date()
		const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
		const newReview: Review = {
			id: Math.floor(Math.random() * 1000000),
			studentName: data.studentName || 'Es',
			rating: data.rating,
			comment: data.comment,
			date: dateStr,
		}
		setWorkers(prev => prev.map(w => (w.id === data.workerId ? { ...w, reviews: [...w.reviews, newReview] } : w)))
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

				{/* Worker profile info */}
				{role === 'worker' && loggedInWorker && (
					<div className="mb-6 lg:mb-10">
					<div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6 flex items-start sm:items-center gap-4 lg:gap-6">
							<img src={loggedInWorker.image} alt={loggedInWorker.name} className="w-20 h-20 lg:w-24 lg:h-24 rounded-full object-cover border-2 border-yellow-200" />
							<div className="flex-1">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<div className="text-xl lg:text-2xl font-bold text-black">{loggedInWorker.name}</div>
										<div className="text-gray-600">{loggedInWorker.subject}</div>
									</div>
									<div className="text-yellow-600 font-semibold">★ {loggedInWorker.rating.toFixed(1)}</div>
								</div>
								<p className="text-sm lg:text-base text-gray-700 mt-2">{loggedInWorker.description}</p>
								<div className="mt-3 flex flex-wrap gap-2">
									<span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs lg:text-sm px-3 py-1 rounded-full">Plānoti: {workerScheduledCount}</span>
									<span className="bg-gray-50 border border-gray-200 text-gray-700 text-xs lg:text-sm px-3 py-1 rounded-full">Pabeigti: {workerCompletedCount}</span>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* User profile info */}
				{role === 'user' && (
					<div className="mb-6 lg:mb-10">
					<div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6 flex items-start sm:items-center gap-4 lg:gap-6">
							<div className="w-20 h-20 lg:w-24 lg:h-24 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 font-bold text-xl">ES</div>
							<div className="flex-1">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<div>
										<div className="text-xl lg:text-2xl font-bold text-black">Es</div>
										<div className="text-gray-600">Lietotājs</div>
									</div>
									<div className="text-gray-700 text-sm">{userUpcomingCount} gaidošie</div>
								</div>
								{nextUserAppointment && (
									<div className="mt-2 text-sm text-gray-700">
										Nākamais: {new Date(nextUserAppointment.date).toLocaleDateString('lv-LV')} {nextUserAppointment.time} • {nextUserAppointment.subject}
									</div>
								)}
							</div>
						</div>
					</div>
				)}

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
					<AdminPanel />
				)}

				{/* Temporarily hide WorkerDashboard (not defined)
				{role === 'worker' && loggedInWorker && (
					<WorkerDashboard worker={loggedInWorker} />
				)}
				*/}

				{role === 'user' && (
					<UserDashboard workers={workers} userAppointments={userAppointments} onBook={bookAppointment} onAddReview={addReview} />
				)}

				{role === 'worker' && userId && (
					<div className="mb-6 lg:mb-10">
						{isLoadingProfile ? (
							<div className="bg-white rounded-2xl shadow p-6">
								<div className="flex items-center justify-center py-8">
									<div className="text-gray-500">Ielādē profīlu...</div>
								</div>
							</div>
						) : teacherProfile && !isEditingProfile ? (
							<TeacherProfileView profile={{ ...teacherProfile, name: teacherName || teacherProfile.name }} isActive={Boolean(isWorkerActive)} onEdit={() => setIsEditingProfile(true)} />
						) : (
							<TeacherOnboarding userId={userId} displayName={teacherName || undefined} isActive={Boolean(isWorkerActive)} initialPhoto={teacherProfile?.photo} initialDescription={teacherProfile?.description} initialAvailability={teacherProfile?.availability || []} initialFirstName={teacherProfile?.firstName} initialLastName={teacherProfile?.lastName} onFinished={() => {
								// refresh profile after save
								fetch(`/api/teacher-profile?userId=${encodeURIComponent(userId)}`).then(r => r.json()).then(d => {
									if (d && d.profile) { setTeacherProfile(d.profile); setIsEditingProfile(false) }
								}).catch(() => {})
							}} />
						)}
					</div>
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

const UserDashboard = (_props: { workers: Worker[]; userAppointments: Appointment[]; onBook: (data: any) => void; onAddReview: (data: any) => void }) => {
	return null
}

const TeacherProfileView = ({ profile, isActive, onEdit }: { profile: any; isActive: boolean; onEdit: () => void }) => {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [selectedDay, setSelectedDay] = useState<number | null>(null)
	const [slots, setSlots] = useState<Array<any>>([])
	const teacherId = String(profile?.userId || profile?.id || '')

	useEffect(() => {
		const load = async () => {
			try {
				const r = await fetch('/api/time-slots')
				if (!r.ok) return
				const d = await r.json().catch(() => null)
				if (d && d.success && Array.isArray(d.timeSlots)) {
					const mine = d.timeSlots.filter((s: any) => String(s.teacherId) === teacherId)
					setSlots(mine)
				}
			} catch {}
		}
		if (teacherId) load()
	}, [teacherId])

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear()
		const month = date.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const daysInMonth = lastDay.getDate()
		const startingDay = (firstDay.getDay() + 6) % 7
		return { daysInMonth, startingDay }
	}

	const getSlotsForDate = (dateStr: string) => {
		return (slots || []).filter((s: any) => s?.date === dateStr)
	}

	const hasSlotsOn = (y: number, m: number, day: number) => {
		const ds = `${y}-${String(m + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
		return getSlotsForDate(ds).length > 0
	}

	const { daysInMonth, startingDay } = getDaysInMonth(selectedDate)

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow p-6 space-y-4">
				<div className="flex items-start gap-4">
					{profile.photo ? (
						<img src={profile.photo} alt="Foto" className="w-24 h-24 rounded-full object-cover border-2 border-yellow-200" />
					) : (
						<div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-yellow-200" />
					)}
					<div className="flex-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="font-semibold text-black mb-1">{profile.name || '—'}</div>
								<span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>{isActive ? 'Aktīvs' : 'Neaktīvs'}</span>
							</div>
							<button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={onEdit}>Labot profīlu</button>
						</div>
						<div className="text-sm text-gray-700 whitespace-pre-line">{profile.description || '—'}</div>
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">←</button>
						<div className="font-semibold text-black">{selectedDate.toLocaleString('lv-LV', { month: 'long' })} {selectedDate.getFullYear()}</div>
						<button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg">→</button>
					</div>
					<div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-600">
						{['P','O','T','C','Pk','S','Sv'].map((d,i) => <div key={i} className="py-1 font-medium">{d}</div>)}
					</div>
					<div className="grid grid-cols-7 gap-1">
						{Array.from({ length: startingDay }, (_, i) => <div key={`e-${i}`} className="h-10"></div>)}
						{Array.from({ length: daysInMonth }, (_, i) => {
							const day = i + 1
							const has = hasSlotsOn(selectedDate.getFullYear(), selectedDate.getMonth(), day)
							const isSel = selectedDay === day
							return (
								<div key={day} className={`h-10 border rounded ${isSel ? 'bg-yellow-400 text-black font-bold' : has ? 'bg-green-50 hover:bg-green-100' : 'bg-gray-50'}`} onClick={() => { setSelectedDay(day) }}>
									<div className="text-[11px] pt-1">{day}</div>
								</div>
							)
						})}
					</div>

					{selectedDay && (
						<div className="mt-2 border-t pt-3">
							{(() => {
								const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
								const items = getSlotsForDate(dateStr)
								if (!items.length) return <div className="text-sm text-gray-500">Šajā dienā nav pieejamu stundu</div>
								return (
									<div className="space-y-1">
										{items.map((s: any) => {
											const typeLabel = s?.lessonType === 'group' ? 'Grupu' : 'Individuāla'
											const locLabel = s?.location === 'teacher' ? 'Privāti' : 'Uz vietas'
											const modLabel = s?.modality === 'zoom' ? 'Zoom' : 'Klātienē'
											const bookedBy = s?.studentName || s?.userName || s?.bookedByName || null
											const isFree = Boolean(s?.available)
											return (
												<div key={s.id} className={`text-sm px-2 py-1 rounded border ${isFree ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'}`}>
													<div className="flex flex-wrap items-center gap-2">
														<span className="font-medium text-black mr-2">{s.time}</span>
														<span className="px-2 py-0.5 rounded-full border border-gray-200 text-gray-700">{typeLabel}</span>
														<span className="px-2 py-0.5 rounded-full border border-gray-200 text-gray-700">{locLabel}</span>
														<span className="px-2 py-0.5 rounded-full border border-gray-200 text-gray-700">{modLabel}</span>
														{isFree ? (
															<span className="ml-auto text-green-700">Pieejams</span>
														) : (
															<span className="ml-auto text-gray-700">Rezervēts{bookedBy ? ` – ${bookedBy}` : ''}</span>
														)}
													</div>
												</div>
											)
										})}
									</div>
								)
							})()}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default ProfileSection

const AdminPanel = () => {
	const [tab, setTab] = useState<'calendar' | 'teachers' | 'students' | 'notifications'>('calendar')
	const [unreadCount, setUnreadCount] = useState(0)

	useEffect(() => {
		// initialize from cache to avoid empty flash
		try {
			const raw = localStorage.getItem('cache_admin_notifications_v1')
			if (raw) {
				const cached = JSON.parse(raw)
				if (cached && Array.isArray(cached.items)) {
					setUnreadCount(cached.items.filter((n: any) => n.unread !== false).length)
				}
			}
		} catch {}

		// poll notifications count lightly
		let timer: any
		const load = async () => {
			try {
				const r = await fetch('/api/notifications?recipientRole=admin')
				if (!r.ok) return
				const d = await r.json()
				if (d && Array.isArray(d.items)) {
					setUnreadCount(d.items.filter((n: any) => n.unread !== false).length)
				}
			} catch {}
		}
		load()
		timer = setInterval(load, 15000)
		return () => timer && clearInterval(timer)
	}, [])
	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow-xl p-2">
			<div className="flex gap-2">
					<button onClick={() => setTab('calendar')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'calendar' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Kalendārs</button>
					<button onClick={() => setTab('teachers')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'teachers' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Pasniedzēji</button>
					<button onClick={() => setTab('students')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'students' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Skolēni</button>
					<button onClick={() => setTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'notifications' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
						Paziņojumi {unreadCount > 0 && <span className="ml-2 inline-block text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{unreadCount}</span>}
					</button>
			</div>
			</div>
			{tab === 'calendar' && (
				<div className="bg-white rounded-2xl shadow-xl p-6">
					<div className="text-gray-600">Kalendārs (admins) – šeit varēsim rādīt kopskatu vai filtrēt pēc pasniedzēja. Pašlaik tukšs.</div>
								</div>
							)}
			{tab === 'teachers' && <AdminTeachers />}
			{tab === 'students' && <AdminStudents />}
			{tab === 'notifications' && <AdminNotifications onCountChange={setUnreadCount} />}
							</div>
						)
}

const AdminStudents = () => {
	const [students, setStudents] = useState<Array<{
		id: string
		userId: string
		firstName: string
		lastName: string
		age: number | null
		grade: string | null
		school: string | null
		isSelf: boolean
		createdAt: string
	}>>([])
	const [users, setUsers] = useState<Record<string, {
		firstName: string
		lastName: string
		email: string
		accountType: string
	}>>({})
	const [loading, setLoading] = useState(true)
	const [lastLoadTime, setLastLoadTime] = useState<number>(0)

	// Load students data
	const loadStudents = async (forceRefresh = false) => {
		try {
			// Check cache first (unless force refresh)
			if (!forceRefresh) {
				try {
					const cached = localStorage.getItem('cache_admin_students_v1')
					if (cached) {
						const { students: cachedStudents, users: cachedUsers, timestamp } = JSON.parse(cached)
						// Use cache if less than 5 minutes old
						if (timestamp && Date.now() - timestamp < 5 * 60 * 1000) {
							setStudents(cachedStudents || [])
							setUsers(cachedUsers || {})
							setLoading(false)
							setLastLoadTime(timestamp)
							return
						}
					}
				} catch (e) {
					console.warn('Failed to load cached students:', e)
				}
			}

			// Load all students
			const studentsResponse = await fetch('/api/students?userId=all')
			if (studentsResponse.ok) {
				const studentsData = await studentsResponse.json()
				if (studentsData.success && studentsData.students) {
					setStudents(studentsData.students)
					
					// Load user info for each unique userId
					const userIds = [...new Set(studentsData.students.map((s: any) => s.userId))] as string[]
					const userPromises = userIds.map(async (userId: string) => {
						try {
							const userResponse = await fetch(`/api/user-info?userId=${userId}`)
							if (userResponse.ok) {
								const userData = await userResponse.json()
								if (userData.success && userData.user) {
									return { userId, user: userData.user }
								}
							}
						} catch (error) {
							console.warn('Failed to load user info for', userId)
						}
						return null
					})
					
					const userResults = await Promise.all(userPromises)
					const userMap: Record<string, any> = {}
					userResults.forEach(result => {
						if (result) {
							userMap[result.userId] = result.user
						}
					})
					setUsers(userMap)

					// Cache the results
					const timestamp = Date.now()
					try {
						localStorage.setItem('cache_admin_students_v1', JSON.stringify({
							students: studentsData.students,
							users: userMap,
							timestamp
						}))
					} catch (e) {
						console.warn('Failed to cache students:', e)
					}
					setLastLoadTime(timestamp)
				}
			}
		} catch (error) {
			console.error('Failed to load students:', error)
		} finally {
			setLoading(false)
		}
	}

	// Load students on mount
	useEffect(() => {
		loadStudents()
	}, [])

	// Listen for storage events to update when new students are added from other tabs
	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'cache_admin_students_v1' && e.newValue) {
				try {
					const { students: newStudents, users: newUsers, timestamp } = JSON.parse(e.newValue)
					if (timestamp > lastLoadTime) {
						setStudents(newStudents || [])
						setUsers(newUsers || {})
						setLastLoadTime(timestamp)
					}
				} catch (error) {
					console.warn('Failed to parse storage update:', error)
				}
			}
		}

		window.addEventListener('storage', handleStorageChange)
		return () => window.removeEventListener('storage', handleStorageChange)
	}, [lastLoadTime])

	// Poll for cache invalidation (check every 30 seconds)
	useEffect(() => {
		const checkCacheInvalidation = async () => {
			try {
				const response = await fetch('/api/cache-invalidation?key=admin_students')
				if (response.ok) {
					const data = await response.json()
					if (data.success && data.lastUpdate) {
						const cached = localStorage.getItem('cache_admin_students_v1')
						if (cached) {
							const { timestamp } = JSON.parse(cached)
							if (data.lastUpdate > timestamp) {
								// Cache is invalid, refresh
								loadStudents(true)
							}
						}
					}
				}
			} catch (error) {
				console.warn('Failed to check cache invalidation:', error)
			}
		}

		// Check immediately, then every 30 seconds
		checkCacheInvalidation()
		const interval = setInterval(checkCacheInvalidation, 30000)
		return () => clearInterval(interval)
	}, [])

	// Refresh button handler
	const handleRefresh = () => {
		setLoading(true)
		loadStudents(true)
	}

	if (loading) {
		return (
			<div className="bg-white rounded-2xl shadow-xl p-6">
				<h2 className="text-2xl font-bold text-black mb-4">Skolēni</h2>
				<div className="text-gray-600">Ielādē...</div>
			</div>
		)
	}

	return (
		<div className="bg-white rounded-2xl shadow-xl p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold text-black">Skolēni</h2>
				<button 
					onClick={handleRefresh}
					className="px-3 py-1 text-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors"
				>
					Atjaunot
				</button>
			</div>
			<div className="text-sm text-gray-600 mb-4">
				Kopā: {students.length} skolēni no {Object.keys(users).length} lietotājiem
				{lastLoadTime > 0 && (
					<span className="ml-2 text-xs">
						• Atjaunots: {new Date(lastLoadTime).toLocaleTimeString('lv-LV')}
					</span>
				)}
			</div>
			
			{students.length === 0 ? (
				<div className="text-gray-600">Nav reģistrētu skolēnu</div>
			) : (
				<div className="space-y-3">
					{students.map(student => {
						const user = users[student.userId]
						return (
							<div key={student.id} className="border border-gray-200 rounded-lg p-4">
								<div className="flex items-center justify-between">
									<div className="flex-1">
										<div className="font-semibold text-black">
											{student.firstName} {student.lastName}
										</div>
										<div className="text-sm text-gray-600">
											{student.isSelf ? 'Pašreģistrācija' : 'Bērns'}
											{student.age && ` • ${student.age} gadi`}
											{student.grade && ` • ${student.grade}`}
											{student.school && ` • ${student.school}`}
										</div>
										{user && (
											<div className="text-xs text-gray-500 mt-1">
												Vecāks: {user.firstName} {user.lastName} ({user.email})
												{user.accountType === 'children' && ' • Vecāku konts'}
											</div>
										)}
									</div>
									<div className="text-xs text-gray-500">
										{new Date(student.createdAt).toLocaleDateString('lv-LV')}
									</div>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

const AdminNotifications = ({ onCountChange }: { onCountChange: (n: number) => void }) => {
	const [items, setItems] = useState<Array<{ id: string; type: string; title: string; message: string; unread: boolean; createdAt: string }>>([])
	const [openId, setOpenId] = useState<string | null>(null)
	const [selectMode, setSelectMode] = useState(false)
	const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({})
	useEffect(() => {
		// derive unread count for parent whenever items change
		try { onCountChange(items.filter((n: any) => n.unread !== false).length) } catch {}
	}, [items, onCountChange])
	const load = async () => {
		try {
			const r = await fetch('/api/notifications?recipientRole=admin')
			if (!r.ok) return
			const d = await r.json()
			if (d && Array.isArray(d.items)) {
				setItems(d.items)
				try { localStorage.setItem('cache_admin_notifications_v1', JSON.stringify({ items: d.items, ts: Date.now() })) } catch {}
			}
		} catch {}
	}
	useEffect(() => {
		// load from cache to render instantly
		try {
			const raw = localStorage.getItem('cache_admin_notifications_v1')
			if (raw) {
				const cached = JSON.parse(raw)
				if (cached && Array.isArray(cached.items)) {
					setItems(cached.items)
				}
			}
		} catch {}
		// refresh in background
		load()
	}, [])
	const openAndMarkRead = async (id: string) => {
		setOpenId(prev => prev === id ? null : id)
		// mark as read if was unread
		const n = items.find(x => x.id === id)
		if (n && n.unread) {
			try {
				await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, unread: false }) })
				setItems(prev => {
					const next = prev.map(x => x.id === id ? { ...x, unread: false } : x)
					try { localStorage.setItem('cache_admin_notifications_v1', JSON.stringify({ items: next, ts: Date.now() })) } catch {}
					return next
				})
			} catch {}
		}
	}
	const toggleSelect = (id: string) => {
		setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }))
	}
	const deleteSelected = async () => {
		const ids = Object.keys(selectedIds).filter(k => selectedIds[k])
		if (!ids.length) return
		try {
			await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
			setItems(prev => {
				const next = prev.filter(n => !ids.includes(n.id))
				try { localStorage.setItem('cache_admin_notifications_v1', JSON.stringify({ items: next, ts: Date.now() })) } catch {}
				return next
			})
			setSelectedIds({})
			setSelectMode(false)
		} catch {}
	}
	const deleteOne = async (id: string) => {
		try {
			await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
			setItems(prev => {
				const next = prev.filter(n => n.id !== id)
				try { localStorage.setItem('cache_admin_notifications_v1', JSON.stringify({ items: next, ts: Date.now() })) } catch {}
				return next
			})
			if (openId === id) setOpenId(null)
		} catch {}
	}
	return (
		<div className="bg-white rounded-2xl shadow-xl p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-xl font-bold text-black">Paziņojumi</h2>
				<div className="flex items-center gap-2">
					{selectMode ? (
						<>
							<button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={deleteSelected}>Dzēst izvēlētos</button>
							<button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={() => { setSelectMode(false); setSelectedIds({}) }}>Atcelt</button>
						</>
					) : (
						<button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={() => setSelectMode(true)}>Atlasīt</button>
					)}
			</div>
			</div>
			{items.length === 0 ? (
				<div className="text-gray-600">Nav paziņojumu</div>
			) : (
				<div className="space-y-2">
					{items.map(n => (
						<div key={n.id} className={`border rounded-xl ${n.unread ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
							<div className="flex items-center justify-between p-4">
								<div className="flex items-center gap-3 min-w-0">
									{selectMode && (
										<input type="checkbox" checked={!!selectedIds[n.id]} onChange={() => toggleSelect(n.id)} />
									)}
									<button className="text-left font-semibold text-black truncate" title={n.title} onClick={() => openAndMarkRead(n.id)}>{n.title}</button>
					</div>
								<div className="flex items-center gap-2">
									<div className="text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString('lv-LV') : ''}</div>
									<button className="text-xs text-red-600" onClick={() => deleteOne(n.id)}>Dzēst</button>
								</div>
							</div>
							{openId === n.id && (
								<div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-line">{n.message}</div>
							)}
						</div>
					))}
						</div>
					)}
		</div>
	)
}

const AdminTeachers = () => {
	const [items, setItems] = useState<Array<{ id: string; name: string; username: string; description: string; active: boolean }>>([])
	const [form, setForm] = useState<{ email: string }>({ email: '' })
	const [creating, setCreating] = useState(false)
	const [created, setCreated] = useState<{ email: string; tempPassword: string; loginUrl: string } | null>(null)
	const [openId, setOpenId] = useState<string | null>(null)
	const [profiles, setProfiles] = useState<Record<string, any>>({})
	const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null)

	useEffect(() => {
		// load from cache first
		try {
			const raw = localStorage.getItem('cache_admin_teachers_v1')
			if (raw) {
				const cached = JSON.parse(raw)
				if (cached && Array.isArray(cached.items)) setItems(cached.items)
			}
		} catch {}
		// then refresh
		fetch('/api/teachers').then(r => r.json()).then(d => {
			if (d && Array.isArray(d.items)) {
				setItems(d.items)
				try { localStorage.setItem('cache_admin_teachers_v1', JSON.stringify({ items: d.items, ts: Date.now() })) } catch {}
			}
		}).catch(() => {})
	}, [])

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow-xl p-6">
				<h2 className="text-2xl font-bold text-black mb-4">Pasniedzēji</h2>
				<div className="grid md:grid-cols-2 gap-3 mb-3">
					<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Pasniedzēja e-pasts" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
				</div>
				<button disabled={creating} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-70 text-black font-semibold py-2 px-4 rounded-lg" onClick={async () => {
					const email = (form.email || '').trim()
					if (!email) return
					setCreating(true)
					try {
						const r = await fetch('/api/send-teacher-invite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
						if (!r.ok) {
							const e = await r.json().catch(() => ({}))
							alert(e.error || 'Neizdevās izveidot ielūgumu')
							return
						}
						const d = await r.json().catch(() => ({}))
						if (d && d.email && d.tempPassword && d.loginUrl) setCreated({ email: d.email, tempPassword: d.tempPassword, loginUrl: d.loginUrl })
						setForm({ email: '' })
						const list = await fetch('/api/teachers').then(x => x.json()).catch(() => null)
						if (list && Array.isArray(list.items)) {
							setItems(list.items)
							try { localStorage.setItem('cache_admin_teachers_v1', JSON.stringify({ items: list.items, ts: Date.now() })) } catch {}
						}
					} finally {
						setCreating(false)
					}
				}}>Nosūtīt ielūgumu</button>
			</div>

			{created && (
				<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
					<div className="font-semibold text-black mb-2">Ielūgums nosūtīts pasniedzējam</div>
					<div className="grid md:grid-cols-3 gap-2 items-center">
						<input readOnly className="p-2 border border-gray-300 rounded-lg bg-white" value={created.email} />
						<input readOnly className="p-2 border border-gray-300 rounded-lg bg-white" value={created.tempPassword} />
						<div className="flex flex-wrap gap-2">
							<a className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" href={created.loginUrl} target="_blank" rel="noreferrer">Atvērt ielūguma saiti</a>
							<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={async () => { try { await navigator.clipboard.writeText(created.tempPassword) } catch {} }}>Kopēt paroli</button>
							<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={async () => { try { await navigator.clipboard.writeText(`${created.email} ${created.tempPassword} ${created.loginUrl}`) } catch {} }}>Kopēt visu</button>
							<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={() => setCreated(null)}>Aizvērt</button>
						</div>
					</div>
					<div className="text-xs text-gray-600 mt-2">Ja e-pasts netika nosūtīts (SMTP nav konfigurēts), varat manuāli nosūtīt ielūguma saiti un paroli.</div>
				</div>
			)}

			<div className="bg-white rounded-2xl shadow-xl p-6">
				{items.length === 0 ? (
					<div className="text-gray-500">Nav pasniedzēju</div>
				) : (
					<div className="space-y-3">
						{items.map(t => (
							<div key={t.id} className="border border-gray-200 rounded-xl">
								<div className="p-4">
									<div className="font-semibold text-black">{t.name} <span className="text-gray-500">({t.username})</span></div>
									<div className="text-sm text-gray-700">{t.active ? 'Aktīvs' : 'Neaktīvs'}</div>
									{t.description && <div className="text-sm text-gray-600 mt-1">{t.description}</div>}
									<div className="mt-2 flex items-center gap-3">
										<label className="inline-flex items-center gap-2 text-sm">
											<input type="checkbox" checked={t.active} onChange={async (e) => {
												const active = e.target.checked
												await fetch('/api/teachers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, active }) })
												setItems(prev => {
													const next = prev.map(x => x.id === t.id ? { ...x, active } : x)
													try { localStorage.setItem('cache_admin_teachers_v1', JSON.stringify({ items: next, ts: Date.now() })) } catch {}
													return next
												})
											}} /> Aktīvs
										</label>
										<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={async () => {
											const r = await fetch('/api/teachers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, action: 'resetPassword' }) })
											if (!r.ok) return
											const d = await r.json().catch(() => ({}))
											if (d && d.tempPassword) {
												try { await navigator.clipboard.writeText(d.tempPassword) } catch {}
												alert('Jaunā pagaidu parole ir nokopēta starpliktuvē')
											}
										}}>Atjaunot paroli</button>
										<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={async () => {
											if (openId === t.id) { setOpenId(null); return }
											setOpenId(t.id)
											if (!profiles[t.id]) {
												setLoadingProfileId(t.id)
												try {
													const prof = await fetch(`/api/teacher-profile?userId=${encodeURIComponent(t.id)}`).then(x => x.json()).catch(() => null)
													setProfiles(prev => ({ ...prev, [t.id]: prof && prof.profile ? prof.profile : null }))
												} finally {
													setLoadingProfileId(null)
												}
											}
										}}>{openId === t.id ? 'Aizvērt profilu' : 'Skatīt profilu'}</button>
									</div>
								</div>
								{openId === t.id && (
									<div className="border-t border-gray-200 p-4 bg-gray-50">
										{loadingProfileId === t.id ? (
											<div className="text-sm text-gray-600">Ielādē profilu...</div>
										) : (
											(() => {
												const p = profiles[t.id]
												if (!p) return <div className="text-sm text-gray-500">Nav profila informācijas</div>
												return (
													<div className="space-y-3">
														<div className="flex items-start gap-4">
															{p.photo ? <img src={p.photo} alt="Foto" className="w-16 h-16 rounded-full object-cover border-2 border-yellow-200" /> : <div className="w-16 h-16 rounded-full bg-gray-200" />}
															<div className="flex-1">
																<div className="text-sm text-gray-700 whitespace-pre-line">{p.description || '—'}</div>
															</div>
														</div>
														<div>
															<div className="font-semibold text-black mb-1">Pieejamie laiki</div>
															{(p.availability || []).length > 0 ? (
																<div className="mt-3 grid md:grid-cols-2 gap-2">
																	{p.availability.map((a: any, _idx: number) => (
																		<div key={_idx} className="text-sm text-gray-800 flex items-center justify-between border border-gray-200 rounded-lg p-3 bg-white">
																			<div className="truncate">
																				{a.type === 'specific' ? (
																					<span>Konkrēta diena: <b>{a.date}</b></span>
																				) : (
																					<span>Dienas: <b>{(a.weekdays||[]).join(', ')}</b></span>
																				)}
																				<span className="ml-2">{a.from}-{a.to}</span>
																				{a.until && <span className="ml-2 text-xs text-gray-600">(līdz {a.until})</span>}
																			</div>
																			<button className="text-xs text-red-600" onClick={() => setProfiles(prev => ({
																				...prev,
																				[t.id]: {
																					...prev[t.id],
																					availability: (prev?.[t.id]?.availability || []).filter((x: any) => x !== a)
																				}
																			}))}>Noņemt</button>
																		</div>
																	))}
																</div>
															) : (
																<div className="text-sm text-gray-500">Nav norādīts</div>
															)}
														</div>
													</div>
												)
											})()
										)}
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	)
}

const TeacherOnboarding = ({ userId, onFinished, initialPhoto, initialDescription, initialAvailability, initialFirstName, initialLastName }: { userId: string; onFinished: () => void; initialPhoto?: string; initialDescription?: string; initialAvailability?: any[]; initialFirstName?: string; initialLastName?: string; displayName?: string; isActive?: boolean }) => {
	const [photo, setPhoto] = useState<string>(initialPhoto || '')
	const [description, setDescription] = useState(initialDescription || '')
	const [firstName, setFirstName] = useState<string>(initialFirstName || '')
	const [lastName, setLastName] = useState<string>(initialLastName || '')
	const [saving, setSaving] = useState(false)
	const [scheduleTab, setScheduleTab] = useState<'weekly'|'specific'>('weekly')

	// Hour-by-hour weekly schedule with options per hour
	type HourKey = `${string}:${string}`
	type HourOpts = { enabled: boolean; lessonType: 'individual' | 'group'; location: 'facility' | 'teacher'; modality: 'in_person' | 'zoom' }
	const hourKeys: HourKey[] = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00` as HourKey)
	const createDefaultDay = (): Record<HourKey, HourOpts> => hourKeys.reduce((acc, h) => {
		acc[h] = { enabled: false, lessonType: 'individual', location: 'facility', modality: 'in_person' }
		return acc
	}, {} as Record<HourKey, HourOpts>)
	const [weeklyHours, setWeeklyHours] = useState<Record<string, Record<HourKey, HourOpts>>>(() => ({
		'1': createDefaultDay(),
		'2': createDefaultDay(),
		'3': createDefaultDay(),
		'4': createDefaultDay(),
		'5': createDefaultDay(),
		'6': createDefaultDay(),
		'7': createDefaultDay()
	}))
	const [openDay, setOpenDay] = useState<string | null>(null)

	const [endDate, setEndDate] = useState<string>('')
	const [startDate, setStartDate] = useState<string>('')

	// Specific-day overrides (hour-by-hour per chosen calendar date)
	const [overrideDate, setOverrideDate] = useState<string>('')
	const [overrides, setOverrides] = useState<Record<string, Record<HourKey, HourOpts>>>({})

	const toggleOverrideHour = (date: string, hour: HourKey, enabled: boolean) => {
		setOverrides(prev => {
			const day = prev[date] ? { ...prev[date] } : createDefaultDay()
			day[hour] = { ...(day[hour] || { enabled: false, lessonType: 'individual', location: 'facility', modality: 'in_person' }), enabled }
			return { ...prev, [date]: day }
		})
	}
	const updateOverrideHourOpt = (date: string, hour: HourKey, field: 'lessonType'|'location'|'modality', value: any) => {
		setOverrides(prev => {
			const day = prev[date] ? { ...prev[date] } : createDefaultDay()
			day[hour] = { ...(day[hour] || { enabled: false, lessonType: 'individual', location: 'facility', modality: 'in_person' }), [field]: value }
			return { ...prev, [date]: day }
		})
	}

	// Initialize from existing availability data
	useEffect(() => {
		if (initialAvailability && initialAvailability.length > 0) {
			const draft: Record<string, Record<HourKey, HourOpts>> = {
				'1': createDefaultDay(), '2': createDefaultDay(), '3': createDefaultDay(), '4': createDefaultDay(), '5': createDefaultDay(), '6': createDefaultDay(), '7': createDefaultDay()
			}
			const draftOverrides: Record<string, Record<HourKey, HourOpts>> = {}
			let newEnd = ''
			let newStart = ''
			initialAvailability.forEach((avail: any) => {
				const days = Array.isArray(avail.weekdays) ? avail.weekdays : []
				const from = (avail.from || '00:00') as HourKey
				const to = (avail.to || '01:00') as HourKey
				days.forEach((d: string) => {
					if (draft[d]) {
						const fromHour = Number(from.slice(0,2))
						const toHour = Math.max(fromHour + 1, Number(to.slice(0,2)))
						for (let h = fromHour; h < toHour; h++) {
							const key = `${String(h).padStart(2,'0')}:00` as HourKey
							draft[d][key] = {
								enabled: true,
								lessonType: avail.lessonType || 'individual',
								location: avail.location || 'facility',
								modality: avail.modality || 'in_person'
							}
						}
					}
				})
				if (avail?.type === 'specific' && typeof avail?.date === 'string' && avail.date) {
					const dateStr = avail.date
					const fromHour = Number(from.slice(0,2))
					const toHour = Math.max(fromHour + 1, Number(to.slice(0,2)))
					const day = draftOverrides[dateStr] ? { ...draftOverrides[dateStr] } : createDefaultDay()
					for (let h = fromHour; h < toHour; h++) {
						const key = `${String(h).padStart(2,'0')}:00` as HourKey
						day[key] = {
							enabled: true,
							lessonType: avail.lessonType || 'individual',
							location: avail.location || 'facility',
							modality: avail.modality || 'in_person'
						}
					}
					draftOverrides[dateStr] = day
				}
				if (avail.until) newEnd = avail.until
				if (avail.fromDate) newStart = avail.fromDate
			})
			setWeeklyHours(draft)
			setOverrides(draftOverrides)
			setEndDate(newEnd)
			setStartDate(newStart)
		}
	}, [initialAvailability])

	const dayNames = ['Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena', 'Svētdiena']

	const toggleHour = (day: string, hour: HourKey, enabled: boolean) => {
		setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], [hour]: { ...prev[day][hour], enabled } } }))
	}
	const updateHourOpt = (day: string, hour: HourKey, field: 'lessonType'|'location'|'modality', value: any) => {
		setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], [hour]: { ...prev[day][hour], [field]: value } } }))
	}

	const generateAvailabilityData = () => {
		const out: any[] = []
		Object.entries(weeklyHours).forEach(([day, hours]) => {
			hourKeys.forEach((h) => {
				const o = hours[h]
				if (o?.enabled) {
					const nextHour = `${String((Number(h.slice(0,2)) + 1) % 24).padStart(2,'0')}:00`
					out.push({
						type: 'weekly',
						weekdays: [day],
						from: h,
						to: nextHour,
						fromDate: startDate || null,
						until: endDate || null,
						lessonType: o.lessonType,
						location: o.location,
						modality: o.modality
					})
				}
			})
		})
		// Specific-day overrides
		Object.entries(overrides).forEach(([dateStr, hours]) => {
			hourKeys.forEach((h) => {
				const o = hours[h]
				if (o?.enabled) {
					const nextHour = `${String((Number(h.slice(0,2)) + 1) % 24).padStart(2,'0')}:00`
					out.push({
						type: 'specific',
						date: dateStr,
						from: h,
						to: nextHour,
						lessonType: o.lessonType,
						location: o.location,
						modality: o.modality
					})
				}
			})
		})
		return out
	}

	const onPhotoSelect = (file: File) => {
		const reader = new FileReader()
		reader.onload = () => setPhoto((reader.result as string) || '')
		reader.readAsDataURL(file)
	}

	const handleSave = async () => {
		if (!firstName.trim() || !lastName.trim()) {
			alert('Lūdzu aizpildiet vārdu un uzvārdu')
			return
		}

		setSaving(true)
		try {
			const availabilityData = generateAvailabilityData()
			
			const response = await fetch('/api/teacher-profile', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					photo,
					description: description.trim(),
					availability: availabilityData
				})
			})

			if (response.ok) {
				onFinished()
			} else {
				alert('Kļūda saglabājot profilu')
			}
		} catch (error) {
			alert('Kļūda savienojumā')
		} finally {
			setSaving(false)
		}
	}

	// Build baseline overrides for a given date from weekly settings (so weekly data is visible by default)
	const buildBaselineForDate = (dateStr: string): Record<HourKey, HourOpts> => {
		const baseline = createDefaultDay()
		try {
			if (!dateStr) return baseline
			const d = new Date(dateStr)
			if (isNaN(d.getTime())) return baseline
			const jsWeekDay = d.getDay() // 0..6, where Mon=1
			const dayIdx = ((jsWeekDay + 6) % 7) + 1 // 1..7 Mon..Sun
			const weekly = weeklyHours[String(dayIdx)]
			if (weekly) {
				hourKeys.forEach(h => {
					const w = weekly[h]
					if (w?.enabled) {
						baseline[h] = { enabled: true, lessonType: w.lessonType, location: w.location, modality: w.modality }
					}
				})
			}
		} catch {}
		return baseline
	}

	// When user selects a date, seed overrides for that date from weekly if none exists
	useEffect(() => {
		if (!overrideDate) return
		setOverrides(prev => {
			if (prev[overrideDate]) return prev
			return { ...prev, [overrideDate]: buildBaselineForDate(overrideDate) }
		})
	}, [overrideDate])

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow p-6 space-y-6">
				{/* Basic Info */}
				<div className="grid md:grid-cols-2 gap-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Vārds</label>
						<input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Vārds" />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Uzvārds</label>
						<input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Uzvārds" />
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
						<input type="file" accept="image/*" onChange={e => { const f = e.target.files && e.target.files[0]; if (f) onPhotoSelect(f) }} className="w-full p-2 border border-gray-300 rounded-lg" />
						{photo && <div className="mt-2"><img src={photo} alt="Priekšskatījums" className="w-20 h-20 rounded-full object-cover border-2 border-yellow-200" /></div>}
					</div>
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Apraksts</label>
						<textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Par sevi, pieredze, pieejamība..." />
					</div>
				</div>

				{/* Schedule Tabs */}
				<div className="flex gap-2">
					<button type="button" onClick={() => setScheduleTab('weekly')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${scheduleTab === 'weekly' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Ik nedēļas grafiks</button>
					<button type="button" onClick={() => setScheduleTab('specific')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${scheduleTab === 'specific' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Noteiktas dienas grafiks</button>
				</div>

				{/* Weekly schedule */}
				{scheduleTab === 'weekly' && (
					<>
						<div className="space-y-3 mb-6">
							{(['1','2','3','4','5','6','7'] as const).map((day) => (
								<div key={day} className="border border-gray-200 rounded-lg">
									<button type="button" className="w-full text-left p-3 flex items-center justify-between" onClick={() => setOpenDay(prev => prev === day ? null : day)}>
										<span className="font-medium text-gray-800">{dayNames[Number(day)-1]}</span>
										<span className="text-gray-500 text-sm">{Object.values(weeklyHours[day]).filter(o => o.enabled).length} h izvēlētas</span>
									</button>
									{openDay === day && (
										<div className="p-3 border-t grid md:grid-cols-2 gap-2">
											{hourKeys.map((h) => {
												const o = weeklyHours[day][h]
												return (
													<div key={h} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
														<label className="flex items-center gap-2 min-w-[64px]">
															<input type="checkbox" checked={o.enabled} onChange={e => toggleHour(day, h, e.target.checked)} />
															<span className="text-sm text-gray-700">{h}</span>
														</label>
														{o.enabled && (
															<div className="flex flex-wrap items-center gap-2">
																<select value={o.lessonType} onChange={e => updateHourOpt(day, h, 'lessonType', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
																	<option value="individual">Individuāla</option>
																	<option value="group">Grupu</option>
																</select>
																<select value={o.location} onChange={e => updateHourOpt(day, h, 'location', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
																	<option value="facility">Uz vietas</option>
																	<option value="teacher">Privāti</option>
																</select>
																<select value={o.modality} onChange={e => updateHourOpt(day, h, 'modality', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
																	<option value="in_person">Klātienē</option>
																	<option value="zoom">Zoom</option>
																</select>
															</div>
														)}
													</div>
												)
											})}
										</div>
									)}
								</div>
							))}
						</div>
						{/* Date Range */}
						<div className="border-t border-gray-200 pt-4">
							<div className="grid md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Sākuma datums (neobligāti)</label>
									<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-full" />
									<p className="text-xs text-gray-500 mt-1">No šī datuma sāksies jūsu pieejamība</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Beigu datums (neobligāti)</label>
									<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-full" />
									<p className="text-xs text-gray-500 mt-1">Pēc šī datuma jūs vairs nebūsiet pieejams jaunām rezervācijām</p>
								</div>
							</div>
						</div>
					</>
				)}

				{/* Specific-day schedule */}
				{scheduleTab === 'specific' && (
					<div className="space-y-4">
						<div className="grid md:grid-cols-2 gap-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Izvēlieties datumu</label>
								<input type="date" value={overrideDate} onChange={e => setOverrideDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" />
								<p className="text-xs text-gray-500 mt-1">Ja šai dienai nav iestatījumu, tie tiks aizpildīti no iknedēļas grafika</p>
							</div>
						</div>
						{overrideDate && (
							<div className="space-y-2">
								{hourKeys.map((h) => {
									const day = overrides[overrideDate] || buildBaselineForDate(overrideDate)
									const o = day[h]
									return (
										<div key={h} className="flex items-center gap-2 p-2 border border-gray-200 rounded-md">
											<label className="flex items-center gap-2 min-w-[64px]">
												<input type="checkbox" checked={o.enabled} onChange={e => toggleOverrideHour(overrideDate, h, e.target.checked)} />
												<span className="text-sm text-gray-700">{h}</span>
											</label>
											{o.enabled && (
												<div className="flex flex-wrap items-center gap-2">
													<select value={o.lessonType} onChange={e => updateOverrideHourOpt(overrideDate, h, 'lessonType', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
														<option value="individual">Individuāla</option>
														<option value="group">Grupu</option>
													</select>
													<select value={o.location} onChange={e => updateOverrideHourOpt(overrideDate, h, 'location', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
														<option value="facility">Uz vietas</option>
														<option value="teacher">Privāti</option>
													</select>
													<select value={o.modality} onChange={e => updateOverrideHourOpt(overrideDate, h, 'modality', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
														<option value="in_person">Klātienē</option>
														<option value="zoom">Zoom</option>
													</select>
												</div>
											)}
										</div>
								)
								})}
							</div>
						)}
					</div>
				)}

				<div className="pt-2">
					<button disabled={saving} onClick={handleSave} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black font-semibold py-2 px-4 rounded-lg">
						{saving ? 'Saglabā...' : 'Saglabāt'}
					</button>
				</div>
			</div>
		</div>
	)
}
