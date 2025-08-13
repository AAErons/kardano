import { useMemo, useState } from 'react'

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
			id: 1,
			name: 'Ēriks Freimanis',
			subject: 'Matemātika (5-12. klase)',
			description: 'Specializējos pamatskolas un vidusskolas matemātikā. Palīdzu apgūt tekošo vielu un aizpildīt zināšanu robus.',
			image: '/images/tutors/eriks.jpeg',
			rating: 4.9,
			reviews: [
				{ id: 1, studentName: 'Anna Kļaviņa', rating: 5, comment: 'Lieliska sagatavošana VPD – 95%!', date: '2024-01' },
				{ id: 2, studentName: 'Kārlis Ozols', rating: 5, comment: 'Beidzot saprotu algebru!', date: '2023-12' },
			],
			appointments: [
				{ id: 1, workerId: 1, workerName: 'Ēriks Freimanis', userName: 'Jānis', date: mkDate(5), time: '14:00', duration: 60, subject: 'Algebra', status: 'scheduled' },
				{ id: 2, workerId: 1, workerName: 'Ēriks Freimanis', userName: 'Elīna', date: mkDate(12), time: '16:00', duration: 60, subject: 'Ģeometrija', status: 'completed' },
				{ id: 7, workerId: 1, workerName: 'Ēriks Freimanis', userName: 'Marta', date: mkDate(18), time: '10:00', duration: 60, subject: 'Trijstūri', status: 'scheduled' },
				{ id: 8, workerId: 1, workerName: 'Ēriks Freimanis', userName: 'Paula', date: mkDate(25), time: '09:00', duration: 90, subject: 'Funkcijas', status: 'scheduled' },
				// Same-day multi-appointment scenario on day 16
				{ id: 13, workerId: 1, workerName: 'Ēriks Freimanis', userName: 'Gustavs', date: mkDate(16), time: '09:00', duration: 60, subject: 'Atvasinājumi', status: 'scheduled' },
				{ id: 14, workerId: 1, workerName: 'Ēriks Freimanis', userName: 'Zane', date: mkDate(16), time: '11:30', duration: 30, subject: 'Konsultācija', status: 'scheduled' },
				{ id: 15, workerId: 1, workerName: 'Ēriks Freimanis', userName: 'Ilze', date: mkDate(16), time: '14:00', duration: 60, subject: 'Vienādojumi', status: 'scheduled' },
			],
		},
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

let nextWorkerId = 4
let nextAppointmentId = 100

const ProfileSection = () => {
	const [role, setRole] = useState<Role>(null)
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [authError, setAuthError] = useState('')

	const [workers, setWorkers] = useState<Worker[]>(initialWorkersData)
	const [loggedInWorkerId, setLoggedInWorkerId] = useState<number | null>(null)
	const [userAppointments, setUserAppointments] = useState<Appointment[]>(createMockUserAppointments(initialWorkersData))

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

	const handleLogin = () => {
		setAuthError('')
		if (username === 'admin' && password === 'admin') {
			setRole('admin')
			setLoggedInWorkerId(null)
			return
		}
		if (username === 'worker' && password === 'worker') {
			setRole('worker')
			setLoggedInWorkerId(workers[0]?.id ?? null)
			return
		}
		if (username === 'user' && password === 'user') {
			setRole('user')
			setLoggedInWorkerId(null)
			return
		}
		setAuthError('Nepareizs lietotājvārds vai parole')
	}

	const handleLogout = () => {
		setRole(null)
		setUsername('')
		setPassword('')
		setAuthError('')
	}

	const addWorker = (newWorker: Omit<Worker, 'id' | 'appointments' | 'reviews'>) => {
		const worker: Worker = {
			id: nextWorkerId++,
			name: newWorker.name,
			subject: newWorker.subject,
			description: newWorker.description,
			image: newWorker.image,
			rating: newWorker.rating,
			reviews: [],
			appointments: [],
		}
		setWorkers(prev => [...prev, worker])
	}

	const updateWorker = (id: number, updates: Partial<Omit<Worker, 'id' | 'appointments' | 'reviews'>>) => {
		setWorkers(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)))
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

	const addBlockedAppointment = (data: { workerId: number; date: string; time: string; duration: number; note?: string }) => {
		const worker = workers.find(w => w.id === data.workerId)
		if (!worker) return
		const appointment: Appointment = {
			id: nextAppointmentId++,
			workerId: worker.id,
			workerName: worker.name,
			userName: '—',
			date: data.date,
			time: data.time,
			duration: data.duration,
			subject: 'Brīvs/Atvaļinājums',
			status: 'blocked',
			note: data.note,
		}
		setWorkers(prev => prev.map(w => (w.id === worker.id ? { ...w, appointments: [...w.appointments, appointment] } : w)))
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
						<p className="text-gray-600 mb-6 text-sm">Testa piekļuve: admin/admin, worker/worker, user/user</p>
						<div className="space-y-3 sm:space-y-4">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Lietotājvārds</label>
								<input value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="admin | worker | user" />
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1">Parole</label>
								<input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="••••••" />
							</div>
							{authError && <div className="text-red-600 text-sm">{authError}</div>}
							<button onClick={handleLogin} className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-lg transition-colors">Pieslēgties</button>
						</div>
					</div>
				)}

				{role === 'admin' && (
					<AdminDashboard workers={workers} onAdd={addWorker} onUpdate={updateWorker} onAddBlocked={addBlockedAppointment} onAddAppointment={bookAppointment} />
				)}

				{role === 'worker' && loggedInWorker && (
					<WorkerDashboard worker={loggedInWorker} />
				)}

				{role === 'user' && (
					<UserDashboard workers={workers} userAppointments={userAppointments} onBook={bookAppointment} onAddReview={addReview} />
				)}
			</div>
		</div>
	)
}

