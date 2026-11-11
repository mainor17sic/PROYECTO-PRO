import React, { useState, useEffect, useRef } from 'react';
import { db } from './services/firebase';
import { generarRecibo } from './services/pdfService';
import './App.css';
import Navbar from './components/Navbar';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import Summary from './components/Summary';
import SearchFab from './components/SearchFab';

const PRODUCTOS_MENU = [
    { nombre: "Pirujitos 🥖", precio: 1 },
    { nombre: "Pirujos Grande 🥖", precio: 1 },
    { nombre: "Pastelitos 🥯", precio: 2 },
    { nombre: "Dulce 🥐", precio: 1 },
    { nombre: "Torta 🍪", precio: 10 },
    { nombre: "Lagarto 🐊", precio: 15 }
];

function App() {
    const [pedidos, setPedidos] = useState([]);
    const [view, setView] = useState("crear");
    const [searchTerm, setSearchTerm] = useState("");
    const [showSearchBox, setShowSearchBox] = useState(false);

    // Estado para la alerta visual interna (In-App Banner)
    const [alertaPedido, setAlertaPedido] = useState(null);

    // Ref para evitar que suene con pedidos antiguos al abrir la app
    const esCargaInicial = useRef(true);

    // 1. GENERADOR DE TIMBRE SONORO NATIVO (SIN ARCHIVOS EXTERNOS)
    const reproducirTimbre = () => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();

            // Primer tono (campana aguda)
            const osc1 = ctx.createOscillator();
            const gain1 = ctx.createGain();
            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(880, ctx.currentTime); // Nota A5
            gain1.gain.setValueAtTime(0.3, ctx.currentTime);
            gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc1.connect(gain1);
            gain1.connect(ctx.destination);
            osc1.start();
            osc1.stop(ctx.currentTime + 0.4);

            // Segundo tono (más agudo, 150ms después)
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.15); // Nota D6
            gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.15);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.start(ctx.currentTime + 0.15);
            osc2.stop(ctx.currentTime + 0.65);
        } catch (e) {
            console.warn("El navegador requiere un toque previo en pantalla para habilitar el audio:", e);
        }
    };

    // 2. FUNCIÓN PARA DISPARAR ALERTA VISUAL + SONIDO + VIBRACIÓN
    const lanzarAlertaInterna = (pedido) => {
        const cliente = pedido.cliente || "Cliente";
        const total = pedido.items 
            ? pedido.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0) 
            : 0;

        // Activar el banner visual en pantalla
        setAlertaPedido({
            correlativo: pedido.correlativo || '',
            cliente,
            total: total.toFixed(2)
        });

        // Vibrar teléfono (si el dispositivo lo soporta)
        if ('vibrate' in navigator) {
            navigator.vibrate([300, 150, 300]);
        }

        // Reproducir timbre doble
        reproducirTimbre();

        // Ocultar automáticamente el banner después de 8 segundos
        setTimeout(() => {
            setAlertaPedido(prev => (prev?.cliente === cliente ? null : prev));
        }, 8000);
    };

    // 3. SUSCRIPCIÓN EN TIEMPO REAL A FIRESTORE
    useEffect(() => {
        const unsubscribe = db.collection("pedidos")
            .orderBy("timestamp", "desc")
            .onSnapshot(snap => {
                const nuevosPedidos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                snap.docChanges().forEach(change => {
                    if (change.type === "added" && !esCargaInicial.current) {
                        const nuevoPedido = change.doc.data();
                        lanzarAlertaInterna(nuevoPedido);
                    }
                });

                setPedidos(nuevosPedidos);
                esCargaInicial.current = false;
            });

        return () => unsubscribe();
    }, []);

    // 4. FUNCIÓN GLOBAL PARA CAMBIAR ESTADOS (PAGADO/ENTREGADO)
    const toggleEstado = (id, campo, valor) => {
        const pass = prompt("PIN:");
        if (pass === "00") {
            const nuevoValor = !valor;
            db.collection("pedidos").doc(id).update({ [campo]: nuevoValor });

            if (campo === 'entregado' && nuevoValor === true) {
                window.confetti({
                    particleCount: 150,
                    origin: { x: 0.5, y: 0.8 }
                });
            }
        }
    };

    return (
        <div className="max-w-md mx-auto min-h-screen pb-32 relative">
            
            {/* BANNER FLOTANTE DE NUEVO PEDIDO (IN-APP NOTIFICATION) */}
            {alertaPedido && (
                <div 
                    onClick={() => {
                        setView('agenda');
                        setAlertaPedido(null);
                    }}
                    className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-11/12 max-w-sm bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-2xl border-2 border-blue-300 flex items-center justify-between cursor-pointer animate-bounce"
                >
                    <div className="flex items-center space-x-3">
                        <span className="text-2xl">🥐</span>
                        <div>
                            <p className="font-bold text-sm uppercase tracking-wide">
                                ¡Nuevo Pedido #{alertaPedido.correlativo}!
                            </p>
                            <p className="text-xs text-blue-100">
                                {alertaPedido.cliente} • <strong>Q{alertaPedido.total}</strong>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setAlertaPedido(null);
                        }}
                        className="text-white font-bold text-lg px-2 hover:text-blue-200"
                    >
                        ✕
                    </button>
                </div>
            )}

            <Navbar view={view} setView={setView} />

            <div className="pt-24 px-4 view-transition">
                {view === 'crear' && (
                    <OrderForm 
                        productos={PRODUCTOS_MENU} 
                        onSuccess={() => setView('agenda')} 
                    />
                )}

                {(view === 'agenda' || view === 'entregas') && (
                    <OrderList 
                        pedidos={pedidos} 
                        view={view} 
                        searchTerm={searchTerm}
                        onToggleEstado={toggleEstado}
                        onPrint={generarRecibo}
                    />
                )}

                {view === 'resumen' && (
                    <Summary pedidos={pedidos} />
                )}
            </div>

            <SearchFab 
                view={view} 
                showSearchBox={showSearchBox} 
                setShowSearchBox={setShowSearchBox} 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
            />
        </div>
    );
}

export default App;
