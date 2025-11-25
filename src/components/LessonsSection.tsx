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
				<h3 className="text-xl font-bold text-black mb-2 text-center">Individuāla nodarbība</h3>
				<div className="mb-3 pb-3 border-b border-gray-200">
					<div className="text-sm font-medium text-gray-600 mb-2">Ilgums: 45 min</div>
					<div className="flex gap-2">
						<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Pamatskolai</span>
						<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Vidusskolai</span>
					</div>
				</div>
				<p className="text-gray-700 mb-3">
					Individuālā nodarbība ir ideāla izvēle, ja vēlies mācīties savā ritmā un vidē, kur visa uzmanība ir vērsta tikai uz Tevi un Taviem mērķiem. Šajās nodarbībās mēs varam koncentrēties uz tieši to, kas Tev visvairāk nepieciešams – vai tā būtu tekošās tēmas apguve, gatavošanās pārbaudes darbiem vai pat matemātiskās loģikas un domāšanas attīstīšana ārpus tam, ko paredzēts apgūt skolā.
				</p>
				<p className="text-gray-700 mb-3">
					Individuālais darbs ļauj pasniedzējam pielāgot pieeju Tavam zināšanu līmenim, tempam un mācīšanās ieradumiem. Tas nodrošina ne tikai ātrāku progresu, bet arī patiesi drošu, atbalstošu vidi, kurā ir viegli uzdot jautājumus, kļūdīties un augt.
				</p>
				<p className="text-gray-700 font-semibold mb-4">
					Savu panākumu galvenā atslēga esi Tu! Bet mēs ar prieku palīdzēsim Tev atrast īsto ceļu līdz virsotnei.
				</p>
			</div>
			<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
				<h3 className="text-xl font-bold text-black mb-2 text-center">Grupu nodarbība (līdz 4 skolēniem)</h3>
				<div className="mb-3 pb-3 border-b border-gray-200">
					<div className="text-sm font-medium text-gray-600 mb-2">Ilgums: 45 min</div>
					<div className="flex gap-2">
						<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Pamatskolai</span>
						<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Vidusskolai</span>
					</div>
				</div>
				<p className="text-gray-700 mb-3">
					Grupu nodarbības ir lieliska iespēja uzlabot savas zināšanas, strādājot ne tikai individuāli, bet arī komandā, vienlaikus, saglabājot personisku atgriezenisko saiti no skolotāja. Šajās nodarbībās mēs strādājam nelielās grupās, lai katrs skolēns saņemtu individuālu atbalstu, vienlaikus gūstot motivāciju un degsmi no kopā padarītā.
				</p>
				<p className="text-gray-700 mb-3">
					Mācības grupā palīdz ne tikai labāk izprast tēmas, bet arī attīstīt analītisko domāšanu un ļauj uz situāciju paskatītites plāšāk - ieklausoties citu idejās un salīdzinot tās ar savējām, izvērtējot kopīgo, atšķirīgo, pozitīvo un negatīvo katram no risinājumiem.
				</p>
				<p className="text-gray-700 mb-4">
					Nelielais dalībnieku skaits ļauj pasniedzējam saglabāt tiešu kontaktu ar katru skolēnu — pielāgot uzdevumus, sekot līdzi progresam un nodrošināt atbalstošu atmosfēru, kurā katram ir vieta izaugsmei.
				</p>
				<p className="text-gray-700 font-semibold mb-4">
					Ceļš uz panākumiem nav jāiet vienam. Kopā - gudrāki!
				</p>
			</div>
			<div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
				<h3 className="text-xl font-bold text-black mb-2 text-center">Gatavošanās eksāmeniem (līdz 4 skolēniem)</h3>
				<div className="mb-3 pb-3 border-b border-gray-200">
					<div className="text-sm font-medium text-gray-600 mb-2">Ilgums: 45 min</div>
					<div className="flex gap-2">
						<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">VPD</span>
						<span className="text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 px-3 py-1 rounded-full">Iestājeksāmeni</span>
					</div>
				</div>
				<p className="text-gray-700 mb-3">
					Gatavošanās eksāmeniem ir mūsu specialitāte jau gandrīz dekādi. Mūsu grupās skolēni strādā fokusētā, motivējošā vidē, kurā kopā atkārtojam visu svarīgāko, sakārtojam zināšanas un pieeju darbam tā, lai eksāmena dienā valdītu pārliecība, nevis stress.
				</p>
				<p className="text-gray-700 mb-3">
					Nodarbībās mērķtiecīgi pārskatām gaidāmajā eksāmenam nepieciešamo mācību vielu, trenējam biežāk sastopamos uzdevumu tipus un mācāmies stratēģijas, kuras palīdz efektīvāk izmantot mūsu rīcībā esošās zināšanas, pieejamo formulu lapu un atļauj mums īstenot eksāmenā iecerēto. Diskusijas grupā ļauj ieraudzīt problēmas no dažādiem skatpunktiem, kamēr salīdzinoši mazais grupas lielums nodrošina, ka katrs saņem individuālu uzmanību, atbalstu un atgriezenisko saiti.
				</p>
				<p className="text-gray-700 mb-4">
					Grupas dinamika palīdz noturēt motivāciju un ritmu, savukārt pasniedzēja vadība — koncentrēties tieši uz to, kas eksāmenā patiešām ir svarīgi. Šajās nodarbībās tiek stiprināta gan priekšmeta pamatzināšanu kārtīga izpratne, gan pārliecība par savām spējām pielietot apgūtās metodes un rīkus.
				</p>
				<p className="text-gray-700 font-semibold mb-4">
					Eksāmenu rakstīsi Tu, bet ļauj mums būt tiem, kuri Tev atbrīvo no satraukuma un dod pārliecību, ka eksāmens ir domāts lai pārbaudītu ko Tu zini, nevis ko Tu nezini, un Tu zini daudz!
				</p>
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
