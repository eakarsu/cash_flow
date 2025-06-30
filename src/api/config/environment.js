// environment.js - ES Module version
export const smtp = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: parseInt(process.env.SMTP_PORT || '587') === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  from: process.env.SMTP_FROM || process.env.SMTP_USER
};

export default smtp;
