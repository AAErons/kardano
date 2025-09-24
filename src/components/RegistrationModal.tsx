import { useState } from 'react'

interface RegistrationModalProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
}

const RegistrationModal = ({ isOpen, onClose }: RegistrationModalProps) => {
	const [step, setStep] = useState(1)
	const [formData, setFormData] = useState({
		accountType: 'self' as 'self' | 'children',
		firstName: '',
		lastName: '',
		email: '',
		password: '',
		confirmPassword: '',
		phone: '',
		discountCode: '',
		children: [] as Array<{
			firstName: string
			lastName: string
			age: number
			grade: string
			email?: string
			phone?: string
		}>
	})
	const [errors, setErrors] = useState<Record<string, string>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const validateStep1 = () => {
		const newErrors: Record<string, string> = {}
		
		if (!formData.firstName.trim()) {
			newErrors.firstName = 'Vārds ir obligāts'
		}
		if (!formData.lastName.trim()) {
			newErrors.lastName = 'Uzvārds ir obligāts'
		}
		if (!formData.email.trim()) {
			newErrors.email = 'E-pasts ir obligāts'
		} else if (!/\S+@\S+\.\S+/.test(formData.email)) {
			newErrors.email = 'Nepareizs e-pasta formāts'
		}
		if (!formData.password) {
			newErrors.password = 'Parole ir obligāta'
		} else if (formData.password.length < 6) {
			newErrors.password = 'Parolei jābūt vismaz 6 rakstzīmēm'
		}
		if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Paroles nesakrīt'
		}

		setErrors(newErrors)
		return Object.keys(newErrors).length === 0
	}

	const validateStep2 = () => {
		if (formData.accountType === 'children') {
			const newErrors: Record<string, string> = {}
			
			if (formData.children.length === 0) {
				newErrors.children = 'Jāpievieno vismaz viens bērns'
			}
			
			formData.children.forEach((child, index) => {
				if (!child.firstName.trim()) {
					newErrors[`child_${index}_firstName`] = 'Bērna vārds ir obligāts'
				}
				if (!child.lastName.trim()) {
					newErrors[`child_${index}_lastName`] = 'Bērna uzvārds ir obligāts'
				}
				if (!child.age || child.age < 1) {
					newErrors[`child_${index}_age`] = 'Nepareizs vecums'
				}
				if (!child.grade.trim()) {
					newErrors[`child_${index}_grade`] = 'Klase ir obligāta'
				}
			})

			setErrors(newErrors)
			return Object.keys(newErrors).length === 0
		}
		return true
	}

    const [checkingEmail, setCheckingEmail] = useState(false)
    const handleNext = async () => {
        if (step === 1 && validateStep1()) {
            // pre-check email: blacklist and duplicate
            try {
                setCheckingEmail(true)
                const r = await fetch(`/api/check-email?email=${encodeURIComponent(formData.email)}`)
                if (r.ok) {
                    const d = await r.json().catch(() => null)
                    if (d && d.available === false) {
                        setErrors(prev => ({ ...prev, email: d.reason === 'blacklisted' ? 'E-pasts ir melnajā sarakstā' : 'E-pasts jau reģistrēts' }))
                        setCheckingEmail(false)
                        return
                    }
                }
                // pre-check discount code if provided
                if (formData.discountCode && formData.discountCode.trim()) {
                    const dc = formData.discountCode.trim().toUpperCase()
                    const r2 = await fetch(`/api/discount-codes?code=${encodeURIComponent(dc)}`)
                    if (!r2.ok) {
                        setErrors(prev => ({ ...prev, discountCode: 'Nederīgs atlaižu kods' }))
                        setCheckingEmail(false)
                        return
                    }
                }
            } catch {
            } finally {
                setCheckingEmail(false)
            }
            setStep(2)
        } else if (step === 2 && validateStep2()) {
            handleSubmit()
        }
    }

    const [submitted, setSubmitted] = useState(false)
    const handleSubmit = async () => {
		setIsSubmitting(true)
		try {
			const response = await fetch('/api/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					accountType: formData.accountType,
					firstName: formData.firstName,
					lastName: formData.lastName,
					email: formData.email,
					password: formData.password,
					phone: formData.phone,
					discountCode: formData.discountCode,
					children: formData.accountType === 'children' ? formData.children : undefined
				})
			})

			if (response.ok) {
                // Show inline instruction to check email instead of closing the modal
                setSubmitted(true)
			} else {
				const errorData = await response.json()
				setErrors({ submit: errorData.error || 'Reģistrācija neizdevās' })
			}
		} catch (error) {
			setErrors({ submit: 'Kļūda savienojumā' })
		} finally {
			setIsSubmitting(false)
		}
	}

	const addChild = () => {
		setFormData(prev => ({
			...prev,
			children: [...prev.children, { firstName: '', lastName: '', age: 0, grade: '', email: '', phone: '' }]
		}))
	}

	const removeChild = (index: number) => {
		setFormData(prev => ({
			...prev,
			children: prev.children.filter((_, i) => i !== index)
		}))
	}

	const updateChild = (index: number, field: string, value: string | number) => {
		setFormData(prev => ({
			...prev,
			children: prev.children.map((child, i) => 
				i === index ? { ...child, [field]: value } : child
			)
		}))
	}

	if (!isOpen) return null

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
			<div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-6 border-b border-gray-200">
					<h2 className="text-2xl font-bold text-black">
						Reģistrācija
					</h2>
					<button
						onClick={onClose}
						className="text-gray-500 hover:text-gray-700 text-2xl"
					>
						×
					</button>
				</div>

				{/* Progress Steps */}
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex items-center justify-center space-x-4">
						<div className={`flex items-center ${step >= 1 ? 'text-yellow-600' : 'text-gray-400'}`}>
							<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
								step >= 1 ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-500'
							}`}>
								1
							</div>
							<span className="ml-2 text-sm font-medium">Pamatinformācija</span>
						</div>
						<div className={`w-8 h-1 ${step >= 2 ? 'bg-yellow-400' : 'bg-gray-200'}`}></div>
						<div className={`flex items-center ${step >= 2 ? 'text-yellow-600' : 'text-gray-400'}`}>
							<div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
								step >= 2 ? 'bg-yellow-400 text-black' : 'bg-gray-200 text-gray-500'
							}`}>
								2
							</div>
							<span className="ml-2 text-sm font-medium">
								{formData.accountType === 'children' ? 'Bērnu informācija' : 'Pabeigt'}
							</span>
						</div>
					</div>
				</div>

                {/* Form Content */}
                <div className="p-6">
                    {submitted ? (
                        <div className="text-center space-y-4">
                            <div className="text-green-600 text-lg font-semibold">✅ Reģistrācija izveidota!</div>
                            <p className="text-gray-600">Lai pabeigtu reģistrāciju, lūdzu, pārbaudiet savu e-pastu un sekojiet norādījumiem.</p>
                        </div>
                    ) : (
                        <>
                    {step === 1 && (
						<div className="space-y-6">
							{/* Account Type Selection */}
							<div>
								<h3 className="text-lg font-semibold text-black mb-4">Konta tips</h3>
								<div className="space-y-3">
									<label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
										<input
											type="radio"
											name="accountType"
											value="self"
											checked={formData.accountType === 'self'}
											onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as 'self' | 'children' }))}
											className="mr-3 text-yellow-600"
										/>
										<div>
											<div className="font-medium text-black">Konts priekš manis</div>
											<div className="text-sm text-gray-600">Reģistrējos matemātikas stundām sev</div>
										</div>
									</label>
									<label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
										<input
											type="radio"
											name="accountType"
											value="children"
											checked={formData.accountType === 'children'}
											onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value as 'self' | 'children' }))}
											className="mr-3 text-yellow-600"
										/>
										<div>
											<div className="font-medium text-black">Konts priekš maniem bērniem</div>
											<div className="text-sm text-gray-600">Reģistrēju savus bērnus matemātikas stundām</div>
										</div>
									</label>
								</div>
							</div>

							{/* Basic Information */}
							<div className="grid md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Vārds *</label>
									<input
										type="text"
										value={formData.firstName}
										onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
										className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
											errors.firstName ? 'border-red-500' : 'border-gray-300'
										}`}
										placeholder="Jūsu vārds"
									/>
									{errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Uzvārds *</label>
									<input
										type="text"
										value={formData.lastName}
										onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
										className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
											errors.lastName ? 'border-red-500' : 'border-gray-300'
										}`}
										placeholder="Jūsu uzvārds"
									/>
									{errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
								</div>
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">E-pasts *</label>
								<input
									type="email"
									value={formData.email}
									onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
									className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
										errors.email ? 'border-red-500' : 'border-gray-300'
									}`}
									placeholder="epasts@example.com"
								/>
								{errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
							</div>

							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">Tālrunis</label>
								<input
									type="tel"
									value={formData.phone}
									onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
									className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
									placeholder="+371 12345678"
								/>
							</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Atlaižu kods (neobligāts)</label>
							<input
								type="text"
								value={formData.discountCode}
								onChange={(e) => setFormData(prev => ({ ...prev, discountCode: e.target.value }))}
								className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
								placeholder="PIEM10"
							/>
                                {errors.discountCode && <p className="text-red-500 text-sm mt-1">{errors.discountCode}</p>}
						</div>

							<div className="grid md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Parole *</label>
									<input
										type="password"
										value={formData.password}
										onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
										className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
											errors.password ? 'border-red-500' : 'border-gray-300'
										}`}
										placeholder="••••••"
									/>
									{errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
								</div>
								<div>
									<label className="block text-sm font-medium text-gray-700 mb-2">Apstiprināt paroli *</label>
									<input
										type="password"
										value={formData.confirmPassword}
										onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
										className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
											errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
										}`}
										placeholder="••••••"
									/>
									{errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
								</div>
							</div>
                        </div>
                    )}

					{step === 2 && formData.accountType === 'children' && (
						<div className="space-y-6">
							<div>
								<h3 className="text-lg font-semibold text-black mb-4">Bērnu informācija</h3>
								<p className="text-gray-600 mb-4">Pievienojiet informāciju par saviem bērniem</p>
								
								{formData.children.map((child, index) => (
									<div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
										<div className="flex items-center justify-between mb-4">
											<h4 className="font-medium text-black">Bērns #{index + 1}</h4>
											<button
												type="button"
												onClick={() => removeChild(index)}
												className="text-red-500 hover:text-red-700 text-sm"
											>
												Noņemt
											</button>
										</div>
										
								<div className="grid md:grid-cols-2 gap-4">
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">Vārds *</label>
												<input
													type="text"
													value={child.firstName}
													onChange={(e) => updateChild(index, 'firstName', e.target.value)}
													className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
														errors[`child_${index}_firstName`] ? 'border-red-500' : 'border-gray-300'
													}`}
													placeholder="Bērna vārds"
												/>
												{errors[`child_${index}_firstName`] && <p className="text-red-500 text-sm mt-1">{errors[`child_${index}_firstName`]}</p>}
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">Uzvārds *</label>
												<input
													type="text"
													value={child.lastName}
													onChange={(e) => updateChild(index, 'lastName', e.target.value)}
													className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
														errors[`child_${index}_lastName`] ? 'border-red-500' : 'border-gray-300'
													}`}
													placeholder="Bērna uzvārds"
												/>
												{errors[`child_${index}_lastName`] && <p className="text-red-500 text-sm mt-1">{errors[`child_${index}_lastName`]}</p>}
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">Vecums *</label>
												<input
													type="number"
													min="1"
													value={child.age || ''}
													onChange={(e) => updateChild(index, 'age', parseInt(e.target.value) || 0)}
													className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
														errors[`child_${index}_age`] ? 'border-red-500' : 'border-gray-300'
													}`}
													placeholder="Vecums"
												/>
												{errors[`child_${index}_age`] && <p className="text-red-500 text-sm mt-1">{errors[`child_${index}_age`]}</p>}
											</div>
											<div>
												<label className="block text-sm font-medium text-gray-700 mb-2">Klase *</label>
												<select
													value={child.grade}
													onChange={(e) => updateChild(index, 'grade', e.target.value)}
													className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
														errors[`child_${index}_grade`] ? 'border-red-500' : 'border-gray-300'
													}`}
												>
													<option value="">Izvēlieties klasi</option>
													<option value="pirmskolas">Pirmskolas</option>
													<option value="1.klase">1. klase</option>
													<option value="2.klase">2. klase</option>
													<option value="3.klase">3. klase</option>
													<option value="4.klase">4. klase</option>
													<option value="5.klase">5. klase</option>
													<option value="6.klase">6. klase</option>
													<option value="7.klase">7. klase</option>
													<option value="8.klase">8. klase</option>
													<option value="9.klase">9. klase</option>
													<option value="10.klase">10. klase</option>
													<option value="11.klase">11. klase</option>
													<option value="12.klase">12. klase</option>
													<option value="augstskola">Augstskola</option>
													<option value="nav_skola">Nav skola</option>
												</select>
												{errors[`child_${index}_grade`] && <p className="text-red-500 text-sm mt-1">{errors[`child_${index}_grade`]}</p>}
											</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">E-pasts (neobligāts)</label>
										<input
											type="email"
											value={child.email || ''}
											onChange={(e) => updateChild(index, 'email', e.target.value)}
											className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
											placeholder="epasts@piemers.lv"
										/>
									</div>
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Tālrunis (neobligāts)</label>
										<input
											type="tel"
											value={child.phone || ''}
											onChange={(e) => updateChild(index, 'phone', e.target.value)}
											className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
											placeholder="+371 12345678"
										/>
									</div>
										</div>
									</div>
								))}
								
								{errors.children && <p className="text-red-500 text-sm mb-4">{errors.children}</p>}
								
								<button
									type="button"
									onClick={addChild}
									className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-yellow-400 hover:text-yellow-600 transition-colors"
								>
									+ Pievienot bērnu
								</button>
							</div>
						</div>
					)}

                    {step === 2 && formData.accountType === 'self' && (
						<div className="text-center space-y-4">
							<div className="text-green-600 text-lg font-semibold">
								✅ Reģistrācija gandrīz pabeigta!
							</div>
							<p className="text-gray-600">
								Pēc reģistrācijas jūs varēsiet rezervēt matemātikas stundas un sekot līdzi saviem pierakstiem.
							</p>
						</div>
					)}

                    {errors.submit && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-600">{errors.submit}</p>
                        </div>
                    )}
                        </>
                    )}
				</div>

				{/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200">
                    {submitted ? (
                        <div className="w-full flex items-center justify-end">
                            <button onClick={onClose} className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium">Aizvērt</button>
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={step === 1 ? onClose : () => setStep(step - 1)}
                                className="px-6 py-2 text-gray-600 hover:text-gray-800 font-medium"
                            >
                                {step === 1 ? 'Atcelt' : 'Atpakaļ'}
                            </button>
                            <button
                                onClick={handleNext}
                                disabled={isSubmitting}
                                className="bg-yellow-400 hover:bg-yellow-500 disabled:opacity-50 text-black font-bold py-3 px-8 rounded-lg transition-colors"
                            >
                                {isSubmitting ? 'Reģistrē...' : step === 2 ? 'Reģistrēties' : (checkingEmail ? 'Pārbauda...' : 'Turpināt')}
                            </button>
                        </>
                    )}
                </div>
			</div>
		</div>
	)
}

export default RegistrationModal
