// API endpoints
const API_BASE = window.location.origin;

// Common fetch utility
const fetchAPI = async (url, method = 'GET', body = null) => {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);
        
        const response = await fetch(`${API_BASE}${url}`, options);
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        return { error: 'Network Error' };
    }
};

// Check Auth
const checkAuth = async () => {
    const res = await fetchAPI('/api/auth-status');
    if (!res.loggedIn) {
        window.location.href = '/';
    } else {
        const userDisplay = document.getElementById('userNameDisplay');
        if(userDisplay) userDisplay.innerText = res.name;
    }
};

// Logout
const logout = async () => {
    await fetchAPI('/logout');
    window.location.href = '/';
};

// Fetch Latest Sensor Data
const fetchLatestData = async () => {
    const data = await fetchAPI('/api/latest-data');
    if (!data.error) {
        document.getElementById('tempValue').innerText = `${data.temperature}°C`;
        document.getElementById('tempTime').innerText = `${data.date} | ${data.time}`;
        
        document.getElementById('humValue').innerText = `${data.humidity}%`;
        document.getElementById('humTime').innerText = `${data.date} | ${data.time}`;
    }
};

// Fetch History Data
const fetchHistory = async () => {
    const data = await fetchAPI('/api/history');
    const tableBody = document.getElementById('historyTableBody');
    if (!data.error && tableBody) {
        tableBody.innerHTML = '';
        data.forEach((log, index) => {
            const row = document.createElement('tr');
            row.className = "border-b border-gray-700 hover:bg-gray-800 transition";
            row.innerHTML = `
                <td class="p-3">${index + 1}</td>
                <td class="p-3 text-blue-400 font-bold">${log.temperature}°C</td>
                <td class="p-3 text-green-400 font-bold">${log.humidity}%</td>
                <td class="p-3">${log.lcdMessage}</td>
                <td class="p-3">${log.time}</td>
                <td class="p-3">${log.date}</td>
                <td class="p-3">
                    <button onclick="deleteRecord('${log.id}')" class="btn-danger text-sm">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }
};

// Delete Record
const deleteRecord = async (id) => {
    if (confirm("Are you sure you want to delete this record?")) {
        await fetchAPI(`/api/history/${id}`, 'DELETE');
        fetchHistory(); // Refresh table
    }
};

// Update LCD Message
const updateLcdMessage = async (e) => {
    e.preventDefault();
    const textInput = document.getElementById('lcdInput').value;
    
    if (textInput.length > 16) {
        alert("Max 16 characters allowed!");
        return;
    }

    const res = await fetchAPI('/api/lcd-message', 'POST', { text: textInput });
    if (res.message) {
        alert('LCD Message Updated Successfully!');
        document.getElementById('currentLcdText').innerText = res.currentText;
        document.getElementById('lcdInput').value = '';
    } else {
        alert(res.error || "Error updating message");
    }
};

// Control LED
const controlLed = async (state) => {
    const res = await fetchAPI(`/api/led/${state}`, 'POST');
    if (res.message) {
        // Just show success silently or tiny toast if preferred
        console.log(`LED is now ${state.toUpperCase()}`);
    } else {
        alert("Error controlling LED");
    }
};

// Initialize Dashboard
const initDashboard = () => {
    checkAuth();
    
    // Initial fetch
    fetchLatestData();
    fetchHistory();
    
    // Fetch Current LCD Text silently
    fetchAPI('/api/lcd-message').then(res => {
        // Server returns plain text for GET /api/lcd-message, but fetchAPI expects json.
        // Wait, fetchAPI uses response.json() so if it's text it might fail.
        // Let's handle it manually here:
        fetch('/api/lcd-message').then(r => r.text()).then(text => {
            const el = document.getElementById('currentLcdText');
            if(el) el.innerText = text;
        });
    });

    // Auto Refresh every 5 seconds
    setInterval(() => {
        fetchLatestData();
        fetchHistory();
    }, 5000);

    // Event Listeners
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('lcdForm')?.addEventListener('submit', updateLcdMessage);
};

// Expose functions to window if using inline onclick
window.deleteRecord = deleteRecord;
window.controlLed = controlLed;
