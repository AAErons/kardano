import { useEffect, useState } from 'react'

type UserProfileProps = { userId: string }

const UserProfile = ({ userId }: UserProfileProps) => {
	const [activeTab, setActiveTab] = useState<'children' | 'bookings' | 'collab' | 'reviews'>('bookings')
	const [userInfo, setUserInfo] = useState<any>(null)
	const [children, setChildren] = useState<any[]>([])
	const [bookings, setBookings] = useState<any[]>([])
	const [timeSlots, setTimeSlots] = useState<any[]>([])
	const [loadingCollab, setLoadingCollab] = useState(false)
	const [selectedCollab, setSelectedCollab] = useState<Record<string, Record<string, boolean>>>({})
	const [selectedChildIdCollab, setSelectedChildIdCollab] = useState<string>('')
	const [collabMessage, setCollabMessage] = useState<string | null>(null)
	const [collabFilters, setCollabFilters] = useState<{ from: string; to: string; lessonType: 'all'|'individual'|'group'; modality: 'all'|'in_person'|'zoom'|'both' }>(() => {
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
	const [userCancelForms, setUserCancelForms] = useState<Record<string, { open: boolean; text: string; submitting?: boolean }>>({})
	// Reviews state
	const [reviews, setReviews] = useState<any[]>([])
	const [loadingReviews, setLoadingReviews] = useState(false)
	const [reviewForm, setReviewForm] = useState<Record<string, { rating: number; comment: string; submitting?: boolean }>>({})

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

	const loadReviews = async () => {
		if (!userId) return
		setLoadingReviews(true)
		try {
			const r = await fetch(`/api/reviews?role=user&userId=${encodeURIComponent(userId)}`)
			if (r.ok) {
				const d = await r.json().catch(() => null)
				if (d && Array.isArray(d.items)) setReviews(d.items)
			}
		} catch {}
		setLoadingReviews(false)
	}

	useEffect(() => { loadUserInfo() }, [userId])
// Ensure children count loads early for parent accounts
useEffect(() => {
    if (userId && userInfo?.accountType === 'children') {
        loadChildren()
    }
}, [userId, userInfo?.accountType])

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
		if (activeTab === 'reviews') loadReviews()
	}, [activeTab, userId])

	// Default select first child for collaboration tab (no 'none' option)
	useEffect(() => {
		if (activeTab === 'collab' && userInfo?.accountType === 'children' && children.length > 0) {
			if (!selectedChildIdCollab) {
				const firstId = String(children[0].id || children[0]._id)
				setSelectedChildIdCollab(firstId)
			}
		}
	}, [activeTab, userInfo?.accountType, children, selectedChildIdCollab])

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
                        <div className="pt-3">
                            <DeleteProfile userId={userId} onDeleted={() => { try { localStorage.removeItem('auth') } catch {}; window.location.href = '/' }} />
                        </div>
					</div>
				</div>
			</div>

            <div className="bg-white rounded-2xl shadow-xl p-2">
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('bookings')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'bookings' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
                        Rezervācijas ({bookings.length})
                    </button>
                    {userInfo?.accountType === 'children' && (
                        <button onClick={() => setActiveTab('children')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'children' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
                            Bērni ({children.length})
                        </button>
                    )}
					{(() => {
						const collabIds = new Set((bookings || []).filter(b => b.extendPreferred === true).map(b => String(b.teacherId)))
						return collabIds.size > 0 ? (
							<button onClick={() => setActiveTab('collab')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'collab' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
								Sadarbības
							</button>
						) : null
					})()}
					<button onClick={() => setActiveTab('reviews')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === 'reviews' ? 'bg-yellow-400 text-black' : 'text-gray-700 hover:bg-yellow-100'}`}>
						Nodarbību vērtējumi
					</button>
				</div>
			</div>

            {activeTab === 'children' && userInfo?.accountType === 'children' && (
				<div className="bg-white rounded-2xl shadow p-6">
					<h3 className="text-lg font-semibold text-black mb-4">Mani bērni</h3>
                    {loadingChildren ? (
						<div className="text-center py-8 text-gray-500">Ielādē...</div>
					) : children.length === 0 ? (
                        <div>
                            <div className="text-center py-8 text-gray-500">Nav bērnu</div>
                            <AddChildForm userId={userId} onSaved={() => loadChildren()} />
                        </div>
					) : (
                        <div className="space-y-4">
                            <AddChildForm userId={userId} onSaved={() => loadChildren()} />
                            {children.map(child => (
                                <ChildCard key={child.id} child={child} onSaved={() => loadChildren()} onDeleted={() => loadChildren()} />
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
                                <label className="flex items-center gap-1 text-xs text-gray-700">
                                    <input type="checkbox" checked={Boolean(bookingStatusFilter['cancelled'])} onChange={e => setBookingStatusFilter(prev => ({ ...prev, ['cancelled']: e.target.checked }))} />
                                    <span>Atcelts</span>
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
                                    if (bookingStatusFilter['cancelled'] && s === 'cancelled') return true
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
                                                : booking.status === 'cancelled'
                                                    ? 'bg-red-100 text-red-800'
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
                                                : booking.status === 'cancelled'
                                                    ? 'Atcelts'
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
                                                {booking.declineReason && (
                                                    <p className="text-sm text-gray-700"><strong>Pamatojums:</strong> {booking.declineReason}</p>
                                                )}
                                                {booking.cancelReason && (
                                                    <p className="text-sm text-gray-700"><strong>Pamatojums:</strong> {booking.cancelReason}</p>
                                                )}
                                                {booking.status === 'cancelled' && (
                                                    <p className="text-xs text-gray-500"><strong>Atcēla:</strong> {booking.cancelledBy === 'teacher' ? 'Pasniedzējs' : 'Lietotājs'}</p>
                                                )}
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
                                                            <strong>Tikšanās veids:</strong> {booking.modality === 'zoom' ? 'Attālināti' : booking.modality === 'both' ? 'Klātienē vai attālināti' : 'Klātienē'}
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
                                                {(booking.status === 'pending' || booking.status === 'pending_unavailable') && (
                                                    <div className="pt-2">
                                                        <button onClick={async () => {
                                                            try {
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
                                                {(booking.status === 'accepted' && !isPastAccepted) && (
                                                    <div className="pt-2">
                                                        {!userCancelForms[String(booking._id)]?.open ? (
                                                            <button onClick={() => {
                                                                const id = String(booking._id)
                                                                setUserCancelForms(prev => ({ ...prev, [id]: { open: true, text: '' } }))
                                                            }} className="text-sm bg-red-500 hover:bg-red-600 text-white rounded-md px-3 py-1">Atcelt</button>
                                                        ) : (
                                                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                                                <label className="block text-xs font-medium text-gray-700 mb-1">Pamatojums</label>
                                                                <input value={userCancelForms[String(booking._id)]?.text || ''} onChange={(e) => {
                                                                    const id = String(booking._id)
                                                                    const curr = userCancelForms[id] || { open: true, text: '' }
                                                                    setUserCancelForms(prev => ({ ...prev, [id]: { ...curr, text: e.target.value } }))
                                                                }} className="w-full max-w-md p-2 border border-gray-300 rounded-lg text-sm" placeholder="Ievadiet pamatojumu" />
                                                                <div className="mt-2 flex items-center gap-2">
                                                                    <button onClick={async () => {
                                                                        const id = String(booking._id)
                                                                        const form = userCancelForms[id]
                                                                        if (!form) return
                                                                        setUserCancelForms(prev => ({ ...prev, [id]: { ...form, submitting: true } }))
                                                                        try {
                                                                            const now = new Date()
                                                                            const bookingDate = new Date(booking.date + 'T00:00:00')
                                                                            const isSameDay = now.getFullYear() === bookingDate.getFullYear() && now.getMonth() === bookingDate.getMonth() && now.getDate() === bookingDate.getDate()
                                                                            if (isSameDay) {
                                                                                const ok = confirm('Atcelot pēc 00:00 šīs pašas dienas laikā, nauda netiks atgriezta. Vai turpināt?')
                                                                                if (!ok) { setUserCancelForms(prev => ({ ...prev, [id]: { ...form, submitting: false } })); return }
                                                                            }
                                                                            const r = await fetch('/api/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'cancel', bookingId: id, reason: form.text || '' }) })
                                                                            if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās atcelt'); setUserCancelForms(prev => ({ ...prev, [id]: { ...form, submitting: false } })); return }
                                                                            setUserCancelForms(prev => ({ ...prev, [id]: { open: false, text: '', submitting: false } }))
                                                                            await loadBookings()
                                                                        } catch {
                                                                            alert('Kļūda')
                                                                            const id2 = String(booking._id)
                                                                            const form2 = userCancelForms[id2]
                                                                            if (form2) setUserCancelForms(prev => ({ ...prev, [id2]: { ...form2, submitting: false } }))
                                                                        }
                                                                    }} className="text-xs bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1" disabled={userCancelForms[String(booking._id)]?.submitting}>{userCancelForms[String(booking._id)]?.submitting ? 'Sūta...' : 'Sūtīt'}</button>
                                                                    <button onClick={() => {
                                                                        const id = String(booking._id)
                                                                        setUserCancelForms(prev => ({ ...prev, [id]: { open: false, text: '' } }))
                                                                    }} className="text-xs border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Atcelt</button>
                                                                </div>
                                                            </div>
                                                        )}
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

			{activeTab === 'reviews' && (
				<div className="bg-white rounded-2xl shadow p-6">
					<h3 className="text-lg font-semibold text-black mb-4">Nodarbību vērtējumi</h3>
					<div className="flex items-center justify-end mb-3">
						<button onClick={() => loadReviews()} disabled={loadingReviews} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50 disabled:opacity-60">{loadingReviews ? 'Ielādē...' : 'Atjaunot'}</button>
					</div>
					{loadingReviews ? (
						<div className="text-center py-8 text-gray-500">Ielādē...</div>
					) : reviews.length === 0 ? (
						<div className="text-center py-8 text-gray-500">Nav pieprasījumu vai novērtējumu</div>
					) : (
						<div className="space-y-3">
							{reviews.map((r: any) => {
								const isApproved = r.status === 'approved'
								const isPending = r.status === 'pending'
								return (
									<div key={String(r._id)} className="border border-gray-200 rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<div className="text-sm text-gray-700">
												<strong>Pasniedzējs:</strong> {r.teacherName || '—'}
												{r.lesson && (
													<span className="ml-2 text-xs text-gray-600">({new Date(r.lesson.date).toLocaleDateString('lv-LV')} {r.lesson.time})</span>
												)}
											</div>
									<span className={`px-2 py-0.5 text-xs rounded-full border ${isApproved ? 'bg-green-50 text-green-800 border-green-200' : isPending ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
										{isApproved ? 'Apstiprināts' : isPending ? 'Gaida apstiprinājumu' : (r.status === 'denied' ? 'Noraidīts' : 'Pieprasīts')}
											</span>
										</div>
								{isApproved ? (
											<div className="text-sm text-gray-700">
												<strong>Vērtējums:</strong> {r.rating} / 5
												{r.comment && <div className="mt-1 whitespace-pre-line">{r.comment}</div>}
											</div>
								) : isPending ? (
									<div className="text-sm text-gray-600">Atsauksme nosūtīta un gaida apstiprinājumu.</div>
								) : (
											<div className="text-sm">
												<div className="flex items-center gap-2 mb-2">
													<label className="text-xs text-gray-700">Vērtējums</label>
													<select value={reviewForm[String(r._id)]?.rating ?? 5} onChange={e => {
														const id = String(r._id)
														setReviewForm(prev => ({ ...prev, [id]: { rating: Number(e.target.value), comment: prev[id]?.comment || '' } }))
													}} className="p-1 border border-gray-300 rounded text-xs">
														{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
													</select>
												</div>
												<textarea placeholder="Komentārs (neobligāti)" value={reviewForm[String(r._id)]?.comment || ''} onChange={e => {
													const id = String(r._id)
													setReviewForm(prev => ({ ...prev, [id]: { rating: prev[id]?.rating ?? 5, comment: e.target.value } }))
												}} className="w-full p-2 border border-gray-300 rounded-lg text-sm" rows={2} />
												<div className="mt-2 flex items-center gap-2">
													<button disabled={reviewForm[String(r._id)]?.submitting} onClick={async () => {
														const id = String(r._id)
														const frm = reviewForm[id] || { rating: 5, comment: '' }
														if (!(frm.rating >= 1 && frm.rating <= 5)) { alert('Nederīgs vērtējums'); return }
														setReviewForm(prev => ({ ...prev, [id]: { ...frm, submitting: true } }))
														try {
															const resp = await fetch('/api/reviews', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'submit', rating: frm.rating, comment: frm.comment || '' }) })
															if (!resp.ok) { const e = await resp.json().catch(() => ({})); alert(e.error || 'Neizdevās iesniegt'); setReviewForm(prev => ({ ...prev, [id]: { ...frm, submitting: false } })); return }
															await loadReviews()
														} finally {
															setReviewForm(prev => ({ ...prev, [id]: { ...frm, submitting: false } }))
														}
													}} className="text-sm bg-yellow-400 hover:bg-yellow-500 text-black rounded-md px-3 py-1">Iesniegt vērtējumu</button>
												</div>
											</div>
										)}
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
						const collabChildByTeacher: Record<string, string> = {}
						;(bookings || []).forEach(b => {
							try {
								if (b && b.extendPreferred === true && b.status === 'accepted' && (b.studentId || b.userId)) {
									const tid = String(b.teacherId)
									const sid = String(b.studentId || b.userId || '')
									if (tid && sid && !collabChildByTeacher[tid]) collabChildByTeacher[tid] = sid
								}
							} catch {}
						})
						// Filter teachers by selected child for parent accounts
						const filteredTeacherIds = (userInfo?.accountType === 'children')
							? collabIds.filter(tid => collabChildByTeacher[tid] && String(collabChildByTeacher[tid]) === String(selectedChildIdCollab))
							: collabIds
						// Keep filters visible; if no teachers for selected child, show empty state below filters
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
												<option value="both">Klātienē vai attālināti</option>
											</select>
										</div>
									</div>
								</div>
								{userInfo?.accountType === 'children' && (
									<div>
										<label className="block text-xs font-medium text-gray-700 mb-1">Bērns</label>
										<select value={selectedChildIdCollab} onChange={e => setSelectedChildIdCollab(e.target.value)} className="w-full max-w-xs p-2 border border-gray-300 rounded-lg text-sm">
											{children.map((c: any) => (
												<option key={c.id || c._id} value={String(c.id || c._id)}>{c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim()}</option>
											))}
										</select>
									</div>
								)}
								{filteredTeacherIds.length === 0 ? (
									<div className="text-gray-500">Nav ilgtermiņa sadarbību</div>
								) : filteredTeacherIds.map(tid => {
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
											// Enforce one-child-per-teacher long-term relationship
											if (userInfo?.accountType === 'children') {
												const assignedChildId = collabChildByTeacher[tid]
												if (assignedChildId && String(selectedChildIdCollab || '') !== String(assignedChildId)) {
													const assignedChild = children.find((c: any) => String(c.id || c._id) === String(assignedChildId))
													const assignedName = assignedChild ? (assignedChild.name || `${assignedChild.firstName || ''} ${assignedChild.lastName || ''}`.trim()) : 'norādītais bērns'
													setCollabMessage(`Šim pasniedzējam ilgtermiņa sadarbība pieejama tikai bērnam: ${assignedName}.`)
													return
												}
											}
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
																			<span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">{sample?.modality === 'zoom' ? 'Attālināti' : sample?.modality === 'both' ? 'Klātienē vai attālināti' : 'Klātienē'}</span>
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



const DeleteProfile = ({ userId, onDeleted }: { userId: string; onDeleted: () => void }) => {
    const [open, setOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    return (
        <div>
            {!open ? (
                <button onClick={() => setOpen(true)} className="text-sm text-red-600 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50">Dzēst profīlu</button>
            ) : (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-800 font-semibold mb-1">Šis profils tiks neatgriezeniski dzēsts.</div>
                    <div className="text-xs text-red-700 mb-2">Tiks atceltas arī visas šī profila rezervācijas.</div>
                    <div className="flex items-center gap-2">
                        <button disabled={submitting} onClick={async () => {
                            setSubmitting(true)
                            try {
                                const r = await fetch('/api/user-delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
                                if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās dzēst profilu'); setSubmitting(false); return }
                                onDeleted()
                            } catch {
                                alert('Kļūda')
                                setSubmitting(false)
                            }
                        }} className="text-sm bg-red-600 hover:bg-red-700 text-white rounded-md px-3 py-1">{submitting ? 'Dzēš...' : 'Dzēst'}</button>
                        <button onClick={() => setOpen(false)} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Atcelt</button>
                    </div>
                </div>
            )}
        </div>
    )
}

const AddChildForm = ({ userId, onSaved }: { userId: string; onSaved: () => void }) => {
    const [form, setForm] = useState<{ firstName: string; lastName: string; age: string; grade: string; email: string; phone: string; school: string }>({ firstName: '', lastName: '', age: '', grade: '', email: '', phone: '', school: '' })
    const [saving, setSaving] = useState(false)
    return (
        <div className="border border-gray-200 rounded-lg p-4">
            <div className="font-semibold text-black mb-2">Pievienot bērnu</div>
            <div className="grid md:grid-cols-3 gap-3">
                <input className="p-2 border border-gray-300 rounded-lg" placeholder="Vārds" value={form.firstName} onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))} />
                <input className="p-2 border border-gray-300 rounded-lg" placeholder="Uzvārds" value={form.lastName} onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))} />
                <input className="p-2 border border-gray-300 rounded-lg" placeholder="Vecums" type="number" min={1} value={form.age} onChange={e => setForm(prev => ({ ...prev, age: e.target.value }))} />
                <input className="p-2 border border-gray-300 rounded-lg" placeholder="Klase" value={form.grade} onChange={e => setForm(prev => ({ ...prev, grade: e.target.value }))} />
                <input className="p-2 border border-gray-300 rounded-lg" placeholder="E-pasts (neobligāti)" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
                <input className="p-2 border border-gray-300 rounded-lg" placeholder="Tālrunis (neobligāti)" value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} />
                <input className="p-2 border border-gray-300 rounded-lg md:col-span-3" placeholder="Skola (neobligāti)" value={form.school} onChange={e => setForm(prev => ({ ...prev, school: e.target.value }))} />
            </div>
            <div className="mt-3">
                <button disabled={saving || !form.firstName.trim() || !form.lastName.trim()} onClick={async () => {
                    try {
                        setSaving(true)
                        const payload: any = {
                            userId,
                            firstName: form.firstName.trim(),
                            lastName: form.lastName.trim(),
                            age: form.age ? Number(form.age) : null,
                            grade: form.grade || null,
                            email: form.email || undefined,
                            phone: form.phone || undefined,
                            school: form.school || null
                        }
                        const r = await fetch('/api/students', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                        if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās pievienot bērnu'); return }
                        setForm({ firstName: '', lastName: '', age: '', grade: '', email: '', phone: '', school: '' })
                        onSaved()
                    } finally {
                        setSaving(false)
                    }
                }} className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black font-semibold px-4 py-2 rounded-lg">{saving ? 'Saglabā...' : 'Pievienot'}</button>
            </div>
        </div>
    )
}

const ChildCard = ({ child, onSaved, onDeleted }: { child: any; onSaved: () => void; onDeleted: () => void }) => {
    const [edit, setEdit] = useState(false)
    const [form, setForm] = useState<{ firstName: string; lastName: string; age: string; grade: string; email: string; phone: string; school: string }>(() => ({
        firstName: child.firstName || '',
        lastName: child.lastName || '',
        age: child.age != null ? String(child.age) : '',
        grade: child.grade || '',
        email: child.email || '',
        phone: child.phone || '',
        school: child.school || ''
    }))
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    return (
        <div className="border border-gray-200 rounded-lg p-4">
            {!edit ? (
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h4 className="font-semibold text-black mb-2">{child.firstName} {child.lastName}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {child.age && (<div><label className="block text-xs font-medium text-gray-600 mb-1">Vecums</label><div className="text-gray-900">{child.age} gadi</div></div>)}
                            {child.grade && (<div><label className="block text-xs font-medium text-gray-600 mb-1">Klase</label><div className="text-gray-900">{child.grade}</div></div>)}
                            {child.email && (<div><label className="block text-xs font-medium text-gray-600 mb-1">E-pasts</label><div className="text-gray-900">{child.email}</div></div>)}
                            {child.phone && (<div><label className="block text-xs font-medium text-gray-600 mb-1">Tālrunis</label><div className="text-gray-900">{child.phone}</div></div>)}
                            {child.school && (<div><label className="block text-xs font-medium text-gray-600 mb-1">Skola</label><div className="text-gray-900">{child.school}</div></div>)}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setEdit(true)} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Labot</button>
                        <button disabled={deleting} onClick={async () => { if (!confirm('Dzēst bērnu?')) return; setDeleting(true); try { const r = await fetch('/api/students', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: String(child.id) }) }); if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās dzēst'); return } onDeleted() } finally { setDeleting(false) } }} className="text-sm text-red-600 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50">Dzēst</button>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="grid md:grid-cols-3 gap-3">
                        <input className="p-2 border border-gray-300 rounded-lg" placeholder="Vārds" value={form.firstName} onChange={e => setForm(prev => ({ ...prev, firstName: e.target.value }))} />
                        <input className="p-2 border border-gray-300 rounded-lg" placeholder="Uzvārds" value={form.lastName} onChange={e => setForm(prev => ({ ...prev, lastName: e.target.value }))} />
                        <input className="p-2 border border-gray-300 rounded-lg" placeholder="Vecums" type="number" min={1} value={form.age} onChange={e => setForm(prev => ({ ...prev, age: e.target.value }))} />
                        <input className="p-2 border border-gray-300 rounded-lg" placeholder="Klase" value={form.grade} onChange={e => setForm(prev => ({ ...prev, grade: e.target.value }))} />
                        <input className="p-2 border border-gray-300 rounded-lg" placeholder="E-pasts (neobligāti)" value={form.email} onChange={e => setForm(prev => ({ ...prev, email: e.target.value }))} />
                        <input className="p-2 border border-gray-300 rounded-lg" placeholder="Tālrunis (neobligāti)" value={form.phone} onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))} />
                        <input className="p-2 border border-gray-300 rounded-lg md:col-span-3" placeholder="Skola (neobligāti)" value={form.school} onChange={e => setForm(prev => ({ ...prev, school: e.target.value }))} />
                    </div>
                    <div className="flex items-center gap-2">
                        <button disabled={saving || !form.firstName.trim() || !form.lastName.trim()} onClick={async () => {
                            try {
                                setSaving(true)
                                const payload: any = {
                                    id: String(child.id),
                                    firstName: form.firstName.trim(),
                                    lastName: form.lastName.trim(),
                                    age: form.age ? Number(form.age) : null,
                                    grade: form.grade || null,
                                    email: form.email || null,
                                    phone: form.phone || null,
                                    school: form.school || null
                                }
                                const r = await fetch('/api/students', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
                                if (!r.ok) { const e = await r.json().catch(() => ({})); alert(e.error || 'Neizdevās saglabāt'); return }
                                setEdit(false)
                                onSaved()
                            } finally {
                                setSaving(false)
                            }
                        }} className="text-sm bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-black rounded-md px-3 py-1">{saving ? 'Saglabā...' : 'Saglabāt'}</button>
                        <button onClick={() => setEdit(false)} className="text-sm border border-gray-300 rounded-md px-3 py-1 hover:bg-gray-50">Atcelt</button>
                    </div>
                </div>
            )}
        </div>
    )
}
