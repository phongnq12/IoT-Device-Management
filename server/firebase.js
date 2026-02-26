// firebase.js for Server
const { initializeApp } = require("firebase/app");
const { getDatabase } = require("firebase/database");

const firebaseConfig = {
    apiKey: "AIzaSyCxH47cYXVDjTVKxtSMX8rZ5NCXKi6PMto",
    authDomain: "iot-device-management-14216.firebaseapp.com",
    databaseURL: "https://iot-device-management-14216-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "iot-device-management-14216",
    storageBucket: "iot-device-management-14216.firebasestorage.app",
    messagingSenderId: "734639350129",
    appId: "1:734639350129:web:45a34a5458be7a3c95d6d0",
    measurementId: "G-QRVTKRJM8M"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

module.exports = { db };
