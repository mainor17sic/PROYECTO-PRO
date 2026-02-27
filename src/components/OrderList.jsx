import React from 'react';
import { db } from '../services/firebase';

const OrderCard = ({ p, onToggleEstado, onPrint }) => {
    const total = p.total || 0;
    const anticipo = p.anticipoValor || 0;
    const resta = total - anticipo;

    // 1. Lógica de Pago Completo (Billetera)
    const marcarPagoCompleto = () => {
        if (p.pagado) {
            db.collection("pedidos").doc(p.id).update({ 
                pagado: false, 
                estadoPago: 'pendiente',
                anticipoValor: 0 
            });
        } else {
            db.collection("pedidos").doc(p.id).update({ 
                pagado: true, 
                estadoPago: 'pagado',
                anticipoValor: total 
            });
        }
    };

    // 2. Lógica de Entrega (Individual y Automática)
    const toggleProductoEntregado = (index) => {
        const nuevosItems = [...p.items];
        nuevosItems[index].entregadoIndividual = !nuevosItems[index].entregadoIndividual;
        
        // Verificar si tras este cambio, TODOS están marcados
        const todosListos = nuevosItems.every(it => it.entregadoIndividual);
        
        db.collection("pedidos").doc(p.id).update({
            items: nuevosItems,
            entregado: todosListos // Se pasa a entregados automáticamente
        });
    };

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
        const pass = prompt("PIN para ELIMINAR:");
        if (pass === "00" && confirm("¿Eliminar registro?")) {
            db.collection("pedidos").doc(p.id).delete();
        }
    };

    return (
        <div className={`bg-white rounded-[2.5rem] p-7 shadow-sm border-2 mb-6 transition-all ${p.entregado ? 'border-transparent opacity-80' : 'border-slate-100'}`}>
            
            {/* ENCABEZADO */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[8px] font-black bg-slate-900 text-white px-2 py-1 rounded-lg uppercase">
                            #{p.correlativo}
                        </span>
                        <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${
                            p.estadoPago === 'pagado' ? 'bg-emerald-500 text-white' : 
                            p.estadoPago === 'anticipo' ? 'bg-orange-400 text-white' : 'bg-red-500 text-white'
                        }`}>
                            {p.estadoPago === 'pagado' ? 'PAGADO' : p.estadoPago === 'anticipo' ? `DEBE Q${resta.toFixed(2)}` : 'DEUDA TOTAL'}
                        </span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">
                        {p.cliente}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase italic">
                        {p.fecha || p.fechaRegistro}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => onPrint(p)} className="bg-slate-100 text-slate-600 w-10 h-10 rounded-2xl flex items-center justify-center tap-soft">
                        <i className="fa-solid fa-print text-sm"></i>
                    </button>
                    <button onClick={eliminarPedido} className="bg-red-50 text-red-400 w-10 h-10 rounded-2xl flex items-center justify-center tap-soft">
                        <i className="fa-solid fa-trash-can text-sm"></i>
                    </button>
                </div>
            </div>

            {/* LISTA DE PRODUCTOS - VISIBILIDAD MEJORADA */}
            <div className="space-y-3 mb-6">
                {p.items.map((it, i) => (
                    <div 
                        key={i} 
                        onClick={() => toggleProductoEntregado(i)}
                        className={`flex items-center justify-between p-4 rounded-3xl border-2 transition-all active:scale-95 ${
                            it.entregadoIndividual 
                            ? 'bg-emerald-50 border-emerald-100 opacity-50' 
                            : 'bg-slate-50 border-slate-50'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            {/* CANTIDAD GRANDE Y VISIBLE */}
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${it.entregadoIndividual ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                                <span className="text-2xl font-black text-white">{it.cantidad}</span>
                            </div>
                            <div>
                                <p className={`text-sm font-black uppercase ${it.entregadoIndividual ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    {it.nombre}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400">Q{it.precio}.00 c/u</p>
                            </div>
                        </div>
                        <i className={`fa-solid ${it.entregadoIndividual ? 'fa-circle-check text-emerald-500' : 'fa-circle text-slate-200'} text-xl`}></i>
                    </div>
                ))}
            </div>

            {/* RESUMEN FINANCIERO */}
            <div className="bg-slate-900 rounded-[2rem] p-5 mb-6 flex justify-between items-center text-white">
                <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Orden</p>
                    <p className="text-xl font-black">Q{total.toFixed(2)}</p>
                </div>
                {p.estadoPago === 'anticipo' && (
                    <div className="text-right">
                        <p className="text-[9px] font-black text-orange-400 uppercase">Faltan</p>
                        <p className="text-xl font-black text-orange-400">Q{resta.toFixed(2)}</p>
                    </div>
                )}
                {p.estadoPago === 'pagado' && (
                    <div className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/30">
                        <span className="text-[10px] font-black uppercase">¡Pagado!</span>
                    </div>
                )}
            </div>

            {/* BOTONES DE ACCIÓN AUTOMATIZADOS */}
            <div className="flex gap-3">
                <button 
                    onClick={marcarTodaLaEntrega} 
                    className={`flex-[2.5] py-5 rounded-[1.5rem] text-xs font-black uppercase tracking-widest tap-soft transition-all shadow-lg ${
                        p.entregado ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}
                >
                    {p.entregado ? '✅ Pedido Entregado' : '🚚 Entregar Todo'}
                </button>
                
                <button 
                    onClick={marcarPagoCompleto} 
                    className={`flex-1 rounded-[1.5rem] tap-soft border-2 transition-all flex items-center justify-center shadow-lg ${
                        p.pagado ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400'
                    }`}
                >
                    <i className={`fa-solid ${p.pagado ? 'fa-check-double' : 'fa-wallet'} text-xl`}></i>
                </button>
            </div>

            {p.nota && (
                <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <p className="text-[10px] font-bold text-amber-700 uppercase">Nota: {p.nota}</p>
                </div>
            )}
        </div>
    );
};