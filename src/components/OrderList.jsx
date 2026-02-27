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

    // Función para marcar un solo producto como entregado
    const toggleProductoEntregado = (index) => {
        const nuevosItems = [...p.items];
        nuevosItems[index].entregadoIndividual = !nuevosItems[index].entregadoIndividual;
        
        db.collection("pedidos").doc(p.id).update({
            items: nuevosItems
        });
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

                    <p className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest flex items-center gap-1">
                        <i className="fa-regular fa-clock text-[9px]"></i> {p.fecha || p.fechaRegistro}
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

            {/* LISTA DE PRODUCTOS CON CONTROL INDIVIDUAL */}
            <div className="space-y-3 mb-4 bg-slate-50/80 p-5 rounded-[2rem] border border-slate-100">
                <div className="flex justify-between items-center mb-2 px-1">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Control de despacho</p>
                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md italic">
                        {entregadosCount} de {totalProductos} listos
                    </span>
                </div>

                {p.items.map((it, i) => (
                    <div key={i} className={`flex justify-between items-center p-2 rounded-2xl transition-all ${it.entregadoIndividual ? 'bg-emerald-50/50' : 'bg-white shadow-sm'}`}>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => toggleProductoEntregado(i)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                                    it.entregadoIndividual 
                                    ? 'bg-emerald-500 border-emerald-500 text-white' 
                                    : 'border-slate-100 text-transparent bg-white'
                                }`}
                            >
                                <i className="fa-solid fa-check text-[10px]"></i>
                            </button>

                            <div className="flex flex-col">
                                <span className={`text-[11px] font-black uppercase tracking-tight leading-none ${it.entregadoIndividual ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                    <span className="text-blue-600 mr-1">{it.cantidad}x</span> {it.nombre}
                                </span>
                                <span className="text-[8px] font-bold text-slate-300">Q{(it.cantidad * it.precio).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* RESUMEN FINANCIERO */}
            <div className="flex justify-between items-center px-6 py-4 mb-6 bg-slate-900 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                {/* Decoración de fondo */}
                <div className="absolute top-0 right-0 w-20 h-full bg-white/5 skew-x-12 translate-x-10"></div>
                
                <div className="relative">
                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Total</p>
                    <p className="text-lg font-black leading-none">Q{total.toFixed(2)}</p>
                </div>

                {p.estadoPago === 'anticipo' && (
                    <div className="text-center relative">
                        <p className="text-[8px] font-black text-orange-400 uppercase leading-none mb-1">Abonó</p>
                        <p className="text-lg font-black leading-none text-orange-200">Q{anticipo.toFixed(2)}</p>
                    </div>
                )}

                <div className="text-right relative">
                    <p className="text-[8px] font-black text-blue-400 uppercase leading-none mb-1">
                        {p.estadoPago === 'pagado' ? 'Saldo' : 'Falta cobrar'}
                    </p>
                    <p className={`text-lg font-black leading-none ${p.estadoPago === 'pagado' ? 'text-emerald-400' : 'text-blue-200'}`}>
                        Q{resta.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* CONTROLES DE ESTADO GENERAL */}
            <div className="flex gap-3">
                <button 
                    onClick={() => onToggleEstado(p.id, 'entregado', p.entregado)} 
                    className={`flex-[2] py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] tap-soft transition-all ${
                        p.entregado ? 'bg-emerald-500 text-white shadow-md shadow-emerald-100' : 'bg-slate-100 text-slate-400'
                    }`}
                >
                    {p.entregado ? 'Pedido Entregado ✓' : 'Marcar Entrega Total'}
                </button>
                <button 
                    onClick={() => onToggleEstado(p.id, 'pagado', p.pagado)} 
                    className={`flex-1 rounded-2xl tap-soft border-2 transition-all flex items-center justify-center ${
                        p.pagado ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-300'
                    }`}
                >
                    <i className={`fa-solid ${p.pagado ? 'fa-check-double' : 'fa-wallet'} text-xs`}></i>
                </button>
            </div>
        </div>
    );
};

const OrderList = ({ pedidos, view, searchTerm, onToggleEstado, onPrint }) => {
    const pedidosFiltrados = pedidos
        .filter(p => view === 'agenda' ? !p.entregado : p.entregado)
        .filter(p => p.cliente.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-4 px-2">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-serif italic text-slate-800 tracking-tight leading-none">
                        {view === 'agenda' ? 'Pedidos en Curso' : 'Entregas Realizadas'}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">
                        {pedidosFiltrados.length} pedidos encontrados
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest mb-1">
                        {view === 'agenda' ? 'Producción' : 'Archivo'}
                    </span>
                </div>
            </div>

            {pedidosFiltrados.length > 0 ? (
                pedidosFiltrados.map(p => (
                    <OrderCard 
                        key={p.id} 
                        p={p} 
                        onToggleEstado={onToggleEstado} 
                        onPrint={onPrint} 
                    />
                ))
            ) : (
                <div className="text-center py-24">
                    <div className="text-4xl mb-4 opacity-20">🥖</div>
                    <p className="opacity-30 italic text-slate-500 text-sm font-medium">
                        No hay registros en esta sección
                    </p>
                </div>
            )}
        </div>
    );
};

export default OrderList;