import { useState } from 'react'

const HelpWidget = () => {
	const [isOpen, setIsOpen] = useState(false)
	const [formData, setFormData] = useState({ name: '', email: '', message: '' })
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setSuccess(false)

		if (!formData.name || !formData.email || !formData.message) {
			setError('Lūdzu aizpildiet visus laukus')
			return
		}

		setLoading(true)

		try {
			const response = await fetch('/api/help-questions', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData)
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Kļūda nosūtot ziņojumu')
			}

			setSuccess(true)
			setFormData({ name: '', email: '', message: '' })
			
			// Close modal after 2 seconds
			setTimeout(() => {
				setIsOpen(false)
				setSuccess(false)
			}, 2000)
		} catch (err: any) {
			setError(err.message || 'Kļūda nosūtot ziņojumu')
		} finally {
			setLoading(false)
		}
	}

	return (
		<>
			{/* Floating Help Button */}
			<div className="fixed bottom-6 right-6 z-50">
				{/* Chat Button */}
				{!isOpen && (
					<button
						onClick={() => setIsOpen(true)}
						className="bg-yellow-400 hover:bg-yellow-500 text-black rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
						aria-label="Sazināties ar mums"
					>
						<svg
							className="w-6 h-6 transition-transform group-hover:rotate-12"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
							/>
						</svg>
						{/* Pulse animation ring */}
						<span className="absolute inset-0 rounded-full bg-yellow-400 animate-ping opacity-20"></span>
					</button>
				)}

				{/* Chat Modal */}
				{isOpen && (
					<div className="bg-white rounded-2xl shadow-2xl w-80 sm:w-96 overflow-hidden border-2 border-yellow-400 animate-slideUp">
						{/* Header */}
						<div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 flex items-center justify-between">
							<div className="flex items-center gap-3">
								<div className="bg-white rounded-full p-2">
									<svg
										className="w-5 h-5 text-yellow-500"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
										/>
									</svg>
								</div>
								<div>
									<h3 className="font-bold text-black text-lg">Sazināties</h3>
									<p className="text-xs text-gray-800">Mēs palīdzēsim!</p>
								</div>
							</div>
							<button
								onClick={() => setIsOpen(false)}
								className="text-black hover:bg-yellow-600 rounded-full p-1 transition-colors"
								aria-label="Aizvērt"
							>
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M6 18L18 6M6 6l12 12"
									/>
								</svg>
							</button>
						</div>

					{/* Body */}
					<div className="p-6">
						{success ? (
							<div className="text-center py-8">
								<div className="text-6xl mb-4">✅</div>
								<h3 className="text-xl font-bold text-green-600 mb-2">Ziņojums nosūtīts!</h3>
								<p className="text-gray-600">Mēs drīz ar Jums sazināsimies.</p>
							</div>
						) : (
							<form onSubmit={handleSubmit} className="space-y-4">
								{/* Name Input */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Vārds <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										placeholder="Jūsu vārds"
										value={formData.name}
										onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
										disabled={loading}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all disabled:opacity-50"
									/>
								</div>

								{/* Email Input */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										E-pasts <span className="text-red-500">*</span>
									</label>
									<input
										type="email"
										placeholder="jusu@epasts.lv"
										value={formData.email}
										onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
										disabled={loading}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all disabled:opacity-50"
									/>
								</div>

								{/* Message Input */}
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">
										Jautājums <span className="text-red-500">*</span>
									</label>
									<textarea
										rows={4}
										placeholder="Jūsu jautājums vai komentārs..."
										value={formData.message}
										onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
										disabled={loading}
										className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all resize-none disabled:opacity-50"
									></textarea>
								</div>

								{/* Error Message */}
								{error && (
									<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
										{error}
									</div>
								)}

								{/* Submit Button */}
								<button
									type="submit"
									disabled={loading}
									className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg transition-all duration-200 hover:scale-105 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
								>
									{loading ? 'Sūta...' : 'Nosūtīt ziņojumu'}
								</button>
							</form>
						)}

							{/* Quick Contact Options */}
							<div className="mt-4 pt-4 border-t border-gray-200">
								<p className="text-xs text-gray-600 text-center mb-3">Vai arī sazinies ar mums:</p>
								<div className="flex justify-center gap-3">
									<a
										href="https://wa.me/37123234450"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center gap-1 text-xs text-gray-700 hover:text-green-600 transition-colors"
										title="WhatsApp"
									>
										<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
											<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.94L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
										</svg>
										WhatsApp
									</a>
									<a
										href="mailto:kardano.info@gmail.com"
										className="flex items-center gap-1 text-xs text-gray-700 hover:text-blue-600 transition-colors"
										title="E-pasts"
									>
										<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
										</svg>
										E-pasts
									</a>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* Add custom animations */}
			<style>{`
				@keyframes slideUp {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				.animate-slideUp {
					animation: slideUp 0.3s ease-out;
				}
			`}</style>
		</>
	)
}

export default HelpWidget

