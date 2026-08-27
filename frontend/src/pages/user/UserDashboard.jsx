import React, { useState } from 'react'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import DashboardShell from '../../components/layout/DashboardShell'
import { useAuth } from '../../context/AuthContext'
import { getDestination, getPackage } from '../../data/mockData'
import { listBlogsByAccount, listBookingsForUser, listSaved } from '../../data/store'
import '../../components/layout/DashboardShell.css'

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
    <DashboardShell title={account.fullname} subtitle="Traveler" items={NAV_ITEMS}>
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
  const bookings = listBookingsForUser(account.userID)
  const saved = listSaved(account.userID)
  const blogs = listBlogsByAccount(account.accountID)

  return (
    <div>
      <div className="dash-section-title">
        <h1>Welcome back, {account.fullname.split(' ')[0]}</h1>
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
  const { account } = useAuth()
  const bookings = listBookingsForUser(account.userID)

  return (
    <div>
      <div className="dash-section-title">
        <h1>My Bookings</h1>
      </div>
      {bookings.length === 0 ? (
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const pkg = getPackage(b.packageID)
                return (
                  <tr key={b.bookingID}>
                    <td>{pkg?.title || b.packageID}</td>
                    <td>{new Date(b.bookingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{b.groupSize || 1}</td>
                    <td>৳{b.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className={'badge ' + (b.paymentStatus === 'paid' ? 'badge-success' : 'badge-gold')}>{b.paymentStatus}</span>
                    </td>
                    <td>
                      <Link to={`/bookings/${b.bookingID}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
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
  const saved = listSaved(account.userID)

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
              const d = getDestination(s.id)
              if (!d) return null
              return (
                <Link key={s.id + s.type} to={`/destinations/${d.destinationID}`} className="item-card">
                  <div className="item-card-media">
                    <img src={d.image} alt={d.name} />
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
            const destination = getDestination(p.destinationID)
            return (
              <Link key={s.id + s.type} to={`/packages/${p.packageID}`} className="item-card">
                <div className="item-card-media">
                  {destination && <img src={destination.image} alt={destination.name} />}
                  <span className="badge badge-river item-card-badge">Package</span>
                </div>
                <div className="item-card-body">
                  <h3>{p.title}</h3>
                  <span className="item-card-meta">৳{p.price.toLocaleString()}</span>
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
  const blogs = listBlogsByAccount(account.accountID)

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
  const { account } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullname: account.fullname, phone: account.phone, gender: account.gender, dob: account.dob })
  const [saved, setSaved] = useState(false)

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    // Profile edits are local-only in this prototype (no backend yet).
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
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
            <input id="username" value={account.username} disabled />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" value={account.email} disabled />
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
          <button type="submit" className="btn btn-primary">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  )
}
