// ============================================================================
// Mock / static data for the OVIZATRI frontend.
//
// Shapes mirror the ERD entities (ACCOUNT, USER, AGENCY, ADMIN, ADDRESS,
// DESTINATION, TOUR_PACKAGE, TOUR_SCHEDULE, ITINERARY, ITINERARY_DAY,
// DAY_ACTIVITY, AMENITY, BOOKING, PAYMENT, REVIEW, BLOG, AGENCY_AUDIT_LOG)
// so that swapping this module for real API calls later is a drop-in
// replacement rather than a rewrite.
//
// Images: only the 5 photographs supplied for the project are used, each
// mapped to the real Bangladeshi destination it depicts.
// ============================================================================

import kuakata from '../assets/images/kuakata.jpg'
import sajekValley from '../assets/images/sajekvalley.jpg'
import bichanakandi from '../assets/images/bichanakandi.jpg'
import sundarban from '../assets/images/sundarban.jpg'
import coxsbazar from '../assets/images/coxsbazar.jpg'

export const heroImages = [kuakata, sajekValley, bichanakandi, sundarban, coxsbazar]

// ---------------------------------------------------------------------------
// ADDRESS
// ---------------------------------------------------------------------------
export const addresses = [
  { addressID: 'ADR-01', street_address: 'House 14, Road 6', thana: 'Dhanmondi', district: 'Dhaka', division: 'Dhaka', postalCode: '1209' },
  { addressID: 'ADR-02', street_address: 'Plot 22, Sea Beach Road', thana: 'Kolatoli', district: "Cox's Bazar", division: 'Chattogram', postalCode: '4700' },
  { addressID: 'ADR-03', street_address: 'Zindabazar Point', thana: 'Kotwali', district: 'Sylhet', division: 'Sylhet', postalCode: '3100' },
]

// ---------------------------------------------------------------------------
// DESTINATION — grounded in the 5 supplied photographs only
// ---------------------------------------------------------------------------
export const destinations = [
  {
    destinationID: 'DST-01',
    name: "Kuakata Beach",
    division: 'Barishal',
    category: 'Beach',
    description:
      'A wide, unbroken sea beach on the Patuakhali coast known for open views of both sunrise and sunset over the Bay of Bengal, and the fishing boats that line its shore at dusk.',
    avgRating: 4.5,
    image: kuakata,
  },
  {
    destinationID: 'DST-02',
    name: 'Sajek Valley',
    division: 'Chattogram',
    category: 'Hills',
    description:
      'A hill valley in Rangamati along the border with Mizoram, sitting above the cloud line, with terraced cottages overlooking the Kasalong reserve forest.',
    avgRating: 4.7,
    image: sajekValley,
  },
  {
    destinationID: 'DST-03',
    name: 'Bichanakandi',
    division: 'Sylhet',
    category: 'Rivers',
    description:
      'A stone-collecting point at the foot of the Khasi Hills near the India border, where clear hill streams run over boulders against a backdrop of the Meghalaya range.',
    avgRating: 4.4,
    image: bichanakandi,
  },
  {
    destinationID: 'DST-04',
    name: 'Sundarbans',
    division: 'Khulna',
    category: 'Mangrove Forest',
    description:
      "The world's largest contiguous mangrove forest and home to the Bengal tiger, explored by boat along its tidal channels and creeks.",
    avgRating: 4.8,
    image: sundarban,
  },
  {
    destinationID: 'DST-05',
    name: "Cox's Bazar",
    division: 'Chattogram',
    category: 'Beach',
    description:
      "The longest natural sea beach in the world, a coastal strip backed by palm groves, with Kolatoli and Laboni among its most visited points.",
    avgRating: 4.6,
    image: coxsbazar,
  },
]

