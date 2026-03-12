import { AuthEnv, getProviderAvailability, json, readSession } from "./_lib"

type PagesContext = {
  request: Request
  env: AuthEnv
}

export async function onRequestGet(context: PagesContext) {
  const user = await readSession(context.request, context.env)

  return json({
    configured: getProviderAvailability(context.env),
    user,
  })
}
