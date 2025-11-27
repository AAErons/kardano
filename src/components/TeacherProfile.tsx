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
				<TeacherOnboarding userId={userId} allowProfileEdit={!(((teacherProfile?.firstName || '').trim() || (teacherProfile?.lastName || '').trim() || (teacherProfile?.name || '').trim()))} initialPhoto={teacherProfile?.photo} initialDescription={teacherProfile?.description} initialAvailability={teacherProfile?.availability || []} initialFirstName={teacherProfile?.firstName} initialLastName={teacherProfile?.lastName} onFinished={async () => {
					try {
						const prof = await fetch(`/api/teacher-profile?userId=${encodeURIComponent(userId)}`).then(r => r.json()).catch(() => null)
						if (prof && prof.profile) { setTeacherProfile(prof.profile); setIsEditingProfile(false) }
					} catch {}
				}} onCancel={() => setIsEditingProfile(false)} />
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
	// Attendance draft state
	const [attendanceDraft, setAttendanceDraft] = useState<Record<string, { attended?: boolean; extendPreferred?: boolean }>>({})
	const [attendanceSaving, setAttendanceSaving] = useState(false)
	const [attendanceMsg, setAttendanceMsg] = useState<string | null>(null)
	const [attendanceSavingIds, setAttendanceSavingIds] = useState<Record<string, boolean>>({})
	const [attendanceItemMsg, setAttendanceItemMsg] = useState<Record<string, string>>({})
    const [bookingInputs, setBookingInputs] = useState<Record<string, { zoomLink?: string; address?: string }>>({})
  const [reasonForms, setReasonForms] = useState<Record<string, { open: boolean; action: 'decline' | 'cancel'; text: string; submitting?: boolean }>>({})
  const [notifSelectMode, setNotifSelectMode] = useState(false)
  const [notifSelectedIds, setNotifSelectedIds] = useState<Record<string, boolean>>({})
  const [altForms, setAltForms] = useState<Record<string, { open: boolean; selected?: string; submitting?: boolean }>>({})
  const [incForms, setIncForms] = useState<Record<string, { open: boolean; newSize?: number; submitting?: boolean }>>({})

	// Reviews state for single-time request per user
	const [reviews, setReviews] = useState<any[]>([])
	const [loadingReviews, setLoadingReviews] = useState(false)
	const [sentReviewReqByUser, setSentReviewReqByUser] = useState<Record<string, boolean>>({})

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

	const loadNotifications = async (silent?: boolean) => {
		if (!teacherId) return
		if (!silent) setLoadingNotifications(true)
		try {
			const r = await fetch(`/api/notifications?recipientRole=worker&recipientUserId=${encodeURIComponent(teacherId)}`)
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && Array.isArray(d.items)) {
					// Only update if something actually changed
					const sig = (arr: any[]) => arr.map((n: any) => `${n.id}:${n.unread ? '1' : '0'}`).join('|')
					const prevSig = sig(notifications)
					const nextSig = sig(d.items)
					if (prevSig !== nextSig) {
						setNotifications(d.items)
						try { localStorage.setItem(`cache_worker_notifications_${teacherId}_v1`, JSON.stringify({ items: d.items, ts: Date.now() })) } catch {}
					}
				}
			}
		} catch {}
		if (!silent) setLoadingNotifications(false)
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

	const loadReviews = async () => {
		if (!teacherId) return
		setLoadingReviews(true)
		try {
			const r = await fetch(`/api/reviews?role=worker&userId=${encodeURIComponent(teacherId)}`)
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && Array.isArray(d.items)) {
					setReviews(d.items)
					// Precompute sent map
					const m: Record<string, boolean> = {}
					d.items.forEach((x: any) => { if (x && x.userId && (x.status === 'requested' || x.status === 'submitted')) m[String(x.userId)] = true })
					setSentReviewReqByUser(m)
				}
			}
		} catch {}
		setLoadingReviews(false)
	}

	useEffect(() => {
	        if (activeTab === 'notifications') loadNotifications()
		if (activeTab === 'bookings') loadBookings()
		if (activeTab === 'attendance') { loadBookings(); loadReviews() }
	}, [activeTab, teacherId])

	// Ensure bookings are available in profile calendar
	useEffect(() => { if (teacherId) { loadBookings(); } }, [teacherId])

	// Background refresh for badges (notifications and bookings)
	useEffect(() => {
		if (!teacherId) return
		let timer: any
		const tick = async () => {
			try {
				await loadNotifications(true)
				await loadBookings()
			} catch {}
		}
		tick()
		timer = setInterval(tick, 15000)
		const onFocus = () => { tick() }
		window.addEventListener('focus', onFocus)
		return () => { if (timer) clearInterval(timer); window.removeEventListener('focus', onFocus) }
	}, [teacherId])

    // Load cached notifications on mount/teacher change
    useEffect(() => {
        if (!teacherId) return
        try {
            const raw = localStorage.getItem(`cache_worker_notifications_${teacherId}_v1`)
            if (raw) {
                const cached = JSON.parse(raw)
                if (cached && Array.isArray(cached.items)) setNotifications(cached.items)
            }
        } catch {}
    }, [teacherId])

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
                // Update local state + cache without waiting for reload
                setNotifications(prev => {
                    const next = prev.map(x => x.id === notificationId ? { ...x, unread: false } : x)
                    try { localStorage.setItem(`cache_worker_notifications_${teacherId}_v1`, JSON.stringify({ items: next, ts: Date.now() })) } catch {}
                    return next
                })
			} catch {}
		} else {
			setExpandedNotifications(prev => { const s = new Set(prev); s.delete(notificationId); return s })
		}
	}

    const toggleNotifSelect = (id: string) => setNotifSelectedIds(prev => ({ ...prev, [id]: !prev[id] }))

    const deleteSelectedNotifs = async () => {
        const ids = Object.keys(notifSelectedIds).filter(k => notifSelectedIds[k])
        if (!ids.length) return
        try {
            await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ids }) })
            setNotifications(prev => {
                const next = prev.filter(n => !ids.includes(n.id))
                try { localStorage.setItem(`cache_worker_notifications_${teacherId}_v1`, JSON.stringify({ items: next, ts: Date.now() })) } catch {}
                return next
            })
            setNotifSelectedIds({})
            setNotifSelectMode(false)
        } catch {}
    }

    const deleteOneNotif = async (id: string) => {
        try {
            await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
            setNotifications(prev => {
                const next = prev.filter(n => n.id !== id)
                try { localStorage.setItem(`cache_worker_notifications_${teacherId}_v1`, JSON.stringify({ items: next, ts: Date.now() })) } catch {}
                return next
            })
            setExpandedNotifications(prev => { const s = new Set(prev); s.delete(id); return s })
        } catch {}
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
	const { daysInMonth, startingDay } = getDaysInMonth(selectedDate)
	
	// Compute badge counts
	const unreadNotifCount = notifications.filter(n => n.unread).length
	// Only count pending bookings that haven't passed their time yet
	const pendingBookingsCount = bookings.filter(b => {
		if (b.status !== 'pending' && b.status !== 'pending_unavailable') return false
		// Check if booking time has passed
		try {
			const bookingDateTime = new Date(`${b.date}T${b.time}:00`)
			return bookingDateTime.getTime() >= Date.now()
		} catch {
			return true // If can't parse, include it to be safe
		}
	}).length

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
							<button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={onEdit}>Mainīt grafiku</button>
						</div>
						<div className="text-sm text-gray-700 whitespace-pre-line">{profile.description || '—'}</div>
					</div>
				</div>
			</div>

			<div className="bg-white rounded-2xl shadow-xl p-2">
				<div className="flex gap-2">
					<button onClick={() => setActiveTab('profile')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'profile' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Profils</button>
				<button onClick={() => setActiveTab('notifications')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'notifications' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
					Paziņojumi {unreadNotifCount > 0 && <span className="ml-2 inline-block text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{unreadNotifCount}</span>}
				</button>
				<button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'bookings' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
					Rezervācijas {pendingBookingsCount > 0 && <span className="ml-2 inline-block text-xs bg-red-500 text-white rounded-full px-2 py-0.5">{pendingBookingsCount}</span>}
				</button>
					<button onClick={() => setActiveTab('attendance')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'attendance' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>Nodarbību apmeklējums</button>
				</div>
			</div>

			{activeTab === 'profile' && (
				<div className="bg-white rounded-2xl shadow p-6">
					{/* Calendar (read-only for this teacher) */}
						<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="text-lg font-semibold text-black">
								{selectedDate.toLocaleString('lv-LV', { month: 'long', year: 'numeric' })}
							</div>
							<div className="flex items-center gap-2">
								<button onClick={() => { setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)); setSelectedDay(null) }} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Iepriekšējais</button>
								<button onClick={() => { setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)); setSelectedDay(null) }} className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">Nākamais</button>
							</div>
						</div>
						
						{/* Legend */}
						<div className="flex flex-wrap items-center gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
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
								<span className="text-gray-700">Notikusi</span>
							</div>
							<div className="flex items-center gap-1.5">
								<div className="w-3 h-3 rounded-full bg-gray-500"></div>
								<span className="text-gray-700">Noilgusi</span>
							</div>
						</div>
						
				<div className="grid grid-cols-7 gap-1">
						{Array.from({ length: startingDay }, (_, i) => (
							<div key={`empty-${i}`} className="h-20 lg:h-24" />
						))}
						{Array.from({ length: daysInMonth }, (_, idx) => {
						const day = idx + 1
					const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
					const daySlots = getSlotsForDate(dateStr)
					const nowTs = Date.now()
					
				// Check if this day is in the past
				const isDayPast = (() => {
					const dayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
					const today = new Date()
					today.setHours(0, 0, 0, 0)
					return dayDate < today
				})()
				
				// Categorize slots
					const expiredSlots: any[] = []
					const completedSlots: any[] = []
					const acceptedSlots: any[] = []
					const pendingSlots: any[] = []
					const availableSlots: any[] = []
					
					daySlots.forEach((s: any) => {
						const slotTs = new Date(`${s.date}T${s.time}:00`).getTime()
						const lessonType = s.lessonType || 'individual'
						const capacity = lessonType === 'group' && typeof s.groupSize === 'number' ? s.groupSize : 1
						const related = bookings.filter(b => b.date === s.date && b.time === s.time)
						const expiredRelated = related.filter(b => b.status === 'expired')
						// Also treat past pending/pending_unavailable as expired
						const pastPendingRelated = related.filter(b => (b.status === 'pending' || b.status === 'pending_unavailable') && slotTs < nowTs)
						const hasExpired = expiredRelated.length > 0 || pastPendingRelated.length > 0
						const acceptedRelated = related.filter(b => b.status === 'accepted')
						const pendingRelated = related.filter(b => (b.status === 'pending' || b.status === 'pending_unavailable') && slotTs >= nowTs)
						const effectiveRelated = related.filter(b => b.status === 'accepted' || b.status === 'pending' || b.status === 'pending_unavailable')
						const bookedCount = effectiveRelated.length
						const isBooked = bookedCount >= capacity || s.available === false
						
						if (slotTs < nowTs) {
							// Past slot - only show if it had bookings (reserved)
							if (hasExpired) {
								expiredSlots.push(s)
							} else if (acceptedRelated.length > 0 || related.length > 0) {
								completedSlots.push(s)
							}
							// Don't add unreserved past slots (no else clause for availableSlots)
						} else if (isBooked) {
							// Future booked slot - determine if accepted or pending
							if (acceptedRelated.length > 0) {
								acceptedSlots.push(s)
							} else if (pendingRelated.length > 0) {
								pendingSlots.push(s)
							} else {
								pendingSlots.push(s) // Default to pending
							}
						} else {
							availableSlots.push(s)
						}
					})
					
					// For past days, we only show reserved slots (those with bookings)
					const displaySlots = isDayPast 
						? [...expiredSlots, ...completedSlots]
						: [...expiredSlots, ...completedSlots, ...acceptedSlots, ...pendingSlots, ...availableSlots]
					
					const totalSlots = displaySlots.length
					const circleSize = totalSlots > 50 ? 'w-1 h-1 lg:w-1.5 lg:h-1.5' : totalSlots > 30 ? 'w-1.5 h-1.5 lg:w-2 lg:h-2' : 'w-2 h-2 lg:w-2.5 lg:h-2.5'
					const gapSize = totalSlots > 50 ? 'gap-0.5' : totalSlots > 30 ? 'gap-1' : 'gap-1.5'
					
					// Determine cell background color
					let cellBgClass = ''
					if (isDayPast) {
						cellBgClass = 'bg-gray-50' // Past days are always grey
					} else if (displaySlots.length > 0) {
						cellBgClass = 'bg-green-50 hover:bg-green-100' // Today/future with bookings
					} else {
						cellBgClass = 'bg-blue-50 hover:bg-blue-100' // Today/future free day
					}
					
					return (
						<div key={day} className={`h-20 lg:h-24 border p-1 cursor-pointer ${cellBgClass}`} onClick={() => { setSelectedDay(day); setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)) }}>
							<div className="text-xs font-medium mb-1">{day}</div>
							{displaySlots.length > 0 && (
								<div className={`flex flex-wrap ${gapSize}`}>
									{expiredSlots.map((_, i) => (
										<div key={`expired-${i}`} className={`${circleSize} rounded-full bg-gray-500`} title="Noilgusi" />
									))}
									{completedSlots.map((_, i) => (
										<div key={`completed-${i}`} className={`${circleSize} rounded-full bg-blue-500`} title="Notikusi" />
									))}
									{!isDayPast && acceptedSlots.map((_, i) => (
										<div key={`accepted-${i}`} className={`${circleSize} rounded-full bg-green-600`} title="Apstiprināts" />
									))}
									{!isDayPast && pendingSlots.map((_, i) => (
										<div key={`pending-${i}`} className={`${circleSize} rounded-full bg-yellow-500`} title="Gaida apstiprinājumu" />
									))}
									{!isDayPast && availableSlots.map((_, i) => (
										<div key={`avail-${i}`} className={`${circleSize} rounded-full border-2 border-green-600 bg-white`} title="Pieejams" />
									))}
								</div>
							)}
						</div>
					)
						})}
					</div>
						{selectedDay && (() => {
							const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`
							const daySlots = getSlotsForDate(dateStr)
							
							// Check if selected day is in the past
							const isSelectedDayPast = (() => {
								const dayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDay)
								const today = new Date()
								today.setHours(0, 0, 0, 0)
								return dayDate < today
							})()
							
							return (
								<div className="mt-4">
									<h4 className="font-semibold text-black mb-2">Laiki {selectedDate.toLocaleDateString('lv-LV')}</h4>
									<div className="space-y-2">
										{daySlots.map(s => {
											const lessonTypeLabel = s.lessonType === 'group' ? 'Grupu' : 'Individuāla'
											const locationLabel = s.location === 'teacher' ? 'Privāti' : 'Uz vietas'
											const modalityLabel = s.modality === 'zoom' ? 'Attālināti' : s.modality === 'both' ? 'Klātienē vai attālināti' : 'Klātienē'
										const capacity = s.lessonType === 'group' && typeof s.groupSize === 'number' ? s.groupSize : 1
                                        const related = bookings.filter(b => b.date === s.date && b.time === s.time)
                                        
                                        // Check if slot is in the past
											const isPast = (() => {
												try {
													const slotDateTime = new Date(`${s.date}T${s.time}:00`)
													return slotDateTime.getTime() < Date.now()
												} catch {
													return false
												}
											})()
                                        
                                        const acceptedRelated = related.filter(b => b.status === 'accepted')
                                        const expiredRelated = related.filter(b => b.status === 'expired')
                                        // Also treat past pending/pending_unavailable as expired
                                        const pastPendingRelated = related.filter(b => (b.status === 'pending' || b.status === 'pending_unavailable') && isPast)
                                        const hasExpired = expiredRelated.length > 0 || pastPendingRelated.length > 0
                                        const pendingRelated = related.filter(b => (b.status === 'pending' || b.status === 'pending_unavailable') && !isPast)
                                        const effectiveRelated = related.filter(b => b.status === 'accepted' || b.status === 'pending' || b.status === 'pending_unavailable')
                                        const bookedCount = effectiveRelated.length
                                        const isAvailable = s.available !== false && bookedCount < capacity
											const slotKey = `${s.date}|${s.time}`
											
											// Determine status label and styling
											let statusLabel = 'Pieejams'
											let statusClass = 'bg-green-100 text-green-800 border-green-200'
											let cardClass = 'bg-green-50 border-green-200'
											
											if (isPast) {
												// Past slots
												if (hasExpired) {
													// Had pending bookings that expired
													statusLabel = 'Noilgusi'
													statusClass = 'bg-gray-100 text-gray-800 border-gray-200'
													cardClass = 'bg-gray-50 border-gray-200'
												} else if (acceptedRelated.length > 0 || related.length > 0) {
													// Had accepted bookings or any other bookings that happened
													statusLabel = 'Notikusi'
													statusClass = 'bg-blue-100 text-blue-800 border-blue-200'
													cardClass = 'bg-blue-50 border-blue-200'
												}
											} else if (!isAvailable) {
												// Future slots that are booked
												if (acceptedRelated.length > 0) {
													// Has accepted bookings
													statusLabel = 'Apstiprināts'
													statusClass = 'bg-green-100 text-green-800 border-green-200'
													cardClass = 'bg-green-50 border-green-200'
												} else if (pendingRelated.length > 0) {
													// Has pending bookings
													statusLabel = 'Gaida apstiprinājumu'
													statusClass = 'bg-yellow-100 text-yellow-800 border-yellow-200'
													cardClass = 'bg-yellow-50 border-yellow-200'
												}
											}
											
											// For past days, don't show unreserved slots
											if (isPast && related.length === 0) {
												return null
											}
											
											return (
												<div key={s.id} className={`border rounded-lg p-3 ${cardClass}`}>
													<div className="flex items-center justify-between mb-1">
														<div className="text-lg font-semibold text-black">{s.time}</div>
														<span className={`text-xs px-2 py-0.5 rounded-full border ${statusClass}`}>{statusLabel}</span>
													</div>
													<div className="flex flex-wrap gap-2 text-xs">
														<span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full border border-blue-200">{lessonTypeLabel}</span>
														<span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full border border-purple-200">{modalityLabel}</span>
														<span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full border border-gray-200">{locationLabel}</span>
                                                    {s.lessonType === 'group' && (
                                                        <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full border border-teal-200">{bookedCount}/{capacity}</span>
                                                    )}
													</div>
                                                    {!isAvailable && s.lessonType !== 'group' && (acceptedRelated.length > 0 || pendingRelated.length > 0) && (
                                                        <div className="text-xs text-gray-700 mt-1">Skolēns: {(acceptedRelated[0]?.studentName || acceptedRelated[0]?.userName || pendingRelated[0]?.studentName || pendingRelated[0]?.userName || '—')}</div>
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
                    <h3 className="text-lg font-semibold text-black mb-4">Paziņojumi</h3>
                    {loadingNotifications ? (
                        <div className="text-center py-8 text-gray-500">Ielādē...</div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">Nav paziņojumu</div>
                    ) : (
                        <div className="space-y-2">
                            {notifications.map(n => (
                                <div key={n.id} className={`border rounded-xl ${n.unread ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            {notifSelectMode && (
                                                <input type="checkbox" checked={!!notifSelectedIds[n.id]} onChange={() => toggleNotifSelect(n.id)} />
                                            )}
                                            <button className="text-left font-semibold text-black truncate" title={n.title} onClick={() => handleNotificationClick(n.id)}>{n.title}</button>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-xs text-gray-500">{n.createdAt ? new Date(n.createdAt).toLocaleString('lv-LV') : ''}</div>
                                            <button className="text-xs text-red-600" onClick={() => deleteOneNotif(n.id)}>Dzēst</button>
                                        </div>
                                    </div>
                                    {expandedNotifications.has(n.id) && (
                                        <div className="px-4 pb-4 text-sm text-gray-700 whitespace-pre-line">{n.message}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-3 flex items-center gap-2">
                        {notifSelectMode ? (
                            <>
                                <button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={deleteSelectedNotifs}>Dzēst izvēlētos</button>
                                <button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={() => { setNotifSelectMode(false); setNotifSelectedIds({}) }}>Atcelt</button>
                            </>
                        ) : (
                            <button className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50" onClick={() => setNotifSelectMode(true)}>Atlasīt</button>
                        )}
                    </div>
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
  const getTs = (v: any) => {
    try { return new Date(v?.createdAt || 0).getTime() || 0 } catch { return 0 }
  };
  
  // Helper to check if a booking time has passed
  const isPastBooking = (b: any) => {
    try {
      const bookingDateTime = new Date(`${b.date}T${b.time}:00`)
      return bookingDateTime.getTime() < Date.now()
    } catch {
      return false
    }
  };
  
  const pending = bookings
    .filter(x => x.status === 'pending' || x.status === 'pending_unavailable' || x.status === 'expired')
    .sort((a, b) => getTs(b) - getTs(a));
  const grouped: Record<string, any[]> = {};
  pending.forEach(b => {
    const k = b.batchId ? String(b.batchId) : `__single__${b._id}`;
    (grouped[k] ||= []).push(b);
  });

  const batchKeys = Object.keys(grouped);
  // Sort batch groups by newest createdAt among items in the group
  const batchGroups = batchKeys
    .filter(k => !k.startsWith('__single__') && grouped[k].length > 1)
    .sort((ka, kb) => {
      const maxA = Math.max(...grouped[ka].map(getTs));
      const maxB = Math.max(...grouped[kb].map(getTs));
      return maxB - maxA;
    });
  const nonBatchPending = batchKeys
    .filter(k => k.startsWith('__single__') || grouped[k].length <= 1)
    .flatMap(k => grouped[k])
    .sort((a, b) => getTs(b) - getTs(a));
  const others = bookings
    .filter(x => x.status !== 'pending' && x.status !== 'pending_unavailable')
    .sort((a, b) => getTs(b) - getTs(a));
  const singles = [...nonBatchPending, ...others].sort((a, b) => getTs(b) - getTs(a));

  // --- return valid JSX ---
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <button onClick={() => loadBookings()} disabled={loadingBookings} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50 disabled:opacity-60">
          {loadingBookings ? 'Ielādē...' : 'Atjaunot'}
        </button>
      </div>
      {batchGroups.map(k => {
        const list = grouped[k];
        const tid = String(list[0].teacherId);
        const dateTimes = list
          .map(x => `${new Date(x.date).toLocaleDateString('lv-LV')} ${x.time}`)
          .join(', ');
        const allPast = list.every((x: any) => isPastBooking(x));

        return (
          <div key={`batch-${k}`} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700 font-semibold">
                Vairāku nodarbību rezervācijas pieprasījums ({list.length})
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full border ${allPast ? 'bg-gray-50 text-gray-800 border-gray-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
                {allPast ? 'Noilgusi' : 'Gaida'}
              </span>
            </div>
            <div className="text-sm text-gray-700">
              <strong>Laiki:</strong> {dateTimes}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
															{list.some((x: any) => !isPastBooking(x)) && (
 															<button onClick={async () => {
 																try {
 																	// Only accept bookings that haven't passed
 																	const validBookings = list.filter((x: any) => !isPastBooking(x))
 																	if (validBookings.length === 0) {
 																		alert('Visas rezervācijas ir noilgušas')
 																		return
 																	}
 																	const needsZoom = validBookings.some((x: any) => (slots.find(s => String(s.teacherId) === tid && s.date === x.date && s.time === x.time)?.modality || x.modality) === 'zoom')
 																	const needsTeacherAddress = validBookings.some((x: any) => (slots.find(s => String(s.teacherId) === tid && s.date === x.date && s.time === x.time)?.location || x.location) === 'teacher')
 																	let zoomLink = ''
 																	let address = ''
 																	if (needsZoom) { zoomLink = prompt('Ievadiet Zoom saiti') || '' }
 																	if (!needsZoom && needsTeacherAddress) { address = prompt('Ievadiet adresi') || '' }
 																	const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept_batch', teacherId: tid, batchId: k, zoomLink, address }) })
 																	if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās apstiprināt komplektu'); return }
 																	loadBookings()
 																} catch { alert('Kļūda apstrādē') }
 															}} className="bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded">Apstiprināt visus</button>
															)}
 														</div>
													<div className="mt-3 space-y-2">
														{[...list].sort((a: any, b: any) => getTs(b) - getTs(a)).map((bi: any) => {
															const label = `${new Date(bi.date).toLocaleDateString('lv-LV')} ${bi.time} — ${bi.studentName || bi.userName || '—'}`
															const createdStr = bi.createdAt ? new Date(bi.createdAt).toLocaleString('lv-LV') : ''
															const isBookingPast = isPastBooking(bi)
															return (
																<div key={bi._id} className="flex items-center justify-between text-sm">
																	<div className="text-gray-700">
																		<div>{label}</div>
																		{createdStr && <div className="text-sm text-gray-700"><strong>Izveidots:</strong> {createdStr}</div>}
																	</div>
																	{isBookingPast ? (
																		<span className="px-2 py-0.5 text-xs rounded-full border bg-gray-50 text-gray-800 border-gray-200">
																			Noilgusi
																		</span>
																	) : (
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
																	)}
																</div>
														)
													})}
													</div>
 												</div>
        );
      })}

      {singles.map(b => {
        const dateStr = new Date(b.date).toLocaleDateString('lv-LV')
        const isBookingPast = isPastBooking(b)
        const isPending = b.status === 'pending'
        const isPendingUnavailable = b.status === 'pending_unavailable'
        // If booking is past and still pending, treat it as expired
        const effectiveStatus = (isPending || isPendingUnavailable) && isBookingPast ? 'expired' : b.status
        const tid = String(teacherId)
        const slot = slots.find(s => String(s.teacherId) === tid && s.date === b.date && s.time === b.time)
        const mod = (slot?.modality || b.modality)
        const loc = (slot?.location || b.location)
        const needsZoom = mod === 'zoom'
        const needsAddress = mod !== 'zoom' && loc === 'teacher'
        const lessonType = (slot?.lessonType || b.lessonType)
        const capacity = lessonType === 'group' ? (typeof slot?.groupSize === 'number' ? Number(slot?.groupSize) : (typeof b.groupSize === 'number' ? Number(b.groupSize) : 1)) : 1
        const relatedSameSlot = bookings.filter(x => String(x.teacherId) === tid && x.date === b.date && x.time === b.time)
        const acceptedCount = relatedSameSlot.filter(x => x.status === 'accepted').length
        const isFull = acceptedCount >= capacity
        return (
          <div key={b._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-700"><strong>Datums:</strong> {dateStr} {b.time}</div>
              <span className={`px-2 py-0.5 text-xs rounded-full border ${effectiveStatus === 'accepted' ? 'bg-green-50 text-green-800 border-green-200' : effectiveStatus === 'declined' ? 'bg-red-50 text-red-800 border-red-200' : effectiveStatus === 'cancelled' ? 'bg-red-50 text-red-800 border-red-200' : effectiveStatus === 'expired' ? 'bg-gray-50 text-gray-800 border-gray-200' : 'bg-yellow-50 text-yellow-800 border-yellow-200'}`}>
                {effectiveStatus === 'accepted' ? 'Apstiprināts' : effectiveStatus === 'declined' ? 'Noraidīts' : effectiveStatus === 'cancelled' ? 'Atcelts' : effectiveStatus === 'expired' ? 'Noilgusi' : 'Gaida'}
              </span>
            </div>
            {b.declineReason && (
              <div className="text-xs text-gray-700 mb-2"><strong>Pamatojums:</strong> {b.declineReason}</div>
            )}
            {b.cancelReason && (
              <div className="text-xs text-gray-700 mb-2"><strong>Pamatojums:</strong> {b.cancelReason}</div>
            )}
            {b.status === 'cancelled' && (
              <div className="text-xs text-gray-500 mb-2"><strong>Atcēla:</strong> {b.cancelledBy === 'teacher' ? 'Pasniedzējs' : 'Lietotājs'}</div>
            )}
            {b.createdAt && (
              <div className="text-sm text-gray-700"><strong>Izveidots:</strong> {new Date(b.createdAt).toLocaleString('lv-LV')}</div>
            )}
            <div className="text-sm text-gray-700"><strong>Skolēns:</strong> {b.studentName || b.userName || '—'}</div>
            {b.userRole === 'children' && (
              <div className="text-sm text-gray-700"><strong>Vecāks:</strong> {b.userName || '—'}</div>
            )}
            <div className="text-sm text-gray-700"><strong>Phone:</strong> {b.userPhone || '—'}</div>
            <div className="text-sm text-gray-700"><strong>Email:</strong> {b.userEmail || '—'}</div>
            {isPending && !isFull && !isBookingPast && (
              <div className="mt-2 space-y-2">
                {needsZoom && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Zoom saite</label>
                    <input value={bookingInputs[String(b._id)]?.zoomLink || ''} onChange={e => setBookingInputs(prev => ({ ...prev, [String(b._id)]: { ...(prev[String(b._id)] || {}), zoomLink: e.target.value } }))} placeholder="https://..." className="w-full max-w-md p-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                )}
                {needsAddress && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Adrese</label>
                    <input value={bookingInputs[String(b._id)]?.address || ''} onChange={e => setBookingInputs(prev => ({ ...prev, [String(b._id)]: { ...(prev[String(b._id)] || {}), address: e.target.value } }))} placeholder="Adrese" className="w-full max-w-md p-2 border border-gray-300 rounded-lg text-sm" />
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={async () => {
                    try {
                      const id = String(b._id)
                      const val = bookingInputs[id] || {}
                      const zoomLink = val.zoomLink || ''
                      const address = val.address || ''
                      if (needsZoom && !zoomLink) { alert('Lūdzu ievadiet Zoom saiti'); return }
                      if (needsAddress && !address) { alert('Lūdzu ievadiet adresi'); return }
                      const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept', bookingId: id, teacherId: tid, zoomLink, address }) })
                      if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās apstiprināt'); return }
                      loadBookings()
                    } catch { alert('Kļūda') }
                  }} className="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded">Apstiprināt</button>
                  <button onClick={() => {
                    const id = String(b._id)
                    setReasonForms(prev => ({ ...prev, [id]: { open: true, action: 'decline', text: '' } }))
                  }} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Noraidīt</button>
                </div>
              </div>
            )}

            {isPendingUnavailable && !isBookingPast && (
              <div className="mt-2 space-y-3">
                <div className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded p-2">Šis laiks vairs nav pieejams apstiprināšanai.</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => {
                    const id = String(b._id)
                    setReasonForms(prev => ({ ...prev, [id]: { open: true, action: 'decline', text: '' } }))
                  }} className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Noraidīt</button>
                  <button onClick={() => {
                    const id = String(b._id)
                    setAltForms(prev => ({ ...prev, [id]: { open: !(prev[id]?.open), selected: prev[id]?.selected } }))
                  }} className="border border-gray-300 text-gray-800 hover:bg-gray-50 px-2 py-1 rounded">Piedāvāt citu laiku</button>
                  {lessonType === 'group' && isFull && (
                    <button onClick={() => {
                      const id = String(b._id)
                      const baseSize = capacity > 0 ? capacity : 1
                      setIncForms(prev => ({ ...prev, [id]: { open: !(prev[id]?.open), newSize: (prev[id]?.newSize && prev[id]?.newSize! > baseSize) ? prev[id]?.newSize : baseSize + 1 } }))
                    }} className="border border-gray-300 text-gray-800 hover:bg-gray-50 px-2 py-1 rounded">Palielināt grupu</button>
                  )}
                </div>

                {altForms[String(b._id)]?.open && (() => {
                  const nowTs = Date.now()
                  const alternatives = slots
                    .filter(s => String(s.teacherId) === tid && s.available !== false)
                    .filter(s => (s.lessonType || lessonType) === lessonType)
                    .filter(s => (s.modality || mod) === mod && (s.location || loc) === loc)
                    .filter(s => new Date(`${s.date}T${s.time}:00`).getTime() > nowTs)
                    .sort((a, c) => new Date(`${a.date}T${a.time}:00`).getTime() - new Date(`${c.date}T${c.time}:00`).getTime())
                  return (
                    <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Izvēlieties citu laiku</label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <select value={altForms[String(b._id)]?.selected || ''} onChange={e => {
                          const id = String(b._id)
                          setAltForms(prev => ({ ...prev, [id]: { ...(prev[id] || { open: true }), selected: e.target.value } }))
                        }} className="p-2 border border-gray-300 rounded-lg text-sm min-w-[16rem]">
                          <option value="">-- izvēlieties --</option>
                          {alternatives.map(s => (
                            <option key={`${s.date}|${s.time}`} value={`${s.date}|${s.time}`}>{new Date(s.date).toLocaleDateString('lv-LV')} {s.time}</option>
                          ))}
                        </select>
                        <button onClick={async () => {
                          const sel = altForms[String(b._id)]?.selected || ''
                          if (!sel) { alert('Lūdzu izvēlieties citu laiku'); return }
                          const [nd, nt] = sel.split('|')
                          const chosen = slots.find(s => String(s.teacherId) === tid && s.date === nd && s.time === nt)
                          if (!chosen) { alert('Izvēlētais laiks nav pieejams'); return }
                          const needsZoom2 = (chosen.modality || mod) === 'zoom'
                          const needsAddress2 = (chosen.modality || mod) !== 'zoom' && (chosen.location || loc) === 'teacher'
                          let zoomLink = ''
                          let address = ''
                          if (needsZoom2) { zoomLink = prompt('Ievadiet Zoom saiti') || '' }
                          if (needsAddress2) { address = prompt('Ievadiet adresi') || '' }
                          if (needsZoom2 && !zoomLink) { alert('Lūdzu ievadiet Zoom saiti'); return }
                          if (needsAddress2 && !address) { alert('Lūdzu ievadiet adresi'); return }
                          try {
                            const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reschedule_accept', bookingId: String(b._id), teacherId: tid, newDate: nd, newTime: nt, zoomLink, address }) })
                            if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās piedāvāt citu laiku'); return }
                            setAltForms(prev => ({ ...prev, [String(b._id)]: { open: false } }))
                            loadBookings()
                          } catch { alert('Kļūda') }
                        }} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Nosūtīt</button>
                        <button onClick={() => setAltForms(prev => ({ ...prev, [String(b._id)]: { open: false } }))} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Atcelt</button>
                      </div>
                    </div>
                  )
                })()}

                {incForms[String(b._id)]?.open && lessonType === 'group' && (
                  <div className="p-2 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex items-end gap-2 flex-wrap">
                      <div>
                        <label className="block text-xs text-gray-700 mb-1">Jaunais grupas izmērs</label>
                        <input type="number" min={capacity + 1} value={incForms[String(b._id)]?.newSize || capacity + 1} onChange={e => {
                          const id = String(b._id)
                          const val = Math.max(capacity + 1, Number(e.target.value || (capacity + 1)))
                          setIncForms(prev => ({ ...prev, [id]: { ...(prev[id] || { open: true }), newSize: val } }))
                        }} className="p-2 border border-gray-300 rounded-lg text-sm w-28" />
                      </div>
                      <button onClick={async () => {
                        const id = String(b._id)
                        const target = incForms[id]?.newSize || (capacity + 1)
                        try {
                          const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'increase_group_size', bookingId: id, teacherId: tid, newSize: target, date: b.date, time: b.time }) })
                          if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās palielināt grupu'); return }
                          setIncForms(prev => ({ ...prev, [id]: { open: false } }))
                          loadBookings()
                        } catch { alert('Kļūda') }
                      }} className="text-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1">Palielināt</button>
                      <button onClick={() => setIncForms(prev => ({ ...prev, [String(b._id)]: { open: false } }))} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Atcelt</button>
                    </div>
                  </div>
                )}
              </div>
            )}
            {b.status === 'accepted' && (b.modality === 'zoom') && b.zoomLink && (
              <div className="text-sm text-gray-700"><strong>Zoom:</strong> <a href={b.zoomLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">{b.zoomLink}</a></div>
            )}
            {b.address && (
              <div className="text-sm text-gray-700"><strong>Adrese:</strong> {b.address}</div>
            )}
            {b.status === 'accepted' && (() => {
              const lessonDateTime = new Date(`${b.date}T${b.time}:00`)
              const isPastLesson = lessonDateTime.getTime() < Date.now()
              return !isPastLesson ? (
                <div className="mt-2">
                  <button onClick={() => {
                    const id = String(b._id)
                    setReasonForms(prev => ({ ...prev, [id]: { open: true, action: 'cancel', text: '' } }))
                  }} className="text-xs bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1">Atcelt</button>
                </div>
              ) : null
            })()}
            {reasonForms[String(b._id)]?.open && (
              <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="block text-xs font-medium text-gray-700 mb-1">Pamatojums</label>
                <input value={reasonForms[String(b._id)]?.text || ''} onChange={(e) => {
                  const id = String(b._id)
                  const curr = reasonForms[id] || { open: true, action: 'decline' as const, text: '' }
                  setReasonForms(prev => ({ ...prev, [id]: { ...curr, text: e.target.value } }))
                }} className="w-full max-w-md p-2 border border-gray-300 rounded-lg text-sm" placeholder="Ievadiet pamatojumu" />
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={async () => {
                    const id = String(b._id)
                    const form = reasonForms[id]
                    if (!form) return
                    setReasonForms(prev => ({ ...prev, [id]: { ...form, submitting: true } }))
                    try {
                      const body: any = { action: form.action, bookingId: id, teacherId: String(teacherId), reason: form.text || '' }
                      const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                      if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās nosūtīt'); return }
                      setReasonForms(prev => ({ ...prev, [id]: { ...form, open: false, submitting: false } }))
                      loadBookings()
                    } catch {
                      alert('Kļūda')
                      setReasonForms(prev => ({ ...prev, [id]: { ...form, submitting: false } }))
                    }
                  }} className="text-xs bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1" disabled={reasonForms[String(b._id)]?.submitting}>{reasonForms[String(b._id)]?.submitting ? 'Sūta...' : 'Sūtīt'}</button>
                  <button onClick={() => {
                    const id = String(b._id)
                    setReasonForms(prev => ({ ...prev, [id]: { open: false, action: prev[id]?.action || 'decline', text: '' } }))
                  }} className="text-xs border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Atcelt</button>
                </div>
              </div>
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
						const accepted = bookings.filter(b => b.status === 'accepted')
						const keyOf = (x: any) => String(x.studentId || x.userId || '')
						const firstByParticipant: Record<string, any> = {}
						accepted.forEach(b => {
							const k = keyOf(b)
							const ts = new Date(`${b.date}T${b.time}:00`).getTime()
							const existing = firstByParticipant[k]
							if (!existing || ts < new Date(`${existing.date}T${existing.time}:00`).getTime()) firstByParticipant[k] = b
						})
						const allFirsts = Object.values(firstByParticipant).filter((b: any) => new Date(`${b.date}T${b.time}:00`).getTime() < nowTs)
						const items = allFirsts.filter((b: any) => (typeof b.attended === 'undefined' || typeof b.extendPreferred === 'undefined'))
						const decided = allFirsts
							.filter((b: any) => (typeof b.attended !== 'undefined' && typeof b.extendPreferred !== 'undefined'))
							.sort((a: any, b: any) => new Date(`${b.date}T${b.time}:00`).getTime() - new Date(`${a.date}T${a.time}:00`).getTime())
						if (items.length === 0) return <div className="text-center py-8 text-gray-500">Nav pirmo nodarbību, kurām jāziņo</div>
						return (
							<div className="space-y-6">
								<div className="flex items-center justify-between">
									<div className="text-sm text-gray-700">Nepabeigti: {items.length}</div>
									<div className="flex items-center gap-2">
										{attendanceMsg && <div className={`text-xs ${attendanceMsg === 'Saglabāts' ? 'text-green-700' : 'text-red-600'}`}>{attendanceMsg}</div>}
										<button onClick={async () => {
											setAttendanceSaving(true)
											setAttendanceMsg(null)
											try {
												const updates = items.map((b: any) => {
													const d = attendanceDraft[String(b._id)] || {}
													const attended = typeof d.attended === 'boolean' ? d.attended : Boolean(b.attended)
													const extendPreferred = typeof d.extendPreferred === 'boolean' ? d.extendPreferred : Boolean(b.extendPreferred)
													return { id: String(b._id), attended, extendPreferred }
												})
												await Promise.all(updates.map(u => fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: u.id, action: 'report', attended: u.attended, extendPreferred: u.extendPreferred }) })))
												setAttendanceMsg('Saglabāts')
												setAttendanceDraft({})
												await loadBookings()
											} catch {
												setAttendanceMsg('Kļūda')
											} finally {
												setAttendanceSaving(false)
											}
										}} disabled={attendanceSaving} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50 disabled:opacity-60">{attendanceSaving ? 'Sūta...' : 'Iesniegt visus'}</button>
									</div>
								</div>
								<div className="space-y-3">
									{items.map((b: any) => {
										const dateStr = new Date(b.date).toLocaleDateString('lv-LV')
										return (
											<div key={`${b._id}-att`} className="border border-gray-200 rounded-lg p-4">
												<div className="flex items-center justify-between mb-2">
													<div className="text-sm text-gray-700"><strong>Datums:</strong> {dateStr} {b.time}</div>
													<span className="px-2 py-0.5 text-xs rounded-full border bg-green-50 text-green-800 border-green-200">Pirmā nodarbība</span>
												</div>
												<div className="flex flex-wrap items-center gap-3 text-xs">
													<span className="font-medium text-gray-800 mr-2">{b.studentName || b.userName || '—'}</span>
													<label className="inline-flex items-center gap-1"><input type="checkbox" checked={attendanceDraft[String(b._id)]?.attended ?? Boolean(b.attended)} onChange={(e) => { const v = e.target.checked; setAttendanceDraft(prev => ({ ...prev, [String(b._id)]: { ...(prev[String(b._id)] || {}), attended: v } })) }} /> Apmeklēja</label>
													<label className="inline-flex items-center gap-1"><input type="checkbox" checked={attendanceDraft[String(b._id)]?.extendPreferred ?? Boolean(b.extendPreferred)} onChange={(e) => { const v = e.target.checked; setAttendanceDraft(prev => ({ ...prev, [String(b._id)]: { ...(prev[String(b._id)] || {}), extendPreferred: v } })) }} /> Apstiprinu sadarbību ilgtermiņā</label>
													<div className="ml-auto flex items-center gap-2">
														{attendanceItemMsg[String(b._id)] && (
															<div className={`text-xs ${attendanceItemMsg[String(b._id)] === 'Saglabāts' ? 'text-green-700' : 'text-red-600'}`}>{attendanceItemMsg[String(b._id)]}</div>
														)}
														<button onClick={async () => {
															const id = String(b._id)
															setAttendanceSavingIds(prev => ({ ...prev, [id]: true }))
															setAttendanceItemMsg(prev => ({ ...prev, [id]: '' }))
															try {
																const d = attendanceDraft[id] || {}
																const attended = typeof d.attended === 'boolean' ? d.attended : Boolean(b.attended)
																const extendPreferred = typeof d.extendPreferred === 'boolean' ? d.extendPreferred : Boolean(b.extendPreferred)
																await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId: id, action: 'report', attended, extendPreferred }) })
																setAttendanceItemMsg(prev => ({ ...prev, [id]: 'Saglabāts' }))
																setAttendanceDraft(prev => { const next = { ...prev }; delete next[id]; return next })
																await loadBookings()
															} catch {
																setAttendanceItemMsg(prev => ({ ...prev, [id]: 'Kļūda' }))
															} finally {
																setAttendanceSavingIds(prev => ({ ...prev, [id]: false }))
															}
														}} disabled={Boolean(attendanceSavingIds[String(b._id)])} className="text-xs border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50 disabled:opacity-60">{attendanceSavingIds[String(b._id)] ? 'Sūta...' : 'Iesniegt'}</button>
													</div>
												</div>
											</div>
										)
									})}
								</div>
								{decided.length > 0 && (
									<div className="pt-4 border-t border-gray-200">
								<h4 className="text-sm font-semibold text-gray-800 mb-2">
									Iepriekšējie lēmumi
									<span className="ml-2 text-xs text-gray-500">
										{loadingReviews ? 'Ielādē novērtējumus…' : `Novērtējumi: ${(reviews || []).filter((r: any) => r.status === 'submitted').length}`}
									</span>
								</h4>
										<div className="space-y-2">
									{decided.map((b: any) => {
												const dateStr = new Date(b.date).toLocaleDateString('lv-LV')
										const userKey = String(b.userId || '')
										const requestAlreadySent = Boolean(sentReviewReqByUser[userKey])
										return (
													<div key={`${b._id}-dec`} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
														<div className="flex flex-wrap items-center gap-3 text-xs text-gray-700">
															<span className="font-medium text-gray-800">{b.studentName || b.userName || '—'}</span>
															<span>({dateStr} {b.time})</span>
															<span className={`px-2 py-0.5 rounded-full border ${b.attended ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>Apmeklēja: {b.attended ? 'Jā' : 'Nē'}</span>
															<span className={`px-2 py-0.5 rounded-full border ${b.extendPreferred ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>Sadarbība: {b.extendPreferred ? 'Jā' : 'Nē'}</span>
													<div className="ml-auto" />
													{userKey && !requestAlreadySent ? (
														<button onClick={async () => {
															try {
																const r = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ teacherId, userId: userKey, bookingId: String(b._id) }) })
																if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās nosūtīt pieprasījumu'); return }
																setSentReviewReqByUser(prev => ({ ...prev, [userKey]: true }))
															} catch { alert('Kļūda') }
														}} className="text-xs bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1">Palūgt novērtējumu</button>
													) : userKey ? (
														<span className="text-xs text-green-700">Pieprasījums nosūtīts</span>
													) : null}
														</div>
													</div>
												)
											})}
										</div>
									</div>
								)}
							</div>
						)
					})()}
				</div>
			)}
		</div>
	)
}

