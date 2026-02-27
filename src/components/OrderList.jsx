import React from 'react';
import { db } from '../services/firebase';

const OrderCard = ({ p, onToggleEstado, onPrint }) => {
    // Cálculo de valores financieros
    const total = p.total || 0;
    const anticipo = p.anticipoValor || 0;
    const resta = total - anticipo;

    // Cálculo de progreso de despacho
    const totalProductos = p.items.length;
    const entregadosCount = p.items.filter(it => it.entregadoIndividual).length;

    const editarAnticipo = () => {
        const pass = prompt("PIN de seguridad para modificar saldos:");
        if (pass === "00") {
            const nuevoAnticipo = prompt("Ingrese el monto TOTAL que el cliente ha entregado (Abono):", anticipo);
            if (nuevoAnticipo !== null && !isNaN(nuevoAnticipo)) {
                const valorNum = parseFloat(nuevoAnticipo);
                let nuevoEstado = 'anticipo';
                let estaPagado = false;
                if (valorNum >= total) { nuevoEstado = 'pagado'; estaPagado = true; }
                else if (valorNum <= 0) { nuevoEstado = 'pendiente'; estaPagado = false; }

                db.collection("pedidos").doc(p.id).update({ 
                    anticipoValor: valorNum,
                    estadoPago: nuevoEstado,
                    pagado: estaPagado
                });
                if (estaPagado && window.confetti) {
                    window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.8 } });
                }
            }
        } else if (pass !== null) { alert("PIN Incorrecto"); }
    };

    const eliminarPedido = () => {
        const pass = prompt("PIN para ELIMINAR:");
        if (pass === "00" && confirm("¿Eliminar registro?")) {
            db.collection("pedidos").doc(p.id).delete();
        }
    };

    const editarNota = () => {
        const pass = prompt("PIN para editar:");
        if (pass === "00") {
            const nuevaNota = prompt("Editar nota:", p.nota);
            if (nuevaNota !== null) {
                db.collection("pedidos").doc(p.id).update({ nota: nuevaNota });
            }
        }
    };

    const toggleProductoEntregado = (index) => {
        const nuevosItems = [...p.items];
        nuevosItems[index].entregadoIndividual = !nuevosItems[index].entregadoIndividual;
        db.collection("pedidos").doc(p.id).update({ items: nuevosItems });
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 relative mb-6 view-transition">
            
            {/* ENCABEZADO */}
            <div className="flex justify-between items-start mb-5">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[7px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            #{p.correlativo}
                        </span>
                        <span className={`text-[7px] font-black px-2 py-0.5 rounded-full uppercase ${
                            p.estadoPago === 'pagado' ? 'bg-emerald-100 text-emerald-600' : 
                            p.estadoPago === 'anticipo' ? 'bg-orange-100 text-orange-600' : 'bg-red-50 text-red-400'
                        }`}>
                            {p.estadoPago === 'pagado' ? 'PAGADO TOTAL' : p.estadoPago === 'anticipo' ? 'CON ANTICIPO' : 'PENDIENTE PAGO'}
                        </span>
                    </div>
                    <h3 className="text-xl font-serif italic text-slate-800 tracking-tight leading-none uppercase">
                        {p.cliente}
                    </h3>
                    <p className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest flex items-center gap-1">
                        <i className="fa-regular fa-clock text-[9px]"></i> {p.fecha || p.fechaRegistro}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-4 w-[2px] bg-blue-500 rounded-full"></div>
                        <p className="text-[10px] font-medium text-slate-400 italic">{p.nota || "Sin especificaciones"}</p>
                        <button onClick={editarNota} className="text-slate-300 hover:text-blue-500 transition-colors">
                            <i className="fa-solid fa-pen-to-square text-[9px]"></i>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button onClick={() => onPrint(p)} className="bg-slate-900 text-white w-9 h-9 rounded-full flex items-center justify-center shadow-lg">
                        <i className="fa-solid fa-print text-[10px]"></i>
                    </button>
                    <button onClick={eliminarPedido} className="bg-red-50 text-red-400 w-9 h-9 rounded-full flex items-center justify-center border border-red-100">
                        <i className="fa-solid fa-trash text-[10px]"></i>
                    </button>
                </div>
            </div>

            {/* LISTA DE PRODUCTOS - VISIBILIDAD DE CANTIDAD MEJORADA */}
            <div className="space-y-3 mb-4 bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100">
                <div className="flex justify-between items-center mb-2 px-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Control de despacho</p>
                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md italic">
                        {entregadosCount} de {totalProductos} listos
                    </span>
                </div>

                {p.items.map((it, i) => (
                    <div 
                        key={i} 
                        onClick={() => toggleProductoEntregado(i)}
                        className={`flex justify-between items-center p-3 rounded-3xl transition-all cursor-pointer ${
                            it.entregadoIndividual ? 'bg-emerald-50/50' : 'bg-white shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-4">
                            {/* NÚMERO DE CANTIDAD GIGANTE Y VISIBLE */}
                            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shadow-sm transition-colors ${
                                it.entregadoIndividual ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}>
                                <span className="text-2xl font-black text-white leading-none">{it.cantidad}</span>
                            </div>

                            <div className="flex flex-col">
                                <span className={`text-xs font-black uppercase tracking-tight leading-tight ${
                                    it.entregadoIndividual ? 'line-through text-slate-400' : 'text-slate-700'
                                }`}>
                                    {it.nombre}
                                </span>
                                <span className="text-[9px] font-bold text-slate-300 uppercase">
                                    Q{(it.cantidad * it.precio).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${
                            it.entregadoIndividual ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-100 text-transparent'
                        }`}>
                            <i className="fa-solid fa-check text-[9px]"></i>
                        </div>
                    </div>
                ))}
            </div>

            {/* RESUMEN FINANCIERO */}
            <div 
                onClick={editarAnticipo}
                className="flex justify-between items-center px-6 py-4 mb-6 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
            >
                <div className="absolute top-0 right-0 w-20 h-full bg-white/5 skew-x-12 translate-x-10"></div>
                <div className="relative">
                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Total</p>
                    <p className="text-lg font-black leading-none">Q{total.toFixed(2)}</p>
                </div>
                {p.estadoPago === 'anticipo' && (
                    <div className="text-center relative">
                        <p className="text-[8px] font-black text-orange-400 uppercase leading-none mb-1 italic text-center">Abonó ✎</p>
                        <p className="text-lg font-black leading-none text-orange-200">Q{anticipo.toFixed(2)}</p>
                    </div>
                )}
                <div className="text-right relative">
                    <p className="text-[8px] font-black text-blue-400 uppercase leading-none mb-1">
                        {p.estadoPago === 'pagado' ? 'Saldo' : 'Falta cobrar'} ✎
                    </p>
                    <p className={`text-lg font-black leading-none ${p.estadoPago === 'pagado' ? 'text-emerald-400' : 'text-blue-200'}`}>
                        Q{resta.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* CONTROLES DE ESTADO */}
            <div className="flex gap-3">
                <button 
                    onClick={() => onToggleEstado(p.id, 'entregado', p.entregado)} 
                    className={`flex-[2] py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all ${
                        p.entregado ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {p.entregado ? 'Pedido Entregado ✓' : 'Marcar Entrega Total'}
                </button>
                <button 
                    onClick={() => onToggleEstado(p.id, 'pagado', p.pagado)} 
                    className={`flex-1 rounded-2xl border-2 transition-all flex items-center justify-center ${
                        p.pagado ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-300'
                    }`}
                >
                    <i className={`fa-solid ${p.pagado ? 'fa-check-double' : 'fa-wallet'} text-xs`}></i>
                </button>
            </div>
        </div>
    );
};

export default OrderCard;