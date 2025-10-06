import { useEffect, useState } from 'react'

interface Tutor {
    id: string
    name: string
    experience: string
    education: string
    description: string
    image: string
}

// Removed reviews UI for simplified public section

const TutorsSection = () => {
    const [tutors, setTutors] = useState<Tutor[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    function getTutorImageFromApi(photo?: string | null, name?: string): string {
        if (photo && typeof photo === 'string') return photo
        const n = (name || '').toLowerCase()
        if (n.includes('erik')) return '/images/tutors/eriks.jpeg'
        if (n.includes('marci')) return '/images/tutors/marcis.jpeg'
        if (n.includes('martin')) return '/images/tutors/martins.jpeg'
        return '/images/hero/tutors-group.jpg'
    }

    useEffect(() => {
        let cancelled = false
        async function load() {
            setLoading(true)
            setError(null)
            try {
                const r = await fetch('/api/teachers')
                if (!r.ok) throw new Error('Neizdevās ielādēt pasniedzējus')
                const data = await r.json().catch(() => ({})) as any
                const items = Array.isArray(data?.items) ? data.items : []
                const actives = items.filter((t: any) => Boolean(t.active))
                const mapped: Tutor[] = actives.map((t: any) => ({
                    id: String(t.id || t._id || ''),
                    name: String(t.name || ''),
                    experience: '',
                    education: '',
                    description: String(t.description || ''),
                    image: getTutorImageFromApi(t.photo, String(t.name || '')),
                }))
                if (!cancelled) setTutors(mapped)
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Kļūda ielādējot pasniedzējus')
            } finally {
                if (!cancelled) setLoading(false)
            }
        }
        load()
        return () => { cancelled = true }
    }, [])

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
                {loading && (
                    <div className="text-center text-gray-500">Ielādē pasniedzējus...</div>
                )}
                {!loading && error && (
                    <div className="text-center text-red-600">{error}</div>
                )}
                {!loading && !error && (
                    tutors.length === 0 ? (
                        <div className="text-center text-gray-500">Nav aktīvu pasniedzēju.</div>
                    ) : (
                        <div className="grid lg:grid-cols-3 gap-8">
                            {tutors.map((tutor) => (
                                <TutorCard key={tutor.id} tutor={tutor} />
                            ))}
                        </div>
                    )
                )}
			</div>
		</div>
	)
}

const TutorCard = ({ tutor }: { tutor: Tutor }) => {
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
				<div className="mb-2" />
			</div>

			{/* Tutor Details */}
			<div className="p-6">
				<div className="mb-2">
					<p className="text-gray-700">{tutor.description || '—'}</p>
				</div>

				{/* Action */}
				<button
					onClick={() => { window.location.href = `/?open=calendar&teacher=${encodeURIComponent(tutor.id)}` }}
					className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg mt-4"
				>
					Rezervēt
				</button>
			</div>
		</div>
	)
}

export default TutorsSection
