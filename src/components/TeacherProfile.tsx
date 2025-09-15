import { useEffect, useState } from 'react'

type TeacherProfileProps = {
	userId: string
	isActive?: boolean
}

// AvailabilityEntry is handled inside TeacherOnboarding

const TeacherProfile = ({ userId, isActive }: TeacherProfileProps) => {
	const [isLoadingProfile, setIsLoadingProfile] = useState(false)
	const [isEditingProfile, setIsEditingProfile] = useState(false)
	const [teacherProfile, setTeacherProfile] = useState<any | null>(null)

	// Removed unused editing helpers from wrapper; editing is handled in TeacherOnboarding

	useEffect(() => {
		let active = true
		const load = async () => {
			setIsLoadingProfile(true)
			try {
				const prof = await fetch(`/api/teacher-profile?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => null)
				if (!active) return
				if (prof && prof.profile) {
					setTeacherProfile(prof.profile)
				}
			} finally {
				if (active) setIsLoadingProfile(false)
			}
		}
		load()
		return () => { active = false }
	}, [userId])

	// Removed unused editing helpers from wrapper; editing is handled in TeacherOnboarding

	return (
		<div className="mb-6 lg:mb-10">
			{isLoadingProfile ? (
				<div className="bg-white rounded-2xl shadow p-6">
					<div className="flex items-center justify-center py-8">
						<div className="text-gray-500">Ielādē profīlu...</div>
					</div>
				</div>
			) : teacherProfile && !isEditingProfile ? (
				<TeacherProfileView profile={teacherProfile} isActive={Boolean(isActive)} onEdit={() => setIsEditingProfile(true)} />
			) : (
				<TeacherOnboarding userId={userId} initialPhoto={teacherProfile?.photo} initialDescription={teacherProfile?.description} initialAvailability={teacherProfile?.availability || []} initialFirstName={teacherProfile?.firstName} initialLastName={teacherProfile?.lastName} onFinished={async () => {
					try {
						const prof = await fetch(`/api/teacher-profile?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => null)
						if (prof && prof.profile) { setTeacherProfile(prof.profile); setIsEditingProfile(false) }
					} catch {}
				}} />
			)}
		</div>
	)
}

