import React from 'react';

const SearchFab = ({ view, showSearchBox, setShowSearchBox, searchTerm, setSearchTerm }) => {
    // Solo mostrar si estamos en las vistas de lista (Agenda o Entregas)
    if (view !== 'agenda' && view !== 'entregas') return null;

    return (
        <div className="fixed bottom-10 right-6 z-[60] flex flex-col items-end gap-3">
            {showSearchBox && (
                <div className="bg-white p-4 rounded-[2rem] shadow-2xl border border-slate-100 w-72 mb-2 view-transition animate-slideUp">
                    <input 
                        autoFocus 
                        className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500 transition-all" 
                        placeholder="Buscar cliente..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)} 
                    />
                </div>
            )}
            
            <button 
                onClick={() => {
                    setShowSearchBox(!showSearchBox);
                    if (showSearchBox) setSearchTerm(""); // Limpiar búsqueda al cerrar
                }} 
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl tap-soft transition-all ${
                    showSearchBox ? 'bg-slate-800 rotate-90' : 'bg-blue-600'
                }`}
            >
                <i className={`fa-solid ${showSearchBox ? 'fa-xmark' : 'fa-magnifying-glass'}`}></i>
            </button>
        </div>
    );
};

export default SearchFab;
