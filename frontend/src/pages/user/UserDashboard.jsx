import React, { useState, useEffect } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { getDestination, getPackage } from '../../data/mockData'
import { listBlogsByAccount, listSaved } from '../../data/store'
import '../../components/layout/DashboardShell.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function useMyBookings() {
  const { account } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadBookings() {
      if (!account?.token) {
        setBookings([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')
      try {
        const response = await fetch(`${API_URL}/bookings/mine`, {
          headers: { Authorization: `Bearer ${account.token}` },
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || 'Failed to load bookings.')
        if (active) setBookings(Array.isArray(data.bookings) ? data.bookings : [])
      } catch (fetchError) {
        if (active) setError(fetchError.message || 'Failed to load bookings.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadBookings()
    return () => { active = false }
  }, [account?.token])

  return { bookings, loading, error }
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', exact: true },
  { to: '/dashboard/bookings', label: 'My Bookings' },
  { to: '/dashboard/saved', label: 'Saved Items' },
  { to: '/dashboard/blogs', label: 'My Blogs' },
  { to: '/dashboard/profile', label: 'Profile' },
]

export default function UserDashboard() {
  const { account } = useAuth()

  return (
    <DashboardShell title={account?.fullname || 'Traveler'} subtitle="Traveler" items={NAV_ITEMS}>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="saved" element={<Saved />} />
        <Route path="blogs" element={<MyBlogs />} />
        <Route path="profile" element={<Profile />} />
      </Routes>
    </DashboardShell>
  )
}

function Overview() {
  const { account } = useAuth()
  const { bookings } = useMyBookings()
  const uid = account?.userID || account?.accountID
  const saved = listSaved(uid)
  const blogs = listBlogsByAccount(account?.accountID)

  return (
    <div>
      <div className="dash-section-title">
        <h1>Welcome back, {(account?.fullname || 'Traveler').split(' ')[0]}</h1>
      </div>
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{bookings.length}</div>
          <div className="stat-label">Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{saved.length}</div>
          <div className="stat-label">Saved Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{blogs.length}</div>
          <div className="stat-label">Blog Posts</div>
        </div>
      </div>

      <div className="card card-pad">
        <h3 style={{ marginTop: 0 }}>Quick actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link to="/destinations" className="btn btn-outline btn-sm">
            Explore Destinations
          </Link>
          <Link to="/packages" className="btn btn-outline btn-sm">
            Browse Packages
          </Link>
          <Link to="/blog/new" className="btn btn-outline btn-sm">
            Write a Blog
          </Link>
        </div>
      </div>
    </div>
  )
}

function Bookings() {
  const { bookings, loading, error } = useMyBookings()

  return (
    <div>
      <div className="dash-section-title">
        <h1>My Bookings</h1>
      </div>
      {loading ? (
        <div className="card card-pad">Loading bookings...</div>
      ) : error ? (
        <div className="form-error-banner">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state card">
          <h3>No bookings yet</h3>
          <p>Book a tour package to see it listed here.</p>
          <Link to="/packages" className="btn btn-primary">
            Browse Packages
          </Link>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Booked</th>
                <th>Group</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const status = String(b.paymentStatus || 'pending')
                const isConfirmed = ['paid', 'confirmed', 'completed'].includes(status.toLowerCase())
                return (
                  <tr key={b.bookingId}>
                    <td>{b.packageTitle}</td>
                    <td>{b.bookingDate ? new Date(b.bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                    <td>{b.groupSize || 1}</td>
                    <td>৳{Number(b.totalAmount || 0).toLocaleString()}</td>
                    <td>
                      <span className={'badge ' + (isConfirmed ? 'badge-success' : 'badge-gold')}>
                        {isConfirmed ? 'Confirmed' : status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Saved() {
  const { account } = useAuth()
  const uid = account?.userID || account?.accountID
  const [saved, setSaved] = useState([])
  const [destinations, setDestinations] = useState([])
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  useEffect(() => {
    async function loadData() {
      setSaved(listSaved(uid))
      try {
        const res = await fetch(`${API_URL}/destinations`)
        const data = await res.json()
        if (res.ok && data.destinations) {
          setDestinations(data.destinations)
        }
      } catch (err) {
        console.error('Failed to load destinations:', err)
      }
    }
    if (uid) {
      loadData()
    }
  }, [uid, API_URL])

  function resolveDest(id) {
    const fromApi = destinations.find((d) => String(d.destinationID || d.destination_id) === String(id))
    if (fromApi) return fromApi
    return getDestination(id)
  }

  return (
    <div>
      <div className="dash-section-title">
        <h1>Saved Items</h1>
      </div>
      {saved.length === 0 ? (
        <div className="empty-state card">
          <h3>Nothing saved yet</h3>
          <p>Save a destination or tour package to find it here later.</p>
        </div>
      ) : (
        <div className="card-grid">
          {saved.map((s) => {
            if (s.type === 'destination') {
              const d = resolveDest(s.id)
              if (!d) return null
              return (
                <Link key={s.id + s.type} to={`/destinations/${d.destinationID || d.destination_id}`} className="item-card">
                  <div className="item-card-media">
                    <img 
                      src={d.image || d.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'} 
                      alt={d.name} 
                    />
                    <span className="badge item-card-badge">Destination</span>
                  </div>
                  <div className="item-card-body">
                    <h3>{d.name}</h3>
                    <span className="item-card-meta">{d.division} Division</span>
                  </div>
                </Link>
              )
            }
            const p = getPackage(s.id)
            if (!p) return null
            const destination = resolveDest(p.destinationID)
            return (
              <Link key={s.id + s.type} to={`/packages/${p.packageID}`} className="item-card">
                <div className="item-card-media">
                  <img 
                    src={destination?.image || destination?.image_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'} 
                    alt={destination?.name || p.title} 
                  />
                  <span className="badge badge-river item-card-badge">Package</span>
                </div>
                <div className="item-card-body">
                  <h3>{p.title}</h3>
                  <span className="item-card-meta">৳{p.price?.toLocaleString()}</span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

function MyBlogs() {
  const { account } = useAuth()
  const blogs = listBlogsByAccount(account?.accountID)

  return (
    <div>
      <div className="dash-section-title">
        <h1>My Blogs</h1>
        <Link to="/blog/new" className="btn btn-primary btn-sm">
          Write a Blog
        </Link>
      </div>
      {blogs.length === 0 ? (
        <div className="empty-state card">
          <h3>You haven't published anything yet</h3>
          <p>Share a trip write-up with other travelers.</p>
        </div>
      ) : (
        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Published</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {blogs.map((b) => (
                <tr key={b.blogID}>
                  <td>{b.title}</td>
                  <td>{b.category}</td>
                  <td>
                    <span className={'badge ' + (b.status === 'published' ? 'badge-success' : 'badge-gold')}>{b.status}</span>
                  </td>
                  <td>{new Date(b.publishDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/blog/${b.blogID}`} className="btn btn-ghost btn-sm">
                      View
                    </Link>
                    <Link to={`/blog/${b.blogID}/edit`} className="btn btn-ghost btn-sm">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function Profile() {
  const { account, logout, updateAccount } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ 
    fullname: account?.fullname || '', 
    phone: account?.phone || '', 
    gender: account?.gender || '', 
    dob: account?.dob || '' 
  })
  const [saved, setSaved] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [saving, setSaving] = useState(false)
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!account?.token) {
      setDeleteError('Please sign in again to update your profile.')
      return
    }

    setSaving(true)
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${account.token}`,
        },
        body: JSON.stringify({
          fullname: form.fullname,
          phone: form.phone,
          gender: form.gender,
          dob: form.dob,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed.')
      }

      const nextSession = JSON.parse(localStorage.getItem('ovizatri.session') || '{}')
      const updatedSession = {
        ...nextSession,
        fullname: form.fullname,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
      }

      localStorage.setItem('ovizatri.session', JSON.stringify(updatedSession))
      updateAccount({
        ...account,
        fullname: form.fullname,
        phone: form.phone,
        gender: form.gender,
        dob: form.dob,
      })

      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (error) {
      setDeleteError(error.message || 'Could not update profile.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm('This will permanently delete your account and all related profile data. This action cannot be undone. Continue?')) {
      return
    }

    try {
      const token = account?.token
      if (!token) {
        throw new Error('You must be signed in to delete your account.')
      }

      const response = await fetch(`${API_URL}/users/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete account.')
      }

      logout()
      navigate('/')
    } catch (error) {
      setDeleteError(error.message || 'Could not delete account.')
    }
  }

  return (
    <div>
      <div className="dash-section-title">
        <h1>Profile</h1>
      </div>
      <div className="card card-pad" style={{ maxWidth: 520 }}>
        {saved && <div className="form-success-banner">Profile updated.</div>}
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="username">Username</label>
            <input id="username" value={account?.username || ''} disabled />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" value={account?.email || ''} disabled />
          </div>
          <div className="field">
            <label htmlFor="fullname">Full name</label>
            <input id="fullname" name="fullname" value={form.fullname} onChange={handleChange} />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="phone">Phone</label>
              <input id="phone" name="phone" value={form.phone} onChange={handleChange} />
            </div>
            <div className="field">
              <label htmlFor="gender">Gender</label>
              <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
          </div>
          <div className="field" style={{ maxWidth: 200 }}>
            <label htmlFor="dob">Date of birth</label>
            <input id="dob" name="dob" type="date" value={form.dob} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card card-pad" style={{ maxWidth: 520, marginTop: 24, borderColor: '#d32f2f' }}>
        <h3 style={{ marginTop: 0, color: '#d32f2f' }}>Danger Zone</h3>
        <p style={{ marginBottom: 16 }}>Permanently delete your traveler account and associated profile data.</p>
        {deleteError && <div className="form-error-banner">{deleteError}</div>}
        <button type="button" className="btn btn-danger" onClick={handleDeleteAccount}>
          Delete Account
        </button>
      </div>
    </div>
  )
}