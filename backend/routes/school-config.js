const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth } = require('../middleware/auth');
const path = require('path');

// GET public school branding
router.get('/public', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT school_name, school_description, logo_url FROM school_config LIMIT 1'
    );

    if (rows.length === 0) {
      return res.json({
        school_name: 'SMK Negeri Bali Mandara',
        school_description: 'Sistem Index Prestasi Citra (IPC) • Panel Admin',
        logo_url: null
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching public school config:', error);
    res.status(500).json({ error: 'Failed to fetch school configuration' });
  }
});

// Apply auth middleware to all routes
router.use(auth);

// GET school configuration
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM school_config LIMIT 1'
    );

    if (rows.length === 0) {
      // Return default config if none exists
      console.log('No school config found, returning default');
      return res.json({
        id: null,
        school_name: 'SMK Negeri Bali Mandara',
        school_description: 'Sistem Index Prestasi Citra (IPC) • Panel Admin',
        principal_name: 'Nama Kepala Sekolah',
        principal_nip: '',
        logo_url: null,
        created_at: null,
        updated_at: null
      });
    }

    console.log('School config fetched:', rows[0]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching school config:', error);
    res.status(500).json({ error: 'Failed to fetch school configuration' });
  }
});

// PUT school configuration (superadmin only)
router.put('/', async (req, res) => {
  try {
    const { school_name, school_description, principal_name, principal_nip, logo_url } = req.body;
    
    // Check if user is superadmin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can update school configuration' });
    }
    
    // Check if config exists
    const [existing] = await db.query('SELECT id FROM school_config LIMIT 1');
    
    if (existing.length > 0) {
      // Update existing config
      await db.query(
        `UPDATE school_config 
         SET school_name = ?, school_description = ?, principal_name = ?, principal_nip = ?, logo_url = ?, updated_at = NOW()
         WHERE id = ?`,
        [school_name, school_description, principal_name, principal_nip, logo_url, existing[0].id]
      );
    } else {
      // Insert new config
      await db.query(
        `INSERT INTO school_config (school_name, school_description, principal_name, principal_nip, logo_url, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [school_name, school_description, principal_name, principal_nip, logo_url]
      );
    }
    
    // Fetch and return updated config
    const [rows] = await db.query('SELECT * FROM school_config LIMIT 1');
    res.json(rows[0]);
  } catch (error) {
    console.error('Error updating school config:', error);
    res.status(500).json({ error: 'Failed to update school configuration' });
  }
});

// Upload logo endpoint
router.post('/upload-logo', async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Only superadmin can upload logo' });
    }
    
    if (!req.files || !req.files.logo) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const logo = req.files.logo;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    if (!allowedTypes.includes(logo.mimetype)) {
      return res.status(400).json({ error: 'Only JPEG and PNG images are allowed' });
    }
    
    // Create uploads/logos directory if it doesn't exist
    const fs = require('fs');
    const uploadDir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const uploadPath = path.join(uploadDir, `${timestamp}_${logo.name}`);

    console.log('Upload directory:', uploadDir);
    console.log('Upload path:', uploadPath);
    console.log('Logo file:', logo.name);

    logo.mv(uploadPath, async (err) => {
      if (err) {
        console.error('Error uploading logo:', err);
        return res.status(500).json({ error: 'Failed to upload logo' });
      }

      console.log('File saved successfully to:', uploadPath);

      // Check if file exists
      const fs = require('fs');
      if (fs.existsSync(uploadPath)) {
        console.log('File exists after upload');
      } else {
        console.error('File does NOT exist after upload');
      }

      const logoUrl = `/uploads/logos/${timestamp}_${logo.name}`;

      console.log('Logo URL to save:', logoUrl);

      // Update school config with new logo
      const [existing] = await db.query('SELECT id FROM school_config LIMIT 1');

      if (existing.length > 0) {
        await db.query(
          'UPDATE school_config SET logo_url = ?, updated_at = NOW() WHERE id = ?',
          [logoUrl, existing[0].id]
        );
      } else {
        await db.query(
          'INSERT INTO school_config (logo_url, created_at, updated_at) VALUES (?, NOW(), NOW())',
          [logoUrl]
        );
      }

      res.json({ logoUrl });
    });
  } catch (error) {
    console.error('Error in logo upload:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

module.exports = router;
