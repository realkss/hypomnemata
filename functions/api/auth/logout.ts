import { clearSessionCookie, json } from "./_lib"

function logoutResponse() {
  return json(
    { ok: true },
    {
      headers: {
        "set-cookie": clearSessionCookie(),
      },
    },
  )
}

export async function onRequestPost() {
  return logoutResponse()
}

export async function onRequestGet() {
  return logoutResponse()
}
