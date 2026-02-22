import React from 'react';

const Navbar = ({ view, setView }) => {
    // Definición de los botones de navegación y sus íconos correspondientes
    const navItems = [
        { id: 'crear', icon: 'fa-plus' },
        { id: 'agenda', icon: 'fa-list' },
        { id: 'entregas', icon: 'fa-check-double' },
        { id: 'resumen', icon: 'fa-vault' }
    ];

    return (
        <div className="fixed top-0 left-0 right-0 z-40 p-4 max-w-md mx-auto">
            <nav className="glass border border-white/40 shadow-xl rounded-full flex justify-around p-2">
                {navItems.map((item) => (
                    <button 
                        key={item.id} 
                        onClick={() => setView(item.id)} 
                        className={`w-12 h-12 rounded-full tap-soft flex items-center justify-center transition-all ${
                            view === item.id 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                        aria-label={`Cambiar a vista ${item.id}`}
                    >
                        <i className={`fa-solid ${item.icon}`}></i>
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default Navbar;
