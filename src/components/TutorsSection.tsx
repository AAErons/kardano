import { useState } from 'react'

interface Tutor {
	id: number
	name: string
	subject: string
	experience: string
	education: string
	description: string
	rating: number
	reviews: Review[]
	image: string
}

interface Review {
	id: number
	studentName: string
	rating: number
	comment: string
	date: string
}

const TutorsSection = () => {
	const tutors: Tutor[] = []

	return (
		<div className="min-h-screen bg-gray-50 py-16 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="text-center mb-16">
					<h1 className="text-4xl lg:text-5xl font-bold text-black mb-6">
						Mūsu{' '}
						<span className="bg-yellow-400 px-4 py-2 rounded-lg">
							PASNIEDZĒJI
						</span>
					</h1>
					<p className="text-xl text-gray-700 max-w-3xl mx-auto">
						Iepazīstieties ar mūsu pieredzējušajiem matemātikas pasniedzējiem, 
						kas palīdzēs jums sasniegt izcilus rezultātus
					</p>
				</div>

				{/* Tutors Grid */}
				{tutors.length === 0 ? (
					<div className="text-center text-gray-500">Nav reģistrētu pasniedzēju.</div>
				) : (
					<div className="grid lg:grid-cols-3 gap-8">
						{tutors.map((tutor) => (
							<TutorCard key={tutor.id} tutor={tutor} />
						))}
					</div>
				)}
			</div>
		</div>
	)
}

const TutorCard = ({ tutor }: { tutor: Tutor }) => {
	const [showReviews, setShowReviews] = useState(false)

	return (
		<div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow duration-300">
			{/* Tutor Image and Basic Info */}
			<div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-8 text-center">
				<img 
					src={tutor.image} 
					alt={tutor.name}
					className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-white shadow-lg"
				/>
				<h3 className="text-2xl font-bold text-black mb-2">{tutor.name}</h3>
				<p className="text-lg text-gray-700 mb-2">{tutor.subject}</p>
				<div className="flex items-center justify-center space-x-2 mb-4">
					<span className="text-yellow-600 text-lg">★</span>
					<span className="font-semibold text-black">{tutor.rating}</span>
					<span className="text-gray-600">({tutor.reviews.length} atsauksmes)</span>
				</div>
			</div>

			{/* Tutor Details */}
			<div className="p-6">
				<div className="space-y-4 mb-6">
					<div>
						<h4 className="font-semibold text-black mb-1">Pieredze:</h4>
						<p className="text-gray-700">{tutor.experience}</p>
					</div>
					<div>
						<h4 className="font-semibold text-black mb-1">Izglītība:</h4>
						<p className="text-gray-700">{tutor.education}</p>
					</div>
					<div>
						<h4 className="font-semibold text-black mb-1">Apraksts:</h4>
						<p className="text-gray-700">{tutor.description}</p>
					</div>
				</div>

				{/* Reviews Section */}
				<div className="border-t border-gray-200 pt-4 mb-6">
					<button
						onClick={() => setShowReviews(!showReviews)}
						className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center"
					>
						{showReviews ? 'Slēpt atsauksmes' : 'Skatīt atsauksmes'}
						<span className="ml-2">{showReviews ? '▲' : '▼'}</span>
					</button>
					
					{showReviews && (
						<div className="mt-4 space-y-3">
							{tutor.reviews.map((review) => (
								<div key={review.id} className="bg-gray-50 p-3 rounded-lg">
									<div className="flex items-center justify-between mb-2">
										<span className="font-medium text-black">{review.studentName}</span>
										<div className="flex items-center">
											<span className="text-yellow-600 mr-1">★</span>
											<span className="text-sm text-gray-600">{review.rating}</span>
										</div>
									</div>
									<p className="text-gray-700 text-sm mb-1">{review.comment}</p>
									<p className="text-xs text-gray-500">{review.date}</p>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Booking Button */}
				<button className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg">
					Rezervēt stundu ar {tutor.name}
				</button>
			</div>
		</div>
	)
}

export default TutorsSection
