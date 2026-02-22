import React from 'react';

const Summary = ({ pedidos }) => {
    // 1. Cálculo del Capital (Solo pedidos marcados como PAGADOS)
    const totalVentas = pedidos
        .filter(p => p.pagado)
        .reduce((acc, p) => 
            acc + p.items.reduce((a, i) => a + (i.cantidad * i.precio), 0), 0
        );

    // 2. Consolidado para Producción (Solo pedidos NO entregados)
    const consolidadoHorno = pedidos
        .filter(p => !p.entregado)
        .reduce((acc, p) => {
            p.items.forEach(it => {
                acc[it.nombre] = (acc[it.nombre] || 0) + it.cantidad;
            });
            return acc;
        }, {});

    const itemsProduccion = Object.entries(consolidadoHorno);

    return (
        <div className="space-y-6 view-transition">
            {/* TARJETA DE CAPITAL PRINCIPAL */}
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
                {/* Círculos decorativos de fondo */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-400/5 rounded-full -ml-16 -mb-16 blur-2xl"></div>
                
                <div className="relative z-10 text-center">
                    <p className="text-[10px] font-black text-blue-400 tracking-[0.4em] mb-4 uppercase">
                        Balance de Ventas
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-2xl font-light text-slate-400">Q</span>
                        <h2 className="text-5xl font-black tracking-tighter">
                            {totalVentas.toFixed(2)}
                        </h2>
                    </div>
                    <div className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mt-2">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                            Capital en Efectivo
                        </p>
                    </div>
                </div>
            </div>

            {/* CONSOLIDADO DE HORNEADO */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                <div className="flex flex-col items-center mb-8">
                    <i className="fa-solid fa-fire-burner text-amber-500 mb-2"></i>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                        Plan de Producción
                    </h3>
                    <div className="h-[2px] w-8 bg-blue-100 mt-2"></div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                    {itemsProduccion.length > 0 ? (
                        itemsProduccion.map(([nombre, cantidad]) => (
                            <div 
                                key={nombre} 
                                className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-50 group hover:border-blue-100 transition-colors"
                            >
                                <span className="font-bold text-slate-600 text-xs uppercase tracking-tight">
                                    {nombre}
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-black text-slate-300 italic">Unidades:</span>
                                    <span className="text-xl font-black text-slate-800">{cantidad}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-slate-400 text-[10px] font-medium italic py-4">
                            No hay horneado pendiente por ahora.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Summary;