// ---------------------------------------------------------------------------
// ACCOUNT / AGENCY — agencies are subtypes of ACCOUNT (isA)
// ---------------------------------------------------------------------------
export const agencies = [
  {
    agencyID: 'AGN-01',
    accountID: 'ACC-A01',
    agencyName: 'Bengal Trails',
    ownerName: 'Rafiqul Islam',
    phone: '+8801711-223344',
    logo_url: null,
    experience_years: 9,
    overview: 'A Dhaka-based operator running small-group departures to the hill and forest regions of Bangladesh since 2016.',
    status: 'verified',
    websiteUrl: 'https://bengaltrails.example.com',
    tradeLicenseDoc_URL: '/docs/trade-license-bengal-trails.pdf',
  },
  {
    agencyID: 'AGN-02',
    accountID: 'ACC-A02',
    agencyName: 'Sundarban Eco Tours',
    ownerName: 'Shirin Akter',
    phone: '+8801819-556677',
    logo_url: null,
    experience_years: 12,
    overview: 'Khulna-registered launch operator specialising in Sundarbans wildlife and mangrove-channel itineraries.',
    status: 'verified',
    websiteUrl: 'https://sundarbanecotours.example.com',
    tradeLicenseDoc_URL: '/docs/trade-license-sundarban-eco.pdf',
  },
  {
    agencyID: 'AGN-03',
    accountID: 'ACC-A03',
    agencyName: 'Coastal Route Holidays',
    ownerName: 'Tanvir Ahmed',
    phone: '+8801912-334455',
    logo_url: null,
    experience_years: 5,
    overview: "Coastal beach-tour agency covering Cox's Bazar and Kuakata departures from Chattogram and Dhaka.",
    status: 'pending_review',
    websiteUrl: 'https://coastalroute.example.com',
    tradeLicenseDoc_URL: '/docs/trade-license-coastal-route.pdf',
  },
]

// ---------------------------------------------------------------------------
// AMENITY
// ---------------------------------------------------------------------------
export const amenities = [
  { amenityID: 'AMN-01', name: 'AC Transport', type: 'Transport' },
  { amenityID: 'AMN-02', name: 'Shared Accommodation', type: 'Stay' },
  { amenityID: 'AMN-03', name: 'All Meals Included', type: 'Meals' },
  { amenityID: 'AMN-04', name: 'Local Guide', type: 'Guide' },
  { amenityID: 'AMN-05', name: 'Boat / Launch Transfer', type: 'Transport' },
  { amenityID: 'AMN-06', name: 'Entry Permits & Fees', type: 'Documentation' },
]

// ---------------------------------------------------------------------------
// TOUR_PACKAGE (belongs_to DESTINATION, offered by AGENCY, includes AMENITY)
// ---------------------------------------------------------------------------
export const tourPackages = [
  {
    packageID: 'PKG-01',
    destinationID: 'DST-02',
    agencyID: 'AGN-01',
    title: 'Sajek Valley Cloud Retreat',
    price: 6500,
    duration: 3,
    maxSeat: 20,
    discount: 10,
    amenityIDs: ['AMN-01', 'AMN-02', 'AMN-03', 'AMN-04'],
    description:
      'Three days among Sajek\'s terraced cottages, with a sunrise viewpoint hike on Konglak Hill and a full day at leisure above the cloud line.',
  },
  {
    packageID: 'PKG-02',
    destinationID: 'DST-04',
    agencyID: 'AGN-02',
    title: 'Sundarbans Wildlife Cruise',
    price: 12000,
    duration: 3,
    maxSeat: 16,
    discount: 0,
    amenityIDs: ['AMN-02', 'AMN-03', 'AMN-04', 'AMN-05', 'AMN-06'],
    description:
      'A three-day launch cruise through the mangrove channels of the Sundarbans, with forest-department-permitted canal cruising and watchtower stops.',
  },
  {
    packageID: 'PKG-03',
    destinationID: 'DST-05',
    agencyID: 'AGN-03',
    title: "Cox's Bazar Coastal Getaway",
    price: 5200,
    duration: 2,
    maxSeat: 30,
    discount: 15,
    amenityIDs: ['AMN-01', 'AMN-02', 'AMN-03'],
    description:
      "A relaxed two-day stay along Kolatoli beach with a sunset walk and an optional half-day trip to Himchari and Inani.",
  },
  {
    packageID: 'PKG-04',
    destinationID: 'DST-01',
    agencyID: 'AGN-03',
    title: 'Kuakata Sunrise & Sunset Tour',
    price: 4800,
    duration: 2,
    maxSeat: 25,
    discount: 0,
    amenityIDs: ['AMN-01', 'AMN-03', 'AMN-04'],
    description:
      'Two days on the Kuakata coast, timed around both the sunrise and sunset viewing points, with a stop at Fatrar Char mangrove char.',
  },
  {
    packageID: 'PKG-05',
    destinationID: 'DST-03',
    agencyID: 'AGN-01',
    title: 'Bichanakandi & Sylhet Hill Streams',
    price: 3900,
    duration: 1,
    maxSeat: 12,
    discount: 0,
    amenityIDs: ['AMN-01', 'AMN-04', 'AMN-05'],
    description:
      'A single-day trip by boat and open jeep to the stone quarry streams of Bichanakandi at the foot of the Khasi Hills.',
  },
]

