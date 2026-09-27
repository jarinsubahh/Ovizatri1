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
    const packageId = Number(payload.package_id);
    const scheduleId = Number(payload.schedule_id ?? 1);
    const groupSize = Number(payload.group_size ?? payload.traveler_count ?? 1) || 1;
    const currentUserId = Number(req.user?.user_id ?? req.user?.id ?? 1) || 1;

    await client.query('BEGIN');

    const procedureCall = await client.query(
      `CALL sp_process_booking_payment(
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10
      )`,
      [
        currentUserId,
        packageId,
        scheduleId,
        groupSize,
        paymentMethod,
        transactionId,
        amount,
        null,
        null,
        null,
      ]
    );

    const procedureOutput = procedureCall.rows?.[0] || {};
    const bookingId = procedureOutput.p_booking_id ?? procedureOutput.booking_id ?? null;
    const paymentId = procedureOutput.p_payment_id ?? procedureOutput.payment_id ?? null;
    const procedureStatus = procedureOutput.p_status ?? procedureOutput.status ?? 'COMPLETED';

    const bookingResult = await client.query(
      `SELECT booking_id, user_id, package_id, schedule_id, group_size, total_amount, payment_status
       FROM booking
       WHERE booking_id = $1`,
      [bookingId]
    );

    const paymentResult = await client.query(
      `SELECT id, booking_id, amount, payment_method, transaction_id, status, payment_date
       FROM payments
       WHERE id = $1`,
      [paymentId]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully.',
      booking: bookingResult.rows[0],
      payment: paymentResult.rows[0],
      receipt: {
        bookingId,
        amount: Number(paymentResult.rows[0]?.amount ?? 0),
        method: paymentResult.rows[0]?.payment_method,
        transactionId: paymentResult.rows[0]?.transaction_id,
        status: procedureStatus,
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
