import { useState } from 'react'

interface HeaderProps {
	activeSection: string
	setActiveSection: (section: string) => void
}

const Header = ({ activeSection, setActiveSection }: HeaderProps) => {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

	const closeMobileMenu = () => {
		setIsMobileMenuOpen(false)
	}

	const handleSectionChange = (section: string) => {
		setActiveSection(section)
		closeMobileMenu()
	}

	return (
		<header className="bg-white shadow-md sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between items-center h-16">
					{/* Logo */}
					<div className="flex items-center">
						<div className="bg-yellow-400 rounded-full p-2 mr-3">
							<span className="text-2xl font-bold text-black">K</span>
						</div>
						<h1 className="text-2xl font-bold text-black">KARDANO</h1>
					</div>

					{/* Desktop Navigation */}
					<nav className="hidden md:flex space-x-8">
						<button
							onClick={() => setActiveSection('home')}
							className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
								activeSection === 'home'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Sākums
						</button>
						<button
							onClick={() => setActiveSection('tutors')}
							className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
								activeSection === 'tutors'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Pasniedzēji
						</button>
						<button
							onClick={() => setActiveSection('calendar')}
							className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
								activeSection === 'calendar'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Kalendārs
						</button>
					</nav>

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
					</div>

					{/* Mobile menu button */}
					<div className="md:hidden">
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

				{/* Mobile Navigation Menu */}
				<div className={`${isMobileMenuOpen ? 'block' : 'hidden'} md:hidden`}>
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
							onClick={() => handleSectionChange('calendar')}
							className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
								activeSection === 'calendar'
									? 'bg-yellow-400 text-black'
									: 'text-gray-700 hover:bg-yellow-100 hover:text-black'
							}`}
						>
							Kalendārs
						</button>
						
						{/* Mobile Contact Info */}
						<div className="pt-4 border-t border-gray-200">
							<div className="px-3 py-2 text-sm text-gray-700">
								<div className="flex items-center mb-2">
									<span className="mr-2">📞</span>
									<span>22327484</span>
								</div>
								<div className="flex items-center">
									<span className="mr-2">✉️</span>
									<span>kardano.info@gmail.com</span>
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
