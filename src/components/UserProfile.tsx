import { useEffect, useState } from 'react'

type UserProfileProps = { userId: string }

const UserProfile = ({ userId }: UserProfileProps) => {
	const [activeTab, setActiveTab] = useState<'children' | 'bookings' | 'collab'>('bookings')
	const [userInfo, setUserInfo] = useState<any>(null)
	const [children, setChildren] = useState<any[]>([])
	const [bookings, setBookings] = useState<any[]>([])
	const [timeSlots, setTimeSlots] = useState<any[]>([])
	const [loadingCollab, setLoadingCollab] = useState(false)
	const [selectedCollab, setSelectedCollab] = useState<Record<string, Record<string, boolean>>>({})
	const [selectedChildIdCollab, setSelectedChildIdCollab] = useState<string>('')
	const [collabMessage, setCollabMessage] = useState<string | null>(null)
	const [collabFilters, setCollabFilters] = useState<{ from: string; to: string; lessonType: 'all'|'individual'|'group'; modality: 'all'|'in_person'|'zoom' }>(() => {
		const now = new Date()
		const from = now.toISOString().slice(0,10)
		const toDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
		const to = toDate.toISOString().slice(0,10)
		return { from, to, lessonType: 'all', modality: 'all' }
	})
	const [loadingChildren, setLoadingChildren] = useState(false)
	const [loadingBookings, setLoadingBookings] = useState(false)
	// Filters for Reservations tab
	const [bookingStatusFilter, setBookingStatusFilter] = useState<Record<string, boolean>>({})

	const loadUserInfo = async () => {
		if (!userId) return
		try {
			const r = await fetch(`/api/user-info?userId=${encodeURIComponent(userId)}`)
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && d.success && d.user) {
					setUserInfo(d.user)
				}
			}
		} catch {}
	}

	const loadChildren = async () => {
		if (!userId) return
		setLoadingChildren(true)
		try {
			const r = await fetch(`/api/students?userId=${encodeURIComponent(userId)}`)
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && d.success && Array.isArray(d.students)) {
					setChildren(d.students)
				}
			}
		} catch {}
		setLoadingChildren(false)
	}

	const loadBookings = async () => {
		if (!userId) return
		setLoadingBookings(true)
		try {
			const r = await fetch(`/api/bookings?role=user&userId=${encodeURIComponent(userId)}`)
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && Array.isArray(d.items)) {
					setBookings(d.items)
				}
			}
		} catch {}
		setLoadingBookings(false)
	}

	const loadTimeSlots = async () => {
		try {
			const r = await fetch('/api/time-slots')
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && d.success && Array.isArray(d.timeSlots)) setTimeSlots(d.timeSlots)
			}
		} catch {}
	}

	useEffect(() => { loadUserInfo() }, [userId])

	// Prefetch bookings so Sadarbības tab visibility is correct on first render
	useEffect(() => { if (userId) loadBookings() }, [userId])

	useEffect(() => {
		if (activeTab === 'children') loadChildren()
		if (activeTab === 'bookings') loadBookings()
		if (activeTab === 'collab') {
			loadBookings()
			loadTimeSlots()
			if (userInfo?.accountType === 'children') loadChildren()
		}
	}, [activeTab, userId])

	// Removed background polling; we refresh when tabs open and on demand via buttons
	useEffect(() => {}, [userId, userInfo?.accountType, activeTab])

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow p-6 space-y-4">
				<div className="flex items-start gap-4">
					<div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-yellow-200 flex items-center justify-center">
						<span className="text-2xl font-bold text-gray-600">
							{userInfo ? `${userInfo.firstName?.[0] || ''}${userInfo.lastName?.[0] || ''}` : '—'}
						</span>
					</div>
					<div className="flex-1">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-2">
								<div className="font-semibold text-black mb-1">
									{userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}` : '—'}
								</div>
							</div>
						</div>
						<div className="text-sm text-gray-700">
							{userInfo?.email || '—'}
						</div>
						{userInfo?.phone && (
							<div className="text-sm text-gray-700">
								{userInfo.phone}
							</div>
						)}
						{userInfo?.createdAt && (
							<div className="text-sm text-gray-700">
								<strong>Reģistrācijas datums:</strong> {new Date(userInfo.createdAt).toLocaleDateString('lv-LV')}
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="bg-white rounded-2xl shadow-xl p-2">
				<div className="flex gap-2">
					{userInfo?.accountType === 'children' && (
						<button onClick={() => setActiveTab('children')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'children' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
							Bērni ({children.length})
						</button>
					)}
					<button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'bookings' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
						Rezervācijas ({bookings.length})
					</button>
					{(() => {
						const collabIds = new Set((bookings || []).filter(b => b.extendPreferred === true).map(b => String(b.teacherId)))
						return collabIds.size > 0 ? (
							<button onClick={() => setActiveTab('collab')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'collab' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
								Sadarbības
							</button>
						) : null
					})()}
				</div>
			</div>

			{activeTab === 'children' && userInfo?.accountType === 'children' && (
				<div className="bg-white rounded-2xl shadow p-6">
					<h3 className="text-lg font-semibold text-black mb-4">Mani bērni</h3>
					{loadingChildren ? (
						<div className="text-center py-8 text-gray-500">Ielādē...</div>
					) : children.length === 0 ? (
						<div className="text-center py-8 text-gray-500">Nav bērnu</div>
					) : (
						<div className="space-y-4">
							{children.map(child => (
								<div key={child.id} className="border border-gray-200 rounded-lg p-4">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h4 className="font-semibold text-black mb-2">
												{child.firstName} {child.lastName}
											</h4>
											<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
												{child.age && (
													<div>
														<label className="block text-xs font-medium text-gray-600 mb-1">Vecums</label>
														<div className="text-gray-900">{child.age} gadi</div>
													</div>
												)}
												{child.grade && (
													<div>
														<label className="block text-xs font-medium text-gray-600 mb-1">Klase</label>
														<div className="text-gray-900">{child.grade}</div>
													</div>
												)}
												{child.school && (
													<div>
														<label className="block text-xs font-medium text-gray-600 mb-1">Skola</label>
														<div className="text-gray-900">{child.school}</div>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{activeTab === 'bookings' && (
				<div className="bg-white rounded-2xl shadow p-6">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-lg font-semibold text-black">Manas rezervācijas</h3>
						<div className="flex items-center gap-2">
							{/* Status filters: Gaida, Pieņemts, Notikusi, Noraidīts */}
							<div className="hidden md:flex items-center gap-3 mr-2">
								<label className="flex items-center gap-1 text-xs text-gray-700">
									<input type="checkbox" checked={Boolean(bookingStatusFilter['gaida'])} onChange={e => setBookingStatusFilter(prev => ({ ...prev, ['gaida']: e.target.checked }))} />
									<span>Gaida</span>
								</label>
								<label className="flex items-center gap-1 text-xs text-gray-700">
									<input type="checkbox" checked={Boolean(bookingStatusFilter['accepted'])} onChange={e => setBookingStatusFilter(prev => ({ ...prev, ['accepted']: e.target.checked }))} />
									<span>Pieņemts</span>
								</label>
								<label className="flex items-center gap-1 text-xs text-gray-700">
									<input type="checkbox" checked={Boolean(bookingStatusFilter['notikusi'])} onChange={e => setBookingStatusFilter(prev => ({ ...prev, ['notikusi']: e.target.checked }))} />
									<span>Notikusi</span>
								</label>
								<label className="flex items-center gap-1 text-xs text-gray-700">
									<input type="checkbox" checked={Boolean(bookingStatusFilter['declined'])} onChange={e => setBookingStatusFilter(prev => ({ ...prev, ['declined']: e.target.checked }))} />
									<span>Noraidīts</span>
								</label>
							</div>
							<button onClick={() => { window.location.href = '/?open=calendar' }} className="text-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1">Rezervē nodarbību</button>
							<button onClick={() => loadBookings()} disabled={loadingBookings} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50 disabled:opacity-60">{loadingBookings ? 'Ielādē...' : 'Atjaunot'}</button>
						</div>
					</div>
					{loadingBookings ? (
						<div className="text-center py-8 text-gray-500">Ielādē...</div>
					) : bookings.length === 0 ? (
						<div className="text-center py-8 text-gray-500">Nav rezervāciju</div>
					) : (
							<div className="space-y-3">
								{[...bookings]
									.filter(b => {
										// If any filter is checked, show only selected groups; otherwise show all
										const anyChecked = Object.values(bookingStatusFilter).some(Boolean)
										if (!anyChecked) return true
										const s = b.status
										const dt = new Date(`${b.date}T${b.time || '00:00'}:00`)
										const isPastAccepted = s === 'accepted' && !isNaN(dt.getTime()) && dt.getTime() < Date.now()
										if (bookingStatusFilter['gaida'] && (s === 'pending' || s === 'pending_unavailable')) return true
										if (bookingStatusFilter['accepted'] && s === 'accepted' && !isPastAccepted) return true
										if (bookingStatusFilter['notikusi'] && isPastAccepted) return true
										if (bookingStatusFilter['declined'] && (s === 'declined' || s === 'declined_conflict')) return true
										return false
									})
									.sort((a, b) => {
										const ta = new Date(`${a.date}T${a.time || '00:00'}:00`).getTime()
										const tb = new Date(`${b.date}T${b.time || '00:00'}:00`).getTime()
										return tb - ta // newest first
									})
									.map(booking => {
                                const bookingDateTime = new Date(`${booking.date}T${booking.time}:00`)
                                const isPast = !isNaN(bookingDateTime.getTime()) && bookingDateTime.getTime() < Date.now()
                                const isPastAccepted = isPast && booking.status === 'accepted'
                                const statusClass = isPastAccepted
                                    ? 'bg-blue-100 text-blue-800'
                                    : booking.status === 'accepted'
                                        ? 'bg-green-100 text-green-800'
                                        : booking.status === 'declined'
                                            ? 'bg-red-100 text-red-800'
                                            : booking.status === 'declined_conflict'
                                                ? 'bg-orange-100 text-orange-800'
                                                : booking.status === 'pending_unavailable'
                                                    ? 'bg-gray-100 text-gray-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                const statusLabel = isPastAccepted
                                    ? 'Notikusi'
                                    : booking.status === 'accepted'
                                        ? 'Pieņemts'
                                        : booking.status === 'declined'
                                            ? 'Noraidīts'
                                            : booking.status === 'declined_conflict'
                                                ? 'Noraidīts (konflikts)'
                                                : booking.status === 'pending_unavailable'
                                                    ? 'Gaida (nav pieejams)'
                                                    : 'Gaida apstiprinājumu'
                                return (
                                    <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${statusClass}`}>
                                                        {statusLabel}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    <strong>Datums:</strong> {new Date(booking.date).toLocaleDateString('lv-LV')} {booking.time}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    <strong>Pasniedzējs:</strong> {booking.teacherName || '—'}
                                                </p>
                                                {booking.studentName && (
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Skolēns:</strong> {booking.studentName}
                                                    </p>
                                                )}
                                                <p className="text-sm text-gray-600">
                                                    <strong>Izveidots:</strong> {new Date(booking.createdAt).toLocaleString('lv-LV')}
                                                </p>
                                                {booking.status === 'accepted' && (
                                                    <div className="mt-2 space-y-1">
                                                        <p className="text-sm text-gray-700">
                                                            <strong>Tikšanās veids:</strong> {(booking.modality === 'zoom') ? 'Attālināti' : 'Klātienē'}
                                                        </p>
                                                        {booking.modality === 'zoom' ? (
                                                            <p className="text-sm text-gray-700">
                                                                <strong>Zoom saite:</strong> {booking.zoomLink ? (<a href={booking.zoomLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">{booking.zoomLink}</a>) : '—'}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-gray-700">
                                                                <strong>Adrese:</strong> {booking.address || '—'}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                                {(booking.status === 'pending' || booking.status === 'pending_unavailable' || (booking.status === 'accepted' && !isPastAccepted)) && (
                                                    <div className="pt-2">
                                                        <button onClick={async () => {
                                                            try {
                                                                // After-midnight same-day policy
                                                                const now = new Date()
                                                                const bookingDate = new Date(booking.date + 'T00:00:00')
                                                                const isSameDay = now.getFullYear() === bookingDate.getFullYear() && now.getMonth() === bookingDate.getMonth() && now.getDate() === bookingDate.getDate()
                                                                if (isSameDay) {
                                                                    const ok = confirm('Atcelot pēc 00:00 šīs pašas dienas laikā, nauda netiks atgriezta. Vai turpināt?')
                                                                    if (!ok) return
                                                                }
                                                                const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', bookingId: String(booking._id) }) })
                                                                if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās atcelt'); return }
                                                                await loadBookings()
                                                            } catch { alert('Kļūda') }
                                                        }} className="text-sm bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1">Atcelt</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                                })}
                        </div>
					)}
				</div>
			)}

			{activeTab === 'collab' && (
				<div className="bg-white rounded-2xl shadow p-6">
					<h3 className="text-lg font-semibold text-black mb-4">Sadarbības</h3>
					{(() => {
						const collabIds = Array.from(new Set((bookings || []).filter(b => b.extendPreferred === true).map(b => String(b.teacherId))))
						if (collabIds.length === 0) return <div className="text-gray-500">Nav ilgtermiņa sadarbību</div>
						const todayStr = new Date().toISOString().slice(0,10)
						return (
							<div className="space-y-6">
								<div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
									<div className="grid md:grid-cols-4 gap-3">
										<div>
											<label className="block text-xs font-medium text-gray-700 mb-1">No datuma</label>
											<input type="date" value={collabFilters.from} onChange={e => setCollabFilters(prev => ({ ...prev, from: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
										</div>
										<div>
											<label className="block text-xs font-medium text-gray-700 mb-1">Līdz datumam</label>
											<input type="date" value={collabFilters.to} onChange={e => setCollabFilters(prev => ({ ...prev, to: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
										</div>
										<div>
											<label className="block text-xs font-medium text-gray-700 mb-1">Nodarbības veids</label>
											<select value={collabFilters.lessonType} onChange={e => setCollabFilters(prev => ({ ...prev, lessonType: e.target.value as any }))} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
												<option value="all">Visi</option>
												<option value="individual">Individuāla</option>
												<option value="group">Grupu</option>
											</select>
										</div>
										<div>
											<label className="block text-xs font-medium text-gray-700 mb-1">Veids</label>
											<select value={collabFilters.modality} onChange={e => setCollabFilters(prev => ({ ...prev, modality: e.target.value as any }))} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
												<option value="all">Visi</option>
												<option value="in_person">Klātienē</option>
												<option value="zoom">Attālināti</option>
											</select>
										</div>
									</div>
								</div>
								{userInfo?.accountType === 'children' && (
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">Bērns</label>
										<select value={selectedChildIdCollab} onChange={e => setSelectedChildIdCollab(e.target.value)} className="w-full max-w-xs p-2 border border-gray-300 rounded-lg text-sm">
											<option value="">—</option>
											{children.map((c: any) => (
												<option key={c.id || c._id} value={String(c.id || c._id)}>{c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}</option>
											))}
										</select>
									</div>
								)}
                                {collabIds.map(tid => {
                                    const teacherSlots = (timeSlots || []).filter(s => {
										if (String(s.teacherId) !== tid) return false
										if (s.available === false) return false
										if (s.date < todayStr) return false
										if (collabFilters.from && s.date < collabFilters.from) return false
										if (collabFilters.to && s.date > collabFilters.to) return false
										if (collabFilters.lessonType !== 'all' && s.lessonType !== collabFilters.lessonType) return false
										if (collabFilters.modality !== 'all' && s.modality !== collabFilters.modality) return false
										return true
									})
									const teacherName = (bookings.find(b => String(b.teacherId) === tid && b.teacherName)?.teacherName) || 'Pasniedzējs'
									// Group available slots by (weekday + time) across the selected date range
									const dayNames = ['Pirmdiena','Otrdiena','Trešdiena','Ceturtdiena','Piektdiena','Sestdiena','Svētdiena']
									const groupedByWeekday: Record<number, Record<string, any[]>> = {}
                                    teacherSlots.forEach((s: any) => {
                                        try {
                                            const d = new Date(String(s.date))
                                            const jsDay = d.getDay()
                                            const wd = ((jsDay + 6) % 7) + 1
                                            const slotTimeKey: string = typeof s.time === 'string' ? s.time : String(s.time || '')
                                            if (!groupedByWeekday[wd]) groupedByWeekday[wd] = {}
                                            if (!groupedByWeekday[wd][slotTimeKey]) groupedByWeekday[wd][slotTimeKey] = []
                                            groupedByWeekday[wd][slotTimeKey].push(s)
                                        } catch {}
                                    })
									const orderTimes = (times: string[]) => times.sort((a, b) => {
										const [ah, am] = a.split(':').map(Number)
										const [bh, bm] = b.split(':').map(Number)
										return (ah * 60 + am) - (bh * 60 + bm)
									})
									const sel = selectedCollab[tid] || {}
									const toggleKey = (key: string) => setSelectedCollab(prev => ({ ...prev, [tid]: { ...(prev[tid] || {}), [key]: !(prev[tid]?.[key]) } }))
									const reserve = async () => {
										const selectedTimes = Object.entries(sel).filter(([,v]) => v).map(([k]) => k)
                                        if (selectedTimes.length === 0) return
										if (userInfo?.accountType === 'children' && children.length > 0 && !selectedChildIdCollab) { setCollabMessage('Lūdzu izvēlieties bērnu'); return }
										setLoadingCollab(true)
										setCollabMessage(null)
										try {
											const batchId = `${tid}-${Date.now()}`
                                            for (const composite of selectedTimes) {
                                                const [wdStr, timePart] = `${composite}`.split('|')
												const wd = Number(wdStr)
                                                const slotsForKey = (groupedByWeekday[wd] && groupedByWeekday[wd][timePart]) ? groupedByWeekday[wd][timePart] : []
												for (const s of slotsForKey) {
                                                    const r = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, teacherId: String(tid), date: s.date, time: s.time, studentId: (userInfo?.accountType === 'children' ? (selectedChildIdCollab || null) : null), batchId }) })
                                                    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || 'Neizdevās izveidot rezervāciju') }
                                                }
                                            }
											setCollabMessage('Rezervācijas izveidotas')
                                            setSelectedCollab(prev => ({ ...prev, [tid]: {} }))
											loadBookings(); loadTimeSlots()
										} catch (e: any) {
											setCollabMessage(e?.message || 'Kļūda')
										} finally { setLoadingCollab(false) }
									}
									return (
										<div key={tid} className="border border-gray-200 rounded-lg p-4">
											<div className="font-semibold text-black mb-3">{teacherName}</div>
                                            {teacherSlots.length === 0 ? (
												<div className="text-sm text-gray-500">Nav pieejamu laiku</div>
											) : (
                                                <div className="space-y-3">
                                                    {([1,2,3,4,5,6,7] as const).map((wd: number) => {
														const timesMap = groupedByWeekday[wd] || {}
                                                        const times = orderTimes(Object.keys(timesMap))
														if (times.length === 0) return null
														return (
															<div key={`${tid}-wd-${wd}`} className="space-y-1">
																<div className="text-sm font-semibold text-gray-800">{dayNames[wd - 1]}</div>
                                                                {times.map((tKey: string) => {
                                                                    const list = timesMap[tKey]
																	const count = list.length
																	const sample = list[0]
                                                                    const key = `${wd}|${tKey}`
																	return (
																		<label key={key} className="flex items-center gap-2 text-sm">
																			<input type="checkbox" checked={Boolean(sel[key])} onChange={() => toggleKey(key)} />
                                                                            <span>{tKey} ({count} dienas)</span>
																			<span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">{sample?.lessonType === 'group' ? 'Grupu' : 'Individuāla'}</span>
																			<span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">{sample?.modality === 'zoom' ? 'Attālināti' : 'Klātienē'}</span>
																		</label>
																	)
																})}
															</div>
														)
													})}
													<div className="pt-2">
														<button disabled={loadingCollab || Object.values(sel).every(v => !v) || (userInfo?.accountType === 'children' && children.length > 0 && !selectedChildIdCollab)} onClick={reserve} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black font-semibold px-4 py-2 rounded-lg">Rezervēt izvēlētos laikus</button>
													</div>
												</div>
											)}
										</div>
									)
								})}
								{collabMessage && <div className={`text-sm mt-2 ${collabMessage.startsWith('Rezervācijas') ? 'text-green-700' : 'text-red-600'}`}>{collabMessage}</div>}
								<div className="text-xs text-gray-500">Pasniedzējs redzēs vienu “Apstiprināt visus” šim komplektam.</div>
							</div>
						)
					})()}
				</div>
			)}
		</div>
	)
}

export default UserProfile


