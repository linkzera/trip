import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function getLinks(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get('/links/:tripId', {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      })
    }
  }, async (req, res) => {
    const { tripId } = req.params

    const trip = await prisma.trip.findUnique({ where: { id: tripId }, include: { links: true } })

    if (!trip) {
      return res.status(404).send({ message: 'Trip not found' })
    }

    return res.status(200).send(trip.links)
  })
}