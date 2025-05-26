document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase app is initialized before accessing auth
    if (!firebase.apps.length) {
        console.error("Firebase app is not initialized. Ensure app.js runs first and firebaseConfig is correct.");
        return;
    }
    const auth = firebase.auth();
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorMessageDiv = document.getElementById('errorMessage');

    // Redirect if already logged in
    auth.onAuthStateChanged(user => {
        if (user) {
            window.location.href = 'dashboard.html';
        }
    });

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            errorMessageDiv.style.display = 'none';
            errorMessageDiv.textContent = '';

            const email = emailInput.value;
            const password = passwordInput.value;

            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    // Signed in
                    window.location.href = 'dashboard.html';
                })
                .catch((error) => {
                    errorMessageDiv.textContent = error.message;
                    errorMessageDiv.style.display = 'block';
                });
        });
    }
});