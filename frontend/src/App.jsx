import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ProtectedRoute from './components/common/ProtectedRoute'

import Home from './pages/Home'
import NotFound from './pages/NotFound'

import UserSignIn from './pages/auth/UserSignIn'
import UserSignUp from './pages/auth/UserSignUp'
import AgencySignIn from './pages/auth/AgencySignIn'
import AgencySignUp from './pages/auth/AgencySignUp'
import AdminSignIn from './pages/auth/AdminSignIn'

import DestinationList from './pages/destinations/DestinationList'
import DestinationDetails from './pages/destinations/DestinationDetails'

import PackageList from './pages/packages/PackageList'
import PackageDetails from './pages/packages/PackageDetails'

import BookingFlow from './pages/booking/BookingFlow'
import BookingDetails from './pages/booking/BookingDetails'

import BlogList from './pages/blog/BlogList'
import BlogDetails from './pages/blog/BlogDetails'
import BlogEditor from './pages/blog/BlogEditor'

import UserDashboard from './pages/user/UserDashboard'

import AgencyDashboard from './pages/agency/AgencyDashboard'
import AgencyPackageManagement from './pages/agency/AgencyPackageManagement'
import AgencyPackageForm from './pages/agency/AgencyPackageForm'
import AgencyProfile from './pages/agency/AgencyProfile'

import AdminDashboard from './pages/admin/AdminDashboard'
import AgencyAuditLog from './pages/admin/AgencyAuditLog'
import AdminAgencies from './pages/admin/AdminAgencies'

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />

          {/* Auth */}
          <Route path="/signin" element={<UserSignIn />} />
          <Route path="/signup" element={<UserSignUp />} />
          <Route path="/agency/signin" element={<AgencySignIn />} />
          <Route path="/agency/signup" element={<AgencySignUp />} />
          <Route path="/admin/signin" element={<AdminSignIn />} />

          {/* Destinations */}
          <Route path="/destinations" element={<DestinationList />} />
          <Route path="/destinations/:destinationId" element={<DestinationDetails />} />

          {/* Tour packages */}
          <Route path="/packages" element={<PackageList />} />
          <Route path="/packages/:packageId" element={<PackageDetails />} />

          {/* Booking */}
          <Route
            path="/booking/:packageId"
            element={
              <ProtectedRoute role="user">
                <BookingFlow />
              </ProtectedRoute>
            }
          />
          <Route
            path="/bookings/:bookingId"
            element={
              <ProtectedRoute role="user">
                <BookingDetails />
              </ProtectedRoute>
            }
          />

          {/* Blog */}
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:blogId" element={<BlogDetails />} />
          <Route
            path="/blog/new"
            element={
              <ProtectedRoute role="user">
                <BlogEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blog/:blogId/edit"
            element={
              <ProtectedRoute role="user">
                <BlogEditor />
              </ProtectedRoute>
            }
          />

          {/* Traveler dashboard */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute role="user">
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          {/* Agency */}
          <Route
            path="/agency/dashboard"
            element={
              <ProtectedRoute role="agency">
                <AgencyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/packages"
            element={
              <ProtectedRoute role="agency">
                <AgencyPackageManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/packages/new"
            element={
              <ProtectedRoute role="agency">
                <AgencyPackageForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/packages/:packageId/edit"
            element={
              <ProtectedRoute role="agency">
                <AgencyPackageForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/agency/profile"
            element={
              <ProtectedRoute role="agency">
                <AgencyProfile />
              </ProtectedRoute>
            }
          />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/agencies"
            element={
              <ProtectedRoute role="admin">
                <AdminAgencies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-log"
            element={
              <ProtectedRoute role="admin">
                <AgencyAuditLog />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
