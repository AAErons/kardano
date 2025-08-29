import { useMemo, useState, useEffect } from 'react'

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
	}, [])

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
						</div>
					</div>
				)}

				{role === 'admin' && (
					<AdminPanel />
				)}

				{role === 'worker' && loggedInWorker && (
					<WorkerDashboard worker={loggedInWorker} />
				)}

				{role === 'user' && (
					<UserDashboard workers={workers} userAppointments={userAppointments} onBook={bookAppointment} onAddReview={addReview} />
				)}

				{role === 'worker' && isWorkerActive === false && userId && (
					<div className="mb-6 lg:mb-10">
						<TeacherOnboarding userId={userId} onFinished={() => setIsWorkerActive(true)} />
					</div>
				)}
			</div>
		</div>
	)
}

const AdminPanel = () => {
	const [tab, setTab] = useState<'calendar' | 'teachers' | 'notifications'>('calendar')
	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow-xl p-2">
			<div className="flex gap-2">
					<button onClick={() => setTab('calendar')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'calendar' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Kalendārs</button>
					<button onClick={() => setTab('teachers')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'teachers' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Pasniedzēji</button>
					<button onClick={() => setTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'notifications' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Paziņojumi</button>
			</div>
			</div>
			{tab === 'calendar' && (
				<div className="bg-white rounded-2xl shadow-xl p-6">
					<div className="text-gray-600">Kalendārs (admins) – šeit varēsim rādīt kopskatu vai filtrēt pēc pasniedzēja. Pašlaik tukšs.</div>
								</div>
							)}
			{tab === 'teachers' && <AdminTeachers />}
			{tab === 'notifications' && (
				<div className="bg-white rounded-2xl shadow-xl p-6 text-gray-600">Paziņojumi – nav datu</div>
											)}
										</div>
									)
}

const AdminTeachers = () => {
	const [items, setItems] = useState<Array<{ id: string; name: string; username: string; description: string; active: boolean }>>([])
	const [form, setForm] = useState<{ firstName: string; lastName: string; description: string }>({ firstName: '', lastName: '', description: '' })
	const [creating, setCreating] = useState(false)
	const [created, setCreated] = useState<{ username: string; tempPassword: string } | null>(null)

	useEffect(() => {
		fetch('/api/teachers').then(r => r.json()).then(d => {
			if (d && Array.isArray(d.items)) setItems(d.items)
		}).catch(() => {})
	}, [])

                                                    return (
				<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow-xl p-6">
				<h2 className="text-2xl font-bold text-black mb-4">Pasniedzēji</h2>
				<div className="grid md:grid-cols-3 gap-3 mb-3">
					<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Vārds" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} />
					<input className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Uzvārds" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} />
					<input className="md:col-span-3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Apraksts (neobligāti)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                                            </div>
				<button disabled={creating} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-70 text-black font-semibold py-2 px-4 rounded-lg" onClick={async () => {
					if (!form.firstName.trim() || !form.lastName.trim()) return
					setCreating(true)
					try {
						const r = await fetch('/api/teachers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
						if (!r.ok) return
						const d = await r.json().catch(() => ({}))
						if (d && d.username && d.tempPassword) setCreated({ username: d.username, tempPassword: d.tempPassword })
						setForm({ firstName: '', lastName: '', description: '' })
						const list = await fetch('/api/teachers').then(x => x.json()).catch(() => null)
						if (list && Array.isArray(list.items)) setItems(list.items)
					} finally {
						setCreating(false)
					}
				}}>Pievienot pasniedzēju</button>
                                                        </div>

			{created && (
				<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
					<div className="font-semibold text-black mb-2">Izveidota pasniedzēja pieeja</div>
					<div className="grid md:grid-cols-3 gap-2 items-center">
						<input readOnly className="p-2 border border-gray-300 rounded-lg bg-white" value={created.username} />
						<input readOnly className="p-2 border border-gray-300 rounded-lg bg-white" value={created.tempPassword} />
						<div className="flex flex-wrap gap-2">
							<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={async () => { try { await navigator.clipboard.writeText(created.username) } catch {} }}>Kopēt lietotājvārdu</button>
							<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={async () => { try { await navigator.clipboard.writeText(created.tempPassword) } catch {} }}>Kopēt paroli</button>
							<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={async () => { try { await navigator.clipboard.writeText(`${created.username} ${created.tempPassword}`) } catch {} }}>Kopēt abus</button>
							<button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={() => setCreated(null)}>Aizvērt</button>
						</div>
					</div>
					<div className="text-xs text-gray-600 mt-2">Drošības nolūkos šī parole tiek rādīta tikai vienreiz.</div>
				</div>
			)}

			<div className="bg-white rounded-2xl shadow-xl p-6">
				{items.length === 0 ? (
					<div className="text-gray-500">Nav pasniedzēju</div>
				) : (
						<div className="space-y-3">
						{items.map(t => (
							<div key={t.id} className="border border-gray-200 rounded-xl p-4">
								<div className="font-semibold text-black">{t.name} <span className="text-gray-500">({t.username})</span></div>
								<div className="text-sm text-gray-700">{t.active ? 'Aktīvs' : 'Neaktīvs'}</div>
								{t.description && <div className="text-sm text-gray-600 mt-1">{t.description}</div>}
								<div className="mt-2 flex items-center gap-3">
									<label className="inline-flex items-center gap-2 text-sm">
										<input type="checkbox" checked={t.active} onChange={async (e) => {
											const active = e.target.checked
											await fetch('/api/teachers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, active }) })
											setItems(prev => prev.map(x => x.id === t.id ? { ...x, active } : x))
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
									}}>Resetēt paroli</button>
								</div>
							</div>
						))}
								</div>
							)}
						</div>
		</div>
	)
}

const TeacherOnboarding = ({ userId, onFinished }: { userId: string; onFinished: () => void }) => {
	const [photo, setPhoto] = useState<string>('')
	const [description, setDescription] = useState('')
	const [availability, setAvailability] = useState<Array<any>>([])
	const [rule, setRule] = useState<{ type: 'weekly'|'weekdayRange'|'specific'; weekdays?: string; from?: string; to?: string; until?: string; date?: string }>({ type: 'weekly', weekdays: '', from: '', to: '', until: '' })
	const [saving, setSaving] = useState(false)

	const onPhotoSelect = (file: File) => {
		const reader = new FileReader()
		reader.onload = () => setPhoto((reader.result as string) || '')
		reader.readAsDataURL(file)
	}

	const addRule = () => {
		if (rule.type === 'specific' && (!rule.date || !rule.from || !rule.to)) return
		if (rule.type !== 'specific' && (!rule.weekdays || !rule.from || !rule.to)) return
		const weekdays = rule.weekdays?.split(',').map(s => s.trim()).filter(Boolean) || []
		setAvailability(prev => [...prev, { type: rule.type, weekdays, from: rule.from, to: rule.to, until: rule.until || null, date: rule.date || null }])
		setRule({ type: 'weekly', weekdays: '', from: '', to: '', until: '' })
	}

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow p-6">
				<h2 className="text-2xl font-bold text-black mb-4">Pasniedzēja profils</h2>
				<div className="grid md:grid-cols-3 gap-3">
					<label className="md:col-span-1 cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium py-2 px-3 rounded-lg inline-block">
						Augšupielādēt foto
						<input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) onPhotoSelect(f) }} />
					</label>
					{photo && <img src={photo} alt="Foto" className="w-24 h-24 rounded-full object-cover border-2 border-yellow-200" />}
					<textarea className="md:col-span-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" rows={4} placeholder="Apraksts" value={description} onChange={e => setDescription(e.target.value)} />
				</div>
			</div>

			<div className="bg-white rounded-2xl shadow p-6">
				<h3 className="text-lg font-semibold text-black mb-3">Pieejamie laiki</h3>
				<div className="grid md:grid-cols-5 gap-3 items-end">
					<select className="p-2 border border-gray-300 rounded-lg" value={rule.type} onChange={e => setRule(r => ({ ...r, type: e.target.value as any }))}>
						<option value="weekly">Nedēļas dienas (atkārtojas)</option>
						<option value="weekdayRange">Darba dienas (diapazons)</option>
						<option value="specific">Konkrēta diena</option>
					</select>
					{rule.type !== 'specific' ? (
						<input className="p-2 border border-gray-300 rounded-lg" placeholder="Dienas, piem.: 1,3,4 (Pirmd=1..Sv=7)" value={rule.weekdays} onChange={e => setRule(r => ({ ...r, weekdays: e.target.value }))} />
					) : (
						<input type="date" className="p-2 border border-gray-300 rounded-lg" value={rule.date || ''} onChange={e => setRule(r => ({ ...r, date: e.target.value }))} />
					)}
					<input type="time" className="p-2 border border-gray-300 rounded-lg" value={rule.from || ''} onChange={e => setRule(r => ({ ...r, from: e.target.value }))} />
					<input type="time" className="p-2 border border-gray-300 rounded-lg" value={rule.to || ''} onChange={e => setRule(r => ({ ...r, to: e.target.value }))} />
					{rule.type !== 'specific' && <input type="date" className="p-2 border border-gray-300 rounded-lg" placeholder="Līdz (neobligāti)" value={rule.until || ''} onChange={e => setRule(r => ({ ...r, until: e.target.value }))} />}
					<button className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-3 rounded-lg" onClick={addRule}>Pievienot</button>
				</div>
				{availability.length > 0 && (
					<div className="mt-3 space-y-2">
						{availability.map((a, idx) => (
							<div key={idx} className="text-sm text-gray-700 flex items-center justify-between border border-gray-200 rounded-md p-2">
								<div>{a.type === 'specific' ? `Diena ${a.date}` : `Dienas: ${(a.weekdays||[]).join(',')}`} • {a.from}-{a.to} {a.until ? `(līdz ${a.until})` : ''}</div>
								<button className="text-xs text-red-600" onClick={() => setAvailability(prev => prev.filter((_, i) => i !== idx))}>Noņemt</button>
							</div>
						))}
					</div>
				)}
			</div>

			<div className="flex gap-2">
				<button disabled={saving} className="bg-green-500 hover:bg-green-600 disabled:opacity-70 text-white font-semibold py-2 px-4 rounded-lg" onClick={async () => {
					setSaving(true)
					try {
						await fetch('/api/teacher-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, photo: photo || undefined, description, availability }) })
						const prof = await fetch(`/api/teacher-profile?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => null)
						if (prof && prof.profile && prof.profile.photo) setPhoto(prof.profile.photo)
						alert('Profils saglabāts')
						onFinished()
					} finally { setSaving(false) }
				}}>Saglabāt</button>
				<button className="border border-gray-300 px-4 py-2 rounded-lg" onClick={onFinished}>Pagaidām izlaist</button>
			</div>
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


