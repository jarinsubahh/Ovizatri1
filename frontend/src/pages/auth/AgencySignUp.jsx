import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import bichanakandi from '../../assets/images/bichanakandi.jpg'
import './Auth.css'

const initialForm = {
  agencyName: '',
  ownerName: '',
  email: '',
  phone: '',
  experience_years: '',
  websiteUrl: '',
  overview: '',
  street_address: '',
  thana: '',
  district: '',
  division: '',
  postalCode: '',
  tradeLicenseFileName: '',
  password: '',
  confirmPassword: '',
  agree: false,
}

const DIVISIONS = ['Dhaka', 'Chattogram', 'Khulna', 'Rajshahi', 'Rangpur', 'Barishal', 'Sylhet', 'Mymensingh']

export default function AgencySignUp() {
  const { signUpAgency } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function handleFile(e) {
    const file = e.target.files?.[0]
    setForm((f) => ({ ...f, tradeLicenseFileName: file ? file.name : '' }))
  }

  function validate() {
    const next = {}
    if (!form.agencyName.trim()) next.agencyName = 'Agency name is required.'
    if (!form.ownerName.trim()) next.ownerName = "Owner's name is required."
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid business email.'
    if (!/^\+?[0-9\- ]{7,15}$/.test(form.phone)) next.phone = 'Enter a valid phone number.'
    if (!form.division) next.division = 'Select a division.'
    if (!form.district.trim()) next.district = 'District is required.'
    if (!form.tradeLicenseFileName) next.tradeLicenseFileName = 'Upload your trade license document.'
    if (form.password.length < 8) next.password = 'Use at least 8 characters.'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords do not match.'
    if (!form.agree) next.agree = 'You must confirm the details are accurate.'
    return next
  }

  function handleSubmit(e) {
    e.preventDefault()
    setFormError('')
    const validation = validate()
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    const result = signUpAgency(form)
    if (!result.ok) {
      setFormError(result.error)
      return
    }
    navigate('/agency/dashboard', { replace: true })
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-card wide">
          <p className="eyebrow">Agency</p>
          <h1>Register your agency</h1>
          <p className="auth-sub">
            Registration details are reviewed by OVIZATRI admins before your agency status changes to verified.
          </p>

          {formError && <div className="form-error-banner">{formError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="field-row">
              <div className="field">
                <label htmlFor="agencyName">Agency name</label>
                <input id="agencyName" name="agencyName" value={form.agencyName} onChange={handleChange} placeholder="Bengal Trails" />
                {errors.agencyName && <span className="field-error">{errors.agencyName}</span>}
              </div>
              <div className="field">
                <label htmlFor="ownerName">Owner name</label>
                <input id="ownerName" name="ownerName" value={form.ownerName} onChange={handleChange} placeholder="Rafiqul Islam" />
                {errors.ownerName && <span className="field-error">{errors.ownerName}</span>}
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="email">Business email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="contact@youragency.com" />
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
                <label htmlFor="experience_years">Years of experience</label>
                <input id="experience_years" name="experience_years" type="number" min="0" value={form.experience_years} onChange={handleChange} placeholder="5" />
              </div>
              <div className="field">
                <label htmlFor="websiteUrl">Website (optional)</label>
                <input id="websiteUrl" name="websiteUrl" value={form.websiteUrl} onChange={handleChange} placeholder="https://youragency.com" />
              </div>
            </div>

            <div className="field">
              <label htmlFor="overview">Agency overview</label>
              <textarea id="overview" name="overview" rows={3} value={form.overview} onChange={handleChange} placeholder="What kind of tours does your agency run, and where?" />
            </div>

            <div className="eyebrow" style={{ marginTop: 6 }}>
              Registered address
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="street_address">Street address</label>
                <input id="street_address" name="street_address" value={form.street_address} onChange={handleChange} placeholder="House / road / area" />
              </div>
              <div className="field">
                <label htmlFor="thana">Thana</label>
                <input id="thana" name="thana" value={form.thana} onChange={handleChange} />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label htmlFor="district">District</label>
                <input id="district" name="district" value={form.district} onChange={handleChange} placeholder="Dhaka" />
                {errors.district && <span className="field-error">{errors.district}</span>}
              </div>
              <div className="field">
                <label htmlFor="division">Division</label>
                <select id="division" name="division" value={form.division} onChange={handleChange}>
                  <option value="">Select</option>
                  {DIVISIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                {errors.division && <span className="field-error">{errors.division}</span>}
              </div>
            </div>
            <div className="field" style={{ maxWidth: 220 }}>
              <label htmlFor="postalCode">Postal code</label>
              <input id="postalCode" name="postalCode" value={form.postalCode} onChange={handleChange} />
            </div>

            <div className="field">
              <label htmlFor="tradeLicense">Trade license document</label>
              <input id="tradeLicense" name="tradeLicense" type="file" accept=".pdf,.jpg,.png" onChange={handleFile} />
              <span className="hint">PDF or image of your registered trade license.</span>
              {errors.tradeLicenseFileName && <span className="field-error">{errors.tradeLicenseFileName}</span>}
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" value={form.password} onChange={handleChange} />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} />
                {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
              </div>
            </div>

            <label className="auth-check">
              <input type="checkbox" name="agree" checked={form.agree} onChange={handleChange} />
              <span>I confirm the agency and license information provided is accurate.</span>
            </label>
            {errors.agree && <span className="field-error">{errors.agree}</span>}

            <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: 18 }}>
              Submit for Review
            </button>
          </form>

          <p className="auth-switch">
            Already registered? <Link to="/agency/signin">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <img src={bichanakandi} alt="" />
        <div className="auth-side-scrim">
          <blockquote>&ldquo;Clear hill streams running over boulders at the foot of the Khasi Hills.&rdquo;</blockquote>
        </div>
      </div>
    </div>
  )
}
