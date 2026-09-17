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

    // ============================================
    // Suscripción a Firestore en tiempo real
    // ============================================
    useEffect(() => {
        const unsubscribe = db.collection("pedidos")
            .orderBy("timestamp", "desc")
            .onSnapshot(snap => {
                setPedidos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
        return () => unsubscribe();
    }, []);

    // ============================================
    // 🔔 Notificaciones Push con Median + FCM
    // ============================================
    useEffect(() => {
        const configurarNotificaciones = () => {
            // 1. Verificar que el bridge de Median exista (usando window.median)
            if (typeof window.median === "undefined") {
                console.warn("⚠️ window.median no está definido. ¿Estás en el navegador o en la app nativa?");
                return;
            }
            if (!window.median.firebaseMessaging) {
                console.warn("⚠️ window.median.firebaseMessaging no existe. El plugin FCM no está activado en Median.");
                return;
            }

            console.log("✅ Bridge de Median detectado. Configurando notificaciones...");

            // 2. Escuchar taps en notificaciones (deep link)
            if (window.median.firebaseMessaging.onNotificationTap) {
                window.median.firebaseMessaging.onNotificationTap((payload) => {
                    console.log("🔔 Notificación tocada:", payload);
                    const pedidoId = payload && payload.data ? payload.data.pedidoId : null;
                    if (pedidoId) {
                        setView("agenda");
                    }
                });
            }

            // 3. Pedir permiso y suscribir al tema
            window.median.firebaseMessaging.requestPermission({
                callback: function (result) {
                    console.log("Permiso solicitado:", result);

                    if (result && result.granted) {
                        console.log("✅ Permiso concedido");

                        // 3a. Obtener token (para diagnóstico / Plan B)
                        window.median.firebaseMessaging.getToken({
                            callback: function (tokenResult) {
                                if (tokenResult && tokenResult.token) {
                                    console.log("📱 Token FCM:", tokenResult.token);
                                } else {
                                    console.warn("⚠️ No se pudo obtener token:", tokenResult);
                                }
                            }
                        });

                        // 3b. Suscribir al tema "nuevos-pedidos"
                        window.median.firebaseMessaging.subscribeToTopic({
                            topic: "nuevos-pedidos", // 👈 IMPORTANTE: Este nombre debe coincidir con tu Cloud Function
                            callback: function (subResult) {
                                console.log("Resultado subscribeToTopic:", subResult);

                                if (subResult && subResult.success) {
                                    console.log("🎉 ¡Suscrito al tema nuevos-pedidos! Recibirá notificaciones masivas.");
                                } else {
                                    console.error("❌ Error al suscribir:", subResult);
                                }
                            }
                        });

                        // 3c. Verificar temas suscritos (diagnóstico)
                        if (window.median.firebaseMessaging.getSubscribedTopics) {
                            window.median.firebaseMessaging.getSubscribedTopics({
                                callback: function (topicsResult) {
                                    console.log("📋 Temas suscritos actualmente:", topicsResult);
                                }
                            });
                        }
                    } else {
                        console.warn("⚠️ Permiso de notificaciones denegado:", result);
                    }
                }
            });
        };

        configurarNotificaciones();
    }, []);

    // ============================================
    // Cambiar estado de pedidos (Pagado / Entregado)
    // ============================================
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