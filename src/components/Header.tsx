import { useState } from 'react'

type Section = 'home' | 'tutors' | 'lessons' | 'calendar' | 'profile'

interface HeaderProps {
	activeSection: Section
	setActiveSection: React.Dispatch<React.SetStateAction<Section>>
}

const Header = ({ activeSection, setActiveSection }: HeaderProps) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false)
	}

	const handleSectionChange = (section: Section) => {
		setActiveSection(section)
		closeMobileMenu()
	}

	return (
		<header className="bg-white shadow-md sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<button
						onClick={() => { setActiveSection('home'); closeMobileMenu() }}
						className="flex items-center focus:outline-none cursor-pointer"
						aria-label="Iet uz sākumlapu"
						title="Sākums"
					>
						<div className="bg-yellow-400 rounded-full p-2 mr-3">
							<span className="text-2xl font-bold text-black">K</span>
						</div>
						<h1 className="text-2xl font-bold text-black">KARDANO</h1>
					</button>

					{/* Contact Info - Desktop */}
					<div className="hidden lg:flex items-center space-x-4 text-sm text-gray-700">
						<div className="flex items-center">
							<span className="mr-2">📞</span>
							<span>22327484</span>
						</div>
						<div className="flex items-center">
							<span className="mr-2">✉️</span>
							<span>kardano.info@gmail.com</span>
						</div>
						{/* WhatsApp */}
						<a
							href="https://wa.me/37122327484"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center hover:text-green-600 transition-colors"
							title="Sazināties WhatsApp"
						>
							<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
							</svg>
						</a>
						{/* Facebook */}
						<a
							href="https://m.me/kardanoschool"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center hover:text-blue-600 transition-colors"
							title="Sazināties Facebook"
						>
							<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
							</svg>
						</a>
					</div>

					{/* Profile + Burger buttons (all breakpoints) */}
					<div className="flex items-center gap-2">
						<button
							onClick={() => { setActiveSection('profile'); closeMobileMenu() }}
							className="inline-flex items-center justify-center p-2 rounded-full text-gray-700 hover:text-black hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-400"
							title="Mans profils"
						>
							<span className="sr-only">Atvērt profilu</span>
							<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
								<path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5zm0 2c-3.866 0-7 3.134-7 7 0 .552.448 1 1 1h12c.552 0 1-.448 1-1 0-3.866-3.134-7-7-7z" />
							</svg>
						</button>
						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-black hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-yellow-400"
						>
							<span className="sr-only">Atvērt galveno izvēlni</span>
							{/* Hamburger icon */}
							<svg
								className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
							</svg>
							{/* Close icon */}
							<svg
								className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
							</svg>
						</button>
					</div>
				</div>

				{/* Collapsible Navigation Menu (all breakpoints) */}
				<div className={`${isMobileMenuOpen ? 'block' : 'hidden'}`}>
					<div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
						<button
							onClick={() => handleSectionChange('home')}
							className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
								activeSection === 'home'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Sākums
						</button>
						<button
							onClick={() => handleSectionChange('tutors')}
							className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
								activeSection === 'tutors'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Pasniedzēji
						</button>
						<button
							onClick={() => handleSectionChange('lessons')}
							className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
								activeSection === 'lessons'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Nodarbības
						</button>
						<button
							onClick={() => handleSectionChange('calendar')}
							className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
								activeSection === 'calendar'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Kalendārs
						</button>
						<button
							onClick={() => handleSectionChange('profile')}
							className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
								activeSection === 'profile'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Mans profils
						</button>
						
						{/* Mobile Contact Info */}
						<div className="pt-4 border-t border-gray-200">
							<div className="px-3 py-2 text-sm text-gray-700">
								<div className="flex items-center mb-2">
									<span className="mr-2">📞</span>
									<span>22327484</span>
								</div>
								<div className="flex items-center mb-2">
									<span className="mr-2">✉️</span>
									<span>kardano.info@gmail.com</span>
								</div>
								<div className="flex items-center gap-4 mt-3">
									<a
										href="https://wa.me/37122327484"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center text-green-600 hover:text-green-700 transition-colors"
										title="Sazināties WhatsApp"
									>
										<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
										</svg>
										<span className="ml-2 font-medium">WhatsApp</span>
									</a>
									<a
										href="https://m.me/kardanoschool"
										target="_blank"
										rel="noopener noreferrer"
										className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
										title="Sazināties Facebook"
									>
										<svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
											<path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
										</svg>
										<span className="ml-2 font-medium">Facebook</span>
									</a>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</header>
	)
}

export default Header
