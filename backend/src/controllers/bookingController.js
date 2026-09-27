const db = require('../config/db');

const VALID_PAYMENT_METHODS = ['bKash', 'Nagad', 'Rocket', 'Card', 'CashOnArrival'];

function generateMockTransactionId() {
  const suffix =     Math.random().toString(36).slice(2, 8).toUpperCase();
  return `TRX-${Date.now()}-${suffix}`;
}

function normalizePaymentMethod(method) {
  const value = String(method || 'Card').trim();
  if (!VALID_PAYMENT_METHODS.includes(value)) {
    throw Object.assign(new Error(`Unsupported payment method: ${value}`), { statusCode: 400 });
  }
  return value;
}

async function createBooking(client, reqUser, payload) {
  const packageId = Number(payload.package_id);
  const scheduleId = Number(payload.schedule_id) || 1;
  const travelers = Number(payload.group_size ?? payload.traveler_count ?? 1) || 1;
  const resolvedUserId = Number(reqUser?.user_id ?? reqUser?.id ?? 1) || 1;

  const packageResult = await client.query(
    'SELECT package_id, max_seat FROM tour_package WHERE package_id = $1 FOR UPDATE;',
    [packageId]
  );

  if (packageResult.rows.length === 0) {
    throw Object.assign(new Error('Package not found.'), { statusCode: 404 });
  }

  const bookedSeatsResult = await client.query(
    "SELECT COALESCE(SUM(group_size), 0) AS booked_seats FROM booking WHERE package_id = $1 AND payment_status != 'cancelled';",
    [packageId]
  );

  const { max_seat: maxSeat } = packageResult.rows[0];
  const bookedSeats = Number(bookedSeatsResult.rows[0]?.booked_seats || 0);
  const remainingSeats = Number(maxSeat) - bookedSeats;

  if (remainingSeats < travelers) {
    throw Object.assign(
      new Error('Not enough available seats for this package. Please reduce the group size or choose another package.'),
      { statusCode: 400 }
    );
  }

  const priceResult = await client.query(
    `SELECT package_id, price, discount
     FROM tour_package
     WHERE package_id = $1`,
    [packageId]
  );

  if (priceResult.rows.length === 0) {
    throw Object.assign(new Error('Package not found.'), { statusCode: 404 });
  }

  const computedAmount = Number(payload.amount) > 0
    ? Number(payload.amount)
    : Number((await client.query('SELECT calculate_booking_amount($1, $2) AS total', [packageId, travelers])).rows[0].total);

  const bookingInsert = await client.query(
    `INSERT INTO booking (user_id, package_id, schedule_id, group_size, total_amount, payment_status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING booking_id, user_id, package_id, schedule_id, group_size, total_amount, payment_status`,
    [resolvedUserId, packageId, scheduleId, travelers, computedAmount]
  );

  const booking = bookingInsert.rows[0];
  booking.total_amount = Number(booking.total_amount);
  return booking;
}

