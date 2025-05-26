document.addEventListener('DOMContentLoaded', () => {
    if (!firebase.apps.length) {
        console.error("Firebase app is not initialized.");
        document.body.innerHTML = '<div class="container"><div class="alert alert-danger">Application Error: Firebase not initialized.</div></div>';
        return;
    }
    const auth = firebase.auth();
    const db = firebase.firestore();

    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');
    const usersTable = document.getElementById('usersTable');
    const usersTableBody = document.getElementById('usersTableBody');
    const currentUserEmailSpan = document.getElementById('currentUserEmail');

    // Modal elements
    const editUserModal = $('#editUserModal'); // jQuery selector for Bootstrap modal
    const editUserIdInput = document.getElementById('editUserId');
    const editUserEmailP = document.getElementById('editUserEmail');
    const editPhoneNumberInput = document.getElementById('editPhoneNumber');
    const editCallPreferenceSelect = document.getElementById('editCallPreference');
    const editStateSelect = document.getElementById('editState');
    const editAdminLevelSelect = document.getElementById('editAdminLevel');
    const saveUserChangesButton = document.getElementById('saveUserChanges');
    const editUserErrorMessage = document.getElementById('editUserErrorMessage');

    auth.onAuthStateChanged(async user => {
        if (user) {
            if(currentUserEmailSpan) currentUserEmailSpan.textContent = `Logged in as: ${user.email}`;
            // Verify admin level client-side (primary check should be Firestore rules)
            const storedAdminLevel = sessionStorage.getItem('minyanUserAdminLevel');

            if (storedAdminLevel === '1') {
                console.log("Admin Level 1 access granted.");
                await loadUsers();
            } else {
                // Attempt to fetch from DB if not in session (e.g. direct navigation)
                try {
                    const userDoc = await db.collection('users').doc(user.uid).get();
                    if (userDoc.exists && userDoc.data().adminLevel === 1) {
                        sessionStorage.setItem('minyanUserAdminLevel', '1');
                        console.log("Admin Level 1 access granted (DB check).");
                        await loadUsers();
                    } else {
                        console.warn("Access Denied. User is not Admin Level 1.");
                        errorMessage.textContent = "Access Denied. You do not have permission to view this page.";
                        errorMessage.style.display = 'block';
                        loadingMessage.style.display = 'none';
                        if(usersTable) usersTable.style.display = 'none';
                        // setTimeout(() => window.location.href = 'dashboard.html', 3000);
                    }
                } catch (error) {
                    console.error("Error verifying admin status:", error);
                    errorMessage.textContent = "Error verifying your access level.";
                    errorMessage.style.display = 'block';
                    loadingMessage.style.display = 'none';
                }
            }
        } else {
            console.log("User not logged in. Redirecting to login.");
            window.location.href = 'login.html';
        }
    });

    async function loadUsers() {
        loadingMessage.style.display = 'block';
        usersTable.style.display = 'none';
        usersTableBody.innerHTML = ''; // Clear previous data

        try {
            const querySnapshot = await db.collection('users').get();
            if (querySnapshot.empty) {
                usersTableBody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>';
            } else {
                let userCount = 0;
                querySnapshot.forEach(doc => {
                    userCount++;
                    const userData = doc.data();
                    const row = usersTableBody.insertRow();

                    row.insertCell().textContent = userData.email || 'N/A';
                    row.insertCell().textContent = userData.phoneNumber || 'N/A';
                    row.insertCell().textContent = userData.callPreference === 'doNotCall' ? 'Do Not Call' : (userData.callPreference === 'onCall' ? 'On Call' : 'N/A');
                    row.insertCell().textContent = userData.state || 'N/A';
                    row.insertCell().textContent = userData.adminLevel ? `Level ${userData.adminLevel}` : 'User';

                    const actionsCell = row.insertCell();
                    const editButton = document.createElement('button');
                    editButton.classList.add('btn', 'btn-xs', 'btn-warning');
                    editButton.textContent = 'Edit';
                    editButton.onclick = () => editUser(doc.id, userData); 
                    actionsCell.append(editButton);

                });
                if (userCount === 0) { 
                    usersTableBody.innerHTML = '<tr><td colspan="6">No users found.</td></tr>';
                }
            }
            usersTable.style.display = 'table';
        } catch (error) {
            console.error("Error loading users:", error);
            errorMessage.textContent = "Error loading users: " + error.message;
            errorMessage.style.display = 'block';
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    function editUser(userId, userData) {
        console.log("Editing user:", userId, userData);
        editUserErrorMessage.style.display = 'none';
        editUserErrorMessage.textContent = '';

        editUserIdInput.value = userId;
        editUserEmailP.textContent = userData.email || 'N/A';
        editPhoneNumberInput.value = userData.phoneNumber || '';
        editCallPreferenceSelect.value = userData.callPreference || 'onCall';
        editStateSelect.value = userData.state || '';
        editAdminLevelSelect.value = userData.adminLevel ? String(userData.adminLevel) : '0';

        editUserModal.modal('show');
    }

    if (saveUserChangesButton) {
        saveUserChangesButton.addEventListener('click', async () => {
            const userId = editUserIdInput.value;
            const newPhoneNumber = editPhoneNumberInput.value.trim();
            const newCallPreference = editCallPreferenceSelect.value;
            const newState = editStateSelect.value;
            const newAdminLevel = parseInt(editAdminLevelSelect.value, 10);

            const dataToUpdate = {
                phoneNumber: newPhoneNumber,
                callPreference: newCallPreference,
                state: newState,
                adminLevel: newAdminLevel // Firestore will store this as a number
            };

            try {
                await db.collection('users').doc(userId).update(dataToUpdate);
                editUserModal.modal('hide');
                await loadUsers(); // Refresh the table
                // Optionally, show a success toast/alert on the main page
            } catch (error) {
                console.error("Error updating user:", error);
                editUserErrorMessage.textContent = `Error updating user: ${error.message}`;
                editUserErrorMessage.style.display = 'block';
            }
        });
    }

});
