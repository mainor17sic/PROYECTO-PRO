import React, { useState, useMemo } from 'react';
import { db, fb } from '../services/firebase';

const OrderForm = ({ productos, onSuccess }) => {
    const [cliente, setCliente] = useState("");
    const [nota, setNota] = useState("");
    const [metodoPago, setMetodoPago] = useState("pendiente"); // 'pendiente', 'anticipo', 'pagado'
    const [montoAnticipo, setMontoAnticipo] = useState("");
    const [itemsForm, setItemsForm] = useState(
        productos.map(p => ({ ...p, cantidad: 0 }))
    );

    // Cálculo del total para saber cuánto resta si hay anticipo
    const totalCuenta = useMemo(() => {
        return itemsForm.reduce((acc, it) => acc + (it.cantidad * it.precio), 0);
    }, [itemsForm]);

    const crearPedido = async () => {
        const items = itemsForm.filter(it => it.cantidad > 0);
        if (!cliente || items.length === 0) return alert("Faltan datos: Cliente o Productos");
        if (metodoPago === 'anticipo' && !montoAnticipo) return alert("Por favor ingresa el monto del anticipo");

        try {
            const counterRef = db.collection("config").doc("counter");
            const docCounter = await counterRef.get();
            let nextCorrelativo = 1;

            if (docCounter.exists) {
                nextCorrelativo = (Number(docCounter.data().last) || 0) + 1;
            }

            // Datos que se enviarán a Firebase
            await db.collection("pedidos").add({
                correlativo: nextCorrelativo,
                cliente: cliente.trim(), 
                nota: nota.trim(), 
                items,
                total: totalCuenta,
                estadoPago: metodoPago,
                anticipoValor: metodoPago === 'anticipo' ? Number(montoAnticipo) : 0,
                pagado: metodoPago === 'pagado',
                fecha: new Date().toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}),
                timestamp: fb.firestore.FieldValue.serverTimestamp(),
                entregado: false, 
            });

            await counterRef.set({ last: nextCorrelativo });

            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#2563eb', '#fbbf24', '#10b981']
            });

            // Limpiar estados
            setCliente(""); 
            setNota("");
            setMetodoPago("pendiente");
            setMontoAnticipo("");
            onSuccess(); 

        } catch (error) {
            console.error("Error al crear pedido:", error);
            alert("Error al conectar con la base de datos.");
        }
    };

    const handleCantidadChange = (index, valor) => {
        const nuevosItems = [...itemsForm];
        nuevosItems[index].cantidad = parseInt(valor) || 0;
        setItemsForm(nuevosItems);
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 view-transition">
            <div className="text-center mb-10 relative">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-amber-50 rounded-full mb-4">
                    <span className="text-2xl">🥐</span>
                </div>
                <h1 className="text-3xl font-serif italic text-slate-800 tracking-tight leading-none">
                    REGISTRO <span className="font-sans font-black not-italic text-blue-600">PANADERIA</span>
                </h1>
            </div>

            <div className="space-y-4">
                <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-100 transition-all" 
                    placeholder="Nombre del Cliente" 
                    value={cliente} 
                    onChange={e => setCliente(e.target.value)} 
                />

                {/* --- NUEVO: SELECTOR DE PAGO --- */}
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { id: 'pendiente', label: 'Deuda' },
                        { id: 'anticipo', label: 'Anticipo' },
                        { id: 'pagado', label: 'Pagado' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            type="button"
                            onClick={() => setMetodoPago(t.id)}
                            className={`py-3 rounded-xl text-[10px] font-black uppercase transition-all ${metodoPago === t.id ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {metodoPago === 'anticipo' && (
                    <input 
                        type="number"
                        className="w-full p-4 bg-blue-50 rounded-2xl text-blue-700 font-black outline-none border-2 border-blue-200 animate-pulse"
                        placeholder="Monto del anticipo Q"
                        value={montoAnticipo}
                        onChange={e => setMontoAnticipo(e.target.value)}
                    />
                )}
                {/* ----------------------------- */}

                <textarea 
                    className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium outline-none h-16 resize-none border-2 border-transparent focus:border-blue-100 transition-all" 
                    placeholder="NOTA (Opcional)..." 
                    value={nota} 
                    onChange={e => setNota(e.target.value)} 
                />

                <div className="space-y-2 mb-4 mt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase ml-2">Productos</p>
                    {itemsForm.map((it, idx) => (
                        <div key={it.nombre} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <span className="font-bold text-slate-600 text-xs uppercase">{it.nombre}</span>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    className="w-12 bg-white rounded-xl py-2 text-center font-black text-blue-600 shadow-sm border-none focus:ring-2 focus:ring-blue-100" 
                                    value={it.cantidad === 0 ? "" : it.cantidad} 
                                    onChange={e => handleCantidadChange(idx, e.target.value)} 
                                />
                                <span className="text-[10px] font-black text-slate-300">Q{it.precio}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RESUMEN DE TOTALES */}
                <div className="bg-slate-900 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase">Total Orden</p>
                        <p className="text-2xl font-black">Q{totalCuenta.toFixed(2)}</p>
                    </div>
                    {metodoPago === 'anticipo' && (
                        <div className="text-right">
                            <p className="text-[9px] font-black text-blue-400 uppercase">Resta Cobrar</p>
                            <p className="text-lg font-bold">Q{(totalCuenta - Number(montoAnticipo)).toFixed(2)}</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={crearPedido} 
                    disabled={totalCuenta === 0}
                    className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest tap-soft shadow-xl transition-all ${totalCuenta === 0 ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white active:scale-95'}`}
                >
                    Generar Orden
                </button>
            </div>
        </div>
    );
};

export default OrderForm;