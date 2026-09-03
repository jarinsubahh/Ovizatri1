const db = require('../config/db');

exports.getPublishedBlogs = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        b.blog_id, 
        b.title, 
        b.content, 
        b.category, 
        b.status, 
        b.image_url, 
        b.publish_date,
        a.account_type,
        COALESCE(u.fullname, ad.admin_name, ag.agency_name, 'Ovizatri User') AS author_name
      FROM blog b
      JOIN account a ON b.account_id = a.account_id
      LEFT JOIN app_user u ON a.account_id = u.account_id
      LEFT JOIN admin ad ON a.account_id = ad.account_id
      LEFT JOIN agency ag ON a.account_id = ag.account_id
      WHERE b.status = 'published'
      ORDER BY b.blog_id DESC
    `;

    const result = await db.query(query);
    const blogs = result.rows || result[0];

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBlogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        b.*, 
        a.account_type,
        COALESCE(u.fullname, ad.admin_name, ag.agency_name, 'Ovizatri User') AS author_name
      FROM blog b
      JOIN account a ON b.account_id = a.account_id
      LEFT JOIN app_user u ON a.account_id = u.account_id
      LEFT JOIN admin ad ON a.account_id = ad.account_id
      LEFT JOIN agency ag ON a.account_id = ag.account_id
      WHERE b.blog_id = $1
    `;

    const result = await db.query(query, [id]);
    const blogs = result.rows || result[0];

    if (!blogs || blogs.length === 0) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    const blog = blogs[0];

    if (blog.status !== 'published') {
      const isAuthor = req.user && req.user.account_id === blog.account_id;
      const isAdmin = req.user && (req.user.account_type === 'admin' || req.user.role === 'admin');
      
      if (!isAuthor && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'This blog is waiting for admin approval',
        });
      }
    }

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};

exports.createBlog = async (req, res, next) => {
  try {
    const { title, content, category, image_url } = req.body;
    const accountId = req.user.account_id || req.user.id;
    const accountType = req.user.account_type || req.user.role;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    // Slug তৈরি করা
    const generatedSlug = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') + `-${Date.now()}`;

    const initialStatus = accountType === 'admin' ? 'published' : 'pending';
    const publishDate = initialStatus === 'published' ? new Date() : null;

    const query = `
      INSERT INTO blog (account_id, title, slug, content, category, status, image_url, publish_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await db.query(query, [
      accountId,
      title,
      generatedSlug,
      content,
      category || 'General',
      initialStatus,
      image_url || null,
      publishDate,
    ]);

    const createdBlog = (result.rows && result.rows[0]) || result[0];

    res.status(201).json({
      success: true,
      message: initialStatus === 'published'
        ? 'Blog published successfully!'
        : 'Blog submitted successfully! Waiting for admin review.',
      data: createdBlog,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyBlogs = async (req, res, next) => {
  try {
    const accountId = req.user.account_id || req.user.id;
    const query = `SELECT * FROM blog WHERE account_id = $1 ORDER BY blog_id DESC`;

    const result = await db.query(query, [accountId]);
    const blogs = result.rows || result[0];

    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    next(error);
  } 
};