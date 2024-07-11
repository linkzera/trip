import nodemailer from 'nodemailer'

export async function getMailClient() {
  const account = await nodemailer.createTestAccount()
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });

  return transporter
}