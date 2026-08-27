import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import kuakata from '../../assets/images/kuakata.jpg'
import './Auth.css'

const initialForm = {
  fullname: '',
  username: '',
  email: '',
  phone: '',
  gender: '',
  dob: '',
  password: '',
  confirmPassword: '',
}

export default function UserSignUp() {
  const { signUpUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  function handleChange(e) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  function validate() {
    const next = {}
    if (!form.fullname.trim()) next.fullname = 'Full name is required.'
    if (!form.username.trim()) next.username = 'Choose a username.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address.'
    if (!/^\+?[0-9\- ]{7,15}$/.test(form.phone)) next.phone = 'Enter a valid phone number.'
    if (!form.gender) next.gender = 'Select a gender.'
    if (!form.dob) next.dob = 'Date of birth is required.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.'
    return next
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    const result = await signUpUser(form)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-card wide">
          <p className="eyebrow">Traveler</p>
          <h1>Create your account</h1>
          <p className="auth-sub">Save destinations, book tour packages and publish your own travel blogs.</p>

          {formError && <div className="form-error-banner">{formError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-row">
              <div className="field">
                <label htmlFor="fullname">Full name</label>
                <input id="fullname" name="fullname" value={form.fullname} onChange={handleChange} placeholder="Nusrat Hossain" />
                {errors.fullname && <span className="field-error">{errors.fullname}</span>}
              </div>
              <div className="field">
                <label htmlFor="username">Username</label>
                <input id="username" name="username" value={form.username} onChange={handleChange} placeholder="nusrat.h" />
                {errors.username && <span className="field-error">{errors.username}</span>}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+8801XXXXXXXXX" />
                {errors.phone && <span className="field-error">{errors.phone}</span>}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
                {errors.gender && <span className="field-error">{errors.gender}</span>}
              </div>
              <div className="field">
                <label htmlFor="dob">Date of birth</label>
                <input id="dob" name="dob" type="date" value={form.dob} onChange={handleChange} />
                {errors.dob && <span className="field-error">{errors.dob}</span>}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="At least 8 characters" />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Create Account
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/signin">Sign in</Link>
          </p>
          <p className="auth-switch">
            Registering a tour agency? <Link to="/agency/signup">Sign up as an agency</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <img src={kuakata} alt="" />
        <div className="auth-side-scrim">
          <blockquote>&ldquo;Open views of both sunrise and sunset over the Bay of Bengal.&rdquo;</blockquote>
        </div>
      </div>
    </div>
  )
}
