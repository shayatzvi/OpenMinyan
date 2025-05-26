// Initialize Firebase
// Ensure firebaseConfig is loaded from firebase-config.js before this script
// These will be initialized globally after firebase.initializeApp
var app; // Use var for broader compatibility if not using modules
var auth;
var db;

try {
    app = firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Firebase initialization error:", error);
    // Display a user-friendly message on the page if Firebase fails to initialize
    const body = document.querySelector('body');
    if (body) {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = 'Error initializing the application. Please try again later.';
        errorDiv.style.color = 'red';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.padding = '20px';
        body.prepend(errorDiv);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.getElementById('navLinks');

    async function updateNavbar(user) {
        if (!navLinks) return; // In case a page doesn't have the navbar structure

        if (user) {
            let adminLinks = '';
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    const userData = userDoc.data();
                    if (userData.adminLevel === 1) {
                        adminLinks = '<li><a href="admin-level1.html">Admin L1</a></li>';
                    } else if (userData.adminLevel === 2) {
                        adminLinks = '<li><a href="admin-level2.html">Admin L2</a></li>';
                    }
                    // Store admin level in session/local storage for quicker checks on admin pages
                    sessionStorage.setItem('minyanUserAdminLevel', userData.adminLevel || '0');
                } else {
                    sessionStorage.setItem('minyanUserAdminLevel', '0');
                }
            } catch (error) {
                console.error("Error fetching user admin level:", error);
                sessionStorage.setItem('minyanUserAdminLevel', '0');
            }

            navLinks.innerHTML = `
                <li><a href="dashboard.html">Dashboard</a></li>
                ${adminLinks}
                <li><a href="#" id="logoutLink">Logout</a></li>
            `;
            const logoutLink = document.getElementById('logoutLink');
            if (logoutLink) {
                logoutLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    auth.signOut().then(() => {
                        window.location.href = 'login.html';
                    }).catch(error => {
                        console.error('Logout error', error);
                    });
                });
            }
        } else {
            sessionStorage.removeItem('minyanUserAdminLevel');
            // No user is signed in
            navLinks.innerHTML = `
                <li><a href="index.html">Register Phone</a></li>
                <li><a href="login.html">Login</a></li>
            `;
        }
    }

    // Listen for auth state changes to update UI
    if (auth) { // Ensure auth is initialized
        auth.onAuthStateChanged(updateNavbar);
    } else {
        console.warn("Firebase auth not initialized when trying to set onAuthStateChanged listener.");
        // Fallback for navbar if auth isn't ready (e.g., show login/register)
        updateNavbar(null);
    }
});
