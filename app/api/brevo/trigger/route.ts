import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-brevo-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Brevo API key not configured. Add it in Settings.' }, { status: 401 })
  }

  const body = await req.json()
  const { email, firstName, lastName, sequenceId, listName } = body

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  try {
    // Upsert contact in Brevo
    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: { FIRSTNAME: firstName || '', LASTNAME: lastName || '' },
        updateEnabled: true,
      }),
    })

    const contactData = await contactRes.json()
    if (!contactRes.ok && contactRes.status !== 204) {
      return NextResponse.json({ error: contactData.message || 'Failed to create Brevo contact' }, { status: contactRes.status })
    }

    // If a list name is provided, try to find or note the list (full list management would require a list ID)
    return NextResponse.json({
      success: true,
      message: `Contact ${email} added/updated in Brevo successfully.`,
      contactId: contactData.id,
      sequenceId,
      listName,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to reach Brevo API' }, { status: 500 })
  }
}
