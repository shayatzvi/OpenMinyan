document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase app is initialized before accessing auth/db
    if (!firebase.apps.length) {
        console.error("Firebase app is not initialized on register page.");
        // Potentially show an error to the user
        return;
    }
    const auth = firebase.auth(); // Defined in app.js, but good to have a local const
    const db = firebase.firestore(); // Defined in app.js
    const registrationForm = document.getElementById('registrationForm');
    const displayPhoneNumber = document.getElementById('displayPhoneNumber');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const stateSelect = document.getElementById('state');
    const errorMessageDiv = document.getElementById('errorMessage');
    const successMessageDiv = document.getElementById('successMessage');

    // Retrieve and display phone number from localStorage
    const phoneNumber = localStorage.getItem('minyanPhoneNumber');
    if (phoneNumber && displayPhoneNumber) {
        displayPhoneNumber.textContent = phoneNumber;
    } else if (displayPhoneNumber) {
        errorMessageDiv.textContent = 'Phone number not found. Please start over from the home page.';
        errorMessageDiv.style.display = 'block';
        if (registrationForm) registrationForm.style.display = 'none'; // Hide form if no phone number
        if (displayPhoneNumber) displayPhoneNumber.textContent = 'Error: Phone number missing.';
        return; // Stop further execution
    }

    if (registrationForm) {
        registrationForm.addEventListener('submit', async function(event) {
            event.preventDefault();
            errorMessageDiv.style.display = 'none';
            errorMessageDiv.textContent = '';
            successMessageDiv.style.display = 'none';
            successMessageDiv.textContent = '';

            const email = emailInput.value.trim();
            const password = passwordInput.value;
            const callPreference = document.querySelector('input[name="callPreference"]:checked').value;
            const selectedState = stateSelect.value;

            if (!email || !password || !selectedState) {
                errorMessageDiv.textContent = 'Please fill in all required fields.';
                errorMessageDiv.style.display = 'block';
                return;
            }

            if (password.length < 6) {
                errorMessageDiv.textContent = 'Password must be at least 6 characters long.';
                errorMessageDiv.style.display = 'block';
                return;
            }

            if (!phoneNumber) {
                errorMessageDiv.textContent = 'Phone number is missing. Please go back to the home page and enter your phone number.';
                errorMessageDiv.style.display = 'block';
                return;
            }

            try {
                // 1. Create user with email and password
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                console.log('User created:', user.uid);

                // 2. Save user data to Firestore
                // Use a collection named 'users' and user.uid as the document ID
                await db.collection('users').doc(user.uid).set({
                    userId: user.uid,
                    email: email,
                    phoneNumber: phoneNumber, // From localStorage
                    callPreference: callPreference,
                    state: selectedState,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Optional: timestamp
                });

                console.log('User data saved to Firestore.');

                // Clear the stored phone number from localStorage as it's no longer needed
                localStorage.removeItem('minyanPhoneNumber');

                successMessageDiv.textContent = 'Account created successfully! You are now logged in. Redirecting to your dashboard...';
                successMessageDiv.style.display = 'block';
                registrationForm.reset(); // Clear the form
                if(displayPhoneNumber) displayPhoneNumber.textContent = 'Registration complete.';

                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);

            } catch (error) {
                console.error('Registration error:', error);
                if (error.code === 'auth/email-already-in-use') {
                    errorMessageDiv.textContent = 'This email address is already in use. Please use a different email.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessageDiv.textContent = 'The password is too weak. Please choose a stronger password.';
                } else {
                    errorMessageDiv.textContent = `Error: ${error.message}`;
                }
                errorMessageDiv.style.display = 'block';
            }
        });
    }
});
