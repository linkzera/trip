import { FastifyInstance } from "fastify";
import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function createActivity(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put('/activity/:tripId', {
    schema: {
      params: z.object({
        tripId: z.string().uuid()
      }),
      body: z.object({
        title: z.string(),
        occurs_at: z.coerce.date()
      })
    }
  }, async (req, res) => {
    const { tripId } = req.params
    const { title, occurs_at } = req.body

    const trip = await prisma.trip.findUnique({ where: { id: tripId } })

    if (!trip) {
      return res.status(404).send({ message: 'Trip not found' })
    }

    const activity = await prisma.activity.create({
      data: {
        title,
        occurs_at,
        trip: {
          connect: {
            id: tripId
          }
        }
      }
    })

    return res.status(201).send(activity)
  })
}