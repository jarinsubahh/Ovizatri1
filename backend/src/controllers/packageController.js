const db = require('../config/db');

const getAllPackages = async (req, res) => {
  try {
    const { destination } = req.query;
    let query = `SELECT * FROM packages WHERE available_slots > 0`;
    const params = [];

    if (destination) {
      query += ` AND LOWER(destination) LIKE LOWER($1)`;
      params.push(`%${destination}%`);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      packages: result.rows,
    });
  } catch (error) {
    console.error('Get all packages error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch packages.',
    });
  }
};

const getPackageById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM packages WHERE package_id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    return res.status(200).json({
      success: true,
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Get package by id error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch package details.',
    });
  }
};

const createPackage = async (req, res) => {
  try {
    const {
      title,
      description,
      destination,
      duration_days,
      price_per_person,
      max_capacity,
    } = req.body;

    if (!title || !destination || !duration_days || !price_per_person || !max_capacity) {
      return res.status(400).json({
        success: false,
        message: 'title, destination, duration_days, price_per_person, and max_capacity are required.',
      });
    }

    const createdBy = req.user?.user_id ?? req.user?.id;
    if (!createdBy) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required to create a package.',
      });
    }

    const query = `
      INSERT INTO packages (
        title,
        description,
        destination,
        duration_days,
        price_per_person,
        max_capacity,
        available_slots,
        created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await db.query(query, [
      title,
      description || null,
      destination,
      Number(duration_days),
      Number(price_per_person),
      Number(max_capacity),
      Number(max_capacity),
      Number(createdBy),
    ]);

    return res.status(201).json({
      success: true,
      message: 'Package created successfully.',
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Create package error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create package.',
    });
  }
};

const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const existingResult = await db.query('SELECT * FROM packages WHERE package_id = $1', [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    const current = existingResult.rows[0];
    const {
      title,
      description,
      destination,
      duration_days,
      price_per_person,
      max_capacity,
      available_slots,
    } = req.body;

    const updateFields = [];
    const values = [];

    if (title !== undefined) {
      updateFields.push('title = $' + (updateFields.length + 1));
      values.push(title);
    }
    if (description !== undefined) {
      updateFields.push('description = $' + (updateFields.length + 1));
      values.push(description);
    }
    if (destination !== undefined) {
      updateFields.push('destination = $' + (updateFields.length + 1));
      values.push(destination);
    }
    if (duration_days !== undefined) {
      updateFields.push('duration_days = $' + (updateFields.length + 1));
      values.push(Number(duration_days));
    }
    if (price_per_person !== undefined) {
      updateFields.push('price_per_person = $' + (updateFields.length + 1));
      values.push(Number(price_per_person));
    }
    if (max_capacity !== undefined) {
      updateFields.push('max_capacity = $' + (updateFields.length + 1));
      values.push(Number(max_capacity));
    }
    if (available_slots !== undefined) {
      updateFields.push('available_slots = $' + (updateFields.length + 1));
      values.push(Number(available_slots));
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields provided for update.',
      });
    }

    const nextMaxCapacity = max_capacity !== undefined ? Number(max_capacity) : Number(current.max_capacity);
    const nextAvailableSlots = available_slots !== undefined ? Number(available_slots) : Number(current.available_slots);

    if (nextAvailableSlots > nextMaxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'available_slots cannot be greater than max_capacity.',
      });
    }

    values.push(id);
    const query = `UPDATE packages SET ${updateFields.join(', ')} WHERE package_id = $${values.length} RETURNING *`;
    const result = await db.query(query, values);

    return res.status(200).json({
      success: true,
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Update package error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update package.',
    });
  }
};

const deletePackage = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM packages WHERE package_id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Package not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Package deleted successfully.',
      package: result.rows[0],
    });
  } catch (error) {
    console.error('Delete package error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete package.',
    });
  }
};

module.exports = {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage,
};
