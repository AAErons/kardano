const LandingPage = ({ go }: { go?: (section: 'home' | 'lessons' | 'tutors' | 'calendar' | 'profile') => void }) => {
	return (
		<div className="min-h-screen bg-white">
			{/* Hero Section */}
			<section className="relative py-8 lg:py-20 px-4">
				<div className="max-w-7xl mx-auto">
					{/* Mobile Layout - Stacked */}
					<div className="lg:hidden space-y-8">
						{/* Title */}
						<div className="text-center">
							<h1 className="text-4xl font-bold text-black leading-tight mb-4">
								<div className="mb-2">MATEMĀTIKAS</div>
								<span className="bg-yellow-400 px-4 py-2 rounded-lg inline-block">
									PRIVĀTSTUNDAS
								</span>
							</h1>
							
							{/* Tutors Image - Mobile */}
							<div className="mt-6">
								<div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-4">
									<img 
										src="/images/hero/tutors-group.jpg" 
										alt="Mūsu matemātikas pasniedzēji - profesionāla komanda matemātikas mācīšanai"
										className="w-full h-auto rounded-xl shadow-2xl object-cover"
										style={{ minHeight: '300px' }}
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Primary Actions (Mobile) */}
					<div className="lg:hidden grid grid-cols-1 gap-3">
						<button onClick={() => go && go('tutors')} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg">
							Iepazīties ar pasniedzējiem
						</button>
						<button onClick={() => go && go('lessons')} className="border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-400 hover:text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200">
							Iepazīties ar nodarbībām
						</button>
						<button onClick={() => go && go('calendar')} className="bg-black hover:bg-gray-900 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200">
							Rezervēt nodarbību
						</button>
					</div>

					{/* Desktop Layout - Side by Side */}
					<div className="hidden lg:grid lg:grid-cols-2 gap-12 items-center">
						{/* Content */}
						<div className="space-y-8">
							<h1 className="text-6xl font-bold text-black leading-tight">
								<div className="mb-2">MATEMĀTIKAS</div>
								<span className="bg-yellow-400 px-4 py-2 rounded-lg inline-block">
									PRIVĀTSTUNDAS
								</span>
							</h1>
							
							{/* Primary Actions (Desktop) */}
							<div className="grid grid-cols-3 gap-4">
								<button onClick={() => go && go('tutors')} className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
									Iepazīties ar pasniedzējiem
								</button>
								<button onClick={() => go && go('lessons')} className="border-2 border-yellow-400 text-yellow-700 hover:bg-yellow-400 hover:text-black font-bold py-4 px-8 rounded-lg transition-colors duration-200">
									Iepazīties ar nodarbībām
								</button>
								<button onClick={() => go && go('calendar')} className="bg-black hover:bg-gray-900 text-white font-bold py-4 px-8 rounded-lg transition-colors duration-200">
									Rezervēt nodarbību
								</button>
							</div>
						</div>

						{/* Tutors Group Image - Desktop */}
						<div className="relative">
							<div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-2xl p-8">
								<img 
									src="/images/hero/tutors-group.jpg" 
									alt="Mūsu matemātikas pasniedzēji - profesionāla komanda matemātikas mācīšanai"
									className="w-full h-auto rounded-xl shadow-2xl object-cover"
									style={{ minHeight: '400px' }}
								/>
							</div>
							
							{/* Mathematical doodles decoration */}
							<div className="absolute -top-4 -right-4 text-4xl text-gray-300">∑</div>
							<div className="absolute top-8 -left-4 text-3xl text-gray-300">π</div>
							<div className="absolute bottom-8 -right-8 text-2xl text-gray-300">∞</div>
							<div className="absolute -bottom-4 left-8 text-3xl text-gray-300">∫</div>
						</div>
					</div>
				</div>
			</section>

			{/* Contact Section */}
			<section className="bg-gray-50 py-12 lg:py-16 px-4">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-2xl lg:text-3xl font-bold text-black mb-6 lg:mb-8">
						SAZINIES AR MUMS
					</h2>
				<div className="grid md:grid-cols-3 gap-6 lg:gap-8">
					{/* Phone/WhatsApp */}
					<a
						href="https://wa.me/37123234450"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-white p-4 lg:p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer"
					>
						<div className="text-3xl lg:text-4xl mb-3 lg:mb-4">📞</div>
						<h3 className="text-lg lg:text-xl font-semibold text-black mb-2">Tālrunis</h3>
						<p className="text-base lg:text-lg text-gray-700">23234450</p>
					</a>
					
					{/* Email */}
					<a
						href="mailto:kardano.info@gmail.com"
						className="bg-white p-4 lg:p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer"
					>
						<div className="text-3xl lg:text-4xl mb-3 lg:mb-4">✉️</div>
						<h3 className="text-lg lg:text-xl font-semibold text-black mb-2">E-pasts</h3>
						<p className="text-base lg:text-lg text-gray-700">kardano.info@gmail.com</p>
					</a>
					
				{/* Facebook Messenger */}
				<a
					href="https://m.me/kardanoschool"
					target="_blank"
					rel="noopener noreferrer"
					className="bg-white p-4 lg:p-6 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer"
				>
						<div className="text-3xl lg:text-4xl mb-3 lg:mb-4">📱</div>
						<h3 className="text-lg lg:text-xl font-semibold text-black mb-2">Facebook</h3>
						<p className="text-base lg:text-lg text-gray-700">Rakstot ziņojumu</p>
					</a>
				</div>
				</div>
			</section>
		</div>
	)
}

export default LandingPage
