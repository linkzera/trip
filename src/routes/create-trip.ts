import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { prisma } from "../lib/prisma";
import { getMailClient } from "../lib/mail";
import nodemailer from 'nodemailer'
import { env } from "../env";
import { dayjs } from "../lib/dayjs";

export async function createTrip(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post('/trips', {
    schema: {
      body: z.object({
        destination: z.string().min(4),
        starts_at: z.coerce.date(),
        ends_at: z.coerce.date(),
        owner_name: z.string(),
        owner_email: z.string().email(),
        emails_to_invite: z.array(z.string().email())
      })
    }
  }, async (req) => {
    const { destination, starts_at, ends_at, owner_email, owner_name, emails_to_invite } = req.body
    const startDateIsBeforeToday = dayjs(starts_at).isBefore(new Date())
    const endDateIsBeforeStartDate = dayjs(ends_at).isBefore(starts_at)

    if (startDateIsBeforeToday) {
      throw new Error('invalid trip start date')
    }
    if (endDateIsBeforeStartDate) {
      throw new Error('invalid trip date')
    }

    const guests = emails_to_invite.map(email => {
      return { email: email }
    })

    const trip = await prisma.trip.create({
      data: {
        destination,
        ends_at,
        starts_at,
        participants: {
          createMany: {
            data: [
              {
                name: owner_name,
                email: owner_email,
                is_owner: true,
                is_confirmed: true
              },
              ...guests
            ]
          }
        }
      }
    })

    const formattedStartDate = dayjs(starts_at).format('LL')
    const formattedEndDate = dayjs(ends_at).format('LL')

    const confirmationLink = `${env.API_BASE_URL}/trips/${trip.id}/confirm`

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
      subject: `Confirme sua viagem para ${destination}`,
      html: `
          <div style="font-family: sans-serif; font-size: 16px; line-height: 1.6;">
          <p>Você solicitou a criação de uma viagem para <strong>${destination}</strong> entre as datas de <strong>${formattedStartDate}</strong> até <strong>${formattedEndDate}</strong>.</p>
          <p></p>
          <p>Para confirmar sua viagem, clique no link abaixo:</p>
          <p></p>
          <p>
            <a href="${confirmationLink}">Confirmar viagem</a>
          </p>
          <p></p>
          <p>Caso você não saiba do que se trata esse e-mail, apenas ignore esse e-mail.</p>
        </div>
      `.trim()
    })

    console.log(nodemailer.getTestMessageUrl(message))
    return { message: 'Viagem cadastrada com sucesso', tripId: trip.id }
  })


  app.get('/trips', async () => {
    const trips = await prisma.trip.findMany({})
    return trips
  })
}