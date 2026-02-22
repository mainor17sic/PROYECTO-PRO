import React, { useState } from 'react';
import { db, fb } from '../services/firebase';

const OrderForm = ({ productos, onSuccess }) => {
    const [cliente, setCliente] = useState("");
    const [nota, setNota] = useState("");
    const [itemsForm, setItemsForm] = useState(
        productos.map(p => ({ ...p, cantidad: 0 }))
    );

    const crearPedido = async () => {
        const items = itemsForm.filter(it => it.cantidad > 0);
        if (!cliente || items.length === 0) return alert("Faltan datos: Cliente o Productos");

        try {
            // Manejo del correlativo (Contador)
            const counterRef = db.collection("config").doc("counter");
            const docCounter = await counterRef.get();
            let nextCorrelativo = 1;
            
            if (docCounter.exists) {
                nextCorrelativo = docCounter.data().last + 1;
            }
            
            await db.collection("pedidos").add({
                correlativo: nextCorrelativo,
                cliente, 
                nota, 
                items,
                fecha: new Date().toLocaleString([], {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}),
                timestamp: fb.firestore.FieldValue.serverTimestamp(),
                entregado: false, 
                pagado: false 
            });

            await counterRef.set({ last: nextCorrelativo });

            // Efecto visual de éxito
            window.confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#2563eb', '#fbbf24', '#10b981']
            });

            // Limpiar formulario y avisar al App.js para cambiar de vista
            setCliente(""); 
            setNota("");
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
                
                <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="h-[1px] w-8 bg-slate-200"></span>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">
                        Registros de pedidos
                    </p>
                    <span className="h-[1px] w-8 bg-slate-200"></span>
                </div>
            </div>

            <div className="space-y-3">
                <input 
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-100 transition-all" 
                    placeholder="Nombre del Cliente" 
                    value={cliente} 
                    onChange={e => setCliente(e.target.value)} 
                />
                
                <textarea 
                    className="w-full p-4 bg-slate-50 rounded-2xl text-sm font-medium outline-none h-16 resize-none border-2 border-transparent focus:border-blue-100 transition-all" 
                    placeholder="NOTA (Opcional)..." 
                    value={nota} 
                    onChange={e => setNota(e.target.value)} 
                />
                
                <div className="space-y-2 mb-8 mt-4">
                    {itemsForm.map((it, idx) => (
                        <div key={it.nombre} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                            <span className="font-bold text-slate-600 text-xs uppercase">{it.nombre}</span>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    className="w-12 bg-white rounded-xl py-2 text-center font-black text-blue-600 shadow-sm border-none focus:ring-2 focus:ring-blue-100" 
                                    value={it.cantidad} 
                                    onChange={e => handleCantidadChange(idx, e.target.value)} 
                                />
                                <span className="text-[10px] font-black text-slate-300">Q{it.precio}</span>
                            </div>
                        </div>
                    ))}
                </div>

                <button 
                    onClick={crearPedido} 
                    className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest tap-soft shadow-xl active:scale-95 transition-transform"
                >
                    Generar Orden
                </button>
            </div>
        </div>
    );
};

export default OrderForm;
