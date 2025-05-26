document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase app is initialized before accessing auth
    if (!firebase.apps.length) {
        console.error("Firebase app is not initialized on home page.");
        // Potentially show an error to the user
        return;
    }
    const auth = firebase.auth();
    const phoneForm = document.getElementById('phoneForm');
    const phoneNumberInput = document.getElementById('phoneNumber');
    const errorMessageDiv = document.getElementById('errorMessage');

    // If user is already logged in, maybe redirect to dashboard?
    // auth.onAuthStateChanged(user => {
    //     if (user) window.location.href = 'dashboard.html';
    // });

    if (phoneForm) {
        phoneForm.addEventListener('submit', function(event) {
            event.preventDefault();
            errorMessageDiv.style.display = 'none';
            errorMessageDiv.textContent = '';

            const phoneNumber = phoneNumberInput.value.trim();

            // Basic phone number validation (you might want a more robust one)
            if (!phoneNumber || !/^\+?([0-9]{1,3})?[-. (]?([0-9]{3})[-. )]?([0-9]{3})[-. ]?([0-9]{4})$/.test(phoneNumber)) {
                errorMessageDiv.textContent = 'Please enter a valid phone number (e.g., 555-123-4567 or +15551234567).';
                errorMessageDiv.style.display = 'block';
                return;
            }

            // Store phone number in localStorage to pass to the next page
            localStorage.setItem('minyanPhoneNumber', phoneNumber);

            // Redirect to registration page
            window.location.href = 'register.html';
        });
    }
});
