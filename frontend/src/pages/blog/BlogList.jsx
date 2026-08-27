import React, { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listBlogs } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import './Blog.css'

export default function BlogList() {
  const { account, role } = useAuth()
  const [query, setQuery] = useState('')
  const blogs = listBlogs().filter((b) => b.status === 'published')

  const filtered = useMemo(
    () => blogs.filter((b) => !query.trim() || b.title.toLowerCase().includes(query.toLowerCase()) || b.category.toLowerCase().includes(query.toLowerCase())),
    [blogs, query]
  )

  return (
    <div className="page container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <p className="eyebrow">Stories</p>
          <h1>Travel blog</h1>
          <p className="section-lead">Notes from travelers who have already made the trip.</p>
        </div>
        {role === 'user' && (
          <Link to="/blog/new" className="btn btn-primary">
            Write a Blog
          </Link>
        )}
      </div>

      <div className="filter-bar">
        <input type="text" placeholder="Search blogs..." value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Search blogs" />
        <span className="filter-count">{filtered.length} post{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No blog posts yet</h3>
          <p>Be the first traveler to share your trip.</p>
        </div>
      ) : (
        <div className="card-grid">
          {filtered.map((b) => (
            <Link to={`/blog/${b.blogID}`} key={b.blogID} className="blog-card">
              {b.image_url && (
                <div className="blog-card-media">
                  <img src={b.image_url} alt={b.title} />
                </div>
              )}
              <div className="blog-card-body">
                <span className="badge">{b.category}</span>
                <h3>{b.title}</h3>
                <p className="blog-card-excerpt">{b.content}</p>
                <span className="blog-card-meta">
                  {b.authorName} &middot; {new Date(b.publishDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
