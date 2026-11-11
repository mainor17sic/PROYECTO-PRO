
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

    // Ref para evitar que notifique todos los pedidos antiguos al cargar por primera vez
    const esCargaInicial = useRef(true);

    // 1. SOLICITAR PERMISOS DE NOTIFICACIÓN AL CARGAR LA APP
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }, []);

    // 2. FUNCIÓN PARA DISPARAR LA NOTIFICACIÓN NATIVA
    const lanzarNotificacion = (pedido) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            const cliente = pedido.cliente || "Cliente";
            const total = pedido.items 
                ? pedido.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0) 
                : 0;

            const titulo = `🥐 ¡Nuevo Pedido #${pedido.correlativo || ''}!`;
            const opciones = {
                body: `Cliente: ${cliente}\nTotal: Q${total.toFixed(2)}`,
                icon: '/favicon.ico',
                vibrate: [200, 100, 200],
                tag: `pedido-${pedido.correlativo || Date.now()}`
            };

            new Notification(titulo, opciones);
        }
    };

    // 3. SUSCRIPCIÓN EN TIEMPO REAL A FIRESTORE + DETECCIÓN DE NUEVOS PEDIDOS
    useEffect(() => {
        const unsubscribe = db.collection("pedidos")
            .orderBy("timestamp", "desc")
            .onSnapshot(snap => {
                const nuevosPedidos = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Detectar si hubo una nueva inserción en tiempo real
                snap.docChanges().forEach(change => {
                    if (change.type === "added" && !esCargaInicial.current) {
                        const nuevoPedido = change.doc.data();
                        lanzarNotificacion(nuevoPedido);
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
        <div className="max-w-md mx-auto min-h-screen pb-32">
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

