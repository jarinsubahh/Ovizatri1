const bcrypt = require('bcrypt');
const db = require('../config/db');
const { generateToken } = require('../utils/token');

const SALT_ROUNDS = 10;

const sendDatabaseError = (res, error, operation) => {
  if (error.code === '23505') return res.status(409).json({ success: false, message: 'An account with that email or username already exists.' });
  if (error.code === '23502' || error.code === '23514') return res.status(400).json({ success: false, message: 'Some submitted information is invalid or missing.' });
  console.error(`${operation} error:`, error);
  return res.status(500).json({ success: false, message: `Internal server error during ${operation.toLowerCase()}.`, error: process.env.NODE_ENV === 'development' ? error.message : undefined });
};

const signupTraveler = async (req, res) => {
  const client = await db.getClient();
  let transactionStarted = false;
  try {
    const { fullname, username, email, password, phone, gender, dob, present_address, permanent_address } = req.body;
    if (!fullname?.trim() || !username?.trim() || !email?.trim() || !password) return res.status(400).json({ success: false, message: 'Full name, username, email, and password are required.' });
    await client.query('BEGIN');
    transactionStarted = true;
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    const presentAddress = present_address?.trim() || null;
    const permanentAddress = permanent_address?.trim() || null;
    const duplicate = await client.query(`SELECT 1 FROM account WHERE LOWER(email) = $1 UNION ALL SELECT 1 FROM app_user WHERE LOWER(username) = LOWER($2)`, [normalizedEmail, normalizedUsername]);
    if (duplicate.rows.length) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(409).json({ success: false, message: 'That email or username is already registered.' });
    }
    let presentAddressId = null;
    let permanentAddressId = null;
    if (presentAddress) {
      const address = await client.query('INSERT INTO address (street_address) VALUES ($1) RETURNING address_id', [presentAddress]);
      presentAddressId = address.rows[0].address_id;
    }
    if (permanentAddress) {
      const address = await client.query('INSERT INTO address (street_address) VALUES ($1) RETURNING address_id', [permanentAddress]);
      permanentAddressId = address.rows[0].address_id;
    }
    const account = await client.query(`INSERT INTO account (email, password_hash, account_type) VALUES ($1, $2, 'user') RETURNING account_id, email, account_type, created_at`, [normalizedEmail, await bcrypt.hash(password, SALT_ROUNDS)]);
    const accountRow = account.rows[0];
    const profile = await client.query(`INSERT INTO app_user (account_id, present_address_id, permanent_address_id, username, fullname, gender, dob, phone) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id, present_address_id, permanent_address_id, username, fullname, gender, dob, phone, pfp_url`, [accountRow.account_id, presentAddressId, permanentAddressId, normalizedUsername, fullname.trim(), gender || null, dob || null, phone?.trim() || null]);
    await client.query('COMMIT');
    transactionStarted = false;
    const user = { ...accountRow, id: accountRow.account_id, name: profile.rows[0].fullname, role: 'user', profile: profile.rows[0] };
    return res.status(201).json({ success: true, message: 'Traveler registered successfully!', token: generateToken(user), user });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    return sendDatabaseError(res, error, 'Traveler registration');
  } finally { client.release(); }
};

