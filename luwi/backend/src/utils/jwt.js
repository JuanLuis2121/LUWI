import jwt from "jsonwebtoken";

export const CreateAccessToken = (payload) => {
  const TOKEN_SECRET = process.env.TOKEN_SECRET;

  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      TOKEN_SECRET,
      {
        expiresIn: "1d",
      },
      (err, token) => {
        if (err) reject(err);
        resolve(token);
      },
    );
  });
};
