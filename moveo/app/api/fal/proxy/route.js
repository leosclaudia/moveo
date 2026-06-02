import { createRouteHandler } from "@fal-ai/server-proxy/nextjs";

// Este handler reenvía las llamadas a fal.ai agregando tu FAL_KEY del lado
// del servidor, así nunca queda expuesta en el navegador.
// allowedEndpoints limita qué modelos se pueden llamar desde Moveo.
export const { GET, POST, PUT } = createRouteHandler({
  allowedEndpoints: [
    "fal-ai/ltx-video/**",
    "fal-ai/veo3/**",
    "fal-ai/veo2/**",
  ],
});