const AdminDashboard = ({ workers, onAdd, onUpdate, onAddBlocked, onAddAppointment }: { workers: Worker[]; onAdd: (w: Omit<Worker, 'id' | 'appointments' | 'reviews'>) => void; onUpdate: (id: number, updates: Partial<Omit<Worker, 'id' | 'appointments' | 'reviews'>>) => void; onAddBlocked: (data: { workerId: number; date: string; time: string; duration: number; note?: string }) => void; onAddAppointment: (data: { workerId: number; userName: string; date: string; time: string; duration: number; subject: string }) => void }) => {
	const [activeTab, setActiveTab] = useState<'pasniedzeji' | 'privatstundas' | 'pieteikumi'>('pasniedzeji')
	const [isAdding, setIsAdding] = useState(false)
	const [newWorker, setNewWorker] = useState<{ name: string; subject: string; rating: number; description: string; image: string }>({ name: '', subject: '', rating: 5, description: '', image: '' })
	const [editingId, setEditingId] = useState<number | null>(null)
	const [editValues, setEditValues] = useState<{ name: string; subject: string; rating: number; description: string; image: string }>({ name: '', subject: '', rating: 5, description: '', image: '' })

	const [selectedTutorId, setSelectedTutorId] = useState<number | 'all'>('all')
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())

	const handleNewImageUpload = (file: File) => {
		const reader = new FileReader()
		reader.onload = () => {
			setNewWorker(prev => ({ ...prev, image: (reader.result as string) || '' }))
		}
		reader.readAsDataURL(file)
	}

	const handleEditImageUpload = (file: File) => {
		const reader = new FileReader()
		reader.onload = () => {
			setEditValues(prev => ({ ...prev, image: (reader.result as string) || '' }))
		}
		reader.readAsDataURL(file)
	}

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear()
		const month = date.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const daysInMonth = lastDay.getDate()
		// Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
		const startingDay = (firstDay.getDay() + 6) % 7
		return { daysInMonth, startingDay }
	}

	const getMonthName = (date: Date) => {
		const months = [
			'Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs',
			'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'
		]
		return months[date.getMonth()]
	}

	const getWeekdayNames = () => ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

	const isToday = (day: number) => {
		const today = new Date()
		return today.getDate() === day && today.getMonth() === selectedDate.getMonth() && today.getFullYear() === selectedDate.getFullYear()
	}

	const filterAppointmentsByMonthAndTutor = (date: Date) => {
		const year = date.getFullYear()
		const month = date.getMonth() + 1
		const monthStr = String(month).padStart(2, '0')
		const re = new RegExp(`^${year}-${monthStr}-`)
		const relevantWorkers = selectedTutorId === 'all' ? workers : workers.filter(w => w.id === selectedTutorId)
		const appts = relevantWorkers.flatMap(w => w.appointments.filter(a => re.test(a.date)))
		return appts
	}

	const getDailyAppointments = (day: number) => {
		const year = selectedDate.getFullYear()
		const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
		const dayStr = String(day).padStart(2, '0')
		const dateStr = `${year}-${month}-${dayStr}`
		const relevantWorkers = selectedTutorId === 'all' ? workers : workers.filter(w => w.id === selectedTutorId)
		return relevantWorkers.flatMap(w => w.appointments.filter(a => a.date === dateStr).map(a => ({ ...a, workerName: w.name })))
	}

	// Deprecated helper removed: getAllSlotsForDay

	// Half-hour timeline helpers for richer daily view
	const generateHalfHourSlots = () => {
		const slots: string[] = []
		for (let hour = 8; hour < 20; hour++) {
			slots.push(`${String(hour).padStart(2, '0')}:00`)
			slots.push(`${String(hour).padStart(2, '0')}:30`)
		}
		return slots
	}

	const halfHourSlots = useMemo(() => generateHalfHourSlots(), [])

	const timeToIndex = (time: string) => {
		const idx = halfHourSlots.indexOf(time)
		return idx >= 0 ? idx + 1 : 1 // grid rows are 1-based
	}

	const durationToRowSpan = (durationMinutes: number) => {
		return Math.max(1, Math.ceil(durationMinutes / 30))
	}

	const getTutorColumns = () => {
		return selectedTutorId === 'all' ? workers : workers.filter(w => w.id === selectedTutorId)
	}

	const getDayAppointmentsByTutor = (day: number) => {
		const year = selectedDate.getFullYear()
		const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
		const dayStr = String(day).padStart(2, '0')
		const dateStr = `${year}-${month}-${dayStr}`
		const result: Record<number, Appointment[]> = {}
		getTutorColumns().forEach(w => {
			result[w.id] = w.appointments.filter(a => a.date === dateStr)
		})
		return result
	}

	const monthlyAppointments = useMemo(() => filterAppointmentsByMonthAndTutor(selectedDate), [workers, selectedTutorId, selectedDate])
	const stats = useMemo(() => {
		const total = monthlyAppointments.length
		const completed = monthlyAppointments.filter(a => a.status === 'completed').length
		const scheduled = monthlyAppointments.filter(a => a.status === 'scheduled').length
		const totalMinutes = monthlyAppointments.reduce((sum, a) => sum + a.duration, 0)
		return { total, completed, scheduled, totalHours: Math.round((totalMinutes / 60) * 10) / 10 }
	}, [monthlyAppointments])

	const { daysInMonth, startingDay } = getDaysInMonth(selectedDate)

	return (
		<div className="space-y-8">
			<div className="bg-white rounded-2xl shadow-xl p-2 lg:p-3">
				<div className="flex gap-2">
					<button onClick={() => setActiveTab('pasniedzeji')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'pasniedzeji' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Pasniedzēji</button>
					<button onClick={() => setActiveTab('privatstundas')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'privatstundas' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Privātstundas</button>
					<button onClick={() => setActiveTab('pieteikumi')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'pieteikumi' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Pieteikumi</button>
				</div>
			</div>

			{activeTab === 'pasniedzeji' && (
				<div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-2xl font-bold text-black">Pasniedzēji</h2>
						<button onClick={() => setIsAdding(v => !v)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg transition-colors">
							{isAdding ? 'Aizvērt' : 'Pievienot pasniedzēju'}
						</button>
					</div>

					{isAdding && (
						<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
							<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Vārds" value={newWorker.name} onChange={e => setNewWorker({ ...newWorker, name: e.target.value })} />
							<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Priekšmets" value={newWorker.subject} onChange={e => setNewWorker({ ...newWorker, subject: e.target.value })} />
							<label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 px-3 rounded-lg inline-block">
								Augšupielādēt attēlu
								<input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleNewImageUpload(f) }} />
							</label>
							{newWorker.image && (
								<div className="md:col-span-2 lg:col-span-3">
									<img src={newWorker.image} alt="Priekšskatījums" className="w-20 h-20 rounded-full object-cover border-2 border-yellow-200" />
								</div>
							)}
							<textarea className="md:col-span-2 lg:col-span-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Apraksts" rows={3} value={newWorker.description} onChange={e => setNewWorker({ ...newWorker, description: e.target.value })} />
							<input type="number" step="0.1" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Reitings" value={newWorker.rating} onChange={e => setNewWorker({ ...newWorker, rating: Number(e.target.value) })} />
							<button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg" onClick={() => {
								if (!newWorker.name || !newWorker.subject || !newWorker.description || !newWorker.image) return
								onAdd(newWorker)
								setNewWorker({ name: '', subject: '', rating: 5, description: '', image: '' })
								setIsAdding(false)
							}}>Saglabāt</button>
						</div>
					)}

					<div className="grid lg:grid-cols-3 gap-6">
						{workers.map(worker => (
							<div key={worker.id} className="border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow bg-white">
								<div className="flex items-start justify-between mb-4">
									<div className="flex gap-4">
									<img src={worker.image} alt={worker.name} className="w-20 h-20 rounded-full object-cover border-2 border-yellow-200" />
										<div>
											<h3 className="text-xl font-bold text-black">{worker.name}</h3>
											<p className="text-gray-700">{worker.subject}</p>
											<div className="text-yellow-600">★ {worker.rating.toFixed(1)}</div>
										</div>
									</div>
									<button className="text-yellow-700 hover:text-yellow-800 font-medium" onClick={() => {
										setEditingId(worker.id)
										setEditValues({ name: worker.name, subject: worker.subject, rating: worker.rating, description: worker.description, image: worker.image })
									}}>Rediģēt</button>
								</div>

								<div className="mb-4">
									<h4 className="font-semibold text-black mb-2">Apraksts</h4>
									<p className="text-gray-700 whitespace-pre-line">{worker.description}</p>
								</div>

								{editingId === worker.id && (
									<div className="border-t border-gray-200 pt-4 space-y-3">
										<div className="grid grid-cols-1 gap-3">
										<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" value={editValues.name} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} />
										<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" value={editValues.subject} onChange={e => setEditValues(v => ({ ...v, subject: e.target.value }))} />
									<label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 px-3 rounded-lg inline-block">
										Augšupielādēt jaunu attēlu
										<input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleEditImageUpload(f) }} />
									</label>
										{editValues.image && (
											<img src={editValues.image} alt="Priekšskatījums" className="w-20 h-20 rounded-full object-cover border-2 border-yellow-200" />
										)}
										<textarea className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" rows={3} value={editValues.description} onChange={e => setEditValues(v => ({ ...v, description: e.target.value }))} />
										<input type="number" step="0.1" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" value={editValues.rating} onChange={e => setEditValues(v => ({ ...v, rating: Number(e.target.value) }))} />
										</div>
										<div className="flex gap-3">
											<button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg" onClick={() => { onUpdate(worker.id, editValues); setEditingId(null) }}>Saglabāt</button>
											<button className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg" onClick={() => setEditingId(null)}>Atcelt</button>
										</div>
									</div>
								)}
							</div>
						))}
					</div>
				</div>
			)}

			{activeTab === 'privatstundas' && (
				<div className="space-y-6">
					<div className="grid lg:grid-cols-3 gap-6">
						<div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6">
							<div className="flex items-center justify-between mb-4 lg:mb-6">
								<button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg lg:text-xl">←</button>
								<h2 className="text-xl lg:text-2xl font-bold text-black text-center">{getMonthName(selectedDate)} {selectedDate.getFullYear()}</h2>
								<button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg lg:text-xl">→</button>
							</div>
							<div className="mb-4">
								<label className="block text-sm font-medium text-gray-700 mb-2">Filtrēt pēc pasniedzēja</label>
								<select value={selectedTutorId === 'all' ? '' : selectedTutorId} onChange={e => setSelectedTutorId(e.target.value ? Number(e.target.value) : 'all')} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm lg:text-base">
									<option value="">Visi pasniedzēji</option>
									{workers.map(w => (
										<option key={w.id} value={w.id}>{w.name}</option>
									))}
								</select>
							</div>
							<div className="grid grid-cols-7 gap-1 mb-2">
								{getWeekdayNames().map((d, i) => (
									<div key={i} className="text-center font-semibold text-gray-600 py-2 text-sm lg:text-base">{d}</div>
								))}
							</div>
							<div className="grid grid-cols-7 gap-1">
								{Array.from({ length: startingDay }, (_, index) => (
									<div key={`empty-${index}`} className="h-16 lg:h-20"></div>
								))}
								{Array.from({ length: daysInMonth }, (_, index) => {
									const day = index + 1
									const dayAppts = getDailyAppointments(day)
									const nonBlockedAppts = dayAppts.filter(a => a.status !== 'blocked')
									const hasBlocked = dayAppts.some(a => a.status === 'blocked')
									const hasAppts = nonBlockedAppts.length > 0
									return (
										<div key={day} className={`h-16 lg:h-20 border border-gray-200 p-1 lg:p-2 cursor-pointer transition-colors ${isToday(day) ? 'bg-yellow-400 text-black font-bold' : hasAppts ? 'bg-green-50 hover:bg-green-100' : hasBlocked ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50'}`} onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}>
											<div className="text-xs lg:text-sm font-medium mb-1">{day}</div>
											{hasAppts && (
												<div className="text-[11px] lg:text-xs text-green-700">{nonBlockedAppts.length} pierakst{nonBlockedAppts.length > 1 ? 'i' : 's'}</div>
											)}
										</div>
									)
								})}
							</div>
						</div>
						<div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6">
							<h3 className="text-lg lg:text-xl font-bold text-black mb-4">Statistika ({getMonthName(selectedDate)})</h3>
							<div className="grid grid-cols-2 gap-3">
								<div className="bg-gray-50 rounded-lg p-3">
									<div className="text-gray-600 text-sm">Kopā pieraksti</div>
									<div className="text-2xl font-bold text-black">{stats.total}</div>
								</div>
								<div className="bg-gray-50 rounded-lg p-3">
									<div className="text-gray-600 text-sm">Pabeigti</div>
									<div className="text-2xl font-bold text-black">{stats.completed}</div>
								</div>
								<div className="bg-gray-50 rounded-lg p-3">
									<div className="text-gray-600 text-sm">Plānoti</div>
									<div className="text-2xl font-bold text-black">{stats.scheduled}</div>
								</div>
								<div className="bg-gray-50 rounded-lg p-3">
									<div className="text-gray-600 text-sm">Stundas</div>
									<div className="text-2xl font-bold text-black">{stats.totalHours} h</div>
								</div>
							</div>
						</div>
					</div>

					<div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6">
						<h3 className="text-lg lg:text-xl font-bold text-black mb-4">{selectedTutorId === 'all' ? 'Visu pasniedzēju' : 'Pasniedzēja'} dienas grafiks — {new Date(selectedDate).toLocaleDateString('lv-LV')}</h3>
						{(() => {
							const day = selectedDate.getDate()
							const tutors = getTutorColumns()
							const apptsByTutor = getDayAppointmentsByTutor(day)
							const rows = halfHourSlots.length
							return (
								<div className="overflow-auto">
									<div className="min-w-[720px]" style={{ display: 'grid', gridTemplateColumns: `160px repeat(${tutors.length}, minmax(160px, 1fr))` }}>
										{/* Header Row */}
										<div></div>
										{tutors.map(t => (
											<div key={t.id} className="px-2 py-2 font-semibold text-black border-b border-gray-200">{t.name}</div>
										))}

										{/* Time labels column */}
										<div style={{ display: 'grid', gridTemplateRows: `repeat(${rows}, 2.25rem)` }} className="border-r border-gray-200">
											{halfHourSlots.map((ts) => (
												<div key={ts} className="text-xs text-gray-500 flex items-center justify-end pr-3 border-b border-gray-100">{ts}</div>
											))}
										</div>

										{/* Tutor columns with grid rows for timeslots */}
										{tutors.map(t => (
											<div key={t.id} style={{ display: 'grid', gridTemplateRows: `repeat(${rows}, 2.25rem)` }} className="relative">
												{/* grid background */}
												{halfHourSlots.map((ts) => (
													<div key={ts} className="border-b border-gray-100"></div>
												))}
												{/* appointments as row-spanning blocks */}
                                        {apptsByTutor[t.id]?.map(appt => {
                                                    const startIdx = timeToIndex(appt.time)
                                                    const span = durationToRowSpan(appt.duration)
                                                    const isCompact = span === 1
                                                    return (
                                                        <div key={appt.id} style={{ gridRow: `${startIdx} / span ${span}` }} className={`m-1 rounded-lg p-2 text-xs shadow-sm overflow-hidden ${appt.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : appt.status === 'blocked' ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
                                                            <div className="font-semibold text-black/80 leading-tight">
                                                                {appt.time} • {appt.subject}
                                                                {isCompact && (
                                                                    <span className="ml-1 text-[10px] text-black/70 whitespace-nowrap">• {appt.userName} • {appt.duration} min</span>
                                                                )}
                                                            </div>
                                                            {!isCompact && (
                                                                <div className="text-[11px] text-black/70 leading-tight">{appt.userName} • {appt.duration} min</div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
											</div>
										))}
									</div>
								</div>
							)
						})()}
					</div>
				</div>
			)}

			{activeTab === 'pieteikumi' && (
				<div className="space-y-6">
					<div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6">
						<h2 className="text-2xl font-bold text-black mb-4">Pieteikumi</h2>
						<p className="text-gray-600 mb-6 text-sm">Mock dati priekšskatījumam. Šeit varēsiet apstiprināt vai noraidīt pieteikumus.</p>

						{/* Privātstundu pieteikumi */}
						<h3 className="text-lg lg:text-xl font-bold text-black mb-3">Privātstundu pieteikumi</h3>
						<div className="space-y-3 mb-6">
							{getTutorColumns().slice(0, 3).map((t, idx) => {
								const time = ['09:00','11:00','15:30'][idx]
								const duration = idx === 2 ? 90 : 60
								const date = new Date()
								const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
								const subject = ['Algebra','Ģeometrija','Konsultācija'][idx]
								const userName = ['Jānis','Elīna','Marta'][idx]
								return (
									<div key={`lesson-${t.id}`} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
												<img src={t.image} alt={t.name} className="w-full h-full object-cover" />
											</div>
											<div>
												<div className="font-semibold text-black">{t.name}</div>
												<div className="text-sm text-gray-600">{date.toLocaleDateString('lv-LV')} • {time} • {duration} min • {subject}</div>
												<div className="text-xs text-gray-500">Skolēns: {userName}</div>
											</div>
										</div>
										<div className="flex items-center gap-2">
											<button className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-3 rounded-lg" onClick={() => {
												onAddAppointment({ workerId: t.id, userName, date: dateStr, time, duration, subject })
												alert('Privātstundas pieteikums apstiprināts (mock). Pieraksts pievienots grafikam.')
											}}>
												Apstiprināt
											</button>
											<button className="border-2 border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold py-2 px-3 rounded-lg" onClick={() => alert('Pieteikums noraidīts (mock).')}>
												Noraidīt
											</button>
										</div>
									</div>
								)
							})}
						</div>

						{/* Brīva laika pieteikumi */}
						<h3 className="text-lg lg:text-xl font-bold text-black mb-3">Brīva laika pieteikumi</h3>
						<div className="space-y-3">
							{getTutorColumns().slice(0, 3).map((t, idx) => (
								<div key={`free-${t.id}`} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
											<img src={t.image} alt={t.name} className="w-full h-full object-cover" />
										</div>
										<div>
											<div className="font-semibold text-black">{t.name}</div>
											<div className="text-sm text-gray-600">{new Date().toLocaleDateString('lv-LV')} • {['09:00','11:30','14:00'][idx]} • {idx === 1 ? 120 : 60} min</div>
											<div className="text-xs text-gray-500">Piezīme: {idx === 0 ? 'Ārsta apmeklējums' : idx === 1 ? 'Atvaļinājums' : 'Personīgi darbi'}</div>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<button className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold py-2 px-3 rounded-lg" onClick={() => {
											const duration = idx === 1 ? 120 : 60
											const time = ['09:00','11:30','14:00'][idx]
											const date = new Date()
											const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
											onAddBlocked({ workerId: t.id, date: dateStr, time, duration, note: 'Apstiprināts' })
											alert('Brīvā laika pieteikums apstiprināts (mock). Brīvais laiks pievienots grafikam.')
										}}>
											Apstiprināt
										</button>
										<button className="border-2 border-red-300 text-red-700 hover:bg-red-50 text-sm font-semibold py-2 px-3 rounded-lg" onClick={() => alert('Pieteikums noraidīts (mock).')}>
											Noraidīt
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

const WorkerDashboard = ({ worker }: { worker: Worker }) => {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [requestOpen, setRequestOpen] = useState(false)
	const [request, setRequest] = useState<{ date: string; startTime: string; duration: number; note: string }>({ date: '', startTime: '', duration: 60, note: '' })

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear()
		const month = date.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const daysInMonth = lastDay.getDate()
		// Convert Sunday=0..Saturday=6 to Monday=0..Sunday=6
		const startingDay = (firstDay.getDay() + 6) % 7
		return { daysInMonth, startingDay }
	}

	const getMonthName = (date: Date) => {
		const months = [
			'Janvāris', 'Februāris', 'Marts', 'Aprīlis', 'Maijs', 'Jūnijs',
			'Jūlijs', 'Augusts', 'Septembris', 'Oktobris', 'Novembris', 'Decembris'
		]
		return months[date.getMonth()]
	}

	const getWeekdayNames = () => ['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv']

	const isToday = (day: number) => {
		const today = new Date()
		return today.getDate() === day && today.getMonth() === selectedDate.getMonth() && today.getFullYear() === selectedDate.getFullYear()
	}

	const getDailyAppointments = (day: number) => {
		const year = selectedDate.getFullYear()
		const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
		const dayStr = String(day).padStart(2, '0')
		const dateStr = `${year}-${month}-${dayStr}`
		return worker.appointments.filter(a => a.date === dateStr)
	}

	const generateHalfHourSlots = () => {
		const slots: string[] = []
		for (let hour = 8; hour < 20; hour++) {
			slots.push(`${String(hour).padStart(2, '0')}:00`)
			slots.push(`${String(hour).padStart(2, '0')}:30`)
		}
		return slots
	}

	const halfHourSlots = useMemo(() => generateHalfHourSlots(), [])

	const timeToIndex = (time: string) => {
		const idx = halfHourSlots.indexOf(time)
		return idx >= 0 ? idx + 1 : 1
	}

	const durationToRowSpan = (durationMinutes: number) => {
		return Math.max(1, Math.ceil(durationMinutes / 30))
	}

	const handleSubmitRequest = () => {
		if (!request.date || !request.startTime || !request.duration) return
		// In a real app this would be sent for approval.
		// Since worker is a prop, we'd normally lift state up. For preview, append to selected day visual by using selectedDate setter.
		// Quick client-side preview: if selected date matches, it will render from getDailyAppointments which is based on worker.appointments.
		// To actually add visually, mutate a local copy and rely on rerender via state. We can't mutate props, so skip persistent add.
		// Instead, show a temporary confirmation and reset form.
		setRequestOpen(false)
		setRequest({ date: '', startTime: '', duration: 60, note: '' })
		alert('Pieteikums iesniegts (mock). Reālajā versijā tiks nosūtīts apstiprināšanai.')
	}

	const { daysInMonth, startingDay } = getDaysInMonth(selectedDate)

	return (
		<div className="grid lg:grid-cols-3 gap-6">
			<div className="lg:col-span-2 space-y-6">
				<div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 lg:p-6">
					<div className="flex items-center justify-between mb-4 lg:mb-6">
						<button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg lg:text-xl">←</button>
						<h2 className="text-xl lg:text-2xl font-bold text-black text-center">{getMonthName(selectedDate)} {selectedDate.getFullYear()}</h2>
						<div className="flex items-center gap-2">
							<button onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg lg:text-xl">→</button>
							<button onClick={() => setRequestOpen(v => !v)} className="ml-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-3 rounded-lg text-sm">Pieteikt brīvu</button>
						</div>
					</div>

					{requestOpen && (
						<div className="mb-6 border border-yellow-200 bg-yellow-50 rounded-xl p-4">
							<h3 className="font-semibold text-black mb-3">Pieteikt brīvu laiku/atvaļinājumu</h3>
							<div className="grid md:grid-cols-4 gap-3">
								<input type="date" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" value={request.date} onChange={e => setRequest({ ...request, date: e.target.value })} />
								<input type="time" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" value={request.startTime} onChange={e => setRequest({ ...request, startTime: e.target.value })} />
								<input type="number" min={30} step={30} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Ilgums (min)" value={request.duration} onChange={e => setRequest({ ...request, duration: Number(e.target.value) })} />
								<input className="md:col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Piezīme (neobligāti)" value={request.note} onChange={e => setRequest({ ...request, note: e.target.value })} />
							</div>
							<div className="mt-3 flex gap-2">
								<button onClick={handleSubmitRequest} className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg">Iesniegt</button>
								<button onClick={() => setRequestOpen(false)} className="border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold py-2 px-4 rounded-lg">Atcelt</button>
							</div>
						</div>
					)}

				<div className="grid grid-cols-7 gap-1 mb-2 text-xs sm:text-sm">
						{getWeekdayNames().map((d, i) => (
							<div key={i} className="text-center font-semibold text-gray-600 py-2 text-sm lg:text-base">{d}</div>
						))}
					</div>
				<div className="grid grid-cols-7 gap-1">
						{Array.from({ length: startingDay }, (_, index) => (
							<div key={`empty-${index}`} className="h-16 lg:h-20"></div>
						))}
						{Array.from({ length: daysInMonth }, (_, index) => {
							const day = index + 1
							const appts = getDailyAppointments(day)
							const nonBlockedAppts = appts.filter(a => a.status !== 'blocked')
							const hasBlocked = appts.some(a => a.status === 'blocked')
							const hasAppts = nonBlockedAppts.length > 0
							return (
								<div key={day} className={`h-16 lg:h-20 border border-gray-200 p-1 lg:p-2 cursor-pointer transition-colors ${isToday(day) ? 'bg-yellow-400 text-black font-bold' : hasAppts ? 'bg-green-50 hover:bg-green-100' : hasBlocked ? 'bg-gray-100 hover:bg-gray-200' : 'bg-gray-50'}`} onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}>
									<div className="text-xs lg:text-sm font-medium mb-1">{day}</div>
									{hasAppts && <div className="text-[11px] lg:text-xs text-green-700">{nonBlockedAppts.length} pierakst{nonBlockedAppts.length > 1 ? 'i' : 's'}</div>}
								</div>
							)
						})}
					</div>
				</div>

				<div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6">
					<h3 className="text-lg lg:text-xl font-bold text-black mb-4">Dienas grafiks — {new Date(selectedDate).toLocaleDateString('lv-LV')}</h3>
					{(() => {
						const day = selectedDate.getDate()
						const dayAppts = getDailyAppointments(day)
						const rows = halfHourSlots.length
						return (
							<div className="overflow-auto">
								<div className="min-w-[560px]" style={{ display: 'grid', gridTemplateColumns: `160px minmax(320px, 1fr)` }}>
									<div></div>
									<div className="px-2 py-2 font-semibold text-black border-b border-gray-200">{worker.name}</div>

									<div style={{ display: 'grid', gridTemplateRows: `repeat(${rows}, 2.25rem)` }} className="border-r border-gray-200">
										{halfHourSlots.map((ts) => (
											<div key={ts} className="text-xs text-gray-500 flex items-center justify-end pr-3 border-b border-gray-100">{ts}</div>
										))}
									</div>

									<div style={{ display: 'grid', gridTemplateRows: `repeat(${rows}, 2.25rem)` }} className="relative">
										{halfHourSlots.map((ts) => (
											<div key={ts} className="border-b border-gray-100"></div>
										))}
                                    {dayAppts.map(appt => {
											const startIdx = timeToIndex(appt.time)
											const span = durationToRowSpan(appt.duration)
											const isCompact = span === 1
											return (
                                            <div key={appt.id} style={{ gridRow: `${startIdx} / span ${span}` }} className={`m-1 rounded-lg p-2 text-xs shadow-sm overflow-hidden ${appt.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' : appt.status === 'blocked' ? 'bg-gray-100 text-gray-700 border border-gray-300' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>
												<div className="font-semibold text-black/80 leading-tight">
													{appt.time} • {appt.subject}
													{isCompact && (
														<span className="ml-1 text-[10px] text-black/70 whitespace-nowrap">• {appt.userName} • {appt.duration} min</span>
													)}
												</div>
												{!isCompact && (
													<div className="text-[11px] text-black/70 leading-tight">{appt.userName} • {appt.duration} min</div>
												)}
											</div>
											)
										})}
									</div>
								</div>
							</div>
						)
					})()}
				</div>
			</div>
			<div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
				<h2 className="text-2xl font-bold text-black mb-4">Manas atsauksmes</h2>
				<div className="space-y-3">
					{worker.reviews.length > 0 ? worker.reviews.map(r => (
						<div key={r.id} className="border border-gray-200 rounded-lg p-3">
							<div className="flex items-center justify-between mb-1">
								<span className="font-semibold text-black">{r.studentName}</span>
								<span className="text-yellow-600">★ {r.rating}</span>
							</div>
							<p className="text-sm text-gray-700">{r.comment}</p>
							<div className="text-xs text-gray-500 mt-1">{r.date}</div>
						</div>
					)) : (
						<div className="text-gray-500">Vēl nav atsauksmju</div>
					)}
				</div>
			</div>
		</div>
	)
}

const UserDashboard = ({ workers, userAppointments, onBook, onAddReview }: { workers: Worker[]; userAppointments: Appointment[]; onBook: (data: { workerId: number; userName: string; date: string; time: string; duration: number; subject: string }) => void; onAddReview: (data: { workerId: number; studentName: string; rating: number; comment: string }) => void }) => {
	const [isBooking, setIsBooking] = useState(false)
	const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming')
	const [form, setForm] = useState<{ workerId: number | ''; userName: string; date: string; time: string; duration: number; subject: string }>({ workerId: '', userName: 'Es', date: '', time: '', duration: 60, subject: 'Matemātika' })
	const [review, setReview] = useState<{ workerId: number | ''; rating: number; comment: string }>({ workerId: '', rating: 5, comment: '' })

	const now = new Date()
	const isUpcoming = (a: Appointment) => {
		const dt = new Date(`${a.date}T${a.time}:00`)
		return a.status !== 'completed' && dt >= now
	}
	const isHistory = (a: Appointment) => !isUpcoming(a)

	return (
				<div className="grid lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-2xl font-bold text-black">Mani pieraksti</h2>
					<button onClick={() => setIsBooking(v => !v)} className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg transition-colors">
						{isBooking ? 'Aizvērt' : 'Jauns pieraksts'}
					</button>
				</div>
				<div className="bg-gray-50 rounded-lg p-1 inline-flex mb-4">
					<button className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'upcoming' ? 'bg-white shadow text-black' : 'text-gray-600'}`} onClick={() => setActiveTab('upcoming')}>Gaidošie</button>
					<button className={`px-4 py-2 text-sm font-semibold rounded-md ${activeTab === 'history' ? 'bg-white shadow text-black' : 'text-gray-600'}`} onClick={() => setActiveTab('history')}>Privātstundu vēsture</button>
				</div>
				{isBooking && (
					<div className="grid md:grid-cols-2 gap-3 mb-6">
						<select className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" value={form.workerId} onChange={e => setForm({ ...form, workerId: e.target.value ? Number(e.target.value) : '' })}>
							<option value="">Izvēlieties pasniedzēju</option>
							{workers.map(w => (
								<option key={w.id} value={w.id}>{w.name}</option>
							))}
						</select>
						<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Datums (YYYY-MM-DD)" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
						<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Laiks (HH:MM)" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
						<input type="number" className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Ilgums (min)" value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} />
						<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Tēma" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
						<button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg" onClick={() => {
							if (!form.workerId || !form.date || !form.time) return
							onBook({ workerId: form.workerId as number, userName: form.userName, date: form.date, time: form.time, duration: form.duration, subject: form.subject })
							setForm({ workerId: '', userName: 'Es', date: '', time: '', duration: 60, subject: 'Matemātika' })
							setIsBooking(false)
						}}>Rezervēt</button>
					</div>
				)}
				<div className="space-y-3">
					{(activeTab === 'upcoming' ? userAppointments.filter(isUpcoming) : userAppointments.filter(isHistory)).length > 0 ? (
						(activeTab === 'upcoming' ? userAppointments.filter(isUpcoming) : userAppointments.filter(isHistory)).map(appt => (
							<div key={appt.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
								<div>
									<div className="font-semibold text-black">{new Date(appt.date).toLocaleDateString('lv-LV')} {appt.time}</div>
									<div className="text-sm text-gray-600">{appt.subject} • {appt.duration} min</div>
								</div>
								<div className="text-sm text-gray-500">{appt.workerName}</div>
							</div>
						))
					) : (
						<div className="text-gray-500">Nav datu</div>
					)}
				</div>

				{/* Leave a review */}
				<div className="mt-6 border-t border-gray-200 pt-4">
					<h3 className="text-lg font-semibold text-black mb-3">Atstāt atsauksmi pasniedzējam</h3>
					<div className="grid md:grid-cols-4 gap-3">
						<select className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" value={review.workerId} onChange={e => setReview({ ...review, workerId: e.target.value ? Number(e.target.value) : '' })}>
							<option value="">Izvēlieties pasniedzēju</option>
							{workers.map(w => (
								<option key={w.id} value={w.id}>{w.name}</option>
							))}
						</select>
						<input type="number" min={1} max={5} step={1} className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Vērtējums (1-5)" value={review.rating} onChange={e => setReview({ ...review, rating: Number(e.target.value) })} />
						<input className="md:col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Komentārs" value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })} />
					</div>
					<div className="mt-3">
						<button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg" onClick={() => {
							if (!review.workerId || !review.rating || !review.comment.trim()) return
							onAddReview({ workerId: review.workerId as number, studentName: 'Es', rating: Math.max(1, Math.min(5, review.rating)), comment: review.comment.trim() })
							setReview({ workerId: '', rating: 5, comment: '' })
							alert('Paldies! Atsauksme pievienota (mock).')
						}}>
							Iesniegt atsauksmi
						</button>
					</div>
				</div>
			</div>
				<div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8">
				<h2 className="text-2xl font-bold text-black mb-4">Pasniedzēji</h2>
				<div className="space-y-3 max-h-[28rem] overflow-auto pr-1">
					{workers.map(w => (
						<div key={w.id} className="border border-gray-200 rounded-lg p-3">
							<div className="flex items-center justify-between">
								<div>
									<div className="font-semibold text-black">{w.name}</div>
									<div className="text-sm text-gray-600">{w.subject}</div>
								</div>
								<div className="text-yellow-600">★ {w.rating.toFixed(1)}</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

export default ProfileSection


