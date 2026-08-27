// ============================================================================
// Lightweight localStorage-backed store for mutable demo data.
//
// This stands in for API calls to the (future) backend. Every function here
// is a natural candidate to become a `fetch('/api/...')` call once the
// PostgreSQL-backed API exists — the rest of the app only imports from this
// file and mockData.js, so swapping the implementation later shouldn't
// require touching page components.
// ============================================================================

import { seedBookings, blogs as seedBlogs, tourPackages as seedPackages, tourSchedules as seedSchedules } from './mockData'

const KEYS = {
  bookings: 'ovizatri.bookings',
  saved: 'ovizatri.saved',
  blogs: 'ovizatri.blogs',
  packages: 'ovizatri.packages',
  schedules: 'ovizatri.schedules',
  auditLog: 'ovizatri.auditLog',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  return value
}

function ensureSeeded() {
  if (!localStorage.getItem(KEYS.bookings)) write(KEYS.bookings, seedBookings)
  if (!localStorage.getItem(KEYS.saved)) write(KEYS.saved, [])
  if (!localStorage.getItem(KEYS.blogs)) write(KEYS.blogs, seedBlogs)
  if (!localStorage.getItem(KEYS.packages)) write(KEYS.packages, seedPackages)
  if (!localStorage.getItem(KEYS.schedules)) write(KEYS.schedules, seedSchedules)
  if (!localStorage.getItem(KEYS.auditLog)) {
    write(KEYS.auditLog, [
      { id: 'AUD-01', agencyID: 'AGN-03', adminID: 'ADM-01', notes: 'Trade license document received and queued for review.', timeStamp: '2026-08-10T09:15:00', status_changed_to: 'pending_review' },
      { id: 'AUD-02', agencyID: 'AGN-01', adminID: 'ADM-01', notes: 'License verified against RJSC records.', timeStamp: '2026-03-02T11:40:00', status_changed_to: 'verified' },
      { id: 'AUD-03', agencyID: 'AGN-02', adminID: 'ADM-01', notes: 'Annual re-verification completed.', timeStamp: '2026-01-18T16:05:00', status_changed_to: 'verified' },
    ])
  }
}

ensureSeeded()

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------
export function listBookings() {
  return read(KEYS.bookings, seedBookings)
}

export function getBooking(bookingID) {
  return listBookings().find((b) => b.bookingID === bookingID)
}

export function listBookingsForUser(userID) {
  return listBookings().filter((b) => b.userID === userID)
}

export function createBooking(booking) {
  const bookings = listBookings()
  const nextID = `BKG-${1000 + bookings.length + 1}`
  const record = { bookingID: nextID, paymentStatus: 'pending', ...booking }
  const updated = [...bookings, record]
  write(KEYS.bookings, updated)
  return record
}

export function recordPayment(bookingID, payment) {
  const bookings = listBookings().map((b) =>
    b.bookingID === bookingID
      ? { ...b, paymentStatus: 'paid', payment: { paymentID: `PMT-${Math.floor(Math.random() * 9000) + 1000}`, timestamp: new Date().toISOString(), ...payment } }
      : b
  )
  write(KEYS.bookings, bookings)
  return bookings.find((b) => b.bookingID === bookingID)
}

// ---------------------------------------------------------------------------
// Saved destinations / packages
// ---------------------------------------------------------------------------
export function listSaved(userID) {
  return read(KEYS.saved, []).filter((s) => s.userID === userID)
}

export function isSaved(userID, type, id) {
  return read(KEYS.saved, []).some((s) => s.userID === userID && s.type === type && s.id === id)
}

export function toggleSaved(userID, type, id) {
  const saved = read(KEYS.saved, [])
  const exists = saved.find((s) => s.userID === userID && s.type === type && s.id === id)
  const updated = exists
    ? saved.filter((s) => !(s.userID === userID && s.type === type && s.id === id))
    : [...saved, { userID, type, id, savedAt: new Date().toISOString() }]
  write(KEYS.saved, updated)
  return !exists
}

// ---------------------------------------------------------------------------
// Blogs
// ---------------------------------------------------------------------------
export function listBlogs() {
  return read(KEYS.blogs, seedBlogs)
}

export function getBlogById(id) {
  return listBlogs().find((b) => b.blogID === id)
}

export function listBlogsByAccount(accountID) {
  return listBlogs().filter((b) => b.accountID === accountID)
}

export function createBlog(blog) {
  const blogsList = listBlogs()
  const nextID = `BLG-${String(blogsList.length + 1).padStart(2, '0')}`
  const record = { blogID: nextID, status: 'published', publishDate: new Date().toISOString().slice(0, 10), ...blog }
  write(KEYS.blogs, [record, ...blogsList])
  return record
}

export function updateBlog(id, changes) {
  const updated = listBlogs().map((b) => (b.blogID === id ? { ...b, ...changes } : b))
  write(KEYS.blogs, updated)
  return updated.find((b) => b.blogID === id)
}

export function deleteBlog(id) {
  write(KEYS.blogs, listBlogs().filter((b) => b.blogID !== id))
}

// ---------------------------------------------------------------------------
// Tour packages & schedules (agency-managed)
// ---------------------------------------------------------------------------
export function listPackages() {
  return read(KEYS.packages, seedPackages)
}

export function listPackagesByAgency(agencyID) {
  return listPackages().filter((p) => p.agencyID === agencyID)
}

export function getPackageById(id) {
  return listPackages().find((p) => p.packageID === id)
}

export function createPackage(pkg) {
  const packages = listPackages()
  const nextID = `PKG-${String(packages.length + 1).padStart(2, '0')}`
  const record = { packageID: nextID, amenityIDs: [], discount: 0, ...pkg }
  write(KEYS.packages, [...packages, record])
  return record
}

export function updatePackage(id, changes) {
  const updated = listPackages().map((p) => (p.packageID === id ? { ...p, ...changes } : p))
  write(KEYS.packages, updated)
  return updated.find((p) => p.packageID === id)
}

export function deletePackage(id) {
  write(KEYS.packages, listPackages().filter((p) => p.packageID !== id))
}

export function listSchedules() {
  return read(KEYS.schedules, seedSchedules)
}

export function listSchedulesForPackage(packageID) {
  return listSchedules().filter((s) => s.packageID === packageID)
}

export function createSchedule(schedule) {
  const schedules = listSchedules()
  const nextID = `SCH-${String(schedules.length + 1).padStart(2, '0')}`
  const record = { scheduleID: nextID, ...schedule }
  write(KEYS.schedules, [...schedules, record])
  return record
}

// ---------------------------------------------------------------------------
// Agency audit log
// ---------------------------------------------------------------------------
export function listAuditLog() {
  return read(KEYS.auditLog, [])
}

export function listAuditLogForAgency(agencyID) {
  return listAuditLog().filter((a) => a.agencyID === agencyID)
}

export function addAuditEntry(entry) {
  const log = listAuditLog()
  const nextID = `AUD-${String(log.length + 1).padStart(2, '0')}`
  const record = { id: nextID, timeStamp: new Date().toISOString(), ...entry }
  write(KEYS.auditLog, [record, ...log])
  return record
}
