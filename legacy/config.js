// js/config.js
window.APP_CONFIG = {
    FIREBASE: {
        apiKey: "AIzaSyAuryeEz2QmtfnbokrSvGWwPIWCMqXxti8",
        authDomain: "ask-sitem.firebaseapp.com",
        projectId: "ask-sitem",
        storageBucket: "ask-sitem.firebasestorage.app",
        messagingSenderId: "1093033362074",
        appId: "1:1093033362074:web:ac33672c8221225e0a9523",
        measurementId: "G-N0MY21Y05K"
    },
    // En güncel ve stabil çalışan Gemini API Key
    GEMINI_KEY: "AIzaSyAu4yCFxNYqEea1twMocJy4U5xTHUQMDaU",
    GEMINI_MODEL: "gemini-1.5-flash", // Hızlı ve ücretsiz kota dostu model
    START_DATE: new Date(2025, 9, 15) // İlişki Başlangıç Tarihi: 15 Ekim 2025 (JS'de aylar 0-indexed olduğundan 9 = Ekim)
};