// === View component from OldProfileSection ===
const TeacherProfileView = ({ profile, isActive, onEdit }: { profile: any; isActive: boolean; onEdit: () => void }) => {
	const [selectedDate, setSelectedDate] = useState<Date>(new Date())
	const [selectedDay, setSelectedDay] = useState<number | null>(null)
	const [slots, setSlots] = useState<Array<any>>([])
	const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'bookings' | 'attendance'>('profile')
	const [notifications, setNotifications] = useState<any[]>([])
	const [bookings, setBookings] = useState<any[]>([])
	const [loadingNotifications, setLoadingNotifications] = useState(false)
	const [loadingBookings, setLoadingBookings] = useState(false)
	const [expandedNotifications, setExpandedNotifications] = useState<Set<string>>(new Set())
	const teacherId = String(profile?.userId || profile?.id || '')
	// Using prompts for meeting details in batch/single actions; no state needed
	const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set())

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

	const loadNotifications = async () => {
		if (!teacherId) return
		setLoadingNotifications(true)
		try {
			const r = await fetch(`/api/notifications?recipientRole=worker&recipientUserId=${encodeURIComponent(teacherId)}`)
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && Array.isArray(d.items)) {
					setNotifications(d.items.filter((n: any) => n.type === 'booking_request'))
				}
			}
		} catch {}
		setLoadingNotifications(false)
	}

	const loadBookings = async () => {
		if (!teacherId) return
		setLoadingBookings(true)
		try {
			const r = await fetch(`/api/bookings?role=worker&userId=${encodeURIComponent(teacherId)}`)
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && Array.isArray(d.items)) {
					setBookings(d.items)
				}
			}
		} catch {}
		setLoadingBookings(false)
	}

	useEffect(() => {
		if (activeTab === 'notifications') loadNotifications()
		if (activeTab === 'bookings') loadBookings()
	}, [activeTab, teacherId])

	// Ensure bookings are available in profile calendar
	useEffect(() => { if (teacherId) loadBookings() }, [teacherId])

	const handleNotificationClick = async (notificationId: string) => {
		const isExpanded = expandedNotifications.has(notificationId)
		if (!isExpanded) {
			setExpandedNotifications(prev => new Set([...prev, notificationId]))
			try {
				await fetch('/api/notifications', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ id: notificationId, unread: false })
				})
				loadNotifications()
			} catch {}
		} else {
			setExpandedNotifications(prev => { const s = new Set(prev); s.delete(notificationId); return s })
		}
	}

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear()
		const month = date.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const daysInMonth = lastDay.getDate()
		const startingDay = (firstDay.getDay() + 6) % 7
		return { daysInMonth, startingDay }
	}
	const getSlotsForDate = (dateStr: string) => (slots || []).filter((s: any) => s?.date === dateStr)
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
								<div className="font-semibold text-black mb-1">{(profile?.name && String(profile.name).trim()) || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || '—'}</div>
								<span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>{isActive ? 'Aktīvs' : 'Neaktīvs'}</span>
							</div>
							<button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={onEdit}>Labot profīlu</button>
						</div>
						<div className="text-sm text-gray-700 whitespace-pre-line">{profile.description || '—'}</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-2xl shadow-xl p-2">
				<div className="flex gap-2">
					<button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Profils</button>
					<button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'notifications' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
						Paziņojumi {notifications.filter(n => n.unread).length > 0 && <span className="ml-2 inline-block text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{notifications.filter(n => n.unread).length}</span>}
					</button>
					<button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'bookings' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Rezervācijas</button>
					<button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'attendance' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Nodarbību apmeklējums</button>
				</div>
			</div>

			{activeTab === 'profile' && (
				<div className="bg-white rounded-2xl shadow p-6">
					{/* Calendar (read-only for this teacher) */}
					<div className="space-y-4">
						<div className="grid grid-cols-7 gap-1">
							{Array.from({ length: startingDay }, (_, i) => (
								<div key={`empty-${i}`} className="h-16" />
							))}
							{Array.from({ length: daysInMonth }, (_, idx) => {
								const day = idx + 1
								const has = hasSlotsOn(selectedDate.getFullYear(), selectedDate.getMonth(), day)
								return (
									<div key={day} className={`h-16 border p-1 ${has ? 'bg-green-50' : 'bg-blue-50'}`} onClick={() => { setSelectedDay(day); setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)) }}>
										<div className="text-xs font-medium">{day}</div>
									</div>
								)
							})}
						</div>
						{selectedDay && (() => {
							const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
							const daySlots = getSlotsForDate(dateStr)
							return (
								<div className="mt-4">
									<h4 className="font-semibold text-black mb-2">Laiki {selectedDate.toLocaleDateString('lv-LV')}</h4>
									<div className="space-y-2">
										{daySlots.map(s => {
											const lessonTypeLabel = s.lessonType === 'group' ? 'Grupu' : 'Individuāla'
											const locationLabel = s.location === 'teacher' ? 'Privāti' : 'Uz vietas'
											const modalityLabel = s.modality === 'zoom' ? 'Attālināti' : 'Klātienē'
											const capacity = s.lessonType === 'group' && typeof s.groupSize === 'number' ? s.groupSize : 1
											const related = bookings.filter(b => b.date === s.date && b.time === s.time)
											const acceptedRelated = related.filter(b => b.status === 'accepted')
											const pendingRelated = related.filter(b => b.status === 'pending' || b.status === 'pending_unavailable')
											const bookedCount = related.length
											const isAvailable = s.available !== false && bookedCount < capacity
											const slotKey = `${s.date}|${s.time}`
											return (
												<div key={s.id} className={`border rounded-lg p-3 ${isAvailable ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
													<div className="flex items-center justify-between mb-1">
														<div className="text-lg font-semibold text-black">{s.time}</div>
														<span className={`text-xs px-2 py-0.5 rounded-full ${isAvailable ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-yellow-100 text-yellow-800 border border-yellow-200'}`}>{isAvailable ? 'Pieejams' : 'Rezervēts'}</span>
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
													{acceptedRelated.length > 0 && s.modality !== 'zoom' && acceptedRelated[0]?.address && (
														<div className="text-xs text-gray-700 mt-1">Adrese: {acceptedRelated[0].address}</div>
													)}
													{s.lessonType === 'group' && related.length > 0 && (
														<div className="mt-2">
															<button className="text-xs text-blue-700 underline" onClick={() => setExpandedSlots(prev => { const next = new Set(prev); if (next.has(slotKey)) next.delete(slotKey); else next.add(slotKey); return next })}>
																{expandedSlots.has(slotKey) ? 'Slēpt dalībniekus' : 'Rādīt dalībniekus'}
															</button>
															{expandedSlots.has(slotKey) && (
																<div className="mt-2 space-y-2">
																	{acceptedRelated.length > 0 && (
																		<div>
																			<div className="text-xs font-semibold text-gray-800 mb-1">Dalībnieki ({acceptedRelated.length})</div>
																			<ul className="text-xs text-gray-700 list-disc list-inside">
																				{acceptedRelated.map(r => (
																					<li key={r._id}>{r.studentName || r.userName || '—'}</li>
																				))}
																			</ul>
																		</div>
																	)}
																	{pendingRelated.length > 0 && (
																			<div>
																				<div className="text-xs font-semibold text-gray-800 mb-1">Gaida apstiprinājumu ({pendingRelated.length})</div>
																				<ul className="text-xs text-gray-700 list-disc list-inside">
																					{pendingRelated.map(r => (
																						<li key={r._id}>{r.studentName || r.userName || '—'}</li>
																					))}
																				</ul>
																			</div>
																	)}
																</div>
															)}
														</div>
													)}
												</div>
											)
										})}
									</div>
								</div>
							)
						})()}
					</div>
				</div>
			)}

			{activeTab === 'notifications' && (
				<div className="bg-white rounded-2xl shadow p-6">
					<h3 className="text-lg font-semibold text-black mb-4">Rezervāciju pieprasījumi</h3>
					{loadingNotifications ? (
						<div className="text-center py-8 text-gray-500">Ielādē...</div>
					) : notifications.length === 0 ? (
						<div className="text-center py-8 text-gray-500">Nav paziņojumu</div>
					) : (
						<div className="space-y-2">
							{notifications.map(n => (
								<div key={n.id} className={`border rounded-xl ${n.unread ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
									<div className="flex items-center justify-between p-4">
										<button className="text-left font-semibold text-black truncate" title={n.title} onClick={() => handleNotificationClick(n.id)}>{n.title}</button>
										<div className="text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString('lv-LV') : ''}</div>
									</div>
									{expandedNotifications.has(n.id) && (
										<div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-line">{n.message}</div>
									)}
								</div>
							))}
						</div>
					)}
				</div>
			)}

{activeTab === 'bookings' && (() => {
  if (loadingBookings) {
    return <div className="text-center py-8 text-gray-500">Ielādē...</div>;
  }

  if (bookings.length === 0) {
    return <div className="text-center py-8 text-gray-500">Nav rezervāciju</div>;
  }

  // --- compute data first ---
  const pending = bookings.filter(x => x.status === 'pending' || x.status === 'pending_unavailable');
  const grouped: Record<string, any[]> = {};
  pending.forEach(b => {
    const k = b.batchId ? String(b.batchId) : `__single__${b._id}`;
    (grouped[k] ||= []).push(b);
  });

  const batchKeys = Object.keys(grouped);
  const batchGroups = batchKeys.filter(k => !k.startsWith('__single__') && grouped[k].length > 1);
  const nonBatchPending = batchKeys
    .filter(k => k.startsWith('__single__') || grouped[k].length <= 1)
    .flatMap(k => grouped[k]);
  const others = bookings.filter(x => x.status !== 'pending' && x.status !== 'pending_unavailable');
  const singles = [...nonBatchPending, ...others];

  // --- return valid JSX ---
  return (
    <div className="space-y-3">
      {batchGroups.map(k => {
        const list = grouped[k];
        const tid = String(list[0].teacherId);
        const dateTimes = list
          .map(x => `${new Date(x.date).toLocaleDateString('lv-LV')} ${x.time}`)
          .join(', ');

        return (
          <div key={`batch-${k}`} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700 font-semibold">
                Vairāku nodarbību rezervācijas pieprasījums ({list.length})
              </div>
              <span className="px-2 py-0.5 text-xs rounded-full border bg-yellow-50 text-yellow-800 border-yellow-200">
                Gaida
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <strong>Laiki:</strong> {dateTimes}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
 															<button onClick={async () => {
 																try {
 																	const needsZoom = list.some((x: any) => (slots.find(s => String(s.teacherId) === tid && s.date === x.date && s.time === x.time)?.modality || x.modality) === 'zoom')
 																	const needsTeacherAddress = list.some((x: any) => (slots.find(s => String(s.teacherId) === tid && s.date === x.date && s.time === x.time)?.location || x.location) === 'teacher')
 																	let zoomLink = ''
 																	let address = ''
 																	if (needsZoom) { zoomLink = prompt('Ievadiet Zoom saiti') || '' }
 																	if (!needsZoom && needsTeacherAddress) { address = prompt('Ievadiet adresi') || '' }
 																	const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept_batch', teacherId: tid, batchId: k, zoomLink, address }) })
 																	if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās apstiprināt komplektu'); return }
 																	loadBookings()
 																} catch { alert('Kļūda apstrādē') }
 															}} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded">Apstiprināt visus</button>
 														</div>
														<div className="mt-3 space-y-2">
															{list.map((bi: any) => {
																const label = `${new Date(bi.date).toLocaleDateString('lv-LV')} ${bi.time} — ${bi.studentName || bi.userName || '—'}`
																return (
																	<div key={bi._id} className="flex items-center justify-between text-sm">
																		<div className="text-gray-700">{label}</div>
																		<div className="flex gap-2">
																			<button onClick={async () => {
																				try {
																					const mod = (slots.find(s => String(s.teacherId) === tid && s.date === bi.date && s.time === bi.time)?.modality || bi.modality)
																					const loc = (slots.find(s => String(s.teacherId) === tid && s.date === bi.date && s.time === bi.time)?.location || bi.location)
																					let zoomLink = ''
																					let address = ''
																					if (mod === 'zoom') { zoomLink = prompt('Ievadiet Zoom saiti') || '' }
																					if (mod !== 'zoom' && loc === 'teacher') { address = prompt('Ievadiet adresi') || '' }
																					const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept', bookingId: String(bi._id), teacherId: tid, zoomLink, address }) })
																					if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās apstiprināt'); return }
																					loadBookings()
																				} catch { alert('Kļūda') }
																		}} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded">Apstiprināt</button>
																			<button onClick={async () => {
																				try {
																					const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'decline', bookingId: String(bi._id), teacherId: tid }) })
																					if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās noraidīt'); return }
																					loadBookings()
																				} catch { alert('Kļūda') }
																		}} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Noraidīt</button>
																		</div>
																	</div>
															)
														})}
													</div>
 												</div>
        );
      })}

      {singles.map(b => {
        const dateStr = new Date(b.date).toLocaleDateString('lv-LV')
        return (
          <div key={b._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700"><strong>Datums:</strong> {dateStr} {b.time}</div>
              <span className={`px-2 py-0.5 text-xs rounded-full border ${b.status === 'accepted' ? 'bg-green-50 text-green-800 border-green-200' : b.status === 'declined' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
                {b.status === 'accepted' ? 'Apstiprināts' : b.status === 'declined' ? 'Noraidīts' : 'Gaida'}
              </span>
            </div>
            <div className="text-sm text-gray-700"><strong>Skolēns:</strong> {b.studentName || b.userName || '—'}</div>
            {b.userRole === 'children' && (
              <div className="text-sm text-gray-700"><strong>Vecāks:</strong> {b.userName || '—'}</div>
            )}
            <div className="text-sm text-gray-700"><strong>Phone:</strong> {b.userPhone || '—'}</div>
            <div className="text-sm text-gray-700"><strong>Email:</strong> {b.userEmail || '—'}</div>
            {b.status === 'accepted' && (b.modality === 'zoom') && b.zoomLink && (
              <div className="text-sm text-gray-700"><strong>Zoom:</strong> <a href={b.zoomLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">{b.zoomLink}</a></div>
            )}
            {b.address && (
              <div className="text-sm text-gray-700"><strong>Adrese:</strong> {b.address}</div>
            )}
            {/* Pending controls omitted in batch-first UI */}
          </div>
        )
      })}
    </div>
  );
})()}

			{activeTab === 'attendance' && (
				<div className="bg-white rounded-2xl shadow p-6">
					<h3 className="text-lg font-semibold text-black mb-4">Nodarbību apmeklējums</h3>
					{loadingBookings ? (
						<div className="text-center py-8 text-gray-500">Ielādē...</div>
					) : (() => {
						const nowTs = Date.now()
						const pastAccepted = bookings.filter(b => b.status === 'accepted' && new Date(`${b.date}T${b.time}:00`).getTime() < nowTs)
						// Determine earliest accepted booking per participant and whether already confirmed long-term
						const keyOf = (x: any) => String(x.studentId || x.userId || '')
						const earliestByParticipant: Record<string, { ts: number; id: string }> = {}
						const hasConfirmed: Record<string, boolean> = {}
						pastAccepted.forEach(b => {
							const k = keyOf(b)
							const ts = new Date(`${b.date}T${b.time}:00`).getTime()
							if (!earliestByParticipant[k] || ts < earliestByParticipant[k].ts) earliestByParticipant[k] = { ts, id: String(b._id) }
							if (b.extendPreferred === true) hasConfirmed[k] = true
						})
						if (pastAccepted.length === 0) return <div className="text-center py-8 text-gray-500">Nav pagājušu nodarbību</div>
						return (
							<div className="space-y-3">
								{pastAccepted.map(b => {
									const dateStr = new Date(b.date).toLocaleDateString('lv-LV')
									const isGroup = (b.lessonType || 'individual') === 'group'
									const participants = isGroup ? bookings.filter(x => x.date === b.date && x.time === b.time && x.status === 'accepted') : [b]
									return (
										<div key={`${b._id}-att`} className="border border-gray-200 rounded-lg p-4">
											<div className="flex items-center justify-between mb-2">
												<div className="text-sm text-gray-700"><strong>Datums:</strong> {dateStr} {b.time}</div>
												<span className="px-2 py-0.5 text-xs rounded-full border bg-green-50 text-green-800 border-green-200">Apstiprināts</span>
											</div>
											<div className="space-y-2">
												{participants.map(p => {
													const pk = keyOf(p)
													const showExtend = !hasConfirmed[pk] && earliestByParticipant[pk]?.id === String(p._id)
													return (
														<div key={p._id} className="flex flex-wrap items-center gap-3 text-xs">
															<span className="font-medium text-gray-800 mr-2">{p.studentName || p.userName || '—'}</span>
															<label className="inline-flex items-center gap-1"><input type="checkbox" checked={Boolean(p.attended)} onChange={async (e) => { await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: String(p._id), action: 'report', attended: e.target.checked }) }); loadBookings() }} /> Apmeklēja</label>
															<label className="inline-flex items-center gap-1"><input type="checkbox" checked={Boolean(p.paid)} onChange={async (e) => { await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: String(p._id), action: 'report', paid: e.target.checked }) }); loadBookings() }} /> Samaksāja</label>
															{showExtend && (
																<label className="inline-flex items-center gap-1"><input type="checkbox" checked={Boolean(p.extendPreferred)} onChange={async (e) => { await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: String(p._id), action: 'report', extendPreferred: e.target.checked }) }); loadBookings() }} /> Apstiprinu sadarbību ilgtermiņā</label>
															)}
														</div>
													)
												})}
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
	)
}

