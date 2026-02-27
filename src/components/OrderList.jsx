import React from 'react';
import { db } from '../services/firebase';

const OrderCard = ({ p, onToggleEstado, onPrint }) => {
    const total = p.total || 0;
    const anticipo = p.anticipoValor || 0;
    const resta = total - anticipo;

    // 1. Lógica de Pago Completo con Confeti
    const marcarPagoCompleto = () => {
        if (p.pagado) {
            db.collection("pedidos").doc(p.id).update({ 
                pagado: false, 
                estadoPago: 'pendiente',
                anticipoValor: 0 
            });
        } else {
            // Efecto de celebración
            window.confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.8 },
                colors: ['#10b981', '#3b82f6', '#fbbf24']
            });

            db.collection("pedidos").doc(p.id).update({ 
                pagado: true, 
                estadoPago: 'pagado',
                anticipoValor: total 
            });
        }
    };

    // 2. Lógica de Entrega Individual y Automática
    const toggleProductoEntregado = (index) => {
        const nuevosItems = [...p.items];
        nuevosItems[index].entregadoIndividual = !nuevosItems[index].entregadoIndividual;
        
        // Regla: Si TODOS los productos están chequeados, pasar a "Entregado"
        const todosListos = nuevosItems.every(it => it.entregadoIndividual);
        
        db.collection("pedidos").doc(p.id).update({
            items: nuevosItems,
            entregado: todosListos 
        });
    };

    // 3. Botón Entregar Todo (Cascada)
    const marcarTodaLaEntrega = () => {
        const estadoDestino = !p.entregado;
        const nuevosItems = p.items.map(it => ({
            ...it,
            entregadoIndividual: estadoDestino
        }));

        db.collection("pedidos").doc(p.id).update({
            items: nuevosItems,
            entregado: estadoDestino
        });
    };

    const eliminarPedido = () => {
        const pass = prompt("PIN de seguridad:");
        if (pass === "00" && confirm("¿Eliminar orden de " + p.cliente + "?")) {
            db.collection("pedidos").doc(p.id).delete();
        }
    };

    return (
        <div className={`bg-white rounded-[2.5rem] p-7 shadow-sm border-2 mb-6 transition-all duration-500 ${p.entregado ? 'border-emerald-100 opacity-60' : 'border-slate-100'}`}>
            
            {/* ENCABEZADO */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-lg uppercase">
                            #{p.correlativo}
                        </span>
                        <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase shadow-sm ${
                            p.estadoPago === 'pagado' ? 'bg-emerald-500 text-white' : 
                            p.estadoPago === 'anticipo' ? 'bg-orange-400 text-white' : 'bg-red-500 text-white'
                        }`}>
                            {p.estadoPago === 'pagado' ? 'PAGADO' : p.estadoPago === 'anticipo' ? `FALTAN Q${resta.toFixed(2)}` : 'DEUDA TOTAL'}
                        </span>
                    </div>
                    <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">
                        {p.cliente}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                        <i className="fa-regular fa-clock mr-1"></i> {p.fecha || p.fechaRegistro}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => onPrint(p)} className="bg-slate-100 text-slate-600 w-11 h-11 rounded-2xl flex items-center justify-center tap-soft border border-slate-200">
                        <i className="fa-solid fa-print text-lg"></i>
                    </button>
                    <button onClick={eliminarPedido} className="bg-red-50 text-red-400 w-11 h-11 rounded-2xl flex items-center justify-center tap-soft border border-red-100">
                        <i className="fa-solid fa-trash-can text-lg"></i>
                    </button>
                </div>
            </div>

            {/* LISTA DE PRODUCTOS CON CANTIDADES MUY VISIBLES */}
            <div className="space-y-3 mb-6">
                {p.items.map((it, i) => (
                    <div 
                        key={i} 
                        onClick={() => toggleProductoEntregado(i)}
                        className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all active:scale-95 cursor-pointer ${
                            it.entregadoIndividual 
                            ? 'bg-emerald-50 border-emerald-200' 
                            : 'bg-slate-50 border-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            {/* CANTIDAD GIGANTE */}
                            <div className={`w-16 h-16 rounded-[1.2rem] flex flex-col items-center justify-center shadow-md transition-colors ${it.entregadoIndividual ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                                <span className="text-3xl font-black text-white leading-none">{it.cantidad}</span>
                                <span className="text-[8px] font-black text-white/60 uppercase">Cant</span>
                            </div>
                            
                            <div>
                                <p className={`text-md font-black uppercase leading-tight ${it.entregadoIndividual ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {it.nombre}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400">Q{it.precio.toFixed(2)} unitario</p>
                            </div>
                        </div>
                        
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${it.entregadoIndividual ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}>
                            <i className="fa-solid fa-check text-sm"></i>
                        </div>
                    </div>
                ))}
            </div>

            {/* RESUMEN DE CUENTA ESTILO TICKET */}
            <div className="bg-slate-900 rounded-[2rem] p-6 mb-6 flex justify-between items-center text-white shadow-xl relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute right-[-10%] top-[-20%] w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">A cobrar</p>
                    <p className="text-3xl font-black italic">Q{resta.toFixed(2)}</p>
                </div>
                
                <div className="text-right relative z-10">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">Total de Orden</p>
                    <p className={`text-sm font-bold ${p.pagado ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {p.pagado ? '¡SALDO PAGADO!' : `Q${total.toFixed(2)}`}
                    </p>
                </div>
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex gap-4">
                <button 
                    onClick={marcarTodaLaEntrega} 
                    className={`flex-[3] py-5 rounded-3xl text-xs font-black uppercase tracking-widest tap-soft transition-all shadow-lg flex items-center justify-center gap-2 ${
                        p.entregado ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                >
                    <i className={`fa-solid ${p.entregado ? 'fa-box-open' : 'fa-truck-ramp-box'}`}></i>
                    {p.entregado ? 'Pedido Entregado' : 'Entregar Todo'}
                </button>
                
                <button 
                    onClick={marcarPagoCompleto} 
                    className={`flex-1 rounded-3xl tap-soft border-2 transition-all flex items-center justify-center shadow-lg active:bg-blue-50 ${
                        p.pagado ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400'
                    }`}
                >
                    <i className={`fa-solid ${p.pagado ? 'fa-check-double' : 'fa-wallet'} text-2xl`}></i>
                </button>
            </div>

            {p.nota && (
                <div className="mt-5 p-4 bg-amber-50 rounded-2xl border-l-4 border-amber-400">
                    <p className="text-[11px] font-black text-amber-800 uppercase flex items-center gap-2">
                        <i className="fa-solid fa-circle-exclamation"></i> Nota: {p.nota}
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrderCard;