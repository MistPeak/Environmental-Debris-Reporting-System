// INITIALIZE MAP
const map = L.map('map').setView([10.3230, 123.9397], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
}).addTo(map);

let marker = null;

// CLICK EVENT (GET LAT/LNG)
map.on('click', function (e) {
    let lat = e.latlng.lat.toFixed(6);
    let lng = e.latlng.lng.toFixed(6);

    document.getElementById("latitude").value = lat;
    document.getElementById("longitude").value = lng;

    if (marker) map.removeLayer(marker);

    marker = L.marker([lat, lng]).addTo(map)
        .bindPopup("Pinned Location<br>Lat: " + lat + "<br>Lng: " + lng)
        .openPopup();
});

// AJAX SUBMIT
document.getElementById("reportForm").addEventListener("submit", function (e) {
    e.preventDefault();

    let formData = new FormData(this);

    // DEBUG: log form data keys (not files)
    try { console.log('Submitting report...'); } catch(e){}

    fetch("../api/api_reports.php", {
        method: "POST",
        body: formData,
        credentials: 'include',
        headers: {
            'Accept': 'application/json'
        }
    })
        .then(async res => {
            const contentType = res.headers.get('content-type') || '';
            if (!res.ok) {
                const txt = await res.text();
                throw new Error('HTTP ' + res.status + '\n' + (txt || res.statusText));
            }
            if (contentType.includes('application/json')) {
                return res.json();
            }
            const txt = await res.text();
            throw new Error('Unexpected response (not JSON): ' + txt);
        })
        .then(data => {
            if (data.success) {
                alert("Report submitted successfully!\nReported by: " + data.reportedBy);

                this.reset();
                if (marker) {
                    map.removeLayer(marker);
                    marker = null;
                }

                document.getElementById("latitude").value = "";
                document.getElementById("longitude").value = "";
            } else {
                alert("Error: " + (data.error || data.message || JSON.stringify(data)));
            }
        })
        .catch(err => {
            console.error('Submit failed', err);
            alert('Error submitting report:\n' + (err.message || 'Network Error'));
        });
});
