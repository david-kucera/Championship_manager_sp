// Function to parse the URL and load the championship data
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const championshipId = urlParams.get('championshipId');

    if (championshipId) {
        fetchAndDisplayChampionshipData(championshipId);
    } else {
        console.error('No championship ID provided in the URL');
    }
});

async function fetchAndDisplayChampionshipData(championshipId) {
    const { data, error } = await _supabase.from('championships').select('*').eq('id', championshipId);

    if (error) {
        console.error('Error fetching championship data:', error.message);
        return;
    }

    const championship = data[0];
    if (championship) {
        document.title = championship.name + " | Championship Manager";
        document.getElementById('championship-name').textContent = championship.name;
        document.getElementById('start-date').textContent = championship.startDate;
        document.getElementById('end-date').textContent = championship.endDate;
        document.getElementById('description').textContent = championship.description;
    }

    const { data: driversData, error: driversError } = await _supabase
        .from('driversInChampionship')
        .select('driverUid')
        .eq('championshipId', championshipId);

    if (driversError) {
        console.error('Error fetching drivers data:', driversError.message);
        openModal("Errpr fetching drivers data!");
        return;
    }

    let currentUserIsRegistered = false;
    const currentUserUid = getCookie('uid');

    for (const driver of driversData) {
        const uid = driver.driverUid;
        // Check if user is already in this championship
        if (uid === currentUserUid) {
            currentUserIsRegistered = true;
        }
        const { data: profileData, error: profileError } = await _supabase
            .from('profiles')
            .select('fullname')
            .eq('uid', uid);

        if (profileError) {
            console.error('Error fetching driver details:', profileError.message);
            continue; // Skip this driver and continue with the next
        }

        addDriverToTable(profileData[0].fullname);
    }

    // Hide the button if he is in the championship
    if (isDriver && !currentUserIsRegistered) {
        document.getElementById('add-to-championship-button').style.display = 'block';
        document.getElementById('add-to-championship-button').onclick = function() {
            addDriverToChampionship(championshipId);
        };
    } else {
        document.getElementById('add-to-championship-button').style.display = 'none';
    }
}

function addDriverToTable(driverName) {
    const tbody = document.getElementById('tbody_championship_drivers');
    const row = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.textContent = driverName;
    row.appendChild(nameCell);
    tbody.appendChild(row);
}

async function addDriverToChampionship(championshipId) {
    let driverUid = getCookie('uid');
    if (!driverUid) {
        console.error("No driver UID found in cookies");
        return;
    }

    try {
        const { data, error } = await _supabase.from('driversInChampionship').insert([
            { championshipId: championshipId, driverUid: driverUid }
        ]);

        if (error) throw error;

        console.log("Driver added to championship successfully:", data);
        openModal("You were successfully added to the championship!");
    } catch (err) {
        console.error("Error adding driver to championship:", err.message);
        openModal("Error when adding to the championship.");
    }
}