// ---------------------------------------------------------------------------
// TOUR_SCHEDULE
// ---------------------------------------------------------------------------
export const tourSchedules = [
  { scheduleID: 'SCH-01', packageID: 'PKG-01', departureDate: '2026-10-02', returnDate: '2026-10-05' },
  { scheduleID: 'SCH-02', packageID: 'PKG-01', departureDate: '2026-10-16', returnDate: '2026-10-19' },
  { scheduleID: 'SCH-03', packageID: 'PKG-02', departureDate: '2026-11-06', returnDate: '2026-11-09' },
  { scheduleID: 'SCH-04', packageID: 'PKG-03', departureDate: '2026-09-19', returnDate: '2026-09-21' },
  { scheduleID: 'SCH-05', packageID: 'PKG-04', departureDate: '2026-09-26', returnDate: '2026-09-28' },
  { scheduleID: 'SCH-06', packageID: 'PKG-05', departureDate: '2026-10-10', returnDate: '2026-10-10' },
]

// ---------------------------------------------------------------------------
// ACCOUNT / USER (traveler) — demo login only
// ---------------------------------------------------------------------------
export const demoUsers = [
  {
    accountID: 'ACC-U01',
    accountType: 'user',
    email: 'traveler@ovizatri.test',
    password: 'password123',
    userID: 'USR-01',
    username: 'nusrat.h',
    fullname: 'Nusrat Hossain',
    gender: 'Female',
    dob: '1998-04-12',
    phone: '+8801611-887766',
    pfp_url: null,
  },
]

export const demoAdmins = [
  {
    accountID: 'ACC-AD01',
    accountType: 'admin',
    email: 'admin@ovizatri.test',
    password: 'admin123',
    adminID: 'ADM-01',
    adminName: 'Site Administrator',
    roleLevel: 'super_admin',
  },
]

// Agency demo login pairs with the agencies[] list above.
export const demoAgencyAccounts = [
  { accountID: 'ACC-A01', accountType: 'agency', email: 'contact@bengaltrails.example.com', password: 'agency123', agencyID: 'AGN-01' },
]

// ---------------------------------------------------------------------------
// REVIEW (reviews TOUR_PACKAGE, written by USER)
// ---------------------------------------------------------------------------
export const reviews = [
  { reviewID: 'RVW-01', packageID: 'PKG-01', userID: 'USR-01', reviewerName: 'Nusrat H.', rating: 5, comment: 'Woke up above the clouds on day two — the cottage view alone was worth the trip.', reviewDate: '2026-06-14' },
  { reviewID: 'RVW-02', packageID: 'PKG-01', userID: 'USR-02', reviewerName: 'Kamal R.', rating: 4, comment: 'Good itinerary, though the jeep ride up is rougher than expected. Bring a light jacket.', reviewDate: '2026-05-30' },
  { reviewID: 'RVW-03', packageID: 'PKG-02', userID: 'USR-03', reviewerName: 'Farhana A.', rating: 5, comment: 'Our guide spotted deer and a monitor lizard from the launch. Very well organised permits.', reviewDate: '2026-04-22' },
  { reviewID: 'RVW-04', packageID: 'PKG-03', userID: 'USR-04', reviewerName: 'Imran K.', rating: 4, comment: 'Beach was clean and the hotel was close to Kolatoli point. Would book again for a short trip.', reviewDate: '2026-07-01' },
  { reviewID: 'RVW-05', packageID: 'PKG-04', userID: 'USR-05', reviewerName: 'Sabrina T.', rating: 5, comment: 'Caught both the sunrise and sunset in one trip exactly as promised.', reviewDate: '2026-03-11' },
]

