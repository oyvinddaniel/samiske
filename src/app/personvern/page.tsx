'use client'

import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export default function PersonvernPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Tilbake til forsiden
        </Link>

        <Card>
          <CardContent className="prose prose-gray max-w-none p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Personvernerklæring</h1>
            <p className="text-sm text-gray-500 mb-8">Sist oppdatert: 13. desember 2025</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Behandlingsansvarlig</h2>
              <p className="text-gray-700 mb-4">
                Samiske.no er en sosial plattform for det samiske miljøet. Behandlingsansvarlig for
                personopplysninger som samles inn via tjenesten er:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700">
                <p><strong>Samiske.no</strong></p>
                <p>E-post: <a href="mailto:kontakt@samiske.no" className="text-blue-600 hover:underline">kontakt@samiske.no</a></p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Hvilke opplysninger vi samler inn</h2>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.1 Opplysninger du gir oss</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                <li><strong>Kontoinformasjon:</strong> E-postadresse og passord ved registrering</li>
                <li><strong>Profilinformasjon:</strong> Navn, profilbilde, biografi, bosted, hjemsted og telefonnummer (valgfritt)</li>
                <li><strong>Innhold:</strong> Innlegg, kommentarer, bilder og meldinger du oppretter</li>
                <li><strong>Preferanser:</strong> Varslingsinnstillinger, favorittsteder og venneforhold</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mt-4 mb-2">2.2 Opplysninger vi samler automatisk</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Tidsstempler:</strong> Når du registrerte deg, sist innlogget, når innhold ble opprettet</li>
                <li><strong>Teknisk data:</strong> Push-varsling tokens (hvis aktivert)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Formål og rettslig grunnlag</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-gray-700 mb-4">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4">Formål</th>
                      <th className="text-left py-2">Rettslig grunnlag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Opprette og administrere brukerkonto</td>
                      <td className="py-2">Avtale (nødvendig for tjenesten)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Vise innlegg og muliggjøre kommunikasjon</td>
                      <td className="py-2">Avtale (kjernetjeneste)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Sende varsler om aktivitet</td>
                      <td className="py-2">Samtykke (kan skrus av)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 pr-4">Vise profilinformasjon til andre</td>
                      <td className="py-2">Samtykke (frivillig å fylle ut)</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Forbedre tjenesten</td>
                      <td className="py-2">Berettiget interesse</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Hvem vi deler data med</h2>
              <p className="text-gray-700 mb-4">
                Vi selger aldri dine personopplysninger. Vi deler kun data med følgende tredjeparter
                som er nødvendige for å levere tjenesten:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <strong>Supabase</strong> (database og autentisering) -
                  <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                    Personvernerklæring
                  </a>
                  <br />
                  <span className="text-sm text-gray-500">Data lagres i EU (Frankfurt)</span>
                </li>
                <li>
                  <strong>Vercel</strong> (hosting) -
                  <a href="https://vercel.com/legal/privacy-policy" className="text-blue-600 hover:underline ml-1" target="_blank" rel="noopener noreferrer">
                    Personvernerklæring
                  </a>
                </li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Hvor lenge vi lagrer data</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Kontoinformasjon:</strong> Så lenge kontoen din er aktiv</li>
                <li><strong>Innlegg og kommentarer:</strong> Så lenge kontoen er aktiv eller til du sletter dem</li>
                <li><strong>Meldinger:</strong> Så lenge kontoen er aktiv</li>
                <li><strong>E-postlogg:</strong> Slettes automatisk etter 30 dager</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Når du sletter kontoen din, slettes all tilknyttet data permanent.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Dine rettigheter</h2>
              <p className="text-gray-700 mb-4">
                I henhold til personvernforordningen (GDPR) har du følgende rettigheter:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>
                  <strong>Rett til innsyn:</strong> Du kan se all informasjon vi har om deg i din profil
                </li>
                <li>
                  <strong>Rett til retting:</strong> Du kan oppdatere profilinformasjonen din når som helst
                </li>
                <li>
                  <strong>Rett til sletting:</strong> Du kan slette kontoen din fra profilsiden.
                  All data slettes permanent.
                </li>
                <li>
                  <strong>Rett til dataportabilitet:</strong> Du kan be om å få utlevert dine data
                </li>
                <li>
                  <strong>Rett til å trekke samtykke:</strong> Du kan endre varslingsinnstillinger
                  eller slette kontoen når som helst
                </li>
              </ul>
              <p className="text-gray-700 mt-4">
                For å utøve dine rettigheter, gå til{' '}
                <Link href="/profil" className="text-blue-600 hover:underline">din profil</Link> eller{' '}
                <Link href="/innstillinger" className="text-blue-600 hover:underline">innstillinger</Link>,
                eller kontakt oss på e-post.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Informasjonskapsler og lokal lagring</h2>
              <p className="text-gray-700 mb-4">
                Vi bruker følgende teknologier for å huske innloggingen din:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Sesjonsdata:</strong> Lagres lokalt i nettleseren for å holde deg innlogget</li>
                <li><strong>Autentiseringstokens:</strong> Sikre tokens for innlogging (httpOnly cookies)</li>
              </ul>
              <p className="text-gray-700 mt-4">
                Vi bruker ikke sporingscookies eller tredjeparts analyseverktøy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Sikkerhet</h2>
              <p className="text-gray-700">
                Vi tar sikkerhet på alvor og bruker følgende tiltak:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                <li>Kryptert overføring (HTTPS)</li>
                <li>Sikker passordlagring (hashing)</li>
                <li>Tilgangskontroll på databasenivå (Row Level Security)</li>
                <li>Regelmessige sikkerhetsgjennomganger</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Klage</h2>
              <p className="text-gray-700">
                Hvis du mener at vi behandler personopplysningene dine i strid med
                personvernregelverket, kan du klage til Datatilsynet:
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-gray-700 mt-2">
                <p><strong>Datatilsynet</strong></p>
                <p>Postboks 458 Sentrum, 0105 Oslo</p>
                <p>
                  <a href="https://www.datatilsynet.no" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    www.datatilsynet.no
                  </a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Endringer</h2>
              <p className="text-gray-700">
                Vi kan oppdatere denne personvernerklæringen ved behov. Ved vesentlige endringer
                vil vi varsle deg via e-post eller en melding i tjenesten.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
