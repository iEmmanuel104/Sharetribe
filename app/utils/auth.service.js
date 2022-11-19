const jwt = require("jsonwebtoken");

const secret = process.env.REFRESH_TOKEN_JWT_SECRET 
const secret2 = process.env.ACCESS_TOKEN_JWT_SECRET

const authService = () => {
  const issue_RefreshToken = payload => jwt.sign(payload, secret, { expiresIn: 86400 });
  const verify_Refreshoken = (token, cb) => jwt.verify(token, secret, {}, cb);
  
  const issue_AccessToken = payload => jwt.sign(payload, secret2, { expiresIn: 7200 });
  const verify_AccessToken = (token, cb) => jwt.verify(token, secret2, {}, cb);

  return {
    issue_RefreshToken,
    verify_Refreshoken,
    issue_AccessToken,
    verify_AccessToken
  };
};

module.exports = authService;
