import React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getBlogById, deleteBlog } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import './Blog.css'

export default function BlogDetails() {
  const { blogId } = useParams()
  const navigate = useNavigate()
  const { account } = useAuth()
  const blog = getBlogById(blogId)

  if (!blog) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>Blog post not found</h3>
          <Link to="/blog" className="btn btn-primary">
            Back to Blog
          </Link>
        </div>
      </div>
    )
  }

  const canEdit = account?.accountID === blog.accountID

  function handleDelete() {
    if (!window.confirm('Delete this blog post? This cannot be undone.')) return
    deleteBlog(blog.blogID)
    navigate('/blog')
  }

  return (
    <div className="page container">
      <article className="blog-article">
        <Link to="/blog" className="hint" style={{ display: 'inline-block', marginBottom: 18 }}>
          &larr; Back to Blog
        </Link>
        <span className="badge badge-gold">{blog.category}</span>
        <h1 style={{ marginTop: 12 }}>{blog.title}</h1>
        <div className="blog-article-meta">
          <span>{blog.authorName}</span>
          <span>&middot;</span>
          <span>{new Date(blog.publishDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {blog.status === 'draft' && <span className="badge badge-error">Draft</span>}
        </div>

        {blog.image_url && (
          <div className="blog-article-media">
            <img src={blog.image_url} alt={blog.title} />
          </div>
        )}

        <div className="blog-article-body">{blog.content}</div>

        {canEdit && (
          <div style={{ display: 'flex', gap: 10, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--line)' }}>
            <Link to={`/blog/${blog.blogID}/edit`} className="btn btn-outline">
              Edit Post
            </Link>
            <button className="btn btn-danger" onClick={handleDelete}>
              Delete Post
            </button>
          </div>
        )}
      </article>
    </div>
  )
}
