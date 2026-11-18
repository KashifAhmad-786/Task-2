import jwt from 'jsonwebtoken';

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'dev-secret-key';
  const userPayload = typeof user === 'object'
    ? {
        id: user._id,
        email: user.email,
        role: user.role,
      }
    : { id: user };

  return jwt.sign(userPayload, secret, {
    expiresIn: '7d',
  });
};

export default generateToken;
