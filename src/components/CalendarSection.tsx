import { useState, useEffect } from 'react'

interface TimeSlot {
	id: string
	teacherId: string
	teacherName: string
	teacherDescription: string
	date: string
	time: string
	duration: number
	subject: string
	available: boolean
}

const CalendarSection = () => {
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [selectedDay, setSelectedDay] = useState<number | null>(null)
	const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
	const [loading, setLoading] = useState(true)
	const [userRole, setUserRole] = useState<string | null>(null)
	const [showMonthPicker, setShowMonthPicker] = useState(false)

	// Check if user is logged in
	useEffect(() => {
		try {
			const raw = localStorage.getItem('auth')
			if (raw) {
				const saved = JSON.parse(raw)
				if (saved && saved.role) {
					setUserRole(saved.role)
				}
			}
		} catch {}
	}, [])

	// Initialize selected day to today when component loads (only once)
	useEffect(() => {
		const today = new Date()
		if (selectedDate.getMonth() === today.getMonth() && selectedDate.getFullYear() === today.getFullYear()) {
			setSelectedDay(today.getDate())
		}
	}, []) // Empty dependency array - only run once on mount

	// Reset selected day when changing months
	useEffect(() => {
		const today = new Date()
		if (selectedDate.getMonth() !== today.getMonth() || selectedDate.getFullYear() !== today.getFullYear()) {
			setSelectedDay(null)
		}
	}, [selectedDate])

	// Load time slots
	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true)
				const response = await fetch('/api/time-slots')
				if (response.ok) {
					const data = await response.json()
					if (data.success) {
						setTimeSlots(data.timeSlots || [])
					}
				}
			} catch (error) {
				console.error('Failed to load time slots:', error)
			} finally {
				setLoading(false)
			}
		}

		loadData()
	}, [])

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
			"Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs",
			"Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"
		]
		return months[date.getMonth()]
	}

	const getWeekdayNames = () => {
		return ["P", "O", "T", "C", "Pk", "S", "Sv"]
	}

	const isPastDate = (day: number) => {
		const today = new Date()
		const slotDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day)
		const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
		return slotDate < todayStart
	}

	const hasAvailableSlots = (day: number) => {
		const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
		return timeSlots.some(slot => slot.date === dateStr && slot.available)
	}

	const getSlotsForDate = (day: number) => {
		const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
		return timeSlots.filter(slot => slot.date === dateStr)
	}

	const { daysInMonth, startingDay } = getDaysInMonth(selectedDate)

	if (loading) {
		return (
			<div className="min-h-screen bg-gray-50 py-8 lg:py-16 px-4">
				<div className="max-w-7xl mx-auto">
					<div className="text-center">
						<h1 className="text-3xl lg:text-5xl font-bold text-black mb-4 lg:mb-6">
							KALENDĀRS -{' '}
							<span className="bg-yellow-400 px-2 lg:px-4 py-1 lg:py-2 rounded-lg">
								PIEEJAMIE LAIKI
							</span>
						</h1>
						<div className="text-gray-600">Ielādē kalendāru...</div>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gray-50 py-8 lg:py-16 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-8 lg:mb-16">
					<h1 className="text-3xl lg:text-5xl font-bold text-black mb-4 lg:mb-6">
						KALENDĀRS -{' '}
						<span className="bg-yellow-400 px-2 lg:px-4 py-1 lg:py-2 rounded-lg">
							PIEEJAMIE LAIKI
						</span>
					</h1>
					<p className="text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto px-4">
						Izvēlieties ērtu laiku un pasniedzēju matemātikas stundām
					</p>
					{!userRole && (
						<div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
							<p className="text-yellow-800 font-medium">
								Reģistrējieties, lai rezervētu stundas un sekotu saviem pierakstiem!
							</p>
						</div>
					)}
				</div>

				<div className="grid lg:grid-cols-1 gap-6 lg:gap-8">
					{/* Calendar */}
					<div className="order-2 lg:order-1">
						<div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6">
							{/* Calendar Header */}
							<div className="flex items-center justify-between mb-4 lg:mb-6">
								<button
									onClick={() => {
										const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
										setSelectedDate(newDate)
										setSelectedDay(null)
									}}
									className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg lg:text-xl"
									title="Iepriekšējais mēnesis"
								>
									←
								</button>
								<div className="text-center">
									<h2 className="text-xl lg:text-2xl font-bold text-black">
										{getMonthName(selectedDate)} {selectedDate.getFullYear()}
									</h2>
									{selectedDate.getMonth() > new Date().getMonth() || selectedDate.getFullYear() > new Date().getFullYear() ? (
										<p className="text-xs text-green-600 mt-1">Nākotnes datumi</p>
									) : selectedDate.getMonth() < new Date().getMonth() || selectedDate.getFullYear() < new Date().getFullYear() ? (
										<p className="text-xs text-gray-500 mt-1">Pagājušie datumi</p>
									) : (
										<p className="text-xs text-yellow-600 mt-1">Pašreizējais mēnesis</p>
									)}
									<button 
										onClick={() => setShowMonthPicker(!showMonthPicker)}
										className="text-xs text-blue-600 hover:text-blue-800 underline mt-1"
									>
										Izvēlēties mēnesi
									</button>
								</div>
								<button
									onClick={() => {
										const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
										setSelectedDate(newDate)
										setSelectedDay(null)
									}}
									className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg lg:text-xl"
									title="Nākamais mēnesis"
								>
									→
								</button>
							</div>

							{/* Month/Year Picker */}
							{showMonthPicker && (
								<div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Mēnesis:</label>
											<select
												value={selectedDate.getMonth()}
												onChange={(e) => {
													const newDate = new Date(selectedDate.getFullYear(), parseInt(e.target.value), 1)
													setSelectedDate(newDate)
													setSelectedDay(null)
												}}
												className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
											>
												{[
													"Janvāris", "Februāris", "Marts", "Aprīlis", "Maijs", "Jūnijs",
													"Jūlijs", "Augusts", "Septembris", "Oktobris", "Novembris", "Decembris"
												].map((month, index) => (
													<option key={index} value={index}>{month}</option>
												))}
											</select>
										</div>
										<div>
											<label className="block text-sm font-medium text-gray-700 mb-2">Gads:</label>
											<select
												value={selectedDate.getFullYear()}
												onChange={(e) => {
													const newDate = new Date(parseInt(e.target.value), selectedDate.getMonth(), 1)
													setSelectedDate(newDate)
													setSelectedDay(null)
												}}
												className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
											>
												{Array.from({ length: 3 }, (_, i) => {
													const year = new Date().getFullYear() + i
													return (
														<option key={year} value={year}>{year}</option>
													)
												})}
											</select>
										</div>
									</div>
									<div className="mt-3 text-center">
										<button
											onClick={() => setShowMonthPicker(false)}
											className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold rounded-lg transition-colors"
										>
											Aizvērt
										</button>
									</div>
								</div>
							)}

							{/* Weekday Headers */}
							<div className="grid grid-cols-7 gap-1 mb-4">
								{getWeekdayNames().map((day, index) => (
									<div key={index} className="text-center font-semibold text-gray-600 py-2 text-sm lg:text-base">
										{day}
									</div>
								))}
							</div>

							{/* Calendar Grid */}
							<div className="grid grid-cols-7 gap-1">
								{/* Empty cells for days before month starts */}
								{Array.from({ length: startingDay }, (_, index) => (
									<div key={`empty-${index}`} className="h-16 lg:h-20"></div>
								))}
								
								{/* Days of the month */}
								{Array.from({ length: daysInMonth }, (_, index) => {
									const day = index + 1
									const slots = getSlotsForDate(day)
									const hasSlots = hasAvailableSlots(day)
									const isPast = isPastDate(day)
									const isSelected = selectedDay === day
									
									return (
										<div
											key={day}
											className={`h-16 lg:h-20 border border-gray-200 p-1 lg:p-2 transition-colors ${
												isSelected
													? 'bg-yellow-400 text-black font-bold cursor-pointer border-yellow-500 border-2'
													: isPast
														? 'bg-gray-100 text-gray-400 cursor-not-allowed'
														: hasSlots 
															? 'bg-green-50 hover:bg-green-100 cursor-pointer' 
															: 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
											}`}
											onClick={() => {
												if (!isPast) {
													setSelectedDay(day)
													setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))
												}
											}}
											title={isPast ? 'Pagājušais datums' : hasSlots ? `${slots.length} pieejam${slots.length > 1 ? 'i' : 's'} laiks${slots.length > 1 ? 'i' : ''}` : 'Nav pieejamu laiku'}
										>
											<div className="text-xs lg:text-sm font-medium">{day}</div>
										</div>
									)
								})}
							</div>
							
							{/* Selected Date Time Slots */}
							{selectedDay && (
								<div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
									<h3 className="text-lg font-semibold text-black mb-4">
										Pieejamie laiki - {selectedDay}. {getMonthName(selectedDate)} {selectedDate.getFullYear()}
									</h3>
									
									{(() => {
										const slots = getSlotsForDate(selectedDay)
										const availableSlots = slots.filter(slot => slot.available)
										
										if (availableSlots.length === 0) {
											return (
												<div className="text-center py-8 text-gray-500">
													<p>Nav pieejamu laiku šajā datumā</p>
												</div>
											)
										}

										return (
											<div className="space-y-3">
												{availableSlots.map(slot => (
													<div key={slot.id} className="border border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition-colors">
														<div className="flex items-start justify-between">
															<div className="flex-1">
																<div className="flex items-center gap-3 mb-2">
																	<h4 className="font-semibold text-black">{slot.teacherName}</h4>
																</div>
																<p className="text-sm text-gray-600 mb-1">{slot.subject}</p>
																{slot.teacherDescription && (
																	<p className="text-xs text-gray-500 mb-2">{slot.teacherDescription}</p>
																)}
																<div className="text-lg font-bold text-yellow-600">
																	{slot.time}
																</div>
															</div>
															<div className="ml-4">
																{userRole === 'admin' || userRole === 'worker' ? (
																	<div className="text-sm text-gray-500 italic">
																		Pasniedzēja laiks
																	</div>
																) : userRole === 'user' ? (
																	<button 
																		onClick={() => {
																			alert(`Rezervācija veiksmīga!\n\nStunda: ${slot.teacherName}\nDatums: ${new Date(slot.date).toLocaleDateString('lv-LV')}\nLaiks: ${slot.time}\nTēma: ${slot.subject}`)
																		}}
																		className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg transition-colors"
																	>
																		Rezervēt
																	</button>
																) : (
																	<div className="flex flex-col gap-2">
																		<div className="text-sm text-gray-500 italic">
																			Reģistrācija nepieciešama rezervācijai
																		</div>
																		<button 
																			onClick={() => {
																				window.location.href = '/?open=register'
																			}}
																			className="bg-blue-400 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
																		>
																			Reģistrēties
																		</button>
																	</div>
																)}
															</div>
														</div>
													</div>
												))}
											</div>
										)
									})()}
								</div>
							)}
						</div>
					</div>

				</div>
			</div>
		</div>
	)
}

export default CalendarSection
