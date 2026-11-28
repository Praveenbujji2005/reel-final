# Leads → Google Sheet (Apps Script)

Every successful enquiry from the website (the home booking form, the quick-contact popup, and the `/contact` form) is added as a new row in a Google Sheet. The website still saves each lead to Firestore first. If the sheet is down, customers are not affected.

New rows always start with **Status = New** and an empty **Notes** cell. The script only ever appends rows. It never edits existing rows, so your team's Status and Notes edits are safe.

## One-time setup

1. **Create the sheet.** Make a new Google Sheet, for example "reelXpress Leads".
2. **Add the script.** In the sheet, go to **Extensions → Apps Script**. Delete everything in `Code.gs` and paste in the contents of [`Code.gs`](./Code.gs). Save.
3. **Set the secret.**
   1. In Apps Script, open **Project Settings** (the gear icon).
   2. Under **Script properties**, add a property named `WEBHOOK_SECRET`.
   3. For its value, use a long random string, for example from `openssl rand -hex 32`.
   4. Keep the string. You'll need it in step 6.
4. **Set up the columns.**
   1. Back in the editor, select `setupSheet` in the function dropdown and click **Run**.
   2. Approve the permission prompt. It asks for access to *this* spreadsheet only.
   3. A `Leads` tab appears with the headers, a Status dropdown, and highlighted Status and Notes columns.
5. **Deploy as a web app.**
   1. Go to **Deploy → New deployment → Select type: Web app**.
   2. Set **Execute as** to **Me**.
   3. Set **Who has access** to **Anyone**. The website's server has no Google login, so the web app must accept anonymous requests. The secret from step 3 is what blocks everyone else.
   4. Click **Deploy** and copy the **Web app URL**. It ends in `/exec`.
6. **Add the URL and secret to the website.** In Vercel go to **Project → Settings → Environment Variables**, add these two, and redeploy:
   ```
   GOOGLE_SHEETS_WEBHOOK_URL=<web app URL from step 5>
   GOOGLE_SHEETS_WEBHOOK_SECRET=<same secret as step 3>
   ```
   For local testing, put the same two lines in `.env.local`.
7. **Test it.** Submit the form on the live site. A row should appear in the `Leads` tab within a few seconds.

## Columns

| Column | Filled by |
|---|---|
| Received (IST), Enquiry ID, Name, Phone, Email, Package / Service, Event Date, City, Locality, Brand / Company, Message, Source Form | Website, automatically |
| **Status** (New / Contacted / Follow-up / Booked / Not interested / Spam) | Your team |
| **Notes** | Your team |

- You can add more columns of your own to the **right** of Notes, such as "Assigned to". Do not insert, delete or reorder columns A–N, because the script writes to them by position.
- Email is blank for quick-contact popup leads, because that form doesn't ask for an email.

## Changing the script later

After you edit `Code.gs`, go to **Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy**. This keeps the same URL, so the website needs no change. Creating a *new* deployment instead gives you a new URL, which you would then have to update in Vercel.

## Troubleshooting

- **No rows are appearing.**
  - In Vercel, open the function logs and look for `[GoogleSheets] Failed to sync enquiry`.
  - `unauthorized` means the secret in Vercel doesn't match the `WEBHOOK_SECRET` script property.
  - `HTTP 401` or `403`, or an HTML response, means the deployment's access isn't set to **Anyone**.
- **The same lead appears twice.** This shouldn't happen: the script skips any Enquiry ID that's already in the sheet.
