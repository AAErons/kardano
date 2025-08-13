const LandingPage = () => {
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

						{/* Description */}
						<p className="text-lg text-gray-700 leading-relaxed text-center">
							Profesionāla matemātikas mācīšana, kas palīdz skolēniem 
							apgūt ne tikai pašreizējo vielu, bet arī aizpildīt 
							iepriekšējās zināšanu trūkumus.
						</p>

						{/* Services */}
						<div className="space-y-4">
							<div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400">
								<p className="text-gray-800 text-sm">
									<strong>Palīdzu ar tekošās vielas apgūšanu,</strong> tajā pašā laikā, 
									cītīgi sekojot līdzi tam vai nav radušies robi līdz šim apgūtajā.
								</p>
							</div>
							
							<div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
								<p className="text-gray-800 text-sm">
									<strong>Sagatavoju iestājeksāmeniem</strong> Valsts ģimnāzijās un 
									RTU Inženierzinātņu vidusskolā.
								</p>
							</div>
							
							<div className="bg-gray-50 p-4 rounded-lg border-l-4 border-gray-300">
								<p className="text-gray-800 text-sm">
									<strong>Palīdzu sagatavoties</strong> pamatskolas un vidusskolas 
									Valsts pārbaudes darbiem.
								</p>
							</div>
						</div>

						{/* CTA Buttons */}
						<div className="flex flex-col gap-3">
							<button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg">
								Rezervēt stundu
							</button>
							<button className="border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-400 hover:text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200">
								Uzzināt vairāk
							</button>
						</div>
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
							
							<p className="text-xl text-gray-700 leading-relaxed">
								Profesionāla matemātikas mācīšana, kas palīdz skolēniem 
								apgūt ne tikai pašreizējo vielu, bet arī aizpildīt 
								iepriekšējās zināšanu trūkumus.
							</p>

							{/* Services */}
							<div className="space-y-6">
								<div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-400">
									<p className="text-gray-800">
										<strong>Palīdzu ar tekošās vielas apgūšanu,</strong> tajā pašā laikā, 
										cītīgi sekojot līdzi tam vai nav radušies robi līdz šim apgūtajā.
									</p>
								</div>
								
								<div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-300">
									<p className="text-gray-800">
										<strong>Sagatavoju iestājeksāmeniem</strong> Valsts ģimnāzijās un 
										RTU Inženierzinātņu vidusskolā.
									</p>
								</div>
								
								<div className="bg-gray-50 p-6 rounded-lg border-l-4 border-gray-300">
									<p className="text-gray-800">
										<strong>Palīdzu sagatavoties</strong> pamatskolas un vidusskolas 
										Valsts pārbaudes darbiem.
									</p>
								</div>
							</div>

							{/* CTA Buttons */}
							<div className="flex flex-col sm:flex-row gap-4">
								<button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">
									Rezervēt stundu
								</button>
								<button className="border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-400 hover:text-black font-bold py-4 px-8 rounded-lg transition-colors duration-200">
									Uzzināt vairāk
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
						<div className="bg-white p-4 lg:p-6 rounded-lg shadow-md">
							<div className="text-3xl lg:text-4xl mb-3 lg:mb-4">📞</div>
							<h3 className="text-lg lg:text-xl font-semibold text-black mb-2">Tālrunis</h3>
							<p className="text-base lg:text-lg text-gray-700">22327484</p>
						</div>
						<div className="bg-white p-4 lg:p-6 rounded-lg shadow-md">
							<div className="text-3xl lg:text-4xl mb-3 lg:mb-4">✉️</div>
							<h3 className="text-lg lg:text-xl font-semibold text-black mb-2">E-pasts</h3>
							<p className="text-base lg:text-lg text-gray-700">kardano.info@gmail.com</p>
						</div>
						<div className="bg-white p-4 lg:p-6 rounded-lg shadow-md">
							<div className="text-3xl lg:text-4xl mb-3 lg:mb-4">📱</div>
							<h3 className="text-lg lg:text-xl font-semibold text-black mb-2">Facebook</h3>
							<p className="text-base lg:text-lg text-gray-700">Rakstot ziņojumu</p>
						</div>
					</div>
				</div>
			</section>
		</div>
	)
}

export default LandingPage
