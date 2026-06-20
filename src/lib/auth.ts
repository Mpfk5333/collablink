import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

export interface SessionUser {
  id: string
  email: string
  nom: string
  prenom: string
  role: string
  photoUrl?: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hashSync(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compareSync(password, hash)
}

export async function getUserByEmail(email: string) {
  return db.utilisateur.findUnique({
    where: { email },
    include: {
      profilClient: true,
      profilFreelance: {
        include: {
          competences: {
            include: {
              competence: true
            }
          }
        }
      },
      portefeuille: true,
    }
  })
}

export async function getUserById(id: string) {
  return db.utilisateur.findUnique({
    where: { id },
    include: {
      profilClient: true,
      profilFreelance: {
        include: {
          competences: {
            include: {
              competence: true
            }
          },
          experiences: true,
        }
      },
      portefeuille: true,
    }
  })
}