// === Onboarding component from OldProfileSection ===
const TeacherOnboarding = ({ userId, onFinished, onCancel, allowProfileEdit = false, initialPhoto, initialDescription, initialAvailability, initialFirstName, initialLastName }: { userId: string; onFinished: () => void; onCancel: () => void; allowProfileEdit?: boolean; initialPhoto?: string; initialDescription?: string; initialAvailability?: any[]; initialFirstName?: string; initialLastName?: string; displayName?: string; isActive?: boolean }) => {
	const [photo, setPhoto] = useState<string>(initialPhoto || '')
	const [description, setDescription] = useState(initialDescription || '')
	const [firstName, setFirstName] = useState<string>(initialFirstName || '')
	const [lastName, setLastName] = useState<string>(initialLastName || '')
	const [saving, setSaving] = useState(false)
	const [scheduleTab, setScheduleTab] = useState<'weekly'|'specific'>('weekly')
	type HourKey = `${string}:${string}`
	type HourOpts = { enabled: boolean; lessonType: 'individual' | 'group'; location: 'facility' | 'teacher'; modality: 'in_person' | 'zoom' | 'both'; groupSize?: number }
	const allowedStartHour = 8
	const allowedEndHour = 22 // exclusive
	const hourKeys: HourKey[] = Array.from({ length: allowedEndHour - allowedStartHour }, (_, i) => `${String(i + allowedStartHour).padStart(2, '0')}:00` as HourKey)
	const createDefaultDay = (): Record<HourKey, HourOpts> => hourKeys.reduce((acc, h) => { acc[h] = { enabled: false, lessonType: 'individual', location: 'facility', modality: 'both' }; return acc }, {} as Record<HourKey, HourOpts>)
	const [weeklyHours, setWeeklyHours] = useState<Record<string, Record<HourKey, HourOpts>>>(() => ({ '1': createDefaultDay(), '2': createDefaultDay(), '3': createDefaultDay(), '4': createDefaultDay(), '5': createDefaultDay(), '6': createDefaultDay(), '7': createDefaultDay() }))
	const [openDay, setOpenDay] = useState<string | null>(null)
	const [endDate, setEndDate] = useState<string>('')
	const [startDate, setStartDate] = useState<string>('')
	const [overrideDate, setOverrideDate] = useState<string>('')
	const [overrides, setOverrides] = useState<Record<string, Record<HourKey, HourOpts>>>({})

	const toggleHour = (day: string, hour: HourKey, enabled: boolean) => { setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], [hour]: { ...prev[day][hour], enabled } } })) }
	const updateHourOpt = (day: string, hour: HourKey, field: 'lessonType'|'location'|'modality'|'groupSize', value: any) => { setWeeklyHours(prev => ({ ...prev, [day]: { ...prev[day], [hour]: { ...prev[day][hour], [field]: value } } })) }
	const toggleOverrideHour = (date: string, hour: HourKey, enabled: boolean) => { setOverrides(prev => { const day = prev[date] ? { ...prev[date] } : createDefaultDay(); day[hour] = { ...(day[hour] || { enabled: false, lessonType: 'individual', location: 'facility', modality: 'both' }), enabled }; return { ...prev, [date]: day } }) }
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
						const rawFromHour = Number(from.slice(0,2))
						const rawToHour = Math.max(rawFromHour + 1, Number(to.slice(0,2)))
						const fromHour = Math.max(allowedStartHour, Math.min(allowedEndHour - 1, rawFromHour))
						const toHourClamped = Math.max(fromHour + 1, Math.min(allowedEndHour, rawToHour))
						for (let h = fromHour; h < toHourClamped; h++) {
							const key = `${String(h).padStart(2,'0')}:00` as HourKey
							draft[d][key] = {
								enabled: true,
								lessonType: avail.lessonType || 'individual',
								location: avail.location || 'facility',
								modality: avail.modality || 'in_person',
								groupSize: (avail.lessonType === 'group' && typeof avail.groupSize === 'number') ? avail.groupSize : undefined
							}
						}
					}
				})
				if (avail?.type === 'specific' && typeof avail?.date === 'string' && avail.date) {
					const dateStr = avail.date
					const rawFromHour = Number(from.slice(0,2))
					const rawToHour = Math.max(rawFromHour + 1, Number(to.slice(0,2)))
					const fromHour = Math.max(allowedStartHour, Math.min(allowedEndHour - 1, rawFromHour))
					const toHourClamped = Math.max(fromHour + 1, Math.min(allowedEndHour, rawToHour))
					const day = draftOverrides[dateStr] ? { ...draftOverrides[dateStr] } : createDefaultDay()
					for (let h = fromHour; h < toHourClamped; h++) {
						const key = `${String(h).padStart(2,'0')}:00` as HourKey
						day[key] = {
							enabled: true,
							lessonType: avail.lessonType || 'individual',
							location: avail.location || 'facility',
							modality: avail.modality || 'in_person',
							groupSize: (avail.lessonType === 'group' && typeof avail.groupSize === 'number') ? avail.groupSize : undefined
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
		if (allowProfileEdit && (!firstName.trim() || !lastName.trim())) { alert('Lūdzu aizpildiet vārdu un uzvārdu'); return }
		setSaving(true)
		try {
			const availabilityData = generateAvailabilityData()
			const payload: any = { userId, availability: availabilityData }
			// Always include description and photo to prevent losing them
			if (description.trim()) payload.description = description.trim()
			if (photo) payload.photo = photo
			if (allowProfileEdit) { 
				payload.firstName = firstName.trim()
				payload.lastName = lastName.trim()
			}
			const response = await fetch('/api/teacher-profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
			if (weekly) { hourKeys.forEach(h => { const w = weekly[h]; if (w?.enabled) baseline[h] = { enabled: true, lessonType: w.lessonType, location: w.location, modality: w.modality, groupSize: typeof w.groupSize === 'number' ? w.groupSize : undefined } }) }
		} catch {}
		return baseline
	}

	useEffect(() => { if (!overrideDate) return; setOverrides(prev => { if (prev[overrideDate]) return prev; return { ...prev, [overrideDate]: buildBaselineForDate(overrideDate) } }) }, [overrideDate])

	return (
		<div className="space-y-6">
			<div className="bg-white rounded-2xl shadow p-6 space-y-6">
				<div className="grid md:grid-cols-2 gap-4">
					{allowProfileEdit && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Vārds</label>
							<input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Vārds" />
						</div>
					)}
					{allowProfileEdit && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Uzvārds</label>
							<input value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Uzvārds" />
						</div>
					)}
					{allowProfileEdit && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Foto</label>
							<input type="file" accept="image/*" onChange={e => { const f = e.target.files && e.target.files[0]; if (f) onPhotoSelect(f) }} className="w-full p-2 border border-gray-300 rounded-lg" />
							{photo && <div className="mt-2"><img src={photo} alt="Priekšskatījums" className="w-20 h-20 rounded-full object-cover border-2 border-yellow-200" /></div>}
						</div>
					)}
					{allowProfileEdit && (
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1">Apraksts</label>
							<textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent" placeholder="Par sevi, pieredze, pieejamība..." />
						</div>
					)}
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
																	{o.lessonType === 'individual' ? (
																		<>
																			<option value="in_person">Klātienē</option>
																			<option value="zoom">Attālināti</option>
																			<option value="both">Klātienē vai attālināti</option>
																		</>
																	) : (
																		<>
																			<option value="in_person">Klātienē</option>
																			<option value="zoom">Attālināti</option>
																		</>
																	)}
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
														{o.lessonType === 'individual' ? (
															<>
																<option value="in_person">Klātienē</option>
																<option value="zoom">Attālināti</option>
																<option value="both">Klātienē vai attālināti</option>
															</>
														) : (
															<>
																<option value="in_person">Klātienē</option>
																<option value="zoom">Attālināti</option>
															</>
														)}
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

				<div className="pt-2 flex gap-2">
					<button disabled={saving} onClick={handleSave} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black font-semibold py-2 px-4 rounded-lg">{saving ? 'Saglabā...' : 'Saglabāt'}</button>
					<button type="button" onClick={onCancel} className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-2 px-4 rounded-lg">Atcelt</button>
				</div>
			</div>
		</div>
	)
}

export default TeacherProfile


