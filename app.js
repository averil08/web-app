// Fetch and display data when the page loads
window.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('https://web-app-h34v.onrender.com/items');
        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }
        const items = await response.json(); //fetch 
        console.log('Fetched items:', items);
        displayTableData(items); // Function to update the table with fetched data
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

// Function to populate the table with fetched data
function displayTableData(items) {
    const table = document.getElementById("storeList").getElementsByTagName('tbody')[0];
    table.innerHTML = ""; // Clear the table before inserting data
    items.forEach(item => {
        const newRow = table.insertRow();
        newRow.insertCell(0).innerHTML = item.id;
        newRow.insertCell(1).innerHTML = item.name;
        newRow.insertCell(2).innerHTML = item.amount;
        newRow.insertCell(3).innerHTML = item.date_created;
        newRow.insertCell(4).innerHTML = `
            <button class="edit-btn" onClick="onEdit(this)">Edit</button>
            <button class="delete-btn" onClick="onDelete(this)">Delete</button>
        `;
    });
}

var selectedRow = null


//Retrieve the data
function readFormData() {
    const name = document.getElementById("name").value.trim();
    // convert amount inserted by user to float
    const amount = parseFloat(document.getElementById("amount").value);

    if (!name) {
        alert("Name cannot be empty");
        throw new Error("Invalid name");
    }

    if (isNaN(amount) || amount <= 0) {
        alert("Amount must be a positive number");
        throw new Error("Invalid amount");
    }

    return { name, amount };
}

// Insert the data into the table and send it to the backend
async function insertNewRecord(data) {
    try {
        const response = await fetch('https://web-app-h34v.onrender.com/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: data.name, amount: data.amount })
        });
        const result = await response.json();

        // After successful insertion, update the table
        if (response.ok) {
            var table = document.getElementById("storeList").getElementsByTagName('tbody')[0];
            var newRow = table.insertRow(table.length);
            newRow.insertCell(0).innerHTML = result.id;
            newRow.insertCell(1).innerHTML = result.name;
            newRow.insertCell(2).innerHTML = result.amount;
            newRow.insertCell(3).innerHTML = result.date_created;
            newRow.insertCell(4).innerHTML = `
                <button class="edit-btn" onClick="onEdit(this)">Edit</button>
                <button class="delete-btn" onClick="onDelete(this)">Delete</button>
            `;
        } else {
            console.error('Failed to add record:', result.error || 'Unknown error');
        }
    } catch (error) {
        console.error('Error adding data:', error);
    }
}


//Edit the data
function onEdit(td) {
    selectedRow = td.parentElement.parentElement;
    if (selectedRow && selectedRow.cells.length >= 3) {
        document.getElementById("name").value = selectedRow.cells[1].innerHTML;
        document.getElementById("amount").value = selectedRow.cells[2].innerHTML;
        document.getElementById("edit").checked = true; // Optional: open a modal
    } else {
        console.error('Invalid row selection');
    }
}

async function onFormSubmit(e) {
    event.preventDefault();
    var formData = readFormData();
    
    if (selectedRow == null) {
        //insertNewRecord(formData); *removed, since naulit
        await insertNewRecord(formData); //insertion of fetched data to table
    } else {
        console.log('Updating record for row:', selectedRow);
        await updateRecord(formData);
    }
    
    resetForm();    
}


// Update the data in the backend
async function updateRecord(formData) {
    if (selectedRow == null) {
        console.error('No row selected for update');
        return;
    }

    const itemId = selectedRow.cells[0].innerText;  // Get the ID of the item to update

    try {
        const response = await fetch(`https://web-app-h34v.onrender.com/items${itemId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: formData.name, amount: formData.amount })
        });
        
        if (response.ok) {
            console.log('Item updated successfully:', await response.json());
            
            // Fetch the updated table data
            const newDataResponse = await fetch('https://web-app-h34v.onrender.com/items');
            if (!newDataResponse.ok) {
                throw new Error('Failed to fetch updated items');
            }
            const updatedItems = await newDataResponse.json();
            displayTableData(updatedItems); // Refresh the table with updated data
        } else {
            const error = await response.json();
            console.error('Failed to update record:', error);
        }
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

//Delete the data
async function onDelete(td) {
    if (confirm('Do you want to delete this record?')) {
        const row = td.parentElement.parentElement;
        const itemId = row.cells[0].innerText; // Get the ID from the row

        try {
            const response = await fetch(`https://web-app-h34v.onrender.com/items/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                console.log('Item deleted successfully');
                
                // Fetch the updated table data
                const newDataResponse = await fetch('https://web-app-h34v.onrender.com/items');
                if (!newDataResponse.ok) {
                    throw new Error('Failed to fetch updated items');
                }
                const updatedItems = await newDataResponse.json();
                displayTableData(updatedItems); // Refresh the table with updated data
            } else {
                const error = await response.text();
                console.error('Failed to delete record:', error);
            }
        } catch (error) {
            console.error('Error deleting record:', error);
        }
    }
}


//Reset the data
function resetForm() {
    document.getElementById("name").value = '';
    document.getElementById("amount").value = '';
    selectedRow = null;
}