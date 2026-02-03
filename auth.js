const crypto = require('crypto');

const JWT_SECRET = 'your-secret-key-change-in-production';

function generateToken(user) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const payload = {
    id: user.id,
    username: user.username,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60)
  };

  const headerEncoded = Buffer.from(JSON.stringify(header)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(headerEncoded + '.' + payloadEncoded)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return headerEncoded + '.' + payloadEncoded + '.' + signature;
}

function verifyToken(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerEncoded, payloadEncoded, signatureEncoded] = parts;

    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(headerEncoded + '.' + payloadEncoded)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    if (signature !== signatureEncoded) return null;

    const payloadStr = Buffer.from(payloadEncoded, 'base64').toString();
    const payload = JSON.parse(payloadStr);

    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return {
      id: payload.id,
      username: payload.username,
      role: payload.role
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
};
