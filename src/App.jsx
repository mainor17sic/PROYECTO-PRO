import React, { useState, useEffect } from 'react';
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

    // 🔔 Suscripción automática a notificaciones push
    useEffect(() => {
        const configurarNotificaciones = async () => {
            // Esperar a que el bridge de Median esté disponible
            if (typeof Median === "undefined" || !Median.firebaseMessaging) {
                console.warn("Median bridge no disponible (¿estás en la app nativa?)");
                return;
            }

            try {
                // 1. Verificar estado del permiso
                const permiso = await Median.firebaseMessaging.getPermissionStatus();
                console.log("Permiso actual:", permiso);

                // 2. Pedir permiso si no está concedido
                if (permiso !== "granted") {
                    const nuevoPermiso = await Median.firebaseMessaging.requestPermission();
                    if (nuevoPermiso !== "granted") {
                        console.log("Usuario denegó las notificaciones");
                        return;
                    }
                }

                // 3. Suscribir al tema de nuevos pedidos
                await Median.firebaseMessaging.subscribeToTopic("nuevos-pedidos");
                console.log("✅ Suscrito al tema: nuevos-pedidos");

                // 4. Escuchar cuando el usuario toca una notificación
                Median.firebaseMessaging.onNotificationTap((payload) => {
                    console.log("🔔 Notificación tocada:", payload);
                    const pedidoId = payload?.data?.pedidoId;
                    if (pedidoId) {
                        setView("agenda");
                    }
                });

            } catch (error) {
                console.error("❌ Error configurando notificaciones:", error);
            }
        };

        configurarNotificaciones();
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