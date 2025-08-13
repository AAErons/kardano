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
	const tutors: Tutor[] = [
		{
			id: 1,
			name: "Ēriks Freimanis",
			subject: "Matemātika (5-12. klase)",
			experience: "8 gadu pieredze",
			education: "RTU Matemātikas fakultāte",
			description: "Specializējos pamatskolas un vidusskolas matemātikā. Palīdzu skolēniem ne tikai apgūt pašreizējo vielu, bet arī aizpildīt iepriekšējās zināšanu trūkumus.",
			rating: 4.9,
			reviews: [
				{
					id: 1,
					studentName: "Anna Kļaviņa",
					rating: 5,
					comment: "Ēriks palīdzēja man sagatavoties Valsts pārbaudes darbam matemātikā. Rezultāts - 95%!",
					date: "2024. gada janvāris"
				},
				{
					id: 2,
					studentName: "Kārlis Ozols",
					rating: 5,
					comment: "Pēc 3 mēnešiem ar Ēriku, es beidzot saprotu algebru!",
					date: "2023. gada decembris"
				}
			],
			image: "/images/tutors/eriks.jpeg"
		},
		{
			id: 2,
			name: "Mārcis Bajaruns",
			subject: "Matemātika (1-9. klase)",
			experience: "12 gadu pieredze",
			education: "LU Pedagoģijas fakultāte",
			description: "Eksperts pamatskolas matemātikā. Mana pieeja ir radīt pozitīvu attieksmi pret matemātiku un palīdzēt skolēniem izveidot spēcīgu pamatu.",
			rating: 4.8,
			reviews: [
				{
					id: 3,
					studentName: "Jānis Liepiņš",
					rating: 5,
					comment: "Mārcis ir brīnišķīgs! Mana meita tagad mīl matemātiku.",
					date: "2024. gada februāris"
				},
				{
					id: 4,
					studentName: "Elīna Zvaigzne",
					rating: 4,
					comment: "Ļoti palīdzēja ar daļskaitļiem. Tagad viss ir skaidrs!",
					date: "2023. gada novembris"
				}
			],
			image: "/images/tutors/marcis.jpeg"
		},
		{
			id: 3,
			name: "Mārtiņš Mārcis Gailītis",
			subject: "Matemātika (9-12. klase, iestājeksāmeni)",
			experience: "15 gadu pieredze",
			education: "RTU Inženierzinātņu vidusskola, RTU",
			description: "Specializējos vidusskolas matemātikā un iestājeksāmenu sagatavošanā. Sagatavoju skolēnus iestājeksāmeniem Valsts ģimnāzijās un RTU Inženierzinātņu vidusskolā.",
			rating: 5.0,
			reviews: [
				{
					id: 5,
					studentName: "Kristīne Jansone",
					rating: 5,
					comment: "Pateicoties Mārtiņam, es iestājos RTU Inženierzinātņu vidusskolā!",
					date: "2024. gada marts"
				},
				{
					id: 6,
					studentName: "Roberts Krūmiņš",
					rating: 5,
					comment: "Mārtiņš ir īstais eksperts! Visi iestājeksāmeni nokārtoti ar augstiem rezultātiem.",
					date: "2023. gada jūnijs"
				}
			],
			image: "/images/tutors/martins.jpeg"
		}
	]

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
				<div className="grid lg:grid-cols-3 gap-8">
					{tutors.map((tutor) => (
						<TutorCard key={tutor.id} tutor={tutor} />
					))}
				</div>
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