async function resolveBookingForPayment(client, reqUser, payload) {
  const bookingId = payload.booking_id !== undefined && payload.booking_id !== null && payload.booking_id !== ''
    ? Number(payload.booking_id)
    : null;

  if (bookingId) {
    const bookingResult = await client.query(
      `SELECT booking_id, user_id, package_id, schedule_id, group_size, total_amount, payment_status
       FROM booking
       WHERE booking_id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      throw Object.assign(new Error('Booking not found.'), { statusCode: 404 });
    }

    const booking = bookingResult.rows[0];
    const currentUserId = Number(reqUser?.user_id ?? reqUser?.id ?? 1) || 1;
    if (Number(booking.user_id) !== currentUserId) {
      throw Object.assign(new Error('You can only pay for your own booking.'), { statusCode: 403 });
    }

    return booking;
  }

  return createBooking(client, reqUser, payload);
}

const postDemoPayment = async (req, res, next) => {
  const pool = db.pool || db;
  const client = await pool.connect();

  try {
    const payload = req.body || {};
    const paymentMethod = normalizePaymentMethod(payload.payment_method);
    const transactionId = String(payload.transaction_id || '').trim() || generateMockTransactionId();
    const amount = Number(payload.amount ?? 0);
    const groupSize = Number(payload.group_size ?? payload.traveler_count ?? 1) || 1;

    await client.query('BEGIN');

    const userRes = await client.query(
      'SELECT user_id FROM app_user WHERE account_id = $1',
      [req.user.id]
    );
    const travelerId = userRes.rows[0]?.user_id || 1;

    let packageId = Number(payload.package_id);
    if (!Number.isFinite(packageId) || packageId <= 0) {
      packageId = 0;
    }

    let pkgRes = await client.query(
      'SELECT package_id, price, discount, max_seat FROM tour_package WHERE package_id = $1 FOR UPDATE',
      [packageId]
    );

    if (!pkgRes.rows.length) {
      pkgRes = await client.query(
        'SELECT package_id, price, discount, max_seat FROM tour_package ORDER BY package_id ASC LIMIT 1 FOR UPDATE'
      );
    }

    if (!pkgRes.rows.length) {
      const agencyRes = await client.query('SELECT agency_id FROM agency ORDER BY agency_id ASC LIMIT 1');
      const destinationRes = await client.query('SELECT destination_id FROM destination ORDER BY destination_id ASC LIMIT 1');

      if (!agencyRes.rows.length || !destinationRes.rows.length) {
        throw Object.assign(new Error('No valid agency or destination data exists to create a fallback package.'), { statusCode: 500 });
      }

      const seedPackage = await client.query(
        `INSERT INTO tour_package (agency_id, destination_id, title, price, duration, max_seat, discount, description)
         VALUES ($1, $2, 'Auto Generated Package', 1000, 3, 20, 0, 'Fallback package created during booking payment processing.')
         RETURNING package_id, price, discount, max_seat`,
        [Number(agencyRes.rows[0].agency_id), Number(destinationRes.rows[0].destination_id)]
      );

      pkgRes = {
        rows: [seedPackage.rows[0]],
      };
    }

    const resolvedPkg = pkgRes.rows[0];
    const resolvedPkgId = Number(resolvedPkg.package_id);

    let scheduleRes = await client.query(
      'SELECT schedule_id FROM tour_schedule WHERE package_id = $1 ORDER BY departure_date ASC LIMIT 1',
      [resolvedPkgId]
    );

    if (!scheduleRes.rows.length) {
      const defaultDeparture = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      const defaultReturn = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
      scheduleRes = await client.query(
        `INSERT INTO tour_schedule (package_id, departure_date, return_date)
         VALUES ($1, $2::date, $3::date)
         RETURNING schedule_id`,
        [resolvedPkgId, defaultDeparture, defaultReturn]
      );
    }

    const resolvedScheduleId = Number(scheduleRes.rows[0].schedule_id);

    const bookedSeatsRes = await client.query(
      "SELECT COALESCE(SUM(group_size), 0) AS booked_seats FROM booking WHERE package_id = $1 AND payment_status IS DISTINCT FROM 'cancelled'",
      [resolvedPkgId]
    );

    const maxSeat = Number(resolvedPkg.max_seat || 0);
    const bookedSeats = Number(bookedSeatsRes.rows[0]?.booked_seats || 0);
    const remainingSeats = maxSeat - bookedSeats;

    if (remainingSeats < groupSize) {
      throw Object.assign(
        new Error('Not enough available seats for this package. Please reduce the group size or choose another package.'),
        { statusCode: 400 }
      );
    }

    const price = Number(resolvedPkg.price || 0);
    const discount = Number(resolvedPkg.discount || 0);
    const effectiveUnitPrice = price * (1 - discount / 100);
    const computedAmount = Number(amount) > 0 ? Number(amount) : effectiveUnitPrice * groupSize;

    const bookingRow = await client.query(
      `INSERT INTO booking (user_id, package_id, schedule_id, group_size, total_amount, payment_status)
       VALUES ($1, $2, $3, $4, $5, 'paid')
       RETURNING *`,
      [travelerId, resolvedPkgId, resolvedScheduleId, groupSize, computedAmount]
    );

    const paymentRow = await client.query(
      `INSERT INTO payments (booking_id, amount, payment_method, transaction_id, status, payment_date)
       VALUES ($1, $2, $3, $4, 'COMPLETED', CURRENT_TIMESTAMP)
       RETURNING *`,
      [bookingRow.rows[0].booking_id, computedAmount, paymentMethod, transactionId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully.',
      booking: bookingRow.rows[0],
      payment: paymentRow.rows[0],
      receipt: {
        bookingId: bookingRow.rows[0].booking_id,
        amount: Number(paymentRow.rows[0].amount),
        method: paymentRow.rows[0].payment_method,
        transactionId: paymentRow.rows[0].transaction_id,
        status: 'COMPLETED',
      },
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.warn('Rollback failed for demo payment:', rollbackError.message);
    }

    if (error?.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A payment with that transaction ID already exists. Please use a different transaction ID.',
      });
    }

    if (error?.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  } finally {
    client.release();
  }
};

module.exports = {
  postDemoPayment,
  generateMockTransactionId,
};
