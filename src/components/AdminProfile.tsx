import { useEffect, useState } from 'react'

const AdminProfile = () => {
	const [tab, setTab] = useState<'calendar' | 'teachers' | 'students' | 'notifications' | 'users' | 'data'>('calendar')
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
					<button onClick={() => setTab('data')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'data' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Dati</button>
				</div>
			</div>
			{tab === 'calendar' && <AdminCalendar />}
			{tab === 'teachers' && <AdminTeachers />}
			{tab === 'students' && <AdminStudents />}
			{tab === 'notifications' && <AdminNotifications onCountChange={setUnreadCount} />}
			{tab === 'users' && <AdminUsers />}
			{tab === 'data' && <AdminData />}
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
	}>>({})
	const [loading, setLoading] = useState(true)
	const [bookingsByStudent, setBookingsByStudent] = useState<Record<string, any[]>>({})
	const [savingPaid, setSavingPaid] = useState<Record<string, boolean>>({})
	const [lastLoadTime, setLastLoadTime] = useState<number>(0)

	const loadStudents = async (forceRefresh = false) => {
		try {
			if (!forceRefresh) {
				try {
					const cached = localStorage.getItem('cache_admin_students_v1')
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
					try { localStorage.setItem('cache_admin_students_v1', JSON.stringify({ students: studentsData.students, users: userMap, timestamp })) } catch {}
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
			if (e.key === 'cache_admin_students_v1' && e.newValue) {
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
						const cached = localStorage.getItem('cache_admin_students_v1')
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
	const [items, setItems] = useState<Array<{ id: string; name: string; username: string; description: string; active: boolean }>>([])
	const [form, setForm] = useState<{ email: string }>({ email: '' })
	const [creating, setCreating] = useState(false)
	const [created, setCreated] = useState<{ email: string; tempPassword: string; loginUrl: string } | null>(null)
	const [openId, setOpenId] = useState<string | null>(null)
	const [profiles, setProfiles] = useState<Record<string, any>>({})
	const [loadingProfileId, setLoadingProfileId] = useState<string | null>(null)

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

				<div className="grid grid-cols-7 gap-1">
					{Array.from({ length: startingDay }, (_, i) => (
						<div key={`empty-${i}`} className="h-16" />
					))}
					{Array.from({ length: daysInMonth }, (_, idx) => {
						const day = idx + 1
						const cellDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
						const isPast = cellDate.getTime() < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
						const dateStr = `${cellDate.getFullYear()}-${String(cellDate.getMonth() + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
						const hasBookings = bookings.some((b: any) => b.date === dateStr && (b.status === 'accepted' || b.status === 'pending' || b.status === 'pending_unavailable') && (!childFilter || String(b.studentId || b.userId || '') === childFilter))
						let counterText = ''
						if (isPast) {
							const booked = bookings.filter((b: any) => b.date === dateStr && (b.status === 'accepted' || b.status === 'pending' || b.status === 'pending_unavailable') && (!childFilter || String(b.studentId || b.userId || '') === childFilter))
							const attended = booked.filter((b: any) => b.attended === true)
							counterText = `${attended.length}/${booked.length}`
						} else {
							const booked = bookings.filter((b: any) => b.date === dateStr && (b.status === 'accepted' || b.status === 'pending' || b.status === 'pending_unavailable') && (!childFilter || String(b.studentId || b.userId || '') === childFilter))
							counterText = `${booked.length}`
						}
						return (
							<div key={day} className={`h-16 border p-1 cursor-pointer ${isPast ? 'bg-gray-100 text-gray-500' : hasBookings ? 'bg-green-50' : 'bg-blue-50'}`} onClick={() => { setSelectedDay(day); setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)) }}>
								<div className="text-xs font-medium">{day}</div>
								<div className={`text-[10px] mt-1 ${isPast ? 'text-gray-600' : 'text-gray-700'}`}>{counterText}</div>
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
								const rows = bookings
									.filter((b: any) => inRange(b.date) && (!teacherFilter || String(b.teacherId) === teacherFilter))
									.sort((a: any, b: any) => (a.date === b.date ? String(a.time).localeCompare(String(b.time)) : new Date(a.date).getTime() - new Date(b.date).getTime()))
									.map((b: any) => ({
										Datums: new Date(b.date).toLocaleDateString('lv-LV'),
										Laiks: b.time || '',
										Pasniedzējs: b.teacherName || '',
										Skolēns: b.studentName || b.userName || '',
										Statuss: b.status || '',
										Apmaksāts: b.paid === true ? 'Jā' : 'Nē',
										Apmeklēts: b.attended === true ? 'Jā' : 'Nē',
										Veids: b.modality === 'zoom' ? 'Attālināti' : 'Klātienē',
										Vieta: b.location === 'teacher' ? 'Privāti' : 'Uz vietas'
									}))
								const ws = XLSX.utils.json_to_sheet(rows)
								const wb = XLSX.utils.book_new()
								XLSX.utils.book_append_sheet(wb, ws, 'Statistika')
								const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
								const blob = new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
								const a = document.createElement('a')
								const url = URL.createObjectURL(blob)
								a.href = url
								const title = exportFrom && exportTo ? `${exportFrom}_lidz_${exportTo}` : selectedDate.toLocaleString('lv-LV', { month: 'long', year: 'numeric' })
								a.download = `statistika-${title}.xlsx`
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
					<div className="grid grid-cols-7 gap-1">
						{Array.from({ length: startingDay }, (_, i) => (
							<div key={`empty-${i}`} className="h-16" />
						))}
						{Array.from({ length: daysInMonth }, (_, idx) => {
							const day = idx + 1
							const cellDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
							const isPast = cellDate.getTime() < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime()
							const dateStr = toDateStr(cellDate)
							let daySlots = getSlotsForDate(dateStr)
							if (teacherFilter) daySlots = daySlots.filter((s: any) => String(s.teacherId) === teacherFilter)
							const has = daySlots.length > 0
							let counterText = ''
							if (isPast) {
								const accepted = bookings.filter((b: any) => b.date === dateStr && b.status === 'accepted' && (!teacherFilter || String(b.teacherId) === teacherFilter))
								const attended = accepted.filter((b: any) => b.attended === true)
								counterText = `${attended.length}/${accepted.length}`
							} else {
								const bookedSlots = daySlots.reduce((acc: number, s: any) => {
									const rel = bookings.filter((b: any) => b.date === s.date && b.time === s.time && String(b.teacherId) === String(s.teacherId) && (b.status === 'accepted' || b.status === 'pending' || b.status === 'pending_unavailable') && (!teacherFilter || String(b.teacherId) === teacherFilter))
									return acc + (rel.length > 0 ? 1 : 0)
								}, 0)
								counterText = `${bookedSlots}/${daySlots.length}`
							}
							return (
								<div key={day} className={`h-16 border p-1 cursor-pointer ${isPast ? 'bg-gray-100 text-gray-500' : has ? 'bg-green-50' : 'bg-blue-50'}`} onClick={() => { setSelectedDay(day); setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)) }}>
									<div className="text-xs font-medium">{day}</div>
									<div className={`text-[10px] mt-1 ${isPast ? 'text-gray-600' : 'text-gray-700'}`}>{counterText}</div>
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
											const modalityLabel = s.modality === 'zoom' ? 'Attālināti' : 'Klātienē'
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
