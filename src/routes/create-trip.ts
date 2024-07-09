import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma";
import dayjs from "dayjs";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
export function createTrip(app: FastifyInstance) {

  app.withTypeProvider<ZodTypeProvider>().post('/trips', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date(),
        owner_name: z.string(),
        owner_email: z.string().email()
      })
    }
  }, async (req) => {
    const { destination, starts_at, ends_at, owner_email, owner_name } = req.body
    console.log(destination, starts_at, ends_at)
    const startDateIsBeforeToday = dayjs(starts_at).isBefore(new Date())
    const endDateIsBeforeStartDate = dayjs(ends_at).isBefore(starts_at)

    if (startDateIsBeforeToday) {
      throw new Error('invalid trip start date')
    }
    if (endDateIsBeforeStartDate) {
      throw new Error('invalid trip date')
    }

    const trip = await prisma.trip.create({
      data: {
        destination,
        ends_at,
        starts_at
      }
    })

    const mail = await getMailClient()

    const message = await mail.sendMail({
      from: {
        name: 'Equipe planer',
        address: 'contato@plan.er'
      },
      to: {
        name: owner_name,
        address: owner_email
      },
      subject: 'Testando envio de email',
      html: `<p>Teste do envio de email</p>`
    })

    console.log(nodemailer.getTestMessageUrl(message))
    return { message: 'Viagem cadastrada com sucesso', tripId: trip.id }
  })


  app.get('/trips', async () => {
    const trips = await prisma.trip.findMany({})
    return trips
  })
}