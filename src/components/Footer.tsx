const Footer = () => {
	return (
		<footer className="bg-black text-white py-12 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="grid md:grid-cols-4 gap-8">
					{/* Company Info */}
					<div className="md:col-span-2">
						<div className="flex items-center mb-4">
							<div className="bg-yellow-400 rounded-full p-2 mr-3">
								<span className="text-2xl font-bold text-black">K</span>
							</div>
							<h3 className="text-2xl font-bold">KARDANO</h3>
						</div>
						<p className="text-gray-300 mb-4 max-w-md">
							Profesionāla matemātikas mācīšana, kas palīdz skolēniem 
							apgūt ne tikai pašreizējo vielu, bet arī aizpildīt 
							iepriekšējās zināšanu trūkumus.
						</p>
						<div className="flex space-x-4">
							<a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
								📘 Facebook
							</a>
							<a href="#" className="text-gray-300 hover:text-yellow-400 transition-colors">
								📧 E-pasts
							</a>
						</div>
					</div>

					{/* Services */}
					<div>
						<h4 className="text-lg font-semibold mb-4 text-yellow-400">Pakalpojumi</h4>
						<ul className="space-y-2 text-gray-300">
							<li>Pamatskolas matemātika</li>
							<li>Vidusskolas matemātika</li>
							<li>Iestājeksāmenu sagatavošana</li>
							<li>Valsts pārbaudes darbu sagatavošana</li>
							<li>Individuālas stundas</li>
						</ul>
					</div>

					{/* Contact */}
					<div>
						<h4 className="text-lg font-semibold mb-4 text-yellow-400">Kontakti</h4>
						<div className="space-y-3 text-gray-300">
							<div className="flex items-center">
								<span className="mr-2">📞</span>
								<span>22327484</span>
							</div>
							<div className="flex items-center">
								<span className="mr-2">✉️</span>
								<span>kardano.info@gmail.com</span>
							</div>
							<div className="flex items-center">
								<span className="mr-2">📍</span>
								<span>Rīga, Latvija</span>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
					<p>&copy; 2024 KARDANO. Visas tiesības aizsargātas.</p>
					<p className="text-sm mt-2">
						Matemātikas privātstundas Rīgā un tuvākajā apkārtnē
					</p>
				</div>
			</div>
		</footer>
	)
}

export default Footer
