import { useEffect, useState } from 'react'

const AdminProfile = () => {
	const [tab, setTab] = useState<'calendar' | 'teachers' | 'students' | 'notifications' | 'data'>('data')
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
					<button onClick={() => setTab('data')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'data' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Dati</button>
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

	return (
		<div className="bg-white rounded-2xl shadow-xl p-6">
			<div className="flex items-center justify-between mb-4">
				<h2 className="text-2xl font-bold text-black">Skolēni</h2>
				<button onClick={handleRefresh} className="px-3 py-1 text-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-lg transition-colors">Atjaunot</button>
			</div>
			<div className="text-sm text-gray-600 mb-4">
				Kopā: {students.length} skolēni no {Object.keys(users).length} lietotājiem
				{lastLoadTime > 0 && (<span className="ml-2 text-xs">• Atjaunots: {new Date(lastLoadTime).toLocaleTimeString('lv-LV')}</span>)}
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
										<div className="font-semibold text-black">{student.firstName} {student.lastName}</div>
										<div className="text-sm text-gray-600">
											{student.isSelf ? 'Pašreģistrācija' : 'Bērns'}
											{student.age && ` • ${student.age} gadi`}
											{student.grade && ` • ${student.grade}`}
											{student.school && ` • ${student.school}`}
										</div>
										{user && (
											<div className="text-xs text-gray-500 mt-1">Vecāks: {user.firstName} {user.lastName} ({user.email}){user.accountType === 'children' && ' • Vecāku konts'}</div>
										)}
									</div>
									<div className="text-xs text-gray-500">{new Date(student.createdAt).toLocaleDateString('lv-LV')}</div>
								</div>
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
	const load = async () => {
		setLoading(true)
		try {
			const r = await fetch('/api/admin-data')
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && d.success && d.data) setAddress(d.data.address || '')
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


