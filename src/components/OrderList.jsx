import React from 'react';
import { db } from '../services/firebase';

const OrderCard = ({ p, onToggleEstado, onPrint }) => {
    const total = p.total || 0;
    const anticipo = p.anticipoValor || 0;
    const resta = total - anticipo;

    const totalProductos = p.items.length;
    const entregadosCount = p.items.filter(it => it.entregadoIndividual).length;

    // Función para editar anticipo con PIN
    const editarAnticipo = () => {
        const pass = prompt("PIN de seguridad para modificar saldos:");
        if (pass === "00") {
            const nuevoAnticipo = prompt("Ingrese el monto TOTAL que el cliente ha abonado:", anticipo);
            if (nuevoAnticipo !== null && !isNaN(nuevoAnticipo)) {
                const valorNum = parseFloat(nuevoAnticipo);
                let nuevoEstado = 'anticipo';
                let estaPagado = false;

                if (valorNum >= total) {
                    nuevoEstado = 'pagado';
                    estaPagado = true;
                    if(window.confetti) window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
                } else if (valorNum <= 0) {
                    nuevoEstado = 'pendiente';
                }

                db.collection("pedidos").doc(p.id).update({ 
                    anticipoValor: valorNum,
                    estadoPago: nuevoEstado,
                    pagado: estaPagado
                });
            }
        }
    };

    const toggleProductoEntregado = (index) => {
        const nuevosItems = [...p.items];
        nuevosItems[index].entregadoIndividual = !nuevosItems[index].entregadoIndividual;
        db.collection("pedidos").doc(p.id).update({ items: nuevosItems });
    };

    const eliminarPedido = () => {
        const pass = prompt("PIN para ELIMINAR:");
        if (pass === "00" && confirm("¿Eliminar registro?")) {
            db.collection("pedidos").doc(p.id).delete();
        }
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 relative mb-6 view-transition">
            
            {/* ENCABEZADO */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[7px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase">
                            #{p.correlativo}
                        </span>
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${
                            p.estadoPago === 'pagado' ? 'bg-emerald-100 text-emerald-600' : 
                            p.estadoPago === 'anticipo' ? 'bg-orange-100 text-orange-600' : 'bg-red-50 text-red-400'
                        }`}>
                            {p.estadoPago === 'pagado' ? 'PAGADO TOTAL' : p.estadoPago === 'anticipo' ? 'CON ANTICIPO' : 'PENDIENTE PAGO'}
                        </span>
                    </div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none uppercase">
                        {p.cliente}
                    </h3>
                    <p className="text-[8px] font-black text-slate-300 uppercase mt-1">
                        <i className="fa-regular fa-clock"></i> {p.fecha || p.fechaRegistro}
                    </p>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => onPrint(p)} className="bg-slate-900 text-white w-9 h-9 rounded-full flex items-center justify-center tap-soft">
                        <i className="fa-solid fa-print text-[10px]"></i>
                    </button>
                    <button onClick={eliminarPedido} className="bg-red-50 text-red-400 w-9 h-9 rounded-full flex items-center justify-center tap-soft border border-red-100">
                        <i className="fa-solid fa-trash text-[10px]"></i>
                    </button>
                </div>
            </div>

            {/* LISTA DE PRODUCTOS - CANTIDADES MÁS VISIBLES */}
            <div className="space-y-3 mb-4 bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100">
                <div className="flex justify-between items-center mb-1 px-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Detalle del Pedido</p>
                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md italic">
                        {entregadosCount}/{totalProductos} listos
                    </span>
                </div>

                {p.items.map((it, i) => (
                    <div 
                        key={i} 
                        onClick={() => toggleProductoEntregado(i)}
                        className={`flex justify-between items-center p-3 rounded-2xl transition-all cursor-pointer ${it.entregadoIndividual ? 'bg-emerald-50/50' : 'bg-white shadow-sm border border-slate-100'}`}
                    >
                        <div className="flex items-center gap-4">
                            {/* CAJA DE CANTIDAD GRANDE */}
                            <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-colors ${it.entregadoIndividual ? 'bg-emerald-500' : 'bg-blue-600'}`}>
                                <span className="text-xl font-black text-white leading-none">{it.cantidad}</span>
                                <span className="text-[7px] font-bold text-white/70 uppercase">Cant</span>
                            </div>

                            <div className="flex flex-col">
                                <span className={`text-xs font-black uppercase tracking-tight ${it.entregadoIndividual ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    {it.nombre}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">Q{(it.cantidad * it.precio).toFixed(2)} total</span>
                            </div>
                        </div>
                        
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${it.entregadoIndividual ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 text-transparent'}`}>
                            <i className="fa-solid fa-check text-[10px]"></i>
                        </div>
                    </div>
                ))}
            </div>

            {/* RESUMEN FINANCIERO EDITABLE */}
            <div 
                onClick={editarAnticipo}
                className="flex justify-between items-center px-6 py-4 mb-6 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
            >
                <div className="absolute top-0 right-0 w-20 h-full bg-white/5 skew-x-12 translate-x-10"></div>

                <div>
                    <p className="text-[8px] font-black text-slate-500 uppercase leading-none mb-1">Total</p>
                    <p className="text-lg font-black leading-none">Q{total.toFixed(2)}</p>
                </div>

                <div className="text-center">
                    <p className="text-[8px] font-black text-orange-400 uppercase leading-none mb-1 italic">Abonó ✎</p>
                    <p className="text-lg font-black leading-none text-orange-200">Q{anticipo.toFixed(2)}</p>
                </div>

                <div className="text-right">
                    <p className="text-[8px] font-black text-blue-400 uppercase leading-none mb-1">Saldo</p>
                    <p className={`text-xl font-black leading-none ${p.estadoPago === 'pagado' ? 'text-emerald-400' : 'text-blue-300'}`}>
                        Q{resta.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* BOTONES DE ESTADO */}
            <div className="flex gap-3">
                <button 
                    onClick={() => onToggleEstado(p.id, 'entregado', p.entregado)} 
                    className={`flex-[2.5] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] tap-soft transition-all ${
                        p.entregado ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {p.entregado ? '✅ Pedido Entregado' : 'Marcar Entrega Total'}
                </button>
                <button 
                    onClick={() => onToggleEstado(p.id, 'pagado', p.pagado)} 
                    className={`flex-1 rounded-2xl tap-soft border-2 transition-all flex items-center justify-center ${
                        p.pagado ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-300'
                    }`}
                >
                    <i className={`fa-solid ${p.pagado ? 'fa-check-double' : 'fa-wallet'} text-sm`}></i>
                </button>
            </div>
        </div>
    );
};

export default OrderList;