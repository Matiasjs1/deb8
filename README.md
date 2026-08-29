# 🗣️ Deb8

Plataforma de **debate formal y respetuoso** donde las personas intercambian ideas de forma organizada, con reglas claras, moderación activa y herramientas para fomentar el pensamiento crítico. Un espacio para discutir sin caer en el caos y la agresividad de las redes sociales.

🌐 **Probar:** [Deb8](https://deb8-6p72.onrender.com/)

Proyecto integrador de la materia **Desarrollo de Sistemas** (2025).

---

## ✅ Qué ofrece

- **Debate por voz o texto** en tiempo real.
- **Salas de 2 a 4 participantes**, por turnos o en modo libre.
- **Moderación y sistema de sanciones** por mal comportamiento.
- **Votación unánime** para expulsar a un participante.
- **Estadísticas personales** de cada usuario.
- **Contactos y debates privados.**
- **Modo oscuro** e interfaz adaptable a móviles.
- **Seguridad:** cifrado, antispam y verificación opcional.

---

## 🏗️ Stack

Monorepo **MERN** con cliente y servidor separados:

```
deb8/
├── client/   # React 18 + Vite + React Router + Socket.io-client
└── server/   # Express + Mongoose + Socket.io + JWT (Node.js)
```

- **Frontend:** React 18, Vite, React Router 7, `axios`, `react-hook-form`, `socket.io-client`.
- **Backend:** Express, Mongoose (MongoDB), JWT (`jsonwebtoken`), Socket.io para debates en vivo.
- **Base de datos:** MongoDB Atlas (free tier M0).
- **Deploy:** Render (`render.yaml`), con `healthcheck` y auto-deploy.

---

## 🚀 Setup local

### 1. Backend

```bash
cd server
npm install
# creá server/.env
```

Variables en `.env`:

```
NODE_ENV=production
PORT=4000
MONGODB_URI=mongodb+srv://<db_user>:***@<cluster>.mongodb.net/deb8db?retryWrites=true&w=majority
TOKEN_SECRET=<long-random-string>
TURN_DURATION_SECONDS=30
CORS_ORIGIN=http://localhost:5173
```

> Generá `TOKEN_SECRET` con:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

### 2. Frontend

```bash
cd client
npm install
npm run dev   # Vite en http://localhost:5173
```

---

## 👥 Autores

Proyecto integrador grupal · **Facundo Chajade · Valentín Ermel · Felipe Glavich · Matías Sesto**

**Profesor:** Jackson Daniel Calderon Vargas
