// Supabase Edge Function: manda l'email di ordine a un fornitore.
// Non usa la chiave "service role": verifica i permessi dell'utente che chiama con
// il suo stesso token, rispettando le regole di sicurezza (RLS) già esistenti.
//
// Variabili d'ambiente richieste (da impostare come "secrets" della funzione):
// - RESEND_API_KEY: chiave del servizio Resend usato per mandare le email
// - RESEND_FROM (facoltativa): indirizzo mittente verificato su Resend;
//   se non impostata usa l'indirizzo di test di Resend (va bene solo per prova).
// SUPABASE_URL e SUPABASE_ANON_KEY sono già disponibili automaticamente.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { azienda_id, nome_azienda, fornitore_nome, fornitore_email, righe, lingua } = await req.json()

    if (!azienda_id || !fornitore_email || !Array.isArray(righe) || righe.length === 0) {
      return new Response(JSON.stringify({ error: 'Dati mancanti nella richiesta.' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autenticato.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Client con i permessi dell'utente che ha fatto la richiesta (rispetta le RLS
    // già esistenti) — nessuna chiave amministrativa coinvolta.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Non autenticato.' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: profilo } = await supabase.from('profili').select('ruolo')
      .eq('utente_id', user.id).eq('azienda_id', azienda_id)
      .in('ruolo', ['responsabile', 'titolare', 'admin'])
      .maybeSingle()

    if (!profilo) {
      return new Response(JSON.stringify({ error: 'Non autorizzato per questa sede.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const de = lingua === 'de'
    const oggetto = de ? `Bestellung von ${nome_azienda}` : `Ordine da ${nome_azienda}`
    const saluto = fornitore_nome
      ? (de ? `Hallo ${fornitore_nome},\n\n` : `Ciao ${fornitore_nome},\n\n`)
      : ''
    const intro = de ? 'Wir möchten Folgendes bestellen:' : 'Vorremmo ordinare quanto segue:'
    const righeTesto = righe.map((r: { quantita: number; nome: string }) => `- ${r.quantita} × ${r.nome}`).join('\n')
    const chiusura = de ? 'Danke und viele Grüße' : 'Grazie e cordiali saluti'
    const corpo = `${saluto}${intro}\n\n${righeTesto}\n\n${chiusura}\n${nome_azienda}`

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM') || 'onboarding@resend.dev',
        to: fornitore_email,
        subject: oggetto,
        text: corpo,
      }),
    })

    if (!resendResponse.ok) {
      const dettaglio = await resendResponse.text()
      return new Response(JSON.stringify({ error: `Servizio email: ${dettaglio}` }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