// ---------------------------------------------------------------------------
// BLOG (written by an ACCOUNT)
// ---------------------------------------------------------------------------
export const blogs = [
  {
    blogID: 'BLG-01',
    accountID: 'ACC-U01',
    authorName: 'Nusrat Hossain',
    title: 'Three days in Sajek: what the itineraries don\u2019t tell you',
    category: 'Hills',
    status: 'published',
    publishDate: '2026-06-20',
    image_url: sajekValley,
    content:
      "The road up to Sajek closes to unescorted traffic outside of the army convoy windows, so timing your departure from Khagrachari matters more than most package listings mention. We left Dhaka the night before, caught the 10am convoy, and were on the ridge by early afternoon with enough light left for the Konglak Hill viewpoint. Mornings are the reason to come: the valley fills with cloud below the cottages until around nine, and it clears in patches rather than all at once. Pack a light jacket even in the warmer months \u2014 the elevation makes a real difference after sunset, and most homestays only offer a single quilt."
  },
  {
    blogID: 'BLG-02',
    accountID: 'ACC-U01',
    authorName: 'Nusrat Hossain',
    title: 'A slower route through the Sundarbans',
    category: 'Wildlife',
    status: 'published',
    publishDate: '2026-05-02',
    image_url: sundarban,
    content:
      "Most three-day cruises follow the same loop through the eastern channels, and there is a reason for that \u2014 the watchtowers along this stretch give the best odds of a sighting. We didn't see a tiger, which our guide was upfront about from the start; spotted deer, macaques and a saltwater crocodile were the highlights instead. What stayed with me was the sound at dusk, when the launch engine cuts and the forest along the bank gets genuinely loud. Bring binoculars if you have them \u2014 the boat-issued pairs are shared and go quickly."
  },
]

// ---------------------------------------------------------------------------
// BOOKING / PAYMENT (mutable demo state lives in localStorage via bookingStore)
// ---------------------------------------------------------------------------
export const seedBookings = [
  {
    bookingID: 'BKG-1001',
    userID: 'USR-01',
    packageID: 'PKG-02',
    scheduleID: 'SCH-03',
    bookingDate: '2026-08-02',
    groupSize: 2,
    totalAmount: 24000,
    paymentStatus: 'paid',
    payment: {
      paymentID: 'PMT-5001',
      transactionID: 'TXN-88213',
      amountPaid: 24000,
      paymentGateway: 'bKash',
      timestamp: '2026-08-02T14:20:00',
    },
  },
]

export function getDestination(id) {
  return destinations.find((d) => d.destinationID === id)
}

export function getPackage(id) {
  return tourPackages.find((p) => p.packageID === id)
}

export function getAgency(id) {
  return agencies.find((a) => a.agencyID === id)
}

export function getPackagesForDestination(destinationID) {
  return tourPackages.filter((p) => p.destinationID === destinationID)
}

export function getPackagesForAgency(agencyID) {
  return tourPackages.filter((p) => p.agencyID === agencyID)
}

export function getSchedulesForPackage(packageID) {
  return tourSchedules.filter((s) => s.packageID === packageID)
}

export function getReviewsForPackage(packageID) {
  return reviews.filter((r) => r.packageID === packageID)
}

export function getAmenitiesByIds(ids) {
  return amenities.filter((a) => ids.includes(a.amenityID))
}

export function getBlog(id) {
  return blogs.find((b) => b.blogID === id)
}
