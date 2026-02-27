import React from 'react';
import { db } from '../services/firebase';

const OrderCard = ({ p, onToggleEstado, onPrint }) => {
    // Cálculo de la resta para mostrar en la tarjeta
    const total = p.total || 0;
    const anticipo = p.anticipoValor || 0;
    const resta = total - anticipo;

    // --- NUEVA LÓGICA DE PAGO TOTAL ---
    const manejarPagoBilletera = () => {
        if (p.pagado) {
            // Si ya estaba pagado, lo regresamos a pendiente (por si hubo error)
            db.collection("pedidos").doc(p.id).update({ 
                pagado: false, 
                estadoPago: 'pendiente',
                anticipoValor: 0 
            });
        } else {
            // Efecto visual de éxito
            if (window.confetti) {
                window.confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.8 },
                    colors: ['#10b981', '#3b82f6']
                });
            }

            // Actualizamos en Firebase para que sea "Cancelado Total"
            db.collection("pedidos").doc(p.id).update({ 
                pagado: true, 
                estadoPago: 'pagado',
                anticipoValor: total // El anticipo ahora es el total, por lo tanto resta Q0
            });
        }
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

    return (
        <div className="bg-white rounded-[2.5rem] p-7 shadow-sm border border-slate-100 relative mb-6 view-transition">
            {/* ENCABEZADO DE FICHA */}
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
                    <h3 className="text-xl font-serif italic text-slate-800 tracking-tight leading-none">
                        {p.cliente}
                    </h3>
                    
                    <p className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest">
                        <i className="fa-regular fa-clock mr-1"></i> {p.fecha || p.fechaRegistro}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                        <div className="h-4 w-[2px] bg-blue-500 rounded-full"></div>
                        <p className="text-[10px] font-medium text-slate-400 italic">
                            {p.nota || "Sin especificaciones"}
                        </p>
                        <button onClick={editarNota} className="text-slate-300 hover:text-blue-500 transition-colors">
                            <i className="fa-solid fa-pen-to-square text-[9px]"></i>
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <button onClick={() => onPrint(p)} className="bg-slate-900 text-white w-9 h-9 rounded-full flex items-center justify-center tap-soft shadow-lg">
                        <i className="fa-solid fa-print text-[10px]"></i>
                    </button>
                    <button onClick={eliminarPedido} className="bg-red-50 text-red-400 w-9 h-9 rounded-full flex items-center justify-center tap-soft border border-red-100">
                        <i className="fa-solid fa-trash text-[10px]"></i>
                    </button>
                </div>
            </div>

            {/* LISTA DE PRODUCTOS */}
            <div className="space-y-3 mb-4 bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100">
                {p.items.map((it, i) => (
                    <div key={i} className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="flex flex-col items-center justify-center bg-white border border-blue-100 shadow-sm w-10 h-10 rounded-xl">
                                <span className="text-lg font-black text-blue-600 leading-none">{it.cantidad}</span>
                            </div>
                            <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{it.nombre}</span>
                        </div>
                        <span className="text-[11px] font-black text-slate-800">Q{(it.cantidad * it.precio).toFixed(2)}</span>
                    </div>
                ))}
            </div>

            {/* RESUMEN DE CUENTA */}
            <div className="flex justify-between items-center px-5 py-3 mb-6 bg-blue-50/30 rounded-2xl border border-dashed border-blue-100">
                <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Total</p>
                    <p className="text-sm font-black text-slate-800">Q{total.toFixed(2)}</p>
                </div>
                {p.estadoPago === 'anticipo' && (
                    <>
                        <div className="text-center">
                            <p className="text-[8px] font-black text-orange-400 uppercase">Anticipo</p>
                            <p className="text-sm font-black text-orange-600">-Q{anticipo.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-blue-500 uppercase">Resta</p>
                            <p className="text-sm font-black text-blue-700 italic">Q{resta.toFixed(2)}</p>
                        </div>
                    </>
                )}
                {p.estadoPago === 'pendiente' && (
                    <div className="text-right">
                        <p className="text-[8px] font-black text-red-400 uppercase">Pendiente</p>
                        <p className="text-sm font-black text-red-600">Q{total.toFixed(2)}</p>
                    </div>
                )}
                {p.estadoPago === 'pagado' && (
                    <div className="text-right">
                        <p className="text-[8px] font-black text-emerald-500 uppercase">Estado</p>
                        <p className="text-sm font-black text-emerald-600">CANCELADO TOTAL</p>
                    </div>
                )}
            </div>

            {/* CONTROLES DE ESTADO */}
            <div className="flex gap-3">
                <button 
                    onClick={() => onToggleEstado(p.id, 'entregado', p.entregado)} 
                    className={`flex-[2] py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] tap-soft transition-all ${
                        p.entregado ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {p.entregado ? 'Pedido Entregado' : 'Marcar Entrega'}
                </button>
                
                {/* Botón de Billetera con la nueva lógica de pago total */}
                <button 
                    onClick={manejarPagoBilletera} 
                    className={`flex-1 rounded-2xl tap-soft border-2 transition-all flex items-center justify-center ${
                        p.pagado ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-slate-100 text-slate-300'
                    }`}
                >
                    <i className={`fa-solid ${p.pagado ? 'fa-check-double' : 'fa-wallet'} text-xs`}></i>
                </button>
            </div>
        </div>
    );
};

export default OrderCard;