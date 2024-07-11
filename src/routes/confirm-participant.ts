import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import z from "zod";
import { env } from "../env";
import { prisma } from "../lib/prisma";

export async function confirmParticipant(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/participants/:participantId/confirm', {
    schema: {
      params: z.object({
        participantId: z.string().uuid()
      })
    }
  }, async (req, res) => {
    const { participantId } = req.params

    const participant = await prisma.participant.findUniqueOrThrow({ where: { id: participantId }, include: { trip: true } })

    if (participant.is_confirmed) {
      return res.redirect(`${env.WEB_BASE_URL}/trips/${participant.trip.id}`)
    }

    await prisma.participant.update({
      where: {
        id: participantId
      },
      data: {
        is_confirmed: true
      }
    })

    const trip = participant.trip
    
    return res.redirect(`${env.WEB_BASE_URL}/trips/${trip.id}`)
  })
}