import React, { useState, useEffect } from 'react';
import OneSignal from 'react-onesignal'; // 👈 1. Importamos OneSignal
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

    // Suscripción a Firebase en tiempo real
    useEffect(() => {
        const unsubscribe = db.collection("pedidos")
            .orderBy("timestamp", "desc")
            .onSnapshot(snap => {
                setPedidos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        return () => unsubscribe();
    }, []);

    // --- 🔔 2. IMPLEMENTO DE ONESIGNAL ---
    useEffect(() => {
        const initOneSignal = async () => {
            try {
                await OneSignal.init({
                    appId: "50e07737-1afa-4a02-b08a-244065c9a69e",
                    allowLocalhostAsSecureOrigin: true, // Para pruebas
                });
                
                // Pedir permiso al usuario para enviar notificaciones
                await OneSignal.Notifications.requestPermission();
                console.log("OneSignal inicializado correctamente");
            } catch (error) {
                console.error("Error al inicializar OneSignal:", error);
            }
        };
        initOneSignal();
    }, []);

    // Función global para cambiar estados (Pagado/Entregado)
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