const signupAgency = async (req, res) => {
  const client = await db.getClient();
  let transactionStarted = false;
  try {
    const { agencyName, ownerName, email, password, phone, experience_years, websiteUrl, overview, street_address, thana, district, division, postalCode, tradeLicenseFileName } = req.body;
    if (!agencyName?.trim() || !ownerName?.trim() || !email?.trim() || !password || !phone?.trim() || !street_address?.trim() || !district?.trim() || !division?.trim()) return res.status(400).json({ success: false, message: 'Agency name, owner name, email, password, phone, and complete address are required.' });
    const experience = Number(experience_years || 0);
    if (!Number.isInteger(experience) || experience < 0) return res.status(400).json({ success: false, message: 'Years of experience must be a non-negative whole number.' });
    await client.query('BEGIN');
    transactionStarted = true;
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = await client.query('SELECT 1 FROM account WHERE LOWER(email) = $1', [normalizedEmail]);
    if (duplicate.rows.length) {
      await client.query('ROLLBACK');
      transactionStarted = false;
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }
    const address = await client.query(`INSERT INTO address (street_address, thana, district, division, postal_code) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [street_address.trim(), thana?.trim() || null, district.trim(), division.trim(), postalCode?.trim() || null]);
    const account = await client.query(`INSERT INTO account (email, password_hash, account_type) VALUES ($1, $2, 'agency') RETURNING account_id, email, account_type, created_at`, [normalizedEmail, await bcrypt.hash(password, SALT_ROUNDS)]);
    const accountRow = account.rows[0];
    const agency = await client.query(`INSERT INTO agency (account_id, registered_address_id, agency_name, owner_name, phone, experience_years, overview, website_url, trade_license_doc_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING agency_id, registered_address_id, agency_name, owner_name, phone, experience_years, overview, status, website_url, trade_license_doc_url`, [accountRow.account_id, address.rows[0].address_id, agencyName.trim(), ownerName.trim(), phone.trim(), experience, overview?.trim() || null, websiteUrl?.trim() || null, tradeLicenseFileName ? `/docs/${tradeLicenseFileName}` : null]);
    await client.query('COMMIT');
    transactionStarted = false;
    const user = { ...accountRow, id: accountRow.account_id, name: agency.rows[0].agency_name, role: 'agency', profile: { ...agency.rows[0], address: address.rows[0] } };
    return res.status(201).json({ success: true, message: 'Agency registered successfully! Account is pending review.', token: generateToken(user), user });
  } catch (error) {
    if (transactionStarted) await client.query('ROLLBACK');
    return sendDatabaseError(res, error, 'Agency registration');
  } finally { client.release(); }
};

const accountSelect = `SELECT a.account_id AS id, a.email, a.password_hash, a.account_type AS role, a.created_at, u.user_id, u.username, u.fullname, u.gender, u.dob, u.phone, ag.agency_id, ag.agency_name, ag.owner_name, ag.experience_years, ag.overview, ag.status, ag.website_url, ag.trade_license_doc_url, ad.address_id, ad.street_address, ad.thana, ad.district, ad.division, ad.postal_code, adm.admin_id, adm.admin_name, adm.role_level FROM account a LEFT JOIN app_user u ON u.account_id = a.account_id LEFT JOIN agency ag ON ag.account_id = a.account_id LEFT JOIN address ad ON ad.address_id = ag.registered_address_id LEFT JOIN admin adm ON adm.account_id = a.account_id`;

const findAccount = async (identifier) => (await db.query(`${accountSelect} WHERE LOWER(a.email) = $1 OR LOWER(u.username) = $1`, [identifier])).rows[0];
const findAccountById = async (id) => (await db.query(`${accountSelect} WHERE a.account_id = $1`, [id])).rows[0];

const toUserPayload = (row) => {
  const user = { id: row.id, name: row.fullname || row.agency_name || row.admin_name, email: row.email, role: row.role, created_at: row.created_at };
  if (row.role === 'user') {
    user.phone = row.phone;
    user.profile = { user_id: row.user_id, username: row.username, fullname: row.fullname, gender: row.gender, dob: row.dob, phone: row.phone };
  } else if (row.role === 'agency') {
    user.profile = { agency_id: row.agency_id, agency_name: row.agency_name, owner_name: row.owner_name, phone: row.phone, experience_years: row.experience_years, overview: row.overview, status: row.status, website_url: row.website_url, trade_license_doc_url: row.trade_license_doc_url, address: { address_id: row.address_id, street_address: row.street_address, thana: row.thana, district: row.district, division: row.division, postal_code: row.postal_code } };
  } else {
    user.profile = { admin_id: row.admin_id, admin_name: row.admin_name, role_level: row.role_level };
  }
  return user;
};

const login = async (req, res) => {
  try {
    const identifier = (req.body.email || req.body.username || '').trim().toLowerCase();
    const { password } = req.body;
    if (!identifier || !password) return res.status(400).json({ success: false, message: 'Email/username and password are required.' });
    const row = await findAccount(identifier);
    if (!row || !(await bcrypt.compare(password, row.password_hash))) return res.status(401).json({ success: false, message: 'Invalid email/username or password.' });
    const user = toUserPayload(row);
    return res.status(200).json({ success: true, message: `Welcome back, ${user.name}!`, token: generateToken({ ...user, name: user.name }), user });
  } catch (error) { return sendDatabaseError(res, error, 'login'); }
};

const getCurrentUser = async (req, res) => {
  try {
    const row = await findAccountById(req.user.id);
    if (!row) return res.status(404).json({ success: false, message: 'User not found.' });
    return res.status(200).json({ success: true, user: toUserPayload(row) });
  } catch (error) { return sendDatabaseError(res, error, 'profile lookup'); }
};

const logout = (req, res) => res.status(200).json({ success: true, message: 'Logged out successfully.' });
module.exports = { signupTraveler, signupAgency, login, getCurrentUser, logout, findAccountById };