// === Onboarding component from OldProfileSection ===
const TeacherOnboarding = ({ userId, onFinished, initialPhoto, initialDescription, initialAvailability, initialFirstName, initialLastName }: { userId: string; onFinished: () => void; initialPhoto?: string; initialDescription?: string; initialAvailability?: any[]; initialFirstName?: string; initialLastName?: string; displayName?: string; isActive?: boolean }) => {
	const [photo, setPhoto] = useState<string>(initialPhoto || '')
	const [description, setDescription] = useState(initialDescription || '')
	const [firstName, setFirstName] = useState<string>(initialFirstName || '')
	const [lastName, setLastName] = useState<string>(initialLastName || '')
	const [saving, setSaving] = useState(false)
	const [scheduleTab, setScheduleTab] = useState<'weekly'|'specific'>('weekly')
	type HourKey = `${string}:${string}`
	type HourOpts = { enabled: boolean; lessonType: 'individual' | 'group'; location: 'facility' | 'teacher'; modality: 'in_person' | 'zoom'; groupSize?: number }
	const hourKeys: HourKey[] = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00` as HourKey)
	const createDefaultDay = (): Record<HourKey, HourOpts> => hourKeys.reduce((acc, h) => { acc[h] = { enabled: false, lessonType: 'individual', location: 'facility', modality: 'in_person' }; return acc }, {} as Record<HourKey, HourOpts>)
	const [weeklyHours, setWeeklyHours] = useState<Record<string, Record<HourKey, HourOpts>>>(() => ({ '1': createDefaultDay(), '2': createDefaultDay(), '3': createDefaultDay(), '4': createDefaultDay(), '5': createDefaultDay(), '6': createDefaultDay(), '7': createDefaultDay() }))
	const [openDay, setOpenDay] = useState<string | null>(null)
	const [endDate, setEndDate] = useState<string>('')
	const [startDate, setStartDate] = useState<string>('')
	const [overrideDate, setOverrideDate] = useState<string>('')
	const [overrides, setOverrides] = useState<Record<string, Record<HourKey, HourOpts>>>({})

	const toggleHour = (day: string, hour: HourKey, enabled: boolean) => { setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], [hour]: { ...prev[day][hour], enabled } } })) }
	const updateHourOpt = (day: string, hour: HourKey, field: 'lessonType'|'location'|'modality'|'groupSize', value: any) => { setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], [hour]: { ...prev[day][hour], [field]: value } } })) }
	const toggleOverrideHour = (date: string, hour: HourKey, enabled: boolean) => { setOverrides(prev => { const day = prev[date] ? { ...prev[date] } : createDefaultDay(); day[hour] = { ...(day[hour] || { enabled: false, lessonType: 'individual', location: 'facility', modality: 'in_person' }), enabled }; return { ...prev, [date]: day } }) }
	const updateOverrideHourOpt = (date: string, hour: HourKey, field: 'lessonType'|'location'|'modality'|'groupSize', value: any) => { setOverrides(prev => { const day = prev[date] ? { ...prev[date] } : createDefaultDay(); day[hour] = { ...(day[hour] || { enabled: false, lessonType: 'individual', location: 'facility', modality: 'in_person' }), [field]: value }; return { ...prev, [date]: day } }) }

	useEffect(() => {
		if (initialAvailability && initialAvailability.length > 0) {
			const draft: Record<string, Record<HourKey, HourOpts>> = { '1': createDefaultDay(), '2': createDefaultDay(), '3': createDefaultDay(), '4': createDefaultDay(), '5': createDefaultDay(), '6': createDefaultDay(), '7': createDefaultDay() }
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
							draft[d][key] = { enabled: true, lessonType: avail.lessonType || 'individual', location: avail.location || 'facility', modality: avail.modality || 'in_person' }
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
						day[key] = { enabled: true, lessonType: avail.lessonType || 'individual', location: avail.location || 'facility', modality: avail.modality || 'in_person' }
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

	const generateAvailabilityData = () => {
		const out: any[] = []
		Object.entries(weeklyHours).forEach(([day, hours]) => {
			hourKeys.forEach((h) => {
				const o = hours[h]
				if (o?.enabled) {
					const nextHour = `${String((Number(h.slice(0,2)) + 1) % 24).padStart(2,'0')}:00`
					out.push({ type: 'weekly', weekdays: [day], from: h, to: nextHour, fromDate: startDate || null, until: endDate || null, lessonType: o.lessonType, location: o.location, modality: o.modality, groupSize: o.lessonType === 'group' && typeof o.groupSize === 'number' ? o.groupSize : undefined })
				}
			})
		})
		Object.entries(overrides).forEach(([dateStr, hours]) => {
			hourKeys.forEach((h) => {
				const o = hours[h]
				if (o?.enabled) {
					const nextHour = `${String((Number(h.slice(0,2)) + 1) % 24).padStart(2,'0')}:00`
					out.push({ type: 'specific', date: dateStr, from: h, to: nextHour, lessonType: o.lessonType, location: o.location, modality: o.modality, groupSize: o.lessonType === 'group' && typeof o.groupSize === 'number' ? o.groupSize : undefined })
				}
			})
		})
		return out
	}

	const onPhotoSelect = (file: File) => { const reader = new FileReader(); reader.onload = () => setPhoto((reader.result as string) || ''); reader.readAsDataURL(file) }

	const handleSave = async () => {
		if (!firstName.trim() || !lastName.trim()) { alert('Lūdzu aizpildiet vārdu un uzvārdu'); return }
		setSaving(true)
		try {
			const availabilityData = generateAvailabilityData()
			const response = await fetch('/api/teacher-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, firstName: firstName.trim(), lastName: lastName.trim(), photo, description: description.trim(), availability: availabilityData }) })
			if (response.ok) onFinished(); else alert('Kļūda saglabājot profilu')
		} catch { alert('Kļūda savienojumā') } finally { setSaving(false) }
	}

	const buildBaselineForDate = (dateStr: string): Record<HourKey, HourOpts> => {
		const baseline = createDefaultDay()
		try {
			if (!dateStr) return baseline
			const d = new Date(dateStr)
			if (isNaN(d.getTime())) return baseline
			const jsWeekDay = d.getDay()
			const dayIdx = ((jsWeekDay + 6) % 7) + 1
			const weekly = weeklyHours[String(dayIdx)]
			if (weekly) { hourKeys.forEach(h => { const w = weekly[h]; if (w?.enabled) baseline[h] = { enabled: true, lessonType: w.lessonType, location: w.location, modality: w.modality } }) }
		} catch {}
		return baseline
	}

	useEffect(() => { if (!overrideDate) return; setOverrides(prev => { if (prev[overrideDate]) return prev; return { ...prev, [overrideDate]: buildBaselineForDate(overrideDate) } }) }, [overrideDate])

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow p-6 space-y-6">
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

				<div className="flex gap-2">
					<button type="button" onClick={() => setScheduleTab('weekly')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${scheduleTab === 'weekly' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Ik nedēļas grafiks</button>
					<button type="button" onClick={() => setScheduleTab('specific')} className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${scheduleTab === 'specific' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Noteiktas dienas grafiks</button>
				</div>

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
																{o.lessonType === 'group' && (
																	<input type="number" min={2} max={50} value={typeof o.groupSize === 'number' ? o.groupSize : ''} onChange={(e) => { const val = e.target.value === '' ? undefined : Math.max(2, Math.min(50, Number(e.target.value))); updateHourOpt(day, h, 'groupSize', val as any) }} placeholder="Grupas izmērs" className="p-1 border border-gray-300 rounded text-xs w-28" />
																)}
																<select value={o.location} onChange={e => updateHourOpt(day, h, 'location', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
																	<option value="facility">Uz vietas</option>
																	<option value="teacher">Privāti</option>
																</select>
																{o.location === 'teacher' && (
																	<span className="text-xs text-red-600">Izvēloties privāto opciju, telpas jānodrošina pašiem.</span>
																)}
																<select value={o.modality} onChange={e => updateHourOpt(day, h, 'modality', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
																	<option value="in_person">Klātienē</option>
																	<option value="zoom">Attālināti</option>
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
						<div className="border-t border-gray-200 pt-4">
							<div className="grid md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Sākuma datums (neobligāti)</label>
									<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent w-full" />
									<p className="text-xs text-gray-500 mt-1">No šī datuma sāksies jūsu pieejamība</p>
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Beigu datums (neobligāti)</label>
									<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus-border-transparent w-full" />
									<p className="text-xs text-gray-500 mt-1">Pēc šī datuma jūs vairs nebūsiet pieejams jaunām rezervācijām</p>
								</div>
							</div>
						</div>
					</>
				)}

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
													{o.lessonType === 'group' && (
														<input type="number" min={2} max={50} value={typeof o.groupSize === 'number' ? o.groupSize : ''} onChange={(e) => { const val = e.target.value === '' ? undefined : Math.max(2, Math.min(50, Number(e.target.value))); updateOverrideHourOpt(overrideDate, h, 'groupSize' as any, val as any) }} placeholder="Grupas izmērs" className="p-1 border border-gray-300 rounded text-xs w-28" />
													)}
													<select value={o.location} onChange={e => updateOverrideHourOpt(overrideDate, h, 'location', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
														<option value="facility">Uz vietas</option>
														<option value="teacher">Privāti</option>
													</select>
													{o.location === 'teacher' && (
														<span className="text-xs text-red-600">Izvēloties privāto opciju, telpas jānodrošina pašiem.</span>
													)}
													<select value={o.modality} onChange={e => updateOverrideHourOpt(overrideDate, h, 'modality', e.target.value)} className="p-1 border border-gray-300 rounded text-xs">
														<option value="in_person">Klātienē</option>
														<option value="zoom">Attālināti</option>
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
					<button disabled={saving} onClick={handleSave} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black font-semibold py-2 px-4 rounded-lg">{saving ? 'Saglabā...' : 'Saglabāt'}</button>
				</div>
			</div>
		</div>
	)
}

export default TeacherProfile


