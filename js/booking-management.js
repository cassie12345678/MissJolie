/* ============================================================
   BOOKING MANAGEMENT SYSTEM
============================================================ */

let bookings = [];
let filteredBookings = [];

// Load bookings from database
async function loadBookings() {
    try {
        const response = await fetch('includes/get-bookings.php');
        const data = await response.json();
        
        if (data.success) {
            bookings = data.bookings;
            filteredBookings = [...bookings];
            updateStats();
            renderBookingsTable();
        } else {
            console.error('Failed to load bookings:', data.error);
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
    }
}

// Update statistics
function updateStats() {
    const total = bookings.length;
    const today = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        const todayDate = new Date();
        return bookingDate.toDateString() === todayDate.toDateString();
    }).length;
    
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const thisWeek = bookings.filter(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= weekStart && bookingDate < weekEnd;
    }).length;
    
    const revenue = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
    
    document.getElementById('totalBookings').textContent = total;
    document.getElementById('todayBookings').textContent = today;
    document.getElementById('weekBookings').textContent = thisWeek;
    document.getElementById('totalRevenue').textContent = `€${revenue.toFixed(2)}`;
}

// Render bookings table
function renderBookingsTable() {
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    
    if (filteredBookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="padding: 20px; text-align: center; color: #999;">Geen bookingen gevonden</td></tr>';
        return;
    }
    
    tbody.innerHTML = filteredBookings.map(booking => {
        const statusColors = {
            'pending': '#ffa366',
            'confirmed': '#6bff9e',
            'completed': '#7b2cbf',
            'cancelled': '#ff5050'
        };
        
        const statusLabels = {
            'pending': 'In afwachting',
            'confirmed': 'Bevestigd',
            'completed': 'Voltooid',
            'cancelled': 'Geannuleerd'
        };
        
        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                <td style="padding: 12px; color: white;">#${booking.id}</td>
                <td style="padding: 12px; color: white;">${formatDateTime(booking.date, booking.time)}</td>
                <td style="padding: 12px; color: white;">${booking.service}</td>
                <td style="padding: 12px; color: white;">${booking.duration}</td>
                <td style="padding: 12px; color: white;">${booking.customerName}</td>
                <td style="padding: 12px; color: white;">${booking.customerEmail}</td>
                <td style="padding: 12px; color: white;">${booking.customerPhone || '-'}</td>
                <td style="padding: 12px; color: white;">€${booking.price.toFixed(2)}</td>
                <td style="padding: 12px;">
                    <span style="background: ${statusColors[booking.status]}; color: black; padding: 5px 10px; border-radius: 5px; font-size: 12px; font-weight: bold;">
                        ${statusLabels[booking.status]}
                    </span>
                </td>
                <td style="padding: 12px;">
                    <button class="btn-small" onclick="editBooking('${booking.id}')" style="background: #7b2cbf; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer; margin-right: 5px;">Bewerken</button>
                    <button class="btn-small" onclick="deleteBooking('${booking.id}')" style="background: #ff5050; color: white; padding: 5px 10px; border: none; border-radius: 5px; cursor: pointer;">Verwijderen</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Format date and time
function formatDateTime(date, time) {
    const d = new Date(date);
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return `${d.toLocaleDateString('nl-NL', options)} ${time.substring(0, 5)}`;
}

// Apply filters
function applyFilters() {
    const status = document.getElementById('filterStatus').value;
    const service = document.getElementById('filterService').value;
    const dateFrom = document.getElementById('filterDateFrom').value;
    const dateTo = document.getElementById('filterDateTo').value;
    
    filteredBookings = bookings.filter(booking => {
        if (status !== 'all' && booking.status !== status) return false;
        if (service !== 'all' && !booking.service.includes(service)) return false;
        if (dateFrom && new Date(booking.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(booking.date) > new Date(dateTo)) return false;
        return true;
    });
    
    renderBookingsTable();
}

// Edit booking
function editBooking(id) {
    const booking = bookings.find(b => b.id === id);
    if (!booking) return;
    
    const modal = document.getElementById('editBookingModal');
    const form = document.getElementById('editBookingForm');
    
    form.innerHTML = `
        <div style="display: grid; gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 5px; color: #aaa;">Status</label>
                <select id="editStatus" style="width: 100%; padding: 10px; background: #2a2a2a; color: white; border: 1px solid #ff66c4; border-radius: 8px;">
                    <option value="pending" ${booking.status === 'pending' ? 'selected' : ''}>In afwachting</option>
                    <option value="confirmed" ${booking.status === 'confirmed' ? 'selected' : ''}>Bevestigd</option>
                    <option value="completed" ${booking.status === 'completed' ? 'selected' : ''}>Voltooid</option>
                    <option value="cancelled" ${booking.status === 'cancelled' ? 'selected' : ''}>Geannuleerd</option>
                </select>
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; color: #aaa;">Datum</label>
                <input type="date" id="editDate" value="${booking.date}" style="width: 100%; padding: 10px; background: #2a2a2a; color: white; border: 1px solid #ff66c4; border-radius: 8px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; color: #aaa;">Tijd</label>
                <input type="time" id="editTime" value="${booking.time}" style="width: 100%; padding: 10px; background: #2a2a2a; color: white; border: 1px solid #ff66c4; border-radius: 8px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; color: #aaa;">Notities</label>
                <textarea id="editNotes" style="width: 100%; padding: 10px; background: #2a2a2a; color: white; border: 1px solid #ff66c4; border-radius: 8px; min-height: 100px;">${booking.notes || ''}</textarea>
            </div>
        </div>
    `;
    
    modal.classList.remove('hidden');
    
    document.getElementById('saveBookingBtn').onclick = async () => {
        const updatedData = {
            id: booking.id,
            status: document.getElementById('editStatus').value,
            date: document.getElementById('editDate').value,
            time: document.getElementById('editTime').value,
            notes: document.getElementById('editNotes').value
        };
        
        try {
            const response = await fetch('includes/update-booking.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                modal.classList.add('hidden');
                loadBookings();
            } else {
                alert('Fout bij opslaan: ' + result.error);
            }
        } catch (error) {
            console.error('Error updating booking:', error);
            alert('Er is een fout opgetreden');
        }
    };
}

// Delete booking
async function deleteBooking(id) {
    if (!confirm('Weet je zeker dat je deze boeking wilt verwijderen?')) return;
    
    try {
        const response = await fetch('includes/delete-booking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });
        
        const result = await response.json();
        
        if (result.success) {
            loadBookings();
        } else {
            alert('Fout bij verwijderen: ' + result.error);
        }
    } catch (error) {
        console.error('Error deleting booking:', error);
        alert('Er is een fout opgetreden');
    }
}

// Close modal
document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
    document.getElementById('editBookingModal').classList.add('hidden');
});

// Apply filters button
document.getElementById('applyFilters')?.addEventListener('click', applyFilters);

// Logout
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    window.location.href = 'admin.html';
});

// Initialize
loadBookings();
