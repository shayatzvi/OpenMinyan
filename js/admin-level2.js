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
    const listsContainer = document.getElementById('listsContainer');
    const onCallListUl = document.getElementById('onCallList');
    const doNotCallListUl = document.getElementById('doNotCallList');
    const currentUserEmailSpan = document.getElementById('currentUserEmail');


    auth.onAuthStateChanged(async user => {
        if (user) {
            if(currentUserEmailSpan) currentUserEmailSpan.textContent = `Logged in as: ${user.email}`;
            
            let effectiveAdminLevel = 0;
            let adminDataForState = null; // To store the admin's full data for state extraction

            // Fetch user data from DB to get the most up-to-date adminLevel and state
            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists) {
                    adminDataForState = userDoc.data();
                    effectiveAdminLevel = adminDataForState.adminLevel || 0;
                    // Update session storage with potentially more current admin level
                    sessionStorage.setItem('minyanUserAdminLevel', String(effectiveAdminLevel));
                } else {
                    // User document doesn't exist in Firestore, treat as no admin
                    effectiveAdminLevel = 0;
                    sessionStorage.setItem('minyanUserAdminLevel', '0');
                }
            } catch (error) {
                console.error("Error fetching user document for admin check:", error);
                errorMessage.textContent = "Error verifying your access level. Please try again.";
                errorMessage.style.display = 'block';
                loadingMessage.style.display = 'none';
                return; // Stop further execution if we can't verify admin status
            }

            if (effectiveAdminLevel === 1) {
                console.log("Admin Level 1 access granted. Loading all lists.");
                await loadLists(null); // Admin L1 sees all states
            } else if (effectiveAdminLevel === 2) {
                const adminState = adminDataForState ? adminDataForState.state : null;
                if (adminState) {
                    console.log(`Admin Level 2 access granted. Filtering lists by state: ${adminState}`);
                    await loadLists(adminState); // Admin L2 sees only their state
                } else {
                    console.warn("Admin Level 2 user has no state defined in their profile. Cannot filter lists.");
                    errorMessage.textContent = "Your user profile is missing state information. State-specific lists cannot be displayed.";
                    errorMessage.style.display = 'block';
                    loadingMessage.style.display = 'none';
                    if(listsContainer) listsContainer.style.display = 'none';
                }
            } else {
                console.warn("Access Denied. User is not Admin Level 1 or 2.");
                errorMessage.textContent = "Access Denied. You do not have permission to view this page.";
                errorMessage.style.display = 'block';
                loadingMessage.style.display = 'none';
                if(listsContainer) listsContainer.style.display = 'none';
            }
        } else {
            console.log("User not logged in. Redirecting to login.");
            window.location.href = 'login.html';
        }
    });

    async function loadLists(filterState) { // filterState will be null for Admin L1, or a state string for Admin L2
        loadingMessage.style.display = 'block';
        listsContainer.style.display = 'none';
        onCallListUl.innerHTML = '';
        doNotCallListUl.innerHTML = '';

        try {
            let onCallQuery = db.collection('users').where('callPreference', '==', 'onCall');
            if (filterState) {
                onCallQuery = onCallQuery.where('state', '==', filterState);
            }

            let doNotCallQuery = db.collection('users').where('callPreference', '==', 'doNotCall');
            if (filterState) {
                doNotCallQuery = doNotCallQuery.where('state', '==', filterState);
            }

            // Load On Call List
            let onCallCount = 0;
            const onCallSnapshot = await onCallQuery.get();
            onCallSnapshot.forEach(doc => {
                onCallCount++;
                const userData = doc.data();
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item');

                let content = `<strong>${userData.email || 'N/A'}</strong> - Phone: `;
                if (userData.phoneNumber) {
                    const callLink = document.createElement('a');
                    callLink.href = `tel:${userData.phoneNumber}`;
                    callLink.textContent = userData.phoneNumber;
                    content += callLink.outerHTML; // Append the link HTML

                    const callButton = document.createElement('button');
                    callButton.classList.add('btn', 'btn-xs', 'btn-success', 'pull-right');
                    callButton.textContent = 'Call';
                    callButton.onclick = () => { window.location.href = `tel:${userData.phoneNumber}`; };
                    listItem.appendChild(callButton); // Add button first so it can be pulled right
                } else {
                    content += 'N/A';
                }
                listItem.innerHTML += content; // Add the rest of the content
                onCallListUl.appendChild(listItem);
            });
            if (onCallCount === 0) {
                onCallListUl.innerHTML = '<li class="list-group-item">No users currently on call.</li>';
            }

            // Load Do Not Call List
            let doNotCallCount = 0;
            const doNotCallSnapshot = await doNotCallQuery.get();
            doNotCallSnapshot.forEach(doc => {
                doNotCallCount++;
                const userData = doc.data();
                const listItem = document.createElement('li');
                listItem.classList.add('list-group-item');
                listItem.textContent = `${userData.email || 'N/A'} - Phone: ${userData.phoneNumber || 'N/A'} (State: ${userData.state || 'N/A'})`;
                doNotCallListUl.appendChild(listItem);
            });
            if (doNotCallCount === 0) {
                doNotCallListUl.innerHTML = '<li class="list-group-item">No users on the do not call list.</li>';
            }

            listsContainer.style.display = 'block';
        } catch (error) {
            console.error("Error loading lists:", error);
            errorMessage.textContent = "Error loading lists: " + error.message;
            errorMessage.style.display = 'block';
        } finally {
            loadingMessage.style.display = 'none';
        }
    }
});
