import crypto from 'crypto'

const secret = crypto.randomBytes(32).toString('hex')
console.log('Secret:', secret)

// Genera un token random, ejecutar con node generateToken.js