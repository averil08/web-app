// setting up express server
//imports Express library to use .get(), .post()...
const express = require('express') 
const cors = require('cors');  // Import cors module
const sqlite3 = require('sqlite3').verbose(); 
const path = require('path');

//initialize express app
const app = express(); 

app.get("/", (req,res) => {
    res.send("Welcome to Express Tracker! Server is Ready.")
})
const PORT = 4000; 

app.use(cors());  // Enable CORS for all origins
//use functions for reqs & response
app.use(express.json()); 

// Connect to SQLite3 database
const db = new sqlite3.Database('./expenses.db', (err) => {
    if (err) {
        console.error('Could not open database', err);
    } else {
        console.log('Database connected.');
    }
});

// Create the table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL, 
        amount DECIMAL(10, 2) NOT NULL,
        date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log('Table "items" created or already exists.');
        }
    });
});

//ROUTE
// GET request to fetch all items
app.get('/items', (req, res) => {
    db.all('SELECT * FROM items', (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch items' });
        }
        console.log('Fetched rows:', rows);  
        res.json(rows); // Return the rows as a JSON response
    });
});

// POST request to insert a new item
app.post('/items', async (req, res) => {
    const { name, amount } = req.body;
    
    // Insert data into the database
    const query = 'INSERT INTO items (name, amount) VALUES (?, ?)';
    db.run(query, [name, amount], function (err) {
        if (err) {
            console.error("Error inserting data:", err.message);
            return res.status(500).json({ error: 'Failed to insert item' });
        }

        const insertedId = this.lastID; // Get the ID of the newly inserted row

        // Fetch the newly inserted row to include accurate date_created
        const fetchQuery = 'SELECT * FROM items WHERE id = ?';
        db.get(fetchQuery, [insertedId], (err, newItem) => {
            if (err) {
                console.error("Error fetching inserted item:", err.message);
                return res.status(500).json({ error: 'Failed to fetch inserted item' });
            }

            console.log(`Inserted item:`, newItem);
            res.status(201).json(newItem); // Respond with the full inserted row
        });
    });
});

// working PUT request to update an existing item
app.put('/items/:id', (req, res) => {
    const { id } = req.params;
    const { name, amount } = req.body;

    console.log(`Received PUT request to update item ID: ${id}`);
    console.log(`Request body:`, { name, amount });

    const updateQuery = `UPDATE items SET name = ?, amount = ? WHERE id = ?`;
    db.run(updateQuery, [name, amount, id], function (err) {
        if (err) {
            console.error('Error executing update query:', err.message);
            res.status(500).json({ error: 'Failed to update item' });
            return;
        }

        if (this.changes === 0) {
            console.warn('No rows were updated. Ensure the ID is correct.');
            res.status(404).json({ error: 'Item not found' });
            return;
        }

        // Added detailed debug log here
        console.log(`Update query executed for ID: ${id} with name: ${name} and amount: ${amount}`);

        console.log(`Successfully updated item ID: ${id}`);
        res.status(200).json({ id, name, amount });
    });
});

// delete route d pa gumagana
// Delete route for removing an item
app.delete('/items/:id', (req, res) => {
    const { id } = req.params;

    // Delete the item from the database
    const deleteQuery = 'DELETE FROM items WHERE id = ?'; // Use ? for parameterized queries in SQLite

    db.run(deleteQuery, [id], function (err) {
        if (err) {
            console.error('Error deleting item:', err);
            return res.status(500).json({ error: 'Failed to delete item' });
        }

        // If no rows were affected, it means the item wasn't found
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Item not found' });
        }

        // Fetch the updated data after deletion
        const fetchQuery = 'SELECT * FROM items ORDER BY id ASC';
        db.all(fetchQuery, [], (err, rows) => {
            if (err) {
                console.error('Error fetching updated data:', err);
                return res.status(500).json({ error: 'Failed to fetch updated data' });
            }

            // Send the updated data back to the frontend
            res.status(200).json(rows);
        });
    });
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});