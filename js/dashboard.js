document.addEventListener('DOMContentLoaded', () => {
    // Ensure Firebase app is initialized before accessing auth/db
    if (!firebase.apps.length) {
        console.error("Firebase app is not initialized. Ensure app.js runs first and firebaseConfig is correct.");
        // Potentially redirect to login or show an error if Firebase isn't ready
        document.body.innerHTML = '<div class="container"><div class="alert alert-danger">Application Error: Firebase not initialized. Please try again later or contact support.</div></div>';
        return;
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    const loadingMessage = document.getElementById('loadingMessage');
    const userInfoDiv = document.getElementById('userInfo');
    const userEmailSpan = document.getElementById('userEmail');
    const userPhoneNumberSpan = document.getElementById('userPhoneNumber');
    const currentCallPreferenceP = document.getElementById('currentCallPreference');
    const currentStateP = document.getElementById('currentState');
    const updateProfileForm = document.getElementById('updateProfileForm');
    const callPreferenceRadios = document.getElementsByName('callPreference');
    const stateSelect = document.getElementById('state');
    const updateStatusMessage = document.getElementById('updateStatusMessage');
    const errorMessageDiv = document.getElementById('errorMessage');

    auth.onAuthStateChanged(user => {
        if (user) {
            loadingMessage.style.display = 'block';
            userInfoDiv.style.display = 'none';
            errorMessageDiv.style.display = 'none';

            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();
                        userEmailSpan.textContent = userData.email;
                        userPhoneNumberSpan.textContent = userData.phoneNumber || 'Not provided';
                        currentCallPreferenceP.textContent = userData.callPreference === 'doNotCall' ? 'Do Not Call List' : 'On Call List';
                        currentStateP.textContent = userData.state || 'Not set';

                        // Pre-select current preference if updating
                        callPreferenceRadios.forEach(radio => {
                            if (radio.value === userData.callPreference) {
                                // radio.checked = true; // Don't pre-check, let user make a new selection
                            }
                        });
                        // stateSelect.value = userData.state; // Don't pre-select, let user make a new selection

                        loadingMessage.style.display = 'none';
                        userInfoDiv.style.display = 'block';
                    } else {
                        console.error("No such document for user!");
                        errorMessageDiv.textContent = "Could not find your user data. Please contact support.";
                        errorMessageDiv.style.display = 'block';
                        loadingMessage.style.display = 'none';
                    }
                })
                .catch(error => {
                    console.error("Error getting user document:", error);
                    errorMessageDiv.textContent = "Error fetching your data: " + error.message;
                    errorMessageDiv.style.display = 'block';
                    loadingMessage.style.display = 'none';
                });
        } else {
            // No user is signed in.
            window.location.href = 'login.html';
        }
    });

    if (updateProfileForm) {
        updateProfileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateStatusMessage.textContent = '';
            updateStatusMessage.className = ''; // Reset classes

            const user = auth.currentUser;
            if (user) {
                const selectedCallPreference = document.querySelector('input[name="callPreference"]:checked');
                const selectedState = stateSelect.value;

                const dataToUpdate = {};
                if (selectedCallPreference) {
                    dataToUpdate.callPreference = selectedCallPreference.value;
                }
                if (selectedState) {
                    dataToUpdate.state = selectedState;
                }

                if (Object.keys(dataToUpdate).length === 0) {
                    updateStatusMessage.textContent = 'Please select an option to update.';
                    updateStatusMessage.className = 'alert alert-warning';
                    return;
                }

                db.collection('users').doc(user.uid).update(dataToUpdate)
                    .then(() => {
                        updateStatusMessage.textContent = 'Profile updated successfully!';
                        updateStatusMessage.className = 'alert alert-success';
                        // Refresh displayed data
                        if (dataToUpdate.callPreference) currentCallPreferenceP.textContent = dataToUpdate.callPreference === 'doNotCall' ? 'Do Not Call List' : 'On Call List';
                        if (dataToUpdate.state) currentStateP.textContent = dataToUpdate.state;
                        updateProfileForm.reset(); // Clear selections
                    })
                    .catch(error => {
                        console.error("Error updating profile: ", error);
                        updateStatusMessage.textContent = 'Error updating profile: ' + error.message;
                        updateStatusMessage.className = 'alert alert-danger';
                    });
            }
        });
    }
});