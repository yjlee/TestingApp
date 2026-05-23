import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const db = new PrismaClient({ adapter })

const FIELDS = [
  'Computer Science & IT',
  'Engineering (Civil, Mechanical, Electrical, etc.)',
  'Medicine & Health Sciences',
  'Law',
  'Business & Management',
  'Education',
  'Social Sciences',
  'Natural Sciences (Biology, Chemistry, Physics)',
  'Mathematics & Statistics',
  'Arts & Humanities',
  'Architecture',
  'Economics',
  'Environmental Studies',
]

async function main() {
  console.log('Seeding fields_of_study...')
  for (const name of FIELDS) {
    await db.fieldOfStudy.upsert({
      where: { name },
      update: {},
      create: { name, isOpenForReview: false, isActive: true },
    })
  }
  console.log(`Seeded ${FIELDS.length} fields.`)
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
