const LessonsSection = () => {
	return (
		<div className="min-h-screen bg-white py-8 lg:py-16 px-4">
			<div className="max-w-7xl mx-auto">
				<div className="text-center mb-8 lg:mb-14">
					<h1 className="text-3xl lg:text-5xl font-bold text-black mb-4">
						NODARBĪBAS
					</h1>
					<p className="text-lg lg:text-xl text-gray-700 max-w-3xl mx-auto">
						Uzzini par privātstundām, to ilgumiem, saturu un norisi. Izvēlies atbilstošāko formātu un rezervē sev ērtu laiku.
					</p>
				</div>

				{/* Offer cards */}
				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-10">
				<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
					<h3 className="text-xl font-bold text-black mb-3">Individuāla nodarbība</h3>
					<p className="text-gray-700 mb-3">
						Individuālā nodarbība ir ideāla izvēle, ja vēlies mācīties savā ritmā un vidē, kur visa uzmanība ir vērsta tikai uz Tevi un Taviem mērķiem. Šajās nodarbībās mēs varam koncentrēties uz tieši to, kas Tev visvairāk nepieciešams – vai tā būtu tekošās tēmas apguve, gatavošanās pārbaudes darbiem vai pat matemātiskās loģikas un domāšanas attīstīšana ārpus tam, ko paredzēts apgūt skolā.
					</p>
					<p className="text-gray-700 mb-3">
						Individuālais darbs ļauj pasniedzējam pielāgot pieeju Tavam zināšanu līmenim, tempam un mācīšanās ieradumiem. Tas nodrošina ne tikai ātrāku progresu, bet arī patiesi drošu, atbalstošu vidi, kurā ir viegli uzdot jautājumus, kļūdīties un augt.
					</p>
					<p className="text-gray-700 mb-4">
						Savu panākumu galvenā atslēga esi Tu! Bet mēs ar prieku palīdzēsim Tev atrast īsto ceļu līdz virsotnei.
					</p>
					<div className="text-sm text-gray-600 mb-4">Ilgums: 60–90 min</div>
					<div className="flex gap-2">
						<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Pamatskolai</span>
						<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Vidusskolai</span>
					</div>
				</div>
					<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
						<h3 className="text-xl font-bold text-black mb-2">Eksāmenu sagatavošana</h3>
						<p className="text-gray-700 mb-3">Mērķtiecīgi treniņi ar uzdevumiem un atgriezenisko saiti.</p>
						<div className="text-sm text-gray-600 mb-4">Ilgums: 90–120 min</div>
						<div className="flex gap-2">
							<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">VPD</span>
							<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Iestājeksāmeni</span>
						</div>
					</div>
					<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
						<h3 className="text-xl font-bold text-black mb-2">Konsultācija</h3>
						<p className="text-gray-700 mb-3">Īsa sesija konkrētas tēmas vai jautājuma atrisināšanai.</p>
						<div className="text-sm text-gray-600 mb-4">Ilgums: 30–60 min</div>
						<div className="flex gap-2">
							<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Ātra palīdzība</span>
						</div>
					</div>
				</div>

				{/* How it works */}
				<div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 mb-10">
					<h2 className="text-2xl font-bold text-black mb-4">Kā notiek nodarbības</h2>
					<ol className="list-decimal list-inside space-y-2 text-gray-700">
						<li>Izvēlies pasniedzēju vai nodarbības veidu.</li>
						<li>Rezervē sev ērtu laiku kalendārā.</li>
						<li>Saņem apstiprinājumu ar detaļām un pievienošanās informāciju.</li>
						<li>Piedalies tiešsaistē vai klātienē pēc vienošanās.</li>
					</ol>
				</div>

				{/* FAQ */}
				<div className="bg-white rounded-2xl shadow-xl p-6 lg:p-8">
					<h2 className="text-2xl font-bold text-black mb-4">BUJ</h2>
					<div className="space-y-3 text-gray-700">
						<div>
							<div className="font-semibold text-black">Vai var atcelt nodarbību?</div>
							<p className="text-sm">Jā, līdz 24h iepriekš bez maksas.</p>
						</div>
						<div>
							<div className="font-semibold text-black">Kā izvēlēties ilgumu?</div>
							<p className="text-sm">Konsultācijām pietiek ar 30–60 min, padziļinātiem treniņiem — 90+ min.</p>
						</div>
						<div>
							<div className="font-semibold text-black">Kur notiek nodarbības?</div>
							<p className="text-sm">Tiešsaistē ar digitālo tāfeli; klātiene iespējama pēc vienošanās.</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default LessonsSection
