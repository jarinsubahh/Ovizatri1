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

async function resolvePaymentTable(client) {
  const tableCheck = await client.query(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = 'public'
       AND table_name IN ('payments', 'payment')
     ORDER BY CASE table_name WHEN 'payment' THEN 1 WHEN 'payments' THEN 2 ELSE 3 END
     LIMIT 1`
  );

  if (tableCheck.rows.length) {
    return tableCheck.rows[0].table_name;
  }

  return 'payment';
}

async function getPaymentInsertConfig(client, paymentTable) {
  const columnCheck = await client.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1`,
    [paymentTable]
  );

  const columns = new Set(columnCheck.rows.map((row) => row.column_name));

  if (columns.has('amount_paid') && columns.has('payment_gateway')) {
    return {
      insertSql: `INSERT INTO ${paymentTable} (booking_id, transaction_id, payment_gateway, amount_paid, timestamp)
                  VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                  RETURNING *`,
      values: (bookingId, bookingAmount, method, transactionId) => [bookingId, transactionId, method, bookingAmount],
    };
  }

  return {
    insertSql: `INSERT INTO ${paymentTable} (booking_id, amount, payment_method, transaction_id, status, payment_date)
                VALUES ($1, $2, $3, $4, 'COMPLETED', CURRENT_TIMESTAMP)
                RETURNING *`,
    values: (bookingId, bookingAmount, method, transactionId) => [bookingId, bookingAmount, method, transactionId],
  };
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
    const bookingIdFromRequest = payload.booking_id ?? payload.bookingId ?? req.params?.bookingId ?? null;
    const packageId = Number(payload.package_id);
    const requestedScheduleId = Number(payload.schedule_id);
    const groupSize = Number(payload.group_size ?? payload.traveler_count ?? 1);

    if (!Number.isInteger(packageId) || packageId <= 0) {
      throw Object.assign(new Error('A valid package ID is required.'), { statusCode: 400 });
    }
    if (!Number.isInteger(groupSize) || groupSize <= 0) {
      throw Object.assign(new Error('Group size must be a positive whole number.'), { statusCode: 400 });
    }

    const appUserResult = await client.query(
      'SELECT user_id FROM app_user WHERE account_id = $1 LIMIT 1',
      [req.user?.id ?? req.user?.account_id ?? 1]
    );
    if (!appUserResult.rows.length) {
      throw Object.assign(new Error('Traveler profile not found for the authenticated account.'), { statusCode: 404 });
    }
    const currentUserId = Number(appUserResult.rows[0].user_id);

    await client.query('BEGIN');

    let bookingRow;

    if (bookingIdFromRequest !== null && bookingIdFromRequest !== undefined && bookingIdFromRequest !== '') {
      const bookingResult = await client.query(
        `SELECT booking_id, user_id, package_id, schedule_id, group_size, total_amount, payment_status
         FROM booking
         WHERE booking_id = $1`,
        [Number(bookingIdFromRequest)]
      );

      if (!bookingResult.rows.length) {
        throw Object.assign(new Error('Booking info not found.'), { statusCode: 404 });
      }

      bookingRow = bookingResult.rows[0];

      if (Number(bookingRow.user_id) !== currentUserId) {
        throw Object.assign(new Error('You can only pay for your own booking.'), { statusCode: 403 });
      }
    } else {
      const packageResult = await client.query(
        'SELECT package_id, max_seat, price, discount FROM tour_package WHERE package_id = $1 FOR UPDATE',
        [packageId]
      );

      if (!packageResult.rows.length) {
        throw Object.assign(new Error('Package not found.'), { statusCode: 404 });
      }

      const packageRow = packageResult.rows[0];
      const resolvedPackageId = Number(packageRow.package_id);
      const bookedSeatsResult = await client.query(
        `SELECT COALESCE(SUM(group_size), 0) AS booked_seats
         FROM booking
         WHERE package_id = $1
           AND LOWER(TRIM(payment_status)) IN ('paid', 'pending', 'confirmed', 'completed')`,
        [resolvedPackageId]
      );
      const bookedSeats = Number(bookedSeatsResult.rows[0].booked_seats || 0);
      if (bookedSeats + groupSize > Number(packageRow.max_seat)) {
        throw Object.assign(new Error('Not enough seats remain for this package.'), { statusCode: 409 });
      }

      let scheduleQuery;
      if (Number.isInteger(requestedScheduleId) && requestedScheduleId > 0) {
        scheduleQuery = await client.query(
          'SELECT schedule_id FROM tour_schedule WHERE package_id = $1 AND schedule_id = $2',
          [resolvedPackageId, requestedScheduleId]
        );
        if (!scheduleQuery.rows.length) {
          throw Object.assign(new Error('Selected schedule does not belong to this package.'), { statusCode: 400 });
        }
      } else {
        scheduleQuery = await client.query(
          'SELECT schedule_id FROM tour_schedule WHERE package_id = $1 ORDER BY schedule_id ASC LIMIT 1',
          [resolvedPackageId]
        );
      }

      let resolvedScheduleId;
      if (!scheduleQuery.rows.length) {
        const departureDate = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        const returnDate = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
        const scheduleInsert = await client.query(
          `INSERT INTO tour_schedule (package_id, departure_date, return_date)
           VALUES ($1, $2::date, $3::date)
           RETURNING schedule_id`,
          [resolvedPackageId, departureDate, returnDate]
        );
        resolvedScheduleId = Number(scheduleInsert.rows[0].schedule_id);
      } else {
        resolvedScheduleId = Number(scheduleQuery.rows[0].schedule_id);
      }

      const amountResult = await client.query(
        'SELECT calculate_booking_amount($1, $2) AS total',
        [resolvedPackageId, groupSize]
      );
      const totalAmount = Number(amountResult.rows[0].total);

      const bookingInsert = await client.query(
        `INSERT INTO booking (user_id, package_id, schedule_id, group_size, total_amount, payment_status)
         VALUES ($1, $2, $3, $4, $5, 'paid')
         RETURNING *`,
        [currentUserId, resolvedPackageId, resolvedScheduleId, groupSize, totalAmount]
      );

      bookingRow = bookingInsert.rows[0];
    }

    const paymentTable = await resolvePaymentTable(client);
    const paymentInsertConfig = await getPaymentInsertConfig(client, paymentTable);
    const paymentInsert = await client.query(
      paymentInsertConfig.insertSql,
      paymentInsertConfig.values(
        Number(bookingRow.booking_id),
        Number(bookingRow.total_amount ?? 0),
        paymentMethod,
        transactionId
      )
    );

    await client.query(
      "UPDATE booking SET payment_status = 'paid' WHERE booking_id = $1",
      [Number(bookingRow.booking_id)]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      success: true,
      message: 'Payment processed successfully.',
      booking: bookingRow,
      payment: paymentInsert.rows[0],
      receipt: {
        bookingId: Number(bookingRow.booking_id),
        amount: Number(paymentInsert.rows[0].amount ?? paymentInsert.rows[0].amount_paid),
        method: paymentInsert.rows[0].payment_method ?? paymentInsert.rows[0].payment_gateway,
        transactionId: paymentInsert.rows[0].transaction_id,
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

const getMyBookings = async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT
         b.booking_id AS "bookingId",
         b.user_id AS "userId",
         b.package_id AS "packageId",
         b.schedule_id AS "scheduleId",
         b.booking_date AS "bookingDate",
         b.group_size AS "groupSize",
         b.total_amount AS "totalAmount",
         b.payment_status AS "paymentStatus",
         tp.title AS "packageTitle",
         tp.duration AS "packageDuration",
         d.name AS "destinationName",
         a.agency_name AS "agencyName",
         ts.departure_date AS "departureDate",
         ts.return_date AS "returnDate"
       FROM app_user u
       JOIN booking b ON b.user_id = u.user_id
       JOIN tour_package tp ON tp.package_id = b.package_id
       JOIN destination d ON d.destination_id = tp.destination_id
       JOIN agency a ON a.agency_id = tp.agency_id
       LEFT JOIN tour_schedule ts ON ts.schedule_id = b.schedule_id
       WHERE u.account_id = $1
       ORDER BY b.booking_date DESC, b.booking_id DESC`,
      [req.user.id]
    );

    return res.status(200).json({ success: true, bookings: result.rows });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  postDemoPayment,
  getMyBookings,
  generateMockTransactionId,
};
