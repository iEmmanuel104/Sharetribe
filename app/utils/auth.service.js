const jwt = require("jsonwebtoken");

const secret = process.env.REFRESH_TOKEN_JWT_SECRET 
const secret2 = process.env.ACCESS_TOKEN_JWT_SECRET

const authService = () => {
  const issue_RefreshToken = payload => jwt.sign(payload, secret, { expiresIn: 86400 });
  const verify_Refreshoken = (token, cb) => jwt.verify(token, secret, {}, cb);
  
  const issue_AccessToken = payload => jwt.sign(payload, secret2, { expiresIn: 7200 });
  const verify_AccessToken = (token, cb) => jwt.verify(token, secret2, {}, cb);

  const attachCookiesToResponse = ({ res, token }) => {
    const oneDay = 1000 * 60 * 60 * 24;
    const longerExp = 1000 * 60 * 60 * 24 * 30;

    if (token === 'REFRESH_TOKEN') {
      res.cookie('refreshToken', token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        signed: true,

        expires: new Date(Date.now() + longerExp),
      });
    }

    if (token === 'ACCESS_TOKEN') {
      res.cookie('accessToken', token, {
        httpOnly: true,
        // secure: process.env.NODE_ENV === 'production',
        signed: true,
        expires: new Date(Date.now() + oneDay),
      });
    }  
    // res.cookie('token', token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === 'production',
    //   signed: true,
    //   expires: new Date(Date.now() + oneDay),
    // });

  };


  return {
    issue_RefreshToken,
    verify_Refreshoken,
    issue_AccessToken,
    verify_AccessToken,
    attachCookiesToResponse
  };
};

module.exports = authService;
