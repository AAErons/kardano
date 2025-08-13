import { useState } from 'react'

interface TimeSlot {
	id: number
	tutorId: number
	tutorName: string
	date: string
	time: string
	duration: number
	subject: string
	available: boolean
}

const CalendarSection = () => {
	const [selectedDate, setSelectedDate] = useState(new Date())
	const [selectedTutor, setSelectedTutor] = useState<number | null>(null)

	// Sample time slots data
	const timeSlots: TimeSlot[] = [
		{
			id: 1,
			tutorId: 1,
			tutorName: "Ēriks Freimanis",
			date: "2024-01-15",
			time: "14:00",
			duration: 60,
			subject: "Matemātika (5-12. klase)",
			available: true
		},
		{
			id: 2,
			tutorId: 1,
			tutorName: "Ēriks Freimanis",
			date: "2024-01-15",
			time: "16:00",
			duration: 60,
			subject: "Matemātika (5-12. klase)",
			available: true
		},
		{
			id: 3,
			tutorId: 2,
			tutorName: "Mārcis Bajaruns",
			date: "2024-01-15",
			time: "15:00",
			duration: 60,
			subject: "Matemātika (1-9. klase)",
			available: true
		},
		{
			id: 4,
			tutorId: 3,
			tutorName: "Mārtiņš Mārcis Gailītis",
			date: "2024-01-16",
			time: "10:00",
			duration: 90,
			subject: "Iestājeksāmenu sagatavošana",
			available: true
		},
		{
			id: 5,
			tutorId: 3,
			tutorName: "Mārtiņš Mārcis Gailītis",
			date: "2024-01-16",
			time: "14:00",
			duration: 90,
			subject: "Iestājeksāmenu sagatavošana",
			available: false
		}
	]

	const tutors = [
		{ id: 1, name: "Ēriks Freimanis" },
		{ id: 2, name: "Mārcis Bajaruns" },
		{ id: 3, name: "Mārtiņš Mārcis Gailītis" }
	]

	const getDaysInMonth = (date: Date) => {
		const year = date.getFullYear()
		const month = date.getMonth()
		const firstDay = new Date(year, month, 1)
		const lastDay = new Date(year, month + 1, 0)
		const daysInMonth = lastDay.getDate()
		const startingDay = firstDay.getDay()
		
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
		return ["Sv", "P", "O", "T", "C", "Pk", "S"]
	}

	const isToday = (day: number) => {
		const today = new Date()
		return today.getDate() === day && 
			   today.getMonth() === selectedDate.getMonth() && 
			   today.getFullYear() === selectedDate.getFullYear()
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
				</div>

				<div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
					{/* Calendar */}
					<div className="lg:col-span-2 order-2 lg:order-1">
						<div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6">
							{/* Calendar Header */}
							<div className="flex items-center justify-between mb-4 lg:mb-6">
								<button
									onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
									className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg lg:text-xl"
								>
									←
								</button>
								<h2 className="text-xl lg:text-2xl font-bold text-black text-center">
									{getMonthName(selectedDate)} {selectedDate.getFullYear()}
								</h2>
								<button
									onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
									className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-lg lg:text-xl"
								>
									→
								</button>
							</div>

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
									
									return (
										<div
											key={day}
											className={`h-16 lg:h-20 border border-gray-200 p-1 lg:p-2 cursor-pointer transition-colors ${
												isToday(day) 
													? 'bg-yellow-400 text-black font-bold' 
													: hasSlots 
														? 'bg-green-50 hover:bg-green-100' 
														: 'bg-gray-50'
											}`}
											onClick={() => {
												if (hasSlots) {
													setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))
												}
											}}
										>
											<div className="text-xs lg:text-sm font-medium mb-1">{day}</div>
											{hasSlots && (
												<div className="text-xs text-green-600">
													{slots.length} laiks{slots.length > 1 ? 'i' : ''}
												</div>
											)}
										</div>
									)
								})}
							</div>
						</div>
					</div>

					{/* Available Slots */}
					<div className="lg:col-span-1 order-1 lg:order-2">
						<div className="bg-white rounded-2xl shadow-xl p-4 lg:p-6">
							<h3 className="text-lg lg:text-xl font-bold text-black mb-4">
								Pieejamie laiki
							</h3>
							
							{/* Tutor Filter */}
							<div className="mb-6">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Filtrēt pēc pasniedzēja:
								</label>
								<select
									value={selectedTutor || ''}
									onChange={(e) => setSelectedTutor(e.target.value ? Number(e.target.value) : null)}
									className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm lg:text-base"
								>
									<option value="">Visi pasniedzēji</option>
									{tutors.map(tutor => (
										<option key={tutor.id} value={tutor.id}>
											{tutor.name}
										</option>
									))}
								</select>
							</div>

							{/* Time Slots List */}
							<div className="space-y-3">
								{timeSlots
									.filter(slot => !selectedTutor || slot.tutorId === selectedTutor)
									.filter(slot => slot.available)
									.map(slot => (
										<div key={slot.id} className="border border-gray-200 rounded-lg p-3 hover:border-yellow-400 transition-colors">
											<div className="space-y-2 mb-3">
												<div>
													<h4 className="font-semibold text-black text-sm lg:text-base">{slot.tutorName}</h4>
													<p className="text-xs lg:text-sm text-gray-600">{slot.subject}</p>
												</div>
												<span className="text-xs lg:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
													{slot.duration} min
												</span>
											</div>
											<div className="space-y-2">
												<span className="text-base lg:text-lg font-bold text-yellow-600 block">
													{new Date(slot.date).toLocaleDateString('lv-LV')} {slot.time}
												</span>
												<button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm lg:text-base">
													Rezervēt
												</button>
											</div>
										</div>
									))}
								
								{timeSlots.filter(slot => !selectedTutor || slot.tutorId === selectedTutor).filter(slot => slot.available).length === 0 && (
									<div className="text-center py-8 text-gray-500">
										Nav pieejamu laiku šajā periodā
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default CalendarSection
