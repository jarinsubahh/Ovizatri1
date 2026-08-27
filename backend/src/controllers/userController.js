const db = require('../config/db');
const bcrypt = require('bcrypt');

/**
 * Update current user profile
 */
const updateProfile = async (req, res) => {
  const client = await db.getClient();
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const { name, phone, password, ...profileFields } = req.body;

    await client.query('BEGIN');

    // Update core user table
    if (name || phone || password) {
      let updateQuery = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
      const params = [];
      let index = 1;

      if (name) {
        updateQuery += `, name = $${index++}`;
        params.push(name.trim());
      }
      if (phone) {
        updateQuery += `, phone = $${index++}`;
        params.push(phone.trim());
      }
      if (password) {
        const hash = await bcrypt.hash(password, 10);
        updateQuery += `, password_hash = $${index++}`;
        params.push(hash);
      }

      updateQuery += ` WHERE id = $${index} RETURNING id, name, email, role, phone`;
      params.push(userId);

      await client.query(updateQuery, params);
    }

    // Update profile table
    if (role === 'traveler') {
      const { address, city, country, emergency_contact, emergencyContact, passport_number, passportNumber, bio } = profileFields;
      await client.query(
        `UPDATE traveler_profiles
         SET address = COALESCE($1, address),
             city = COALESCE($2, city),
             country = COALESCE($3, country),
             emergency_contact = COALESCE($4, emergency_contact),
             passport_number = COALESCE($5, passport_number),
             bio = COALESCE($6, bio),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $7`,
        [
          address || null,
          city || null,
          country || null,
          emergency_contact || emergencyContact || null,
          passport_number || passportNumber || null,
          bio || null,
          userId,
        ]
      );
    } else if (role === 'agency') {
      const { agency_name, agencyName, trade_license, tradeLicense, contact_person, contactPerson, office_address, officeAddress, city, country, website, description } = profileFields;
      await client.query(
        `UPDATE agency_profiles
         SET agency_name = COALESCE($1, agency_name),
             trade_license = COALESCE($2, trade_license),
             contact_person = COALESCE($3, contact_person),
             office_address = COALESCE($4, office_address),
             city = COALESCE($5, city),
             country = COALESCE($6, country),
             website = COALESCE($7, website),
             description = COALESCE($8, description),
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $9`,
        [
          agency_name || agencyName || null,
          trade_license || tradeLicense || null,
          contact_person || contactPerson || null,
          office_address || officeAddress || null,
          city || null,
          country || null,
          website || null,
          description || null,
          userId,
        ]
      );
    }

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully!',
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    client.release();
  }
};

module.exports = {
  updateProfile,
};
