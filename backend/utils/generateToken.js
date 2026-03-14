import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

  // Depending on client preference, we can send it in a cookie or just response body.
  // We'll return it so the controller can send it in the JSON body for the client.
  return token;
};

export default generateToken;
