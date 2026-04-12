import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-brevo-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'Brevo API key not configured. Add it in Settings.' }, { status: 401 })
  }

  const body = await req.json()
  // listId is the Brevo list ID that triggers the automation sequence.
  // attributes is an optional object of Brevo contact attributes (e.g. FIRSTNAME, SEGMENT, CATEGORY).
  const { email, firstName, lastName, sequenceId, listId, listName, attributes: extraAttributes } = body

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const brevoHeaders = {
    'api-key': apiKey,
    'Content-Type': 'application/json',
  }

  try {
    // Step 1: Upsert contact in Brevo (create or update)
    const contactPayload: Record<string, unknown> = {
      email,
      attributes: {
        FIRSTNAME: firstName || '',
        LASTNAME: lastName || '',
        // Merge any extra attributes (e.g. SEGMENT, CATEGORY passed from merchant record)
        ...(extraAttributes && typeof extraAttributes === 'object' ? extraAttributes : {}),
      },
      updateEnabled: true,
    }

    // If a list ID is provided, add the contact to the list as part of upsert.
    // This is the trigger that fires Brevo automation sequences attached to the list.
    if (listId) {
      contactPayload.listIds = [Number(listId)]
    }

    const contactRes = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: brevoHeaders,
      body: JSON.stringify(contactPayload),
    })

    // 201 = created, 204 = updated (no body), 400 with code=duplicate_parameter = already exists
    const contactData = contactRes.status !== 204 ? await contactRes.json() : { id: null }
    if (!contactRes.ok && contactRes.status !== 204) {
      // Brevo returns 400 for duplicate contacts with updateEnabled=false, but we set true so this
      // should not happen — surface the error if it does.
      return NextResponse.json(
        { error: contactData.message || 'Failed to create/update Brevo contact' },
        { status: contactRes.status }
      )
    }

    // Step 2: If a listId was provided separately (without embedding in the upsert above),
    // explicitly add the contact to the list so the automation fires.
    // This handles the case where the contact already existed and listIds in the upsert body
    // may be ignored by Brevo for existing contacts.
    let listAddResult: Record<string, unknown> | null = null
    if (listId) {
      const listRes = await fetch(`https://api.brevo.com/v3/contacts/lists/${Number(listId)}/contacts/add`, {
        method: 'POST',
        headers: brevoHeaders,
        body: JSON.stringify({ emails: [email] }),
      })
      if (listRes.ok || listRes.status === 204) {
        listAddResult = { added: true, listId: Number(listId) }
      } else {
        let msg = 'List add failed'
        try { const e = await listRes.json(); msg = e.message || msg } catch {}
        listAddResult = { added: false, listId: Number(listId), error: msg }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Contact ${email} added/updated in Brevo${listId ? ` and added to list ${listId}` : ''}.`,
      contactId: contactData.id ?? null,
      sequenceId: sequenceId ?? null,
      listName: listName ?? null,
      listAdd: listAddResult,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to reach Brevo API' }, { status: 500 })
  }
}
