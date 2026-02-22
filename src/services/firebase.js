// Importamos solo lo necesario de la SDK compat (según tu código original)
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

// Configuración extraída de tu index.html original
const firebaseConfig = {
    apiKey: "AIzaSyD7iqWBCoScuHSID15itaShi7dRQuQwkEo",
    authDomain: "panaderia-marvin.firebaseapp.com",
    projectId: "panaderia-marvin",
    storageBucket: "panaderia-marvin.firebasestorage.app",
    messagingSenderId: "908203563116",
    appId: "1:908203563116:web:69995ce1866a536bf3e049"
};

// Inicialización segura: verifica si ya existe una instancia activa
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Exportamos la base de datos para usarla en App.js u otros componentes
export const db = firebase.firestore();

// Opcional: exportar el objeto firebase por si necesitas FieldValue (como el timestamp)
export const fb = firebase;
