const express = require('express');
const router = express.Router();
const {Table} = require('../models/Table');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Create a new table
router.post('/',  async (req, res) => {
  const { name, stake, player } = req.body;

  if (!name || !stake || !player || !player.username || typeof player.chips !== 'number') {
      return res.status(400).json({ error: 'Invalid table or player data' });
  }

  try {
      const newTable = new Table({ name, stake, players: [player] });
      await newTable.save();
      res.status(201).json({ message: 'Table created successfully', table: newTable });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

// Join an existing table
router.post('/join', async (req, res) => {
  const { tableId, player } = req.body;

  if (!player || !player.username || typeof player.chips !== 'number') {
      return res.status(400).json({ error: 'Invalid player data' });
  }

  try {
      const table = await Table.findById(tableId);
      if (!table) {
          return res.status(404).json({ error: 'Table not found' });
      }

      if (table.players.length >= 4) {
          return res.status(400).json({ error: 'Table is full' });
      }

      table.players.push(player);
      await table.save();
      res.status(200).json({ message: 'Joined table successfully', table });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});


  // Leave a table
  router.post('/:tableId/leave', async (req, res) => {
    const { tableId } = req.params;
    const { username } = req.body;
  
    try {
      const table = await Table.findById(tableId);
      if (!table) {
        return res.status(404).json({ success: false, error: 'Table not found' });
      }

      table.players = table.players.filter(player => player.username !== username);
      await table.save();

      res.status(200).json({ success: true, message: 'Player removed from table' });
    } catch (error) {
      console.error('Error leaving table:', error);
      res.status(500).json({ success: false, error: 'Failed to leave table' });
    }
  });
// Delete a table
router.delete('/:id', async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    res.status(200).json({ message: 'Table deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get table by ID
router.get('/:id', async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ error: 'Table not found' });
    }
    // Add human player if not present
    const playerExists = table.players.some(p => p.username === req.user?.username);
    if (req.user && !playerExists) {
        table.players.push({
            username: req.user.username,
            chips: req.user.chips,
            isHuman: true
        });
        await table.save();
    }

    res.status(200).json({ table });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all tables
router.get('/', async (req, res) => {
  try {
    // Fetch tables and filter out empty ones
    const tables = await Table.find({});
    
    res.status(200).json({ success: true, tables });
  } catch (error) {
    console.error('Error fetching tables:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tables' });
  }
});

// Clean up empty tables
router.post('/cleanup-tables', async (req, res) => {
  try {
    // Find tables with no players
    const emptyTables = await Table.find({ 'players.0': { $exists: false } });
    
    // Delete empty tables
    await Promise.all(emptyTables.map(table => table.remove()));
    
    res.status(200).json({ success: true, message: `${emptyTables.length} empty tables removed` });
  } catch (error) {
    console.error('Error cleaning up tables:', error);
    res.status(500).json({ success: false, error: 'Failed to clean up tables' });
  }
});

module.exports = router;
