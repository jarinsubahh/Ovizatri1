import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createBlog, getBlogById, updateBlog } from '../../data/store'
import { useAuth } from '../../context/AuthContext'
import './Blog.css'

const CATEGORIES = ['Hills', 'Beach', 'Wildlife', 'Rivers', 'Food', 'Culture', 'General']

const emptyForm = { title: '', category: 'General', content: '', image_url: '', status: 'published' }

export default function BlogEditor() {
  const { blogId } = useParams()
  const navigate = useNavigate()
  const { account } = useAuth()
  const isEdit = Boolean(blogId)
  const existing = isEdit ? getBlogById(blogId) : null

  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')

  useEffect(() => {
    if (existing) {
      setForm({
        title: existing.title,
        category: existing.category,
        content: existing.content,
        image_url: existing.image_url || '',
        status: existing.status,
      })
    }
  }, [existing]) // eslint-disable-line react-hooks/exhaustive-deps

  if (isEdit && !existing) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>Blog post not found</h3>
        </div>
      </div>
    )
  }

  if (isEdit && existing.accountID !== account.accountID) {
    return (
      <div className="page container">
        <div className="empty-state">
          <h3>You can only edit your own posts</h3>
        </div>
      </div>
    )
  }

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError('Title and content are required.')
      return
    }
    setError('')

    if (isEdit) {
      updateBlog(existing.blogID, form)
      navigate(`/blog/${existing.blogID}`)
    } else {
      const record = createBlog({ ...form, accountID: account.accountID, authorName: account.fullname })
      navigate(`/blog/${record.blogID}`)
    }
  }

  return (
    <div className="page container">
      <div className="blog-article">
        <div className="page-header">
          <p className="eyebrow">{isEdit ? 'Edit Post' : 'New Post'}</p>
          <h1>{isEdit ? 'Edit your blog post' : 'Write a blog post'}</h1>
        </div>

        {error && <div className="form-error-banner">{error}</div>}

        <form onSubmit={handleSubmit} className="blog-editor-form">
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="Give your post a title" />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="category">Category</label>
              <select id="category" name="category" value={form.category} onChange={handleChange}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="status">Status</label>
              <select id="status" name="status" value={form.status} onChange={handleChange}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="image_url">Cover image URL (optional)</label>
            <input id="image_url" name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://..." />
            <span className="hint">Leave blank to publish without a cover image.</span>
          </div>

          <div className="field">
            <label htmlFor="content">Content</label>
            <textarea id="content" name="content" value={form.content} onChange={handleChange} placeholder="Share what the trip was actually like..." />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEdit ? 'Save Changes' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
