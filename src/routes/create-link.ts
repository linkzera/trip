import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function createLink(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put('/link/:tripId', {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      body: z.object({
        title: z.string(),
        url: z.string().url()
      })
    }
  }, async (req, res) => {
    const { tripId } = req.params
    const { title, url } = req.body

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })

    if (!trip) {
      return res.status(404).send({ message: 'Trip not found' })
    }

    const link = await prisma.link.create({
      data: {
        title,
        url,
        trip: {
          connect: {
            id: tripId
          }
        }
      }
    })

    return res.status(201).send(link)
  })
}