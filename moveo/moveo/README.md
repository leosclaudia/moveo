# Moveo 🎬

App para animar productos con IA. Subís una foto, elegís estilo/formato/duración
y genera un video publicitario usando fal.ai (image-to-video).

## Stack
- Next.js (App Router, JavaScript)
- fal.ai — modelos LTX Video (sin audio) y Veo 3.1 (con audio)
- Proxy oficial @fal-ai/server-proxy (tu API key nunca se expone al navegador)

## Correr en local
1. `npm install`
2. Copiá `.env.local.example` a `.env.local` y pegá tu FAL_KEY
3. `npm run dev` y abrí http://localhost:3000

## Desplegar en Vercel
1. Subí esta carpeta a un repo de GitHub
2. En Vercel: New Project → importá el repo (Framework: Next.js, Root Directory: vacío)
3. En Settings → Environment Variables agregá:
   - Name: `FAL_KEY`   Value: tu API key de fal.ai
4. Deploy. ¡Listo!

## Notas
- El proxy solo permite los modelos de animación (allowedEndpoints en
  app/api/fal/proxy/route.js). Cambiá esa lista si agregás modelos.
- Antes de un lanzamiento serio conviene sumar login o rate-limiting al proxy,
  para que nadie use tus créditos de fal sin permiso.
