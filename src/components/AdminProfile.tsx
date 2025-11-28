import { useEffect, useState } from 'react'

const AdminProfile = () => {
	const [tab, setTab] = useState<'calendar' | 'teachers' | 'students' | 'notifications' | 'users' | 'data' | 'reviews' | 'questions'>('calendar')
	const [unreadCount, setUnreadCount] = useState(0)

	useEffect(() => {
		try {
			const raw = localStorage.getItem('cache_admin_notifications_v1')
			if (raw) {
				const cached = JSON.parse(raw)
				if (cached && Array.isArray(cached.items)) {
					setUnreadCount(cached.items.filter((n: any) => n.unread !== false).length)
				}
			}
		} catch {}

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
			<button onClick={() => setTab('users')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'users' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Lietotāji</button>
				<button onClick={() => setTab('questions')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'questions' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Jautājumi</button>
				<button onClick={() => setTab('data')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'data' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Dati</button>
				<button onClick={() => setTab('reviews')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'reviews' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Atsauksmes</button>
				</div>
			</div>
		{tab === 'calendar' && <AdminCalendar />}
		{tab === 'teachers' && <AdminTeachers />}
		{tab === 'students' && <AdminStudents />}
		{tab === 'notifications' && <AdminNotifications onCountChange={setUnreadCount} />}
		{tab === 'users' && <AdminUsers />}
		{tab === 'questions' && <AdminQuestions />}
		{tab === 'data' && <AdminData />}
		{tab === 'reviews' && <AdminReviews />}
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
		email?: string | null
		phone?: string | null
		isSelf: boolean
		createdAt: string
	}>>([])
	const [users, setUsers] = useState<Record<string, {
		firstName: string
		lastName: string
		email: string
		phone?: string
		accountType: string
		discountCode?: string
	}>>({})
	const [loading, setLoading] = useState(true)
	const [bookingsByStudent, setBookingsByStudent] = useState<Record<string, any[]>>({})
	const [savingPaid, setSavingPaid] = useState<Record<string, boolean>>({})
	const [lastLoadTime, setLastLoadTime] = useState<number>(0)

	const loadStudents = async (forceRefresh = false) => {
		try {
			if (!forceRefresh) {
				try {
					const cached = localStorage.getItem('cache_admin_students_v2')
					if (cached) {
						const { students: cachedStudents, users: cachedUsers, timestamp } = JSON.parse(cached)
						if (timestamp && Date.now() - timestamp < 5 * 60 * 1000) {
							setStudents(cachedStudents || [])
							setUsers(cachedUsers || {})
							setLoading(false)
							setLastLoadTime(timestamp)
							return
						}
					}
				} catch {}
			}

			const studentsResponse = await fetch('/api/students?userId=all')
			if (studentsResponse.ok) {
				const studentsData = await studentsResponse.json()
				if (studentsData.success && studentsData.students) {
					setStudents(studentsData.students)
					const userIds = [...new Set(studentsData.students.map((s: any) => s.userId))] as string[]
					const userPromises = userIds.map(async (userId: string) => {
						try {
							const userResponse = await fetch(`/api/user-info?userId=${userId}`)
							if (userResponse.ok) {
								const userData = await userResponse.json()
								if (userData.success && userData.user) return { userId, user: userData.user }
							}
						} catch {}
						return null
					})
					const userResults = await Promise.all(userPromises)
					const userMap: Record<string, any> = {}
					userResults.forEach(result => { if (result) userMap[result.userId] = result.user })
					setUsers(userMap)
					const timestamp = Date.now()
					try { localStorage.setItem('cache_admin_students_v2', JSON.stringify({ students: studentsData.students, users: userMap, timestamp })) } catch {}
					setLastLoadTime(timestamp)
				}
			}
		} catch {
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => { loadStudents() }, [])

	// Load bookings per student to find first lessons
	useEffect(() => {
		const loadBookings = async () => {
			try {
				const r = await fetch('/api/bookings?role=admin')
				if (!r.ok) return
				const d = await r.json().catch(() => null)
				if (d && Array.isArray(d.items)) {
					const byStudent: Record<string, any[]> = {}
					d.items.forEach((b: any) => {
						const sid = String(b.studentId || '')
						if (!sid) return
						(byStudent[sid] ||= []).push(b)
					})
					Object.keys(byStudent).forEach(sid => {
						byStudent[sid].sort((a, b) => new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${b.date}T${b.time}:00`).getTime())
					})
					setBookingsByStudent(byStudent)
				}
			} catch {}
		}
		loadBookings()
	}, [])

	useEffect(() => {
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'cache_admin_students_v2' && e.newValue) {
				try {
					const { students: newStudents, users: newUsers, timestamp } = JSON.parse(e.newValue)
					if (timestamp > lastLoadTime) {
						setStudents(newStudents || [])
						setUsers(newUsers || {})
						setLastLoadTime(timestamp)
					}
				} catch {}
			}
		}
		window.addEventListener('storage', handleStorageChange)
		return () => window.removeEventListener('storage', handleStorageChange)
	}, [lastLoadTime])

	useEffect(() => {
		const checkCacheInvalidation = async () => {
			try {
				const response = await fetch('/api/cache-invalidation?key=admin_students')
				if (response.ok) {
					const data = await response.json()
					if (data.success && data.lastUpdate) {
						const cached = localStorage.getItem('cache_admin_students_v2')
						if (cached) {
							const { timestamp } = JSON.parse(cached)
							if (data.lastUpdate > timestamp) loadStudents(true)
						}
					}
				}
			} catch {}
		}
		checkCacheInvalidation()
		const interval = setInterval(checkCacheInvalidation, 30000)
		return () => clearInterval(interval)
	}, [])

	const handleRefresh = () => { setLoading(true); loadStudents(true) }

	if (loading) {
		return (
			<div className="bg-white rounded-2xl shadow-xl p-6">
				<h2 className="text-2xl font-bold text-black mb-4">Skolēni</h2>
				<div className="text-gray-600">Ielādē...</div>
			</div>
		)
	}

	// Show only real students (self accounts) and children; exclude parent accounts as list items
	const hasUsersLoaded = Object.keys(users).length > 0
	const filteredStudents = students.filter(s => s.isSelf === true || !hasUsersLoaded || (users[s.userId]?.accountType === 'children'))

	return (
		<div className="bg-white rounded-2xl shadow-xl p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold text-black">Skolēni</h2>
				<button onClick={handleRefresh} className="px-3 py-1 text-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors">Atjaunot</button>
			</div>
			<div className="text-sm text-gray-600 mb-4">
				Kopā: {filteredStudents.length} skolēni no {Object.keys(users).length} lietotājiem
				{lastLoadTime > 0 && (<span className="ml-2 text-xs">• Atjaunots: {new Date(lastLoadTime).toLocaleTimeString('lv-LV')}</span>)}
			</div>
			{filteredStudents.length === 0 ? (
				<div className="text-gray-600">Nav reģistrētu skolēnu</div>
			) : (
				<div className="space-y-3">
					{filteredStudents.map(student => {
						const user = users[student.userId]
						const list = bookingsByStudent[String(student.id)] || []
						const first = list.find((b: any) => b.status === 'accepted' && new Date(`${b.date}T${b.time}:00`).getTime() < Date.now())
						return (
							<div key={student.id} className="border border-gray-200 rounded-lg p-4">
						<div className="flex items-center justify-between">
							<div className="flex-1">
								<div className="font-semibold text-black">
									{student.firstName} {student.lastName}
									{(() => {
										const hasAttended = list.some((b: any) => b.status === 'accepted' && new Date(`${b.date}T${b.time}:00`).getTime() < Date.now())
										const hasPaid = list.some((b: any) => b.status === 'accepted' && b.paid === true && new Date(`${b.date}T${b.time}:00`).getTime() < Date.now())
										if (!hasAttended && !hasPaid) return null
										return (
											<span className="ml-2 inline-flex items-center gap-2">
												{hasAttended && (
													<span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">Apmeklējis</span>
												)}
												{hasPaid && (
													<span className="text-xs px-2 py-0.5 rounded-full border bg-green-50 text-green-700 border-green-200">Apmaksājis</span>
												)}
											</span>
										)
									})()}
								</div>
						<div className="text-sm text-gray-600">
							{student.isSelf ? (
								<>
									{user?.email && `E-pasts: ${user.email}`}
									{user?.phone && `${user?.email ? ' • ' : ''}Tālrunis: ${user.phone}`}
								</>
							) : 'Bērns'}
							{student.age && ` • ${student.age} gadi`}
							{student.grade && ` • ${student.grade}`}
							{student.school && ` • ${student.school}`}
						</div>
						{!student.isSelf && (student.email || student.phone) && (
							<div className="text-xs text-gray-500 mt-1">
								{student.email && `E-pasts: ${student.email}`}
								{student.phone && `${student.email ? ' • ' : ''}Tālrunis: ${student.phone}`}
							</div>
						)}
						{user?.accountType === 'children' && (
							<div className="text-xs text-gray-500 mt-1">Vecāks: {user.firstName} {user.lastName} ({user.email})</div>
						)}
						{user?.discountCode && (
							<div className="text-xs mt-1">
								<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
									<span className="font-medium">Atlaides kods:</span>
									<span className="ml-1 font-mono">{user.discountCode}</span>
								</span>
							</div>
						)}
									</div>
									<div className="text-xs text-gray-500">{new Date(student.createdAt).toLocaleDateString('lv-LV')}</div>
								</div>
								{first && first.paid !== true && (
									<div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
										<div className="flex items-center justify-end">
											<button disabled={!!savingPaid[String(first._id)]} onClick={async () => {
												const id = String(first._id)
												setSavingPaid(prev => ({ ...prev, [id]: true }))
												try {
													await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'mark_paid', bookingId: id, paid: true }) })
													setBookingsByStudent(prev => {
														const next = { ...prev }
														const arr = (next[String(student.id)] || []).map((b: any) => b._id === first._id ? { ...b, paid: true } : b)
														next[String(student.id)] = arr
														return next
													})
												} catch {} finally {
													setSavingPaid(prev => ({ ...prev, [id]: false }))
												}
											}} className="text-xs bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1">Apmaksājis</button>
										</div>
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}

const AdminTeachers = () => {
    const [items, setItems] = useState<Array<{ id: string; name: string; username: string; description: string; active: boolean; firstName?: string; lastName?: string; email?: string; phone?: string; photo?: string | null }>>([])
	const [form, setForm] = useState<{ email: string }>({ email: '' })
	const [creating, setCreating] = useState(false)
	const [created, setCreated] = useState<{ email: string; tempPassword: string; loginUrl: string } | null>(null)
	const [openId, setOpenId] = useState<string | null>(null)
	const [profiles, setProfiles] = useState<Record<string, any>>({})
	const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null)
    const [editing, setEditing] = useState<Record<string, boolean>>({})
    const [editForm, setEditForm] = useState<Record<string, { firstName: string; lastName: string; email: string; phone: string; description: string; photo: string }>>({})
	const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
	const [deleting, setDeleting] = useState<string | null>(null)

	useEffect(() => {
		try {
			const raw = localStorage.getItem('cache_admin_teachers_v1')
			if (raw) {
				const cached = JSON.parse(raw)
				if (cached && Array.isArray(cached.items)) setItems(cached.items)
			}
		} catch {}
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
											if (d && d.tempPassword) { try { await navigator.clipboard.writeText(d.tempPassword) } catch {}; alert('Jaunā pagaidu parole ir nokopēta starpliktuvē') }
										}}>Atjaunot paroli</button>
                                        <button className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50" onClick={() => {
                                            const isOpen = editing[t.id]
                                            setEditing(prev => ({ ...prev, [t.id]: !isOpen }))
                                            if (!isOpen) {
                                                const p = profiles[t.id]
                                                setEditForm(prev => ({
                                                    ...prev,
                                                    [t.id]: {
                                                        firstName: (t.firstName || p?.firstName || '').trim(),
                                                        lastName: (t.lastName || p?.lastName || '').trim(),
                                                        email: (t.email || '').trim(),
                                                        phone: (t.phone || '').trim(),
                                                        description: (p?.description || t.description || '').trim(),
                                                        photo: (p?.photo || t.photo || '') || ''
                                                    }
                                                }))
                                            }
                                        }}>{editing[t.id] ? 'Aizvērt rediģēšanu' : 'Rediģēt'}</button>
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
										<button 
											className="text-sm border border-red-300 text-red-600 hover:bg-red-50 rounded-md px-2 py-1" 
											onClick={() => setDeleteConfirm(t.id)}
										>
											Dzēst
										</button>
									</div>
									{deleteConfirm === t.id && (
										<div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
											<p className="text-sm text-red-800 mb-3">
												Vai tiešām vēlaties dzēst pasniedzēju <strong>{t.name}</strong>? 
												Tiks dzēsti arī viņa profils un visi laika sloti. Šī darbība ir neatgriezeniska.
											</p>
											<div className="flex gap-2">
												<button
													disabled={deleting === t.id}
													className="text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-semibold rounded-md px-3 py-1"
													onClick={async () => {
														setDeleting(t.id)
														try {
															const r = await fetch('/api/teachers', {
																method: 'DELETE',
																headers: { 'Content-Type': 'application/json' },
																body: JSON.stringify({ id: t.id })
															})
															if (!r.ok) {
																const e = await r.json().catch(() => ({}))
																alert(e.error || 'Neizdevās dzēst pasniedzēju')
																return
															}
															// Remove from list
															setItems(prev => {
																const next = prev.filter(x => x.id !== t.id)
																try { localStorage.setItem('cache_admin_teachers_v1', JSON.stringify({ items: next, ts: Date.now() })) } catch {}
																return next
															})
															setDeleteConfirm(null)
														} catch (err) {
															alert('Kļūda dzēšot pasniedzēju')
														} finally {
															setDeleting(null)
														}
													}}
												>
													{deleting === t.id ? 'Dzēš...' : 'Jā, dzēst'}
												</button>
												<button
													className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50"
													onClick={() => setDeleteConfirm(null)}
												>
													Atcelt
												</button>
											</div>
										</div>
									)}
								</div>
                                {editing[t.id] && (
                                    <div className="border-t border-gray-200 p-4 bg-yellow-50">
                                        {(() => {
                                            const ef = editForm[t.id] || { firstName: '', lastName: '', email: '', phone: '', description: '', photo: '' }
                                            const setEf = (patch: Partial<typeof ef>) => setEditForm(prev => ({ ...prev, [t.id]: { ...ef, ...patch } }))
                                            return (
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-4">
                                                        {ef.photo ? <img src={ef.photo} alt="Foto" className="w-16 h-16 rounded-full object-cover border-2 border-yellow-200" /> : <div className="w-16 h-16 rounded-full bg-gray-200" />}
                                                        <div className="flex-1 grid md:grid-cols-2 gap-2">
                                                            <div>
                                                                <label className="block text-xs text-gray-700 mb-1">Vārds</label>
                                                                <input value={ef.firstName} onChange={e => setEf({ firstName: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-700 mb-1">Uzvārds</label>
                                                                <input value={ef.lastName} onChange={e => setEf({ lastName: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-700 mb-1">E-pasts</label>
                                                                <input value={ef.email} onChange={e => setEf({ email: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs text-gray-700 mb-1">Tālrunis</label>
                                                                <input value={ef.phone} onChange={e => setEf({ phone: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs text-gray-700 mb-1">Apraksts</label>
                                                                <textarea rows={3} value={ef.description} onChange={e => setEf({ description: e.target.value })} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
                                                            </div>
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs text-gray-700 mb-1">Profila bilde (URL vai ielādēt)</label>
                                                                <div className="flex items-center gap-2">
                                                                    <input value={ef.photo} onChange={e => setEf({ photo: e.target.value })} className="flex-1 p-2 border border-gray-300 rounded-lg text-sm" placeholder="https://... vai data:image/jpeg;base64,..." />
                                                                    <input type="file" accept="image/*" onChange={async (e) => {
                                                                        const f = e.target.files?.[0]
                                                                        if (!f) return
                                                                        const reader = new FileReader()
                                                                        reader.onload = () => { setEf({ photo: String(reader.result || '') }) }
                                                                        reader.readAsDataURL(f)
                                                                    }} className="text-sm" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={() => setEditing(prev => ({ ...prev, [t.id]: false }))}>Atcelt</button>
                                                        <button className="text-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1" onClick={async () => {
                                                            const ef2 = editForm[t.id]
                                                            if (!ef2) return
                                                            // Save core fields to users via /api/teachers PATCH
                                                            await fetch('/api/teachers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: t.id, firstName: ef2.firstName, lastName: ef2.lastName, email: ef2.email, phone: ef2.phone }) })
                                                            // Save profile fields to teacher-profile
                                                            await fetch('/api/teacher-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: t.id, photo: ef2.photo, description: ef2.description, firstName: ef2.firstName, lastName: ef2.lastName }) })
                                                            // Refresh list
                                                            const list = await fetch('/api/teachers').then(x => x.json()).catch(() => null)
                                                            if (list && Array.isArray(list.items)) {
                                                                setItems(list.items)
                                                                try { localStorage.setItem('cache_admin_teachers_v1', JSON.stringify({ items: list.items, ts: Date.now() })) } catch {}
                                                            }
                                                            setEditing(prev => ({ ...prev, [t.id]: false }))
                                                        }}>Saglabāt</button>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                    </div>
                                )}
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
                                                                <div className="font-semibold text-black">{(p?.name && String(p.name).trim()) || `${(p?.firstName||'').trim()} ${(p?.lastName||'').trim()}`.trim() || t.name || t.username || '—'}</div>
                                                                <div className="text-sm text-gray-700 whitespace-pre-line mt-1">{p.description || '—'}</div>
                                                            </div>
                                                        </div>
                                                    <div>
                                                        <div className="font-semibold text-black mb-2">Pieejamie laiki</div>
                                                        {(() => {
                                                            const dayNames = ['Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena','Svētdiena']
                                                            const weekly = (p.availability || []).filter((a: any) => a?.type === 'weekly')
                                                            const specific = (p.availability || []).filter((a: any) => a?.type === 'specific')
                                                            const timesByDay: Record<string, Array<string>> = {}
                                                            const expandStarts = (from?: string, to?: string): string[] => {
                                                                try {
                                                                    const fh = parseInt(String(from || '00:00').split(':')[0] || '0', 10)
                                                                    const thRaw = parseInt(String(to || '00:00').split(':')[0] || '0', 10)
                                                                    const th = isNaN(thRaw) ? fh + 1 : thRaw
                                                                    const out: string[] = []
                                                                    for (let h = fh; h < th; h++) out.push(`${String(h).padStart(2,'0')}:00`)
                                                                    return out
                                                                } catch { return from ? [from] : [] }
                                                            }
                                                            weekly.forEach((a: any) => {
                                                                const weekdays = Array.isArray(a.weekdays) ? a.weekdays : []
                                                                const starts = expandStarts(a.from, a.to)
                                                                weekdays.forEach((d: any) => {
                                                                    const idx = String(Number(d) - 1)
                                                                    ;(timesByDay[idx] ||= [])
                                                                    starts.forEach((t) => { if (!timesByDay[idx].includes(t)) timesByDay[idx].push(t) })
                                                                })
                                                            })
                                                            const hasAny = Object.values(timesByDay).some(arr => (arr || []).length > 0) || specific.length > 0
                                                            if (!hasAny) return <div className="text-sm text-gray-500">Nav norādīts</div>
                                                            return (
                                                                <div className="space-y-3">
                                                                    {dayNames.map((dn, i) => (
                                                                        <div key={dn}>
                                                                            <div className="text-sm font-medium text-gray-800">{dn}:</div>
                                                                            <div className="text-sm text-gray-700">{(timesByDay[String(i)] || []).length > 0 ? timesByDay[String(i)].join(', ') : '—'}</div>
                                                                        </div>
                                                                    ))}
                                                                    {specific.length > 0 && (
                                                                        <div className="pt-2">
                                                                            <div className="text-sm font-medium text-gray-800 mb-1">Noteiktas dienas</div>
                                                                            <div className="space-y-1 text-sm text-gray-700">
                                                                                {specific.map((a: any, idx: number) => {
                                                                                    const starts = expandStarts(a.from, a.to)
                                                                                    return (
                                                                                        <div key={idx}>{a.date}: {starts.length > 0 ? starts.join(', ') : (a.from || '')}</div>
                                                                                    )
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })()}
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

const AdminData = () => {
	const [address, setAddress] = useState('')
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [codes, setCodes] = useState<Array<{ id: string; code: string; description?: string }>>([])
	const [creatingCode, setCreatingCode] = useState(false)
	const [deletingCode, setDeletingCode] = useState<Record<string, boolean>>({})
	const [newCode, setNewCode] = useState<{ code: string; description: string }>({ code: '', description: '' })
	const load = async () => {
		setLoading(true)
		try {
			const [r1, r2] = await Promise.all([
				fetch('/api/admin-data'),
				fetch('/api/discount-codes')
			])
			if (r1.ok) {
				const d = await r1.json().catch(() => null)
				if (d && d.success && d.data) setAddress(d.data.address || '')
			}
			if (r2.ok) {
				const d = await r2.json().catch(() => null)
				if (d && Array.isArray(d.items)) setCodes(d.items)
			}
		} catch {}
		setLoading(false)
	}
	useEffect(() => { load() }, [])
	const save = async () => {
		setSaving(true)
		try { await fetch('/api/admin-data', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ address }) }); await load() } catch {}
		setSaving(false)
	}
	return (
		<div className="bg-white rounded-2xl shadow-xl p-6">
			<h2 className="text-2xl font-bold text-black mb-4">Dati</h2>
			{loading ? (
				<div className="text-gray-600">Ielādē...</div>
			) : (
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1">Skolas adrese</label>
						<textarea rows={3} value={address} onChange={e => setAddress(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Ievadiet skolas adresi..." />
					</div>
					<div>
						<button disabled={saving} onClick={save} className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg disabled:opacity-60">{saving ? 'Saglabā...' : 'Saglabāt'}</button>
					</div>
					<div className="pt-4 border-t border-gray-200" />
					<div>
						<div className="flex items-center justify-between mb-2">
							<div className="text-xl font-semibold text-black">Atlaižu kodi</div>
						</div>
					<div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
						<div className="grid md:grid-cols-3 gap-2 items-end">
								<div className="md:col-span-1">
									<label className="block text-xs text-gray-700 mb-1">Kods</label>
									<input value={newCode.code} onChange={e => setNewCode(prev => ({ ...prev, code: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="PIEM10" />
								</div>
							<div className="md:col-span-2">
									<label className="block text-xs text-gray-700 mb-1">Apraksts</label>
									<input value={newCode.description} onChange={e => setNewCode(prev => ({ ...prev, description: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg" placeholder="Piem., 10% atlaide septembrī" />
								</div>
							</div>
							<div className="mt-2">
							<button disabled={creatingCode || !newCode.code} onClick={async () => {
									const code = (newCode.code || '').trim().toUpperCase()
									if (!code) return
								const payload: any = { code, description: (newCode.description || '').trim() }
									setCreatingCode(true)
									try {
										const r = await fetch('/api/discount-codes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
										if (!r.ok) {
											const e = await r.json().catch(() => ({}))
											alert(e.error || 'Neizdevās izveidot atlaižu kodu')
											return
										}
										await load()
									setNewCode({ code: '', description: '' })
									} finally {
										setCreatingCode(false)
									}
								}} className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg disabled:opacity-60">{creatingCode ? 'Pievieno...' : 'Pievienot kodu'}</button>
							</div>
						</div>

					{codes.length === 0 ? (
							<div className="text-gray-600">Nav izveidotu atlaižu kodu</div>
						) : (
							<div className="space-y-2">
							{codes.map(c => (
								<div key={c.id} className="border border-gray-200 rounded-xl p-3 bg-white">
									<div className="grid md:grid-cols-4 gap-2 items-center">
										<div className="md:col-span-1">
											<div className="text-sm font-semibold text-black">{c.code}</div>
										</div>
										<div className="md:col-span-2">
											<input value={c.description || ''} onChange={e => setCodes(prev => prev.map(x => x.id === c.id ? { ...x, description: e.target.value } : x))} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Apraksts" />
										</div>
										<div className="flex items-center gap-2 justify-end">
											<button onClick={async () => {
												const payload: any = { id: c.id, description: c.description || '' }
												const r = await fetch('/api/discount-codes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
												if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās saglabāt'); return }
												await load()
											}} className="text-sm border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50">Saglabāt</button>
											<button disabled={!!deletingCode[c.id]} onClick={async () => {
												if (!confirm('Dzēst šo atlaižu kodu?')) return
												setDeletingCode(prev => ({ ...prev, [c.id]: true }))
												try {
													const r = await fetch('/api/discount-codes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id }) })
													if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās dzēst'); return }
													setCodes(prev => prev.filter(x => x.id !== c.id))
												} finally {
													setDeletingCode(prev => ({ ...prev, [c.id]: false }))
												}
											}} className="text-sm text-red-600 border border-red-200 rounded-md px-2 py-1 hover:bg-red-50">{deletingCode[c.id] ? 'Dzēš...' : 'Dzēst'}</button>
										</div>
									</div>
								</div>
							))}
							</div>
					)}
					</div>
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
		try {
			const raw = localStorage.getItem('cache_admin_notifications_v1')
			if (raw) {
				const cached = JSON.parse(raw)
				if (cached && Array.isArray(cached.items)) setItems(cached.items)
			}
		} catch {}
		load()
	}, [])

	const openAndMarkRead = async (id: string) => {
		setOpenId(prev => prev === id ? null : id)
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

	const toggleSelect = (id: string) => setSelectedIds(prev => ({ ...prev, [id]: !prev[id] }))

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
		<div className="bg-white rounded-2xl shadow p-6">
			<h3 className="text-lg font-semibold text-black mb-4">Paziņojumi</h3>
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
			<div className="mt-3 flex items-center gap-2">
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
	)
}

export default AdminProfile



const AdminReviews = () => {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const load = async () => {
        setLoading(true)
        try {
            const r = await fetch('/api/reviews?role=admin')
            if (r.ok) {
                const d = await r.json().catch(() => null)
                if (d && Array.isArray(d.items)) setItems(d.items)
            }
        } finally { setLoading(false) }
    }
    useEffect(() => { load() }, [])

    const approve = async (id: string) => {
        await fetch('/api/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'approve' }) })
        load()
    }
    const deny = async (id: string) => {
        await fetch('/api/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'deny' }) })
        load()
    }

    const pending = items.filter(x => x.status === 'pending')
    const approved = items.filter(x => x.status === 'approved')
    const denied = items.filter(x => x.status === 'denied')

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-black">Atsauksmes</h2>
                <button onClick={load} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Atjaunot</button>
            </div>
            {loading ? (
                <div className="text-gray-600">Ielādē...</div>
            ) : (
                <div className="space-y-6">
                    <div>
                        <div className="text-lg font-semibold text-black mb-2">Gaida apstiprinājumu</div>
                        {pending.length === 0 ? (
                            <div className="text-sm text-gray-600">Nav</div>
                        ) : (
                            <div className="space-y-2">
                                {pending.map(r => (
                                    <div key={String(r._id)} className="border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-start justify-between">
                                            <div className="text-sm text-gray-800">
                                                <div className="font-medium">{r.userName || 'Lietotājs'} → {r.teacherName || 'Pasniedzējs'}</div>
                                                {r.lesson && (
                                                    <div className="text-xs text-gray-600">{new Date(r.lesson.date).toLocaleDateString('lv-LV')} {r.lesson.time}</div>
                                                )}
                                                <div className="text-xs text-gray-700 mt-1">Vērtējums: {r.rating} / 5</div>
                                                {r.comment && <div className="text-xs text-gray-700 whitespace-pre-line mt-1">{r.comment}</div>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => approve(String(r._id))} className="text-sm bg-green-500 hover:bg-green-600 text-white rounded-md px-3 py-1">Apstiprināt</button>
                                                <button onClick={() => deny(String(r._id))} className="text-sm bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1">Noraidīt</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-black mb-2">Apstiprinātās</div>
                        {approved.length === 0 ? (
                            <div className="text-sm text-gray-600">Nav</div>
                        ) : (
                            <div className="space-y-2">
                                {approved.map(r => (
                                    <div key={String(r._id)} className="border border-gray-200 rounded-lg p-3 bg-green-50">
                                        <div className="text-sm text-gray-800">
                                            <div className="font-medium">{r.userName || 'Lietotājs'} → {r.teacherName || 'Pasniedzējs'}</div>
                                            <div className="text-xs text-gray-700">Vērtējums: {r.rating} / 5</div>
                                            {r.comment && <div className="text-xs text-gray-700 whitespace-pre-line mt-1">{r.comment}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="text-lg font-semibold text-black mb-2">Noraidītās</div>
                        {denied.length === 0 ? (
                            <div className="text-sm text-gray-600">Nav</div>
                        ) : (
                            <div className="space-y-2">
                                {denied.map(r => (
                                    <div key={String(r._id)} className="border border-gray-200 rounded-lg p-3 bg-red-50">
                                        <div className="text-sm text-gray-800">
                                            <div className="font-medium">{r.userName || 'Lietotājs'} → {r.teacherName || 'Pasniedzējs'}</div>
                                            <div className="text-xs text-gray-700">Vērtējums: {r.rating} / 5</div>
                                            {r.comment && <div className="text-xs text-gray-700 whitespace-pre-line mt-1">{r.comment}</div>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
const AdminUsers = () => {
    const [items, setItems] = useState<Array<{ id: string; firstName: string; lastName: string; email: string; phone?: string; accountType: string; studentCount: number; createdAt: string }>>([])
    const [loading, setLoading] = useState(true)
    const [openId, setOpenId] = useState<string | null>(null)
    const [submitting, setSubmitting] = useState(false)
    const [subtab, setSubtab] = useState<'list'|'blacklist'>('list')
    const [blacklist, setBlacklist] = useState<Array<{ id: string; email: string; reason?: string; createdAt?: string }>>([])
    const [blForm, setBlForm] = useState<{ email: string; reason: string }>({ email: '', reason: '' })

    const load = async () => {
        setLoading(true)
        try {
            const r = await fetch('/api/users')
            if (r.ok) {
                const d = await r.json().catch(() => null)
                if (d && Array.isArray(d.items)) setItems(d.items)
            }
        } finally { setLoading(false) }
    }
    useEffect(() => { if (subtab === 'list') load() }, [subtab])

    const loadBlacklist = async () => {
        try {
            const r = await fetch('/api/blacklist')
            if (r.ok) {
                const d = await r.json().catch(() => null)
                if (d && Array.isArray(d.items)) setBlacklist(d.items)
            }
        } catch {}
    }
    useEffect(() => { if (subtab === 'blacklist') loadBlacklist() }, [subtab])

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex gap-2 mb-4">
                <button onClick={() => setSubtab('list')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${subtab === 'list' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Profilu saraksts</button>
                <button onClick={() => setSubtab('blacklist')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${subtab === 'blacklist' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Melnais saraksts</button>
            </div>

            {subtab === 'list' ? (
                loading ? <div className="text-gray-600">Ielādē...</div> : (
                    <div className="space-y-3">
                        {items.length === 0 ? (
                            <div className="text-gray-600">Nav lietotāju</div>
                        ) : items.map(u => (
                            <div key={u.id} className="border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-semibold text-black">{u.firstName} {u.lastName}</div>
                                        <div className="text-sm text-gray-700">{u.email} {u.phone ? `• ${u.phone}` : ''}</div>
                                        <div className="text-xs text-gray-500">
                                            {u.accountType === 'children' ? (
                                                <>Bērni: {u.studentCount} • {new Date(u.createdAt).toLocaleDateString('lv-LV')}</>
                                            ) : (
                                                <>{new Date(u.createdAt).toLocaleDateString('lv-LV')}</>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setOpenId(prev => prev === u.id ? null : u.id)} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Dzēst</button>
                                    </div>
                                </div>
                                {openId === u.id && (
                                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="text-sm text-red-800 font-semibold mb-1">Šis profils tiks neatgriezeniski dzēsts.</div>
                                        <div className="text-xs text-red-700 mb-2">Tiks atceltas arī visas šī profila rezervācijas.</div>
                                        <div className="flex items-center gap-2">
                                            <button disabled={submitting} onClick={async () => {
                                                setSubmitting(true)
                                                try {
                                                    const r = await fetch('/api/user-delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: u.id }) })
                                                    if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās dzēst profilu'); setSubmitting(false); return }
                                                    setOpenId(null)
                                                    load()
                                                    // Add to blacklist
                                                    try { await fetch('/api/blacklist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: u.email, reason: 'Dzēsts profīls' }) }) } catch {}
                                                } finally { setSubmitting(false) }
                                            }} className="text-sm bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1">{submitting ? 'Dzēš...' : 'Dzēst'}</button>
                                            <button onClick={() => setOpenId(null)} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Atcelt</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div>
                    <div className="border border-gray-200 rounded-xl p-4 mb-3">
                        <div className="grid md:grid-cols-3 gap-2 items-end">
                            <input className="p-2 border border-gray-300 rounded-lg" placeholder="E-pasts" value={blForm.email} onChange={e => setBlForm(prev => ({ ...prev, email: e.target.value }))} />
                            <input className="p-2 border border-gray-300 rounded-lg" placeholder="Pamatojums (neobligāti)" value={blForm.reason} onChange={e => setBlForm(prev => ({ ...prev, reason: e.target.value }))} />
                            <button onClick={async () => { const email = (blForm.email || '').trim(); if (!email) return; await fetch('/api/blacklist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, reason: blForm.reason || '' }) }); setBlForm({ email: '', reason: '' }); loadBlacklist() }} className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-2">Pievienot</button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {blacklist.length === 0 ? (
                            <div className="text-gray-600">Nav ierakstu</div>
                        ) : blacklist.map(b => (
                            <div key={b.id} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-black">{b.email}</div>
                                    {b.reason && <div className="text-sm text-gray-700">{b.reason}</div>}
                                </div>
                                <button onClick={async () => { await fetch('/api/blacklist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: b.id }) }); loadBlacklist() }} className="text-sm text-red-600 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50">Dzēst</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

const AdminCalendar = () => {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [selectedDay, setSelectedDay] = useState<number | null>(null)
	const [loading, setLoading] = useState(true)
	const [slots, setSlots] = useState<any[]>([])
	const [bookings, setBookings] = useState<any[]>([])
	const [refreshKey, setRefreshKey] = useState<number>(0)
	const [calendarView, setCalendarView] = useState<'teachers' | 'children'>('teachers')
	const [teacherFilter, setTeacherFilter] = useState<string>('')
	const [childFilter, setChildFilter] = useState<string>('')
	const [exportFrom, setExportFrom] = useState<string>('')
	const [exportTo, setExportTo] = useState<string>('')

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear()
		const month = date.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const daysInMonth = lastDay.getDate()
		const startingDay = (firstDay.getDay() + 6) % 7
		return { daysInMonth, startingDay }
	}
	const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
	const getSlotsForDate = (dateStr: string) => (slots || []).filter((s: any) => s?.date === dateStr)
	const { daysInMonth, startingDay } = getDaysInMonth(selectedDate)

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			setLoading(true)
			try {
				const [slotsRes, bookingsRes] = await Promise.all([
					fetch('/api/time-slots'),
					fetch('/api/bookings?role=admin')
				])
				let s: any[] = []
				if (slotsRes.ok) {
					const d = await slotsRes.json().catch(() => null)
					s = (d && d.timeSlots) || []
				}
				let b: any[] = []
				if (bookingsRes.ok) {
					const d = await bookingsRes.json().catch(() => null)
					b = (d && d.items) || []
				}
				if (!cancelled) { setSlots(s); setBookings(b) }
			} catch {
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		load()
		return () => { cancelled = true }
	}, [refreshKey])

	if (calendarView === 'children') {
		return (
			<div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
				<div className="flex flex-wrap gap-2">
					<button onClick={() => setCalendarView('teachers')} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-700 hover:bg-yellow-100">Skolotāji</button>
					<button onClick={() => setCalendarView('children')} className="px-3 py-1 rounded-lg text-sm font-semibold bg-yellow-400 text-black">Bērni</button>
				</div>
				<div className="flex items-center justify-between">
					<div className="text-lg font-semibold text-black">
						{selectedDate.toLocaleString('lv-LV', { month: 'long', year: 'numeric' })}
					</div>
					<div className="flex items-center gap-2">
						<select value={childFilter} onChange={e => setChildFilter(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm min-w-[12rem]">
							<option value="">Visi bērni</option>
							{Array.from(new Map(bookings.map((b: any) => [String(b.studentId || b.userId || ''), (b.studentName || b.userName || '—')])).entries())
								.filter(([id]) => id)
								.sort((a, b) => a[1].localeCompare(b[1]))
								.map(([id, name]) => (<option key={id} value={id}>{name}</option>))}
						</select>
						<button onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Iepriekšējais</button>
						<button onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Nākamais</button>
					</div>
				</div>

				{/* Export panel for children */}
				<div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
					<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
						<div className="flex flex-col sm:flex-row gap-2">
							<div>
								<label className="block text-xs text-gray-700 mb-1">No datuma</label>
								<input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm" />
							</div>
							<div>
								<label className="block text-xs text-gray-700 mb-1">Līdz datumam</label>
								<input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm" />
							</div>
						</div>
						<div>
						<button onClick={async () => {
							try {
								const XLSX: any = await import('xlsx')
								let from: Date
								let to: Date
								if (exportFrom && exportTo) {
									from = new Date(exportFrom)
									to = new Date(exportTo)
									to.setHours(23,59,59,999)
								} else {
									const year = selectedDate.getFullYear()
									const month = selectedDate.getMonth()
									from = new Date(year, month, 1)
									to = new Date(year, month + 1, 0)
									to.setHours(23,59,59,999)
								}
								const inRange = (dStr: string) => {
									try {
										const d = new Date(dStr)
										if (isNaN(d.getTime())) return false
										return d >= from && d <= to
									} catch { return false }
								}
								const toTs = (date: string, time?: string) => new Date(`${date}T${time || '00:00'}:00`).getTime()
								// Build earliest accepted booking per child (any teacher)
								const earliestByStudent: Record<string, number> = {}
								for (const b of bookings as any[]) {
									if (b.status !== 'accepted') continue
									const sid = String(b.studentId || b.userId || '')
									if (!sid) continue
									const ts = toTs(b.date, b.time)
									if (!earliestByStudent[sid] || ts < earliestByStudent[sid]) earliestByStudent[sid] = ts
								}
								const agg: Record<string, { childName: string; groupHad: number; individualHad: number; groupLateCancels: number; individualLateCancels: number; discountCode: string }> = {}
								// Build a map of userId to discount code from bookings
								const userDiscountCodes: Record<string, string> = {}
								for (const b of bookings as any[]) {
									const uid = String(b.userId || '')
									if (uid && b.userDiscountCode && !userDiscountCodes[uid]) {
										userDiscountCodes[uid] = b.userDiscountCode
									}
								}
								for (const b of bookings as any[]) {
									if (!inRange(b.date)) continue
									const studentId = String(b.studentId || b.userId || '')
									if (!studentId) continue
									if (childFilter && studentId !== childFilter) continue
									const isGroup = b.lessonType === 'group'
									const lessonTs = toTs(b.date, b.time)
									const userId = String(b.userId || '')
									const discountCode = userDiscountCodes[userId] || b.userDiscountCode || '—'
									agg[studentId] ||= { childName: b.studentName || b.userName || '—', groupHad: 0, individualHad: 0, groupLateCancels: 0, individualLateCancels: 0, discountCode }
									// Teacher late cancellations
									if (b.status === 'cancelled' && b.cancelledBy === 'teacher') {
										const updatedAtTs = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
										const dayStart = new Date(b.date); dayStart.setHours(0,0,0,0)
										const isLateTeacherCancel = updatedAtTs >= dayStart.getTime()
										if (isLateTeacherCancel) {
											if (isGroup) agg[studentId].groupLateCancels++
											else agg[studentId].individualLateCancels++
										}
										continue
									}
									// Count lessons had: accepted and occurred
									if (b.status === 'accepted' && !isNaN(lessonTs) && lessonTs < Date.now()) {
										const isFirstEver = earliestByStudent[studentId] === lessonTs
										if (isFirstEver && b.attended !== true) continue
										if (isGroup) agg[studentId].groupHad++
										else agg[studentId].individualHad++
									}
								}
								const rows = Object.entries(agg)
									.sort((a, b) => a[1].childName.localeCompare(b[1].childName))
									.map(([_, v]) => ({
										Skolēns: v.childName,
										'Atlaides kods': v.discountCode,
										'Individuālās nodarbības': v.individualHad,
										'Grupu nodarbības': v.groupHad,
										'Atceltas (vēlu) individuālās': v.individualLateCancels,
										'Atceltas (vēlu) grupu': v.groupLateCancels,
									}))
								
								// Create worksheet with title row
								const title = exportFrom && exportTo ? `${exportFrom} līdz ${exportTo}` : selectedDate.toLocaleString('lv-LV', { month: 'long', year: 'numeric' })
								const ws = XLSX.utils.aoa_to_sheet([
									[`Skolēnu statistika - ${title}`],
									[],
									['Skolēns', 'Atlaides kods', 'Individuālās nodarbības', 'Grupu nodarbības', 'Atceltas (vēlu) individuālās', 'Atceltas (vēlu) grupu']
								])
								
								// Add data rows
								XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4', skipHeader: true })
								
								// Calculate totals
								const totalIndividual = rows.reduce((sum, r) => sum + r['Individuālās nodarbības'], 0)
								const totalGroup = rows.reduce((sum, r) => sum + r['Grupu nodarbības'], 0)
								const totalCancelIndividual = rows.reduce((sum, r) => sum + r['Atceltas (vēlu) individuālās'], 0)
								const totalCancelGroup = rows.reduce((sum, r) => sum + r['Atceltas (vēlu) grupu'], 0)
								
								// Add totals row
								const lastRow = rows.length + 4
								XLSX.utils.sheet_add_aoa(ws, [['KOPĀ:', '', totalIndividual, totalGroup, totalCancelIndividual, totalCancelGroup]], { origin: `A${lastRow}` })
								
								// Set column widths
								ws['!cols'] = [
									{ wch: 25 }, // Skolēns
									{ wch: 15 }, // Atlaides kods
									{ wch: 22 }, // Individuālās
									{ wch: 18 }, // Grupu
									{ wch: 26 }, // Atceltas individuālās
									{ wch: 22 }  // Atceltas grupu
								]
								
								// Style title
								if (!ws['A1']) ws['A1'] = { t: 's', v: '' }
								ws['A1'].s = {
									font: { bold: true, sz: 16, color: { rgb: '000000' } },
									alignment: { horizontal: 'left', vertical: 'center' },
									fill: { fgColor: { rgb: 'FCD34D' } }
								}
								
								// Merge title cells
								if (!ws['!merges']) ws['!merges'] = []
								ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } })
								
								// Style header row
								const headerCells = ['A3', 'B3', 'C3', 'D3', 'E3', 'F3']
								headerCells.forEach(cell => {
									if (!ws[cell]) ws[cell] = { t: 's', v: '' }
									ws[cell].s = {
										font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
										fill: { fgColor: { rgb: '1F2937' } },
										alignment: { horizontal: 'center', vertical: 'center' },
										border: {
											top: { style: 'thin', color: { rgb: '000000' } },
											bottom: { style: 'thin', color: { rgb: '000000' } },
											left: { style: 'thin', color: { rgb: '000000' } },
											right: { style: 'thin', color: { rgb: '000000' } }
										}
									}
								})
								
								// Style data rows with alternating colors
								for (let i = 0; i < rows.length; i++) {
									const rowNum = i + 4
									const isEven = i % 2 === 0
									const cells = ['A', 'B', 'C', 'D', 'E', 'F'].map(col => `${col}${rowNum}`)
									cells.forEach((cell, idx) => {
										if (!ws[cell]) ws[cell] = { t: 's', v: '' }
										ws[cell].s = {
											fill: { fgColor: { rgb: isEven ? 'FFFFFF' : 'F9FAFB' } },
											alignment: { horizontal: (idx === 0 || idx === 1) ? 'left' : 'center', vertical: 'center' },
											border: {
												top: { style: 'thin', color: { rgb: 'E5E7EB' } },
												bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
												left: { style: 'thin', color: { rgb: 'E5E7EB' } },
												right: { style: 'thin', color: { rgb: 'E5E7EB' } }
											}
										}
									})
								}
								
								// Style totals row
								const totalCells = ['A', 'B', 'C', 'D', 'E', 'F'].map(col => `${col}${lastRow}`)
								totalCells.forEach((cell, idx) => {
									if (!ws[cell]) ws[cell] = { t: 's', v: '' }
									ws[cell].s = {
										font: { bold: true, sz: 12 },
										fill: { fgColor: { rgb: 'FEF3C7' } },
										alignment: { horizontal: idx === 0 ? 'left' : 'center', vertical: 'center' },
										border: {
											top: { style: 'medium', color: { rgb: '000000' } },
											bottom: { style: 'medium', color: { rgb: '000000' } },
											left: { style: 'thin', color: { rgb: '000000' } },
											right: { style: 'thin', color: { rgb: '000000' } }
										}
									}
								})
								
								const wb = XLSX.utils.book_new()
								XLSX.utils.book_append_sheet(wb, ws, 'Skolēnu statistika')
								const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
								const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
								const a = document.createElement('a')
								const url = URL.createObjectURL(blob)
								a.href = url
								const filename = exportFrom && exportTo ? `${exportFrom}_lidz_${exportTo}` : selectedDate.toLocaleString('lv-LV', { month: 'long', year: 'numeric' })
								a.download = `statistika-berni-${filename}.xlsx`
								a.click()
								setTimeout(() => URL.revokeObjectURL(url), 1500)
							} catch (e) { alert('Neizdevās eksportēt XLSX') }
						}} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Lejupielādēt statistiku</button>
						</div>
					</div>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
				<span className="font-semibold text-gray-700">Leģenda:</span>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
					<span className="text-gray-700">Gaida apstiprinājumu</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-green-600"></div>
					<span className="text-gray-700">Apstiprināts</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-blue-500"></div>
					<span className="text-gray-700">Apmeklēts</span>
				</div>
			</div>

			{/* Weekday Headers */}
			<div className="grid grid-cols-7 gap-1 mb-2">
				{['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv'].map((day, index) => (
					<div key={index} className="text-center font-semibold text-gray-600 text-xs lg:text-sm">
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1">
				{Array.from({ length: startingDay }, (_, i) => (
					<div key={`empty-${i}`} className="h-20 lg:h-24" />
				))}
				{Array.from({ length: daysInMonth }, (_, idx) => {
					const day = idx + 1
					const cellDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
					const isPast = cellDate.getTime() < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
					const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
					const dayBookings = bookings.filter((b: any) => b.date === dateStr && (b.status === 'accepted' || b.status === 'pending' || b.status === 'pending_unavailable') && (!childFilter || String(b.studentId || b.userId || '') === childFilter))
					const nowTs = Date.now()
					
					// Categorize bookings
					const attendedBookings: any[] = []
					const acceptedBookings: any[] = []
					const pendingBookings: any[] = []
					
					dayBookings.forEach((b: any) => {
						const bookingTs = new Date(`${b.date}T${b.time}:00`).getTime()
						if (isPast || bookingTs < nowTs) {
							if (b.attended === true) {
								attendedBookings.push(b)
							} else if (b.status === 'accepted') {
								acceptedBookings.push(b)
							}
						} else {
							if (b.status === 'accepted') {
								acceptedBookings.push(b)
							} else {
								pendingBookings.push(b)
							}
						}
					})
					
					const totalBookings = dayBookings.length
					const circleSize = totalBookings > 20 ? 'w-1.5 h-1.5 lg:w-2 lg:h-2' : 'w-2 h-2 lg:w-2.5 lg:h-2.5'
					const gapSize = totalBookings > 20 ? 'gap-1' : 'gap-1.5'
					
					let cellBgClass = ''
					if (isPast) {
						cellBgClass = 'bg-gray-50 hover:bg-gray-100'
					} else if (totalBookings > 0) {
						cellBgClass = 'bg-green-50 hover:bg-green-100'
					} else {
						cellBgClass = 'bg-blue-50 hover:bg-blue-100'
					}
					
					return (
						<div key={day} className={`h-20 lg:h-24 border p-1 cursor-pointer ${cellBgClass}`} onClick={() => { setSelectedDay(day); setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)) }}>
							<div className="text-xs font-medium mb-1">{day}</div>
							{totalBookings > 0 && (
								<div className={`flex flex-wrap ${gapSize}`}>
									{attendedBookings.map((_, i) => (
										<div key={`attended-${i}`} className={`${circleSize} rounded-full bg-blue-500`} title="Apmeklēts" />
									))}
									{acceptedBookings.map((_, i) => (
										<div key={`accepted-${i}`} className={`${circleSize} rounded-full bg-green-600`} title="Apstiprināts" />
									))}
									{pendingBookings.map((_, i) => (
										<div key={`pending-${i}`} className={`${circleSize} rounded-full bg-yellow-500`} title="Gaida apstiprinājumu" />
									))}
								</div>
							)}
						</div>
					)
				})}
			</div>

				{selectedDay && (() => {
					const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
					const dayBookings = bookings
						.filter((b: any) => b.date === dateStr && (b.status === 'accepted' || b.status === 'pending' || b.status === 'pending_unavailable') && (!childFilter || String(b.studentId || b.userId || '') === childFilter))
						.sort((a: any, b: any) => String(a.time).localeCompare(String(b.time)))
					return (
						<div className="mt-4">
							<h4 className="font-semibold text-black mb-2">Rezervācijas {new Date(dateStr).toLocaleDateString('lv-LV')}</h4>
							<div className="space-y-2">
								{dayBookings.length === 0 ? (
									<div className="text-sm text-gray-600">Nav rezervāciju šajā dienā</div>
								) : dayBookings.map((b: any) => {
									const statusClass = b.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
									return (
										<div key={String(b._id)} className={`border rounded-md p-3 text-sm ${statusClass}`}>
											<div className="flex items-start justify-between">
												<div>
													<div className="font-medium text-black">{b.time} • {b.studentName || b.userName || '—'}</div>
													<div className="text-xs text-gray-600">Pasniedzējs: {b.teacherName || '—'}</div>
												</div>
												<div className="flex items-center gap-2">
													{b.status === 'accepted' && (
														<>
															<span className={`text-xs px-2 py-0.5 rounded-md border ${b.paid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>Apmaksāts: {b.paid ? 'Jā' : 'Nē'}</span>
															<span className={`text-xs px-2 py-0.5 rounded-md border ${b.attended ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>Apmeklēts: {b.attended ? 'Jā' : 'Nē'}</span>
														</>
													)}
												</div>
											</div>
										</div>
									)
								})}
							</div>
						</div>
					)
				})()}
			</div>
		)
	}

	return (
		<div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
			<div className="flex flex-wrap gap-2">
				<button onClick={() => setCalendarView('teachers')} className="px-3 py-1 rounded-lg text-sm font-semibold bg-yellow-400 text-black">Skolotāji</button>
				<button onClick={() => setCalendarView('children')} className="px-3 py-1 rounded-lg text-sm font-semibold text-gray-700 hover:bg-yellow-100">Bērni</button>
			</div>
			<div className="flex items-center justify-between">
				<div className="text-lg font-semibold text-black">
					{selectedDate.toLocaleString('lv-LV', { month: 'long', year: 'numeric' })}
				</div>
				<div className="flex items-center gap-2">
					<select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm min-w-[12rem]">
 						<option value="">Visi pasniedzēji</option>
						{(() => {
							const pairs: Array<{ id: string; name: string }> = []
							;[...slots, ...bookings].forEach((x: any) => {
								const id = String(x?.teacherId || '')
								const name = x?.teacherName
								if (id && name) pairs.push({ id, name })
							})
							const dict: Record<string, string> = {}
							pairs.forEach(p => { if (!dict[p.id]) dict[p.id] = p.name })
							return Object.entries(dict)
								.sort((a, b) => a[1].localeCompare(b[1]))
								.map(([id, name]) => (<option key={id} value={id}>{name}</option>))
						})()}
					</select>
					<button onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Iepriekšējais</button>
					<button onClick={() => setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Nākamais</button>
					<button onClick={() => setRefreshKey(k => k + 1)} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Atjaunot</button>
				</div>
			</div>

			{/* Export panel */}
			<div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
				<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
					<div className="flex flex-col sm:flex-row gap-2">
						<div>
							<label className="block text-xs text-gray-700 mb-1">No datuma</label>
							<input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm" />
						</div>
						<div>
							<label className="block text-xs text-gray-700 mb-1">Līdz datumam</label>
							<input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} className="p-2 border border-gray-300 rounded-lg text-sm" />
						</div>
					</div>
					<div>
					<button onClick={async () => {
							try {
								const XLSX: any = await import('xlsx')
								let from: Date
								let to: Date
								if (exportFrom && exportTo) {
									from = new Date(exportFrom)
									to = new Date(exportTo)
									to.setHours(23,59,59,999)
								} else {
									const year = selectedDate.getFullYear()
									const month = selectedDate.getMonth()
									from = new Date(year, month, 1)
									to = new Date(year, month + 1, 0)
									to.setHours(23,59,59,999)
								}
								const inRange = (dStr: string) => {
									try {
										const d = new Date(dStr)
										if (isNaN(d.getTime())) return false
										return d >= from && d <= to
									} catch { return false }
								}
						const toTs = (date: string, time?: string) => new Date(`${date}T${time || '00:00'}:00`).getTime()
						// Build earliest accepted booking per student (per teacher not needed here)
						const earliestByStudent: Record<string, number> = {}
						for (const b of bookings as any[]) {
							if (b.status !== 'accepted') continue
							const sid = String(b.studentId || b.userId || '')
							if (!sid) continue
							const ts = toTs(b.date, b.time)
							if (!earliestByStudent[sid] || ts < earliestByStudent[sid]) earliestByStudent[sid] = ts
						}
						const nowTs = Date.now()
						const agg: Record<string, { childName: string; groupHad: number; individualHad: number; groupLateCancels: number; individualLateCancels: number; discountCode: string }> = {}
						// Build a map of userId to discount code from bookings
						const userDiscountCodes: Record<string, string> = {}
						for (const b of bookings as any[]) {
							const uid = String(b.userId || '')
							if (uid && b.userDiscountCode && !userDiscountCodes[uid]) {
								userDiscountCodes[uid] = b.userDiscountCode
							}
						}
						for (const b of bookings as any[]) {
							if (!inRange(b.date)) continue
							if (teacherFilter && String(b.teacherId) !== teacherFilter) continue
							const studentId = String(b.studentId || b.userId || '')
							if (!studentId) continue
							if (childFilter && studentId !== childFilter) continue
							const isGroup = b.lessonType === 'group'
							const lessonTs = toTs(b.date, b.time)
							const userId = String(b.userId || '')
							const discountCode = userDiscountCodes[userId] || b.userDiscountCode || '—'
							agg[studentId] ||= { childName: b.studentName || b.userName || '—', groupHad: 0, individualHad: 0, groupLateCancels: 0, individualLateCancels: 0, discountCode }
							// Teacher late cancellations
							if (b.status === 'cancelled' && b.cancelledBy === 'teacher') {
								const updatedAtTs = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
								const dayStart = new Date(b.date); dayStart.setHours(0,0,0,0)
								const isLateTeacherCancel = updatedAtTs >= dayStart.getTime()
								if (isLateTeacherCancel) {
									if (isGroup) agg[studentId].groupLateCancels++
									else agg[studentId].individualLateCancels++
								}
								continue
							}
							// Count lessons had: accepted and occurred
							if (b.status === 'accepted' && !isNaN(lessonTs) && lessonTs < nowTs) {
								const isFirstEver = earliestByStudent[studentId] === lessonTs
								if (isFirstEver && b.attended !== true) {
									continue
								}
								if (isGroup) agg[studentId].groupHad++
								else agg[studentId].individualHad++
							}
						}
						const rows = Object.entries(agg)
							.sort((a, b) => a[1].childName.localeCompare(b[1].childName))
							.map(([_, v]) => ({
								Skolēns: v.childName,
								'Atlaides kods': v.discountCode,
								'Individuālās nodarbības': v.individualHad,
								'Grupu nodarbības': v.groupHad,
								'Atceltas (vēlu) individuālās': v.individualLateCancels,
								'Atceltas (vēlu) grupu': v.groupLateCancels,
							}))
						
						// Create worksheet with title row
						const title = exportFrom && exportTo ? `${exportFrom} līdz ${exportTo}` : selectedDate.toLocaleString('lv-LV', { month: 'long', year: 'numeric' })
						const ws = XLSX.utils.aoa_to_sheet([
							[`Skolēnu statistika - ${title}`],
							[],
							['Skolēns', 'Atlaides kods', 'Individuālās nodarbības', 'Grupu nodarbības', 'Atceltas (vēlu) individuālās', 'Atceltas (vēlu) grupu']
						])
						
						// Add data rows
						XLSX.utils.sheet_add_json(ws, rows, { origin: 'A4', skipHeader: true })
						
						// Calculate totals
						const totalIndividual = rows.reduce((sum, r) => sum + r['Individuālās nodarbības'], 0)
						const totalGroup = rows.reduce((sum, r) => sum + r['Grupu nodarbības'], 0)
						const totalCancelIndividual = rows.reduce((sum, r) => sum + r['Atceltas (vēlu) individuālās'], 0)
						const totalCancelGroup = rows.reduce((sum, r) => sum + r['Atceltas (vēlu) grupu'], 0)
						
						// Add totals row
						const lastRow = rows.length + 4
						XLSX.utils.sheet_add_aoa(ws, [['KOPĀ:', '', totalIndividual, totalGroup, totalCancelIndividual, totalCancelGroup]], { origin: `A${lastRow}` })
						
						// Set column widths
						ws['!cols'] = [
							{ wch: 25 }, // Skolēns
							{ wch: 15 }, // Atlaides kods
							{ wch: 22 }, // Individuālās
							{ wch: 18 }, // Grupu
							{ wch: 26 }, // Atceltas individuālās
							{ wch: 22 }  // Atceltas grupu
						]
						
						// Style title
						if (!ws['A1']) ws['A1'] = { t: 's', v: '' }
						ws['A1'].s = {
							font: { bold: true, sz: 16, color: { rgb: '000000' } },
							alignment: { horizontal: 'left', vertical: 'center' },
							fill: { fgColor: { rgb: 'FCD34D' } }
						}
						
						// Merge title cells
						if (!ws['!merges']) ws['!merges'] = []
						ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } })
						
						// Style header row
						const headerCells = ['A3', 'B3', 'C3', 'D3', 'E3', 'F3']
						headerCells.forEach(cell => {
							if (!ws[cell]) ws[cell] = { t: 's', v: '' }
							ws[cell].s = {
								font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12 },
								fill: { fgColor: { rgb: '1F2937' } },
								alignment: { horizontal: 'center', vertical: 'center' },
								border: {
									top: { style: 'thin', color: { rgb: '000000' } },
									bottom: { style: 'thin', color: { rgb: '000000' } },
									left: { style: 'thin', color: { rgb: '000000' } },
									right: { style: 'thin', color: { rgb: '000000' } }
								}
							}
						})
						
						// Style data rows with alternating colors
						for (let i = 0; i < rows.length; i++) {
							const rowNum = i + 4
							const isEven = i % 2 === 0
							const cells = ['A', 'B', 'C', 'D', 'E', 'F'].map(col => `${col}${rowNum}`)
							cells.forEach((cell, idx) => {
								if (!ws[cell]) ws[cell] = { t: 's', v: '' }
								ws[cell].s = {
									fill: { fgColor: { rgb: isEven ? 'FFFFFF' : 'F9FAFB' } },
									alignment: { horizontal: (idx === 0 || idx === 1) ? 'left' : 'center', vertical: 'center' },
									border: {
										top: { style: 'thin', color: { rgb: 'E5E7EB' } },
										bottom: { style: 'thin', color: { rgb: 'E5E7EB' } },
										left: { style: 'thin', color: { rgb: 'E5E7EB' } },
										right: { style: 'thin', color: { rgb: 'E5E7EB' } }
									}
								}
							})
						}
						
						// Style totals row
						const totalCells = ['A', 'B', 'C', 'D', 'E', 'F'].map(col => `${col}${lastRow}`)
						totalCells.forEach((cell, idx) => {
							if (!ws[cell]) ws[cell] = { t: 's', v: '' }
							ws[cell].s = {
								font: { bold: true, sz: 12 },
								fill: { fgColor: { rgb: 'FEF3C7' } },
								alignment: { horizontal: idx === 0 ? 'left' : 'center', vertical: 'center' },
								border: {
									top: { style: 'medium', color: { rgb: '000000' } },
									bottom: { style: 'medium', color: { rgb: '000000' } },
									left: { style: 'thin', color: { rgb: '000000' } },
									right: { style: 'thin', color: { rgb: '000000' } }
								}
							}
						})
						
						const wb = XLSX.utils.book_new()
						XLSX.utils.book_append_sheet(wb, ws, 'Skolēnu statistika')
						const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
						const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
						const a = document.createElement('a')
						const url = URL.createObjectURL(blob)
						a.href = url
						const filename = exportFrom && exportTo ? `${exportFrom}_lidz_${exportTo}` : selectedDate.toLocaleString('lv-LV', { month: 'long', year: 'numeric' })
						a.download = `statistika-berni-${filename}.xlsx`
						a.click()
						setTimeout(() => URL.revokeObjectURL(url), 1500)
					} catch (e) { alert('Neizdevās eksportēt XLSX') }
					}} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Lejupielādēt statistiku</button>
					</div>
				</div>
			</div>

			{loading ? (
			<div className="text-gray-600">Ielādē...</div>
		) : (
			<>
			{/* Legend */}
			<div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
				<span className="font-semibold text-gray-700">Leģenda:</span>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full border-2 border-green-600 bg-white"></div>
					<span className="text-gray-700">Pieejams</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-yellow-500"></div>
					<span className="text-gray-700">Gaida apstiprinājumu</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-green-600"></div>
					<span className="text-gray-700">Apstiprināts</span>
				</div>
				<div className="flex items-center gap-1.5">
					<div className="w-3 h-3 rounded-full bg-blue-500"></div>
					<span className="text-gray-700">Apmeklēts</span>
				</div>
			</div>

			{/* Weekday Headers */}
			<div className="grid grid-cols-7 gap-1 mb-2">
				{['P', 'O', 'T', 'C', 'Pk', 'S', 'Sv'].map((day, index) => (
					<div key={index} className="text-center font-semibold text-gray-600 text-xs lg:text-sm">
						{day}
					</div>
				))}
			</div>

			<div className="grid grid-cols-7 gap-1">
					{Array.from({ length: startingDay }, (_, i) => (
						<div key={`empty-${i}`} className="h-20 lg:h-24" />
					))}
					{Array.from({ length: daysInMonth }, (_, idx) => {
						const day = idx + 1
						const cellDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
						const isPast = cellDate.getTime() < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
						const dateStr = toDateStr(cellDate)
						let daySlots = getSlotsForDate(dateStr)
						if (teacherFilter) daySlots = daySlots.filter((s: any) => String(s.teacherId) === teacherFilter)
						const has = daySlots.length > 0
						const nowTs = Date.now()
						
						// Categorize slots
						const attendedSlots: any[] = []
						const acceptedSlots: any[] = []
						const pendingSlots: any[] = []
						const availableSlots: any[] = []
						
						daySlots.forEach((s: any) => {
							const slotTs = new Date(`${s.date}T${s.time}:00`).getTime()
							const related = bookings.filter((b: any) => b.date === s.date && b.time === s.time && String(b.teacherId) === String(s.teacherId) && (!teacherFilter || String(b.teacherId) === teacherFilter))
							const acceptedRelated = related.filter((b: any) => b.status === 'accepted')
							const pendingRelated = related.filter((b: any) => b.status === 'pending' || b.status === 'pending_unavailable')
							const attendedRelated = acceptedRelated.filter((b: any) => b.attended === true)
							const capacity = s.lessonType === 'group' && typeof s.groupSize === 'number' ? s.groupSize : 1
							const isBooked = acceptedRelated.length >= capacity || pendingRelated.length > 0
							
							if (isPast || slotTs < nowTs) {
								if (attendedRelated.length > 0) {
									attendedSlots.push(s)
								} else if (acceptedRelated.length > 0) {
									acceptedSlots.push(s)
								}
							} else if (isBooked) {
								if (acceptedRelated.length > 0) {
									acceptedSlots.push(s)
								} else {
									pendingSlots.push(s)
								}
							} else {
								availableSlots.push(s)
							}
						})
						
						const totalSlots = daySlots.length
						const circleSize = totalSlots > 50 ? 'w-1 h-1 lg:w-1.5 lg:h-1.5' : totalSlots > 30 ? 'w-1.5 h-1.5 lg:w-2 lg:h-2' : 'w-2 h-2 lg:w-2.5 lg:h-2.5'
						const gapSize = totalSlots > 50 ? 'gap-0.5' : totalSlots > 30 ? 'gap-1' : 'gap-1.5'
						
						let cellBgClass = ''
						if (isPast) {
							cellBgClass = 'bg-gray-50 hover:bg-gray-100'
						} else if (has) {
							cellBgClass = 'bg-green-50 hover:bg-green-100'
						} else {
							cellBgClass = 'bg-blue-50 hover:bg-blue-100'
						}
						
						return (
							<div key={day} className={`h-20 lg:h-24 border p-1 cursor-pointer ${cellBgClass}`} onClick={() => { setSelectedDay(day); setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)) }}>
								<div className="text-xs font-medium mb-1">{day}</div>
								{totalSlots > 0 && (
									<div className={`flex flex-wrap ${gapSize}`}>
										{attendedSlots.map((_, i) => (
											<div key={`attended-${i}`} className={`${circleSize} rounded-full bg-blue-500`} title="Apmeklēts" />
										))}
										{acceptedSlots.map((_, i) => (
											<div key={`accepted-${i}`} className={`${circleSize} rounded-full bg-green-600`} title="Apstiprināts" />
										))}
										{pendingSlots.map((_, i) => (
											<div key={`pending-${i}`} className={`${circleSize} rounded-full bg-yellow-500`} title="Gaida apstiprinājumu" />
										))}
										{availableSlots.map((_, i) => (
											<div key={`avail-${i}`} className={`${circleSize} rounded-full border-2 border-green-600 bg-white`} title="Pieejams" />
										))}
									</div>
								)}
							</div>
						)
					})}
				</div>

					{selectedDay && (() => {
						const dateStr = toDateStr(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDay))
						let daySlots = getSlotsForDate(dateStr)
						if (teacherFilter) daySlots = daySlots.filter((s: any) => String(s.teacherId) === teacherFilter)
						const dayBookings = bookings.filter((b: any) => b.date === dateStr && (!teacherFilter || String(b.teacherId) === teacherFilter)).sort((a: any, b: any) => String(a.time).localeCompare(String(b.time)))
						return (
							<div className="mt-4">
								<h4 className="font-semibold text-black mb-2">Laiki {new Date(dateStr).toLocaleDateString('lv-LV')}</h4>
								{daySlots.length > 0 ? (
									<div className="space-y-2">
										{daySlots.map(s => {
											const lessonTypeLabel = s.lessonType === 'group' ? 'Grupu' : 'Individuāla'
											const locationLabel = s.location === 'teacher' ? 'Privāti' : 'Uz vietas'
											const modalityLabel = s.modality === 'zoom' ? 'Attālināti' : s.modality === 'both' ? 'Klātienē vai attālināti' : 'Klātienē'
											const capacity = s.lessonType === 'group' && typeof s.groupSize === 'number' ? s.groupSize : 1
											const related = bookings.filter((b: any) => b.date === s.date && b.time === s.time && String(b.teacherId) === String(s.teacherId))
											const acceptedRelated = related.filter((b: any) => b.status === 'accepted')
											const bookedCount = related.length
											const isAvailable = s.available !== false && bookedCount < capacity
											const slotTs = new Date(`${s.date}T${s.time || '00:00'}:00`).getTime()
											const isPastSlot = slotTs < Date.now()
											let cardClass = isAvailable ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
											if (isPastSlot) {
												const anyAttendedPaid = acceptedRelated.some((x: any) => x.attended === true && x.paid === true)
												const anyAttended = acceptedRelated.some((x: any) => x.attended === true)
												cardClass = anyAttendedPaid ? 'bg-green-50 border-green-200' : anyAttended ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'
											}
											return (
												<div key={s.id} className={`border rounded-lg p-3 ${cardClass}`}>
													<div className="flex items-center justify-between mb-1">
														<div className="text-lg font-semibold text-black">{s.time}</div>
														<div className="text-sm text-gray-700">{s.teacherName || 'Pasniedzējs'}</div>
														{!isPastSlot ? (
															<span className={`text-xs px-2 py-0.5 rounded-full ${isAvailable ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>{isAvailable ? 'Pieejams' : 'Rezervēts'}</span>
														) : null}
													</div>
													<div className="flex flex-wrap gap-2 text-xs">
														<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">{lessonTypeLabel}</span>
														<span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full border border-purple-200">{modalityLabel}</span>
														<span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200">{locationLabel}</span>
														{s.lessonType === 'group' && (
															<span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full border border-teal-200">{bookedCount}/{capacity}</span>
														)}
													</div>
													{!isAvailable && s.lessonType !== 'group' && related.length > 0 && (
														<div className="text-xs text-gray-700 mt-1">Skolēns: {(acceptedRelated[0]?.studentName || acceptedRelated[0]?.userName || related[0]?.studentName || related[0]?.userName || '—')}</div>
													)}
												</div>
											)
										})}
									</div>
								) : (
									<div className="space-y-2">
										{dayBookings.length === 0 ? (
											<div className="text-sm text-gray-600">Nav rezervāciju šajā dienā</div>
										) : dayBookings.map((b: any) => {
											const bTs = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime()
											const isPastBooking = bTs < Date.now()
											let cardClass = b.status === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
											if (isPastBooking) {
												cardClass = b.attended === true ? (b.paid === true ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200') : 'bg-gray-50 border-gray-200'
											}
											return (
												<div key={String(b._id)} className={`border rounded-md p-3 text-sm ${cardClass}`}>
													<div className="flex items-start justify-between">
														<div>
															<div className="font-medium text-black">{new Date(b.date).toLocaleDateString('lv-LV')} {b.time} • {b.teacherName || ''}</div>
														</div>
														<div className="flex items-center gap-2">
															{b.status === 'accepted' && (
																<>
																	<span className={`text-xs px-2 py-0.5 rounded-md border ${b.paid ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>Apmaksāts: {b.paid ? 'Jā' : 'Nē'}</span>
																	<span className={`text-xs px-2 py-0.5 rounded-md border ${b.attended ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>Apmeklēts: {b.attended ? 'Jā' : 'Nē'}</span>
																</>
															)}
														</div>
													</div>
												</div>
											)
										})}
									</div>
								)}
							</div>
						)
					})()}
			</>
		)}
	</div>
)
}

// Admin Questions Component
const AdminQuestions = () => {
	const [loading, setLoading] = useState(false)
	const [questions, setQuestions] = useState<Array<{ _id: string; name: string; email: string; message: string; status: string; createdAt: string }>>([])
	const [expandedId, setExpandedId] = useState<string | null>(null)

	const loadQuestions = async () => {
		setLoading(true)
		try {
			const response = await fetch('/api/help-questions')
			const data = await response.json()
			if (data.success) {
				setQuestions(data.questions)
			}
		} catch (error) {
			console.error('Error loading questions:', error)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadQuestions()
	}, [])

	const updateStatus = async (questionId: string, status: string) => {
		try {
			const response = await fetch('/api/help-questions', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ questionId, status })
			})
			if (response.ok) {
				loadQuestions()
			}
		} catch (error) {
			console.error('Error updating status:', error)
		}
	}

	const deleteQuestion = async (questionId: string) => {
		if (!confirm('Vai tiešām dzēst šo jautājumu?')) return
		try {
			const response = await fetch('/api/help-questions', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ questionId })
			})
			if (response.ok) {
				loadQuestions()
			}
		} catch (error) {
			console.error('Error deleting question:', error)
		}
	}

	const getStatusBadge = (status: string) => {
		switch (status) {
			case 'new':
				return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Jauns</span>
			case 'read':
				return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 border border-blue-200">Lasīts</span>
			case 'resolved':
				return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 border border-green-200">Atrisināts</span>
			default:
				return null
		}
	}

	return (
		<div className="bg-white rounded-2xl shadow p-6">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold text-black">Jautājumi</h2>
				<button
					onClick={loadQuestions}
					disabled={loading}
					className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
				>
					{loading ? 'Ielādē...' : 'Atjaunot'}
				</button>
			</div>

			{loading ? (
				<div className="text-center py-8 text-gray-500">Ielādē...</div>
			) : questions.length === 0 ? (
				<div className="text-center py-8 text-gray-500">Nav jautājumu</div>
			) : (
				<div className="space-y-4">
					{questions.map((question) => (
						<div key={question._id} className="border border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition-colors">
							<div className="flex items-start justify-between mb-3">
								<div className="flex-1">
									<div className="flex items-center gap-3 mb-2">
										<h3 className="font-semibold text-black">{question.name}</h3>
										{getStatusBadge(question.status)}
									</div>
									<div className="text-sm text-gray-600 mb-1">
										<span className="font-medium">E-pasts:</span>{' '}
										<a href={`mailto:${question.email}`} className="text-blue-600 hover:underline">
											{question.email}
										</a>
									</div>
									<div className="text-xs text-gray-500">
										{new Date(question.createdAt).toLocaleString('lv-LV')}
									</div>
								</div>
								<button
									onClick={() => setExpandedId(expandedId === question._id ? null : question._id)}
									className="text-gray-500 hover:text-black transition-colors"
								>
									<svg
										className={`w-5 h-5 transition-transform ${expandedId === question._id ? 'rotate-180' : ''}`}
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
									</svg>
								</button>
							</div>

							{expandedId === question._id && (
								<div className="mt-4 pt-4 border-t border-gray-200">
									<div className="mb-4">
										<div className="text-sm font-medium text-gray-700 mb-2">Ziņojums:</div>
										<div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-800 whitespace-pre-wrap">
											{question.message}
										</div>
									</div>

									<div className="flex flex-wrap gap-2">
										{question.status !== 'read' && (
											<button
												onClick={() => updateStatus(question._id, 'read')}
												className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
											>
												Atzīmēt kā lasītu
											</button>
										)}
										{question.status !== 'resolved' && (
											<button
												onClick={() => updateStatus(question._id, 'resolved')}
												className="px-3 py-1.5 text-sm bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
											>
												Atzīmēt kā atrisinātu
											</button>
										)}
										{question.status !== 'new' && (
											<button
												onClick={() => updateStatus(question._id, 'new')}
												className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
											>
												Atzīmēt kā jaunu
											</button>
										)}
										<button
											onClick={() => deleteQuestion(question._id)}
											className="px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
										>
											Dzēst
										</button>
									</div>
								</div>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
