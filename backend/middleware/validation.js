// Input validation middleware

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 6 characters
  return password && password.length >= 6;
};

const validateUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Validate registration input
const validateRegister = (req, res, next) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (name && name.length > 255) {
    return res.status(400).json({ error: 'Name must be less than 255 characters' });
  }

  next();
};

// Validate login input
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  next();
};

// Validate UUID parameter
const validateUUIDParam = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({ error: `${paramName} is required` });
    }

    if (!validateUUID(id)) {
      return res.status(400).json({ error: `Invalid ${paramName} format` });
    }

    next();
  };
};

// Validate content sync input
const validateContentSync = (req, res, next) => {
  const { contentItems } = req.body;

  // contentItems is required for this endpoint
  if (!contentItems) {
    return res.status(400).json({ error: 'Content items array is required' });
  }

  if (!Array.isArray(contentItems)) {
    return res.status(400).json({ error: 'Content items must be an array' });
  }

  if (contentItems.length === 0) {
    return res.status(400).json({ error: 'Content items array cannot be empty' });
  }

  if (contentItems.length > 100) {
    return res.status(400).json({ error: 'Cannot sync more than 100 items at once' });
  }

  // Validate each content item structure
  for (const item of contentItems) {
    if (!item.id || !item.filename || !item.fileType) {
      return res.status(400).json({ 
        error: 'Each content item must have id, filename, and fileType' 
      });
    }
  }

  next();
};

// Validate caption creation
const validateCaptionCreation = (req, res, next) => {
  const { captions } = req.body;

  if (!captions || !Array.isArray(captions)) {
    return res.status(400).json({ error: 'Captions array is required' });
  }

  if (captions.length === 0) {
    return res.status(400).json({ error: 'At least one caption is required' });
  }

  if (captions.length > 10) {
    return res.status(400).json({ error: 'Cannot create more than 10 captions at once' });
  }

  for (const caption of captions) {
    if (!caption.tone || !caption.content) {
      return res.status(400).json({ error: 'Each caption must have tone and content' });
    }

    if (!['Professional', 'Casual', 'Engaging'].includes(caption.tone)) {
      return res.status(400).json({ error: 'Tone must be Professional, Casual, or Engaging' });
    }

    if (caption.content.length > 5000) {
      return res.status(400).json({ error: 'Caption content must be less than 5000 characters' });
    }
  }

  next();
};

// Validate caption update
const validateCaptionUpdate = (req, res, next) => {
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (typeof content !== 'string') {
    return res.status(400).json({ error: 'Content must be a string' });
  }

  if (content.length > 5000) {
    return res.status(400).json({ error: 'Content must be less than 5000 characters' });
  }

  if (content.trim().length === 0) {
    return res.status(400).json({ error: 'Content cannot be empty' });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUUIDParam,
  validateContentSync,
  validateCaptionCreation,
  validateCaptionUpdate,
  validateEmail,
  validatePassword,
  validateUUID,
